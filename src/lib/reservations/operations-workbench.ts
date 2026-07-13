import {
  buildBookingRequestWorkItem,
  messageActivityAt,
  summarizeMessage,
} from "@/lib/reservations/booking-request-workbench";
import type {
  AvailabilityConflict,
  BookingRequest,
  MessageItem,
  OperationsWorkbenchItem,
  Reservation,
  SyncHealth,
} from "@/lib/reservations/types";

function latestMessageByOrigin(messages: MessageItem[], origin: "guest" | "team") {
  const filtered = messages.filter((message) =>
    origin === "guest" ? message.origin === "guest_inbound" : message.origin !== "guest_inbound",
  );
  return [...filtered].sort((left, right) => messageActivityAt(right).localeCompare(messageActivityAt(left)))[0] ?? null;
}

export function buildBookingRequestOperationsItem(input: {
  bookingRequest: BookingRequest;
  messages: MessageItem[];
  conflicts: AvailabilityConflict[];
  ownerName?: string | null;
}): OperationsWorkbenchItem {
  const workItem = buildBookingRequestWorkItem(input);
  return {
    kind: "booking_request",
    id: workItem.id,
    displayRef: workItem.publicRef,
    publicRef: workItem.publicRef,
    reservationNumber: null,
    guestName: workItem.guestName,
    guestEmail: workItem.guestEmail,
    status: workItem.status,
    lane: workItem.lane,
    needsReply: workItem.needsReply,
    latestCustomerMessageAt: workItem.latestCustomerMessageAt,
    latestTeamMessageAt: workItem.latestTeamMessageAt,
    lastSnippet: workItem.lastSnippet,
    ownerUserId: workItem.ownerUserId,
    ownerAssignedAt: workItem.ownerAssignedAt,
    ownerName: input.ownerName ?? workItem.ownerName,
    hasConflict: workItem.hasConflict,
    syncHealth: workItem.syncHealth,
    sourceProvider: null,
    requestedCheckIn: workItem.requestedCheckIn,
    requestedCheckOut: workItem.requestedCheckOut,
    requestedGuests: workItem.requestedGuests,
    requestedBungalowType: workItem.requestedBungalowType,
    updatedAt: workItem.updatedAt,
  };
}

export function buildReservationOperationsItem(input: {
  reservation: Reservation;
  messages: MessageItem[];
  conflicts: AvailabilityConflict[];
  syncHealth: SyncHealth;
  ownerName?: string | null;
}): OperationsWorkbenchItem {
  const latestGuestMessage = latestMessageByOrigin(input.messages, "guest");
  const latestTeamMessage = latestMessageByOrigin(input.messages, "team");
  const latestMessage =
    [...input.messages].sort((left, right) => messageActivityAt(right).localeCompare(messageActivityAt(left)))[0] ?? null;

  let lane: OperationsWorkbenchItem["lane"] = "waiting_customer";
  if (input.conflicts.length > 0) {
    lane = "conflict";
  } else if (!input.reservation.bungalowId) {
    lane = "pending_mapping";
  } else if (input.syncHealth === "degraded") {
    lane = "sync_error";
  } else if (input.syncHealth === "pending") {
    lane = "pending_ack";
  } else if (
    latestGuestMessage &&
    (!latestTeamMessage || messageActivityAt(latestGuestMessage) > messageActivityAt(latestTeamMessage))
  ) {
    lane = "requires_reply";
  } else if (["cancelled", "no_show", "paid", "checked_out"].includes(input.reservation.status)) {
    lane = "closed";
  }

  return {
    kind: "reservation",
    id: input.reservation.id,
    displayRef: input.reservation.number,
    publicRef: null,
    reservationNumber: input.reservation.number,
    guestName: input.reservation.guestName ?? "Reserva OTA",
    guestEmail: input.reservation.guestEmail ?? "Sin correo",
    status: input.reservation.status,
    lane,
    needsReply: lane === "requires_reply",
    latestCustomerMessageAt: latestGuestMessage ? messageActivityAt(latestGuestMessage) : null,
    latestTeamMessageAt: latestTeamMessage ? messageActivityAt(latestTeamMessage) : null,
    lastSnippet: latestMessage ? summarizeMessage(latestMessage) : null,
    ownerUserId: input.reservation.responsibleId ?? null,
    ownerAssignedAt: null,
    ownerName: input.ownerName ?? null,
    hasConflict: input.conflicts.length > 0,
    syncHealth: input.syncHealth,
    sourceProvider: input.reservation.sourceProvider ?? null,
    requestedCheckIn: input.reservation.startDate,
    requestedCheckOut: input.reservation.endDate,
    requestedGuests: input.reservation.guestCount ?? null,
    requestedBungalowType: input.reservation.bungalowId,
    updatedAt: input.reservation.updatedAt,
  };
}
