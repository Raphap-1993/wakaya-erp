import { bookingRequestCreateSchema } from "@/lib/reservations/schemas";
import { failureResponse, jsonResponse, readJsonBody } from "@/lib/reservations/http";
import { reservationStore } from "@/lib/reservations/store";
import { buildInitialTransferEmail, queueOutboundEmail } from "@/lib/mail/email-outbox";

export async function POST(request: Request) {
  try {
    const parsed = bookingRequestCreateSchema.parse(await readJsonBody<unknown>(request));
    const { bookingRequest } = await reservationStore.createBookingRequest(parsed);
    const message = buildInitialTransferEmail({
      guestName: bookingRequest.guestName,
      guestEmail: bookingRequest.guestEmail,
      publicRef: bookingRequest.publicRef,
      requestedCheckIn: bookingRequest.requestedCheckIn,
      requestedCheckOut: bookingRequest.requestedCheckOut,
    });
    const email = await queueOutboundEmail({
      eventType: "booking_request.initial_transfer_instructions",
      linkedEntityType: "booking_request",
      linkedEntityId: bookingRequest.id,
      message,
    });

    return jsonResponse({ bookingRequest, email }, 201);
  } catch (error) {
    return failureResponse(error);
  }
}
