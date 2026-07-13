import { bookingRequestCreateSchema } from "@/lib/reservations/schemas";
import { summarizePublicCapacityAvailability } from "@/lib/bungalow-capacity/public-availability";
import { bungalowCapacityStore } from "@/lib/bungalow-capacity/store";
import { failureResponse, jsonResponse, readJsonBody } from "@/lib/reservations/http";
import { reservationStore } from "@/lib/reservations/store";
import { buildInitialTransferEmail, queueOutboundEmail } from "@/lib/mail/email-outbox";
import { sendTransactionalZohoEmail } from "@/lib/mail/zoho-client";
import { RESERVATIONS_MAILBOX_ADDRESS } from "@/lib/reservations/booking-request-workbench";

export async function POST(request: Request) {
  try {
    const parsed = bookingRequestCreateSchema.parse(await readJsonBody<unknown>(request));

    if (parsed.requestedBungalowType) {
      const [bungalows, reservations, capacities] = await Promise.all([
        reservationStore.listBungalows(),
        reservationStore.list(),
        bungalowCapacityStore.listCapacities(),
      ]);
      const availability = summarizePublicCapacityAvailability({
        reservations: reservations.map((reservation) => ({
          id: reservation.id,
          bungalowId: reservation.bungalowId,
          checkIn: reservation.startDate,
          checkOut: reservation.endDate,
          status: reservation.status,
        })),
        bungalows,
        capacities,
        bungalowId: parsed.requestedBungalowType,
        checkIn: parsed.requestedCheckIn,
        checkOut: parsed.requestedCheckOut,
        guests: parsed.requestedGuests,
      });

      if (!availability.available) {
        return jsonResponse(
          {
            error: "bungalow_type_unavailable",
            message: "No hay cupos disponibles para todo el rango.",
            alternatives: availability.alternatives,
            alternativeDates: availability.alternativeDates,
          },
          409,
        );
      }
    }

    const created = await reservationStore.createBookingRequest(parsed);
    const message = buildInitialTransferEmail({
      guestName: created.bookingRequest.guestName,
      guestEmail: created.bookingRequest.guestEmail,
      publicRef: created.bookingRequest.publicRef,
      requestedCheckIn: created.bookingRequest.requestedCheckIn,
      requestedCheckOut: created.bookingRequest.requestedCheckOut,
      requestedGuests: created.bookingRequest.requestedGuests,
      requestedBungalowType: created.bookingRequest.requestedBungalowType,
    });
    let delivery;
    try {
      delivery = await sendTransactionalZohoEmail(message);
    } catch (error) {
      if (!(error instanceof Error) || error.message !== "initial_email_failed") {
        throw error;
      }

      delivery = {
        status: "queued_without_provider" as const,
        provider: "none" as const,
        providerMessageId: null,
        providerThreadId: null,
        sentAt: null,
      };
    }
    const email = await queueOutboundEmail({
      eventType: "booking_request.initial_transfer_instructions",
      linkedEntityType: "booking_request",
      linkedEntityId: created.bookingRequest.id,
      message,
      delivery,
    });
    await reservationStore.recordBookingRequestMessage(created.bookingRequest.id, {
      direction: "outbound",
      origin: "system_outbound",
      providerMessageId: delivery.providerMessageId,
      providerThreadId: delivery.providerThreadId ?? null,
      fromAddress: RESERVATIONS_MAILBOX_ADDRESS,
      toAddresses: message.to,
      subject: message.subject,
      bodyText: message.text,
      bodyHtml: message.html,
      sentAt: delivery.sentAt ?? null,
      createdByUserId: null,
    });
    const bookingRequest = await reservationStore.transitionBookingRequest(created.bookingRequest.id, {
      action: "mark_initial_email_sent",
      actorId: "system",
      reason: "initial transfer instructions queued to outbound mail",
    });

    return jsonResponse({ bookingRequest, email, delivery }, 201);
  } catch (error) {
    return failureResponse(error);
  }
}
