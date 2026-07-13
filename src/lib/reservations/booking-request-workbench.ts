import type {
  AvailabilityConflict,
  BookingRequest,
  BookingRequestLane,
  BookingRequestWorkItem,
  MessageItem,
  MessageOrigin,
} from "@/lib/reservations/types";

export const RESERVATIONS_MAILBOX_ADDRESS = "reservas@wakayaecolodge.com";

function normalizeAddress(address: string | null | undefined): string {
  return (address ?? "").trim().toLowerCase();
}

export function isReservationsMailboxAddress(address: string | null | undefined): boolean {
  return normalizeAddress(address) === RESERVATIONS_MAILBOX_ADDRESS;
}

export function messageActivityAt(message: Pick<MessageItem, "receivedAt" | "sentAt" | "ingestedAt">): string {
  return message.receivedAt ?? message.sentAt ?? message.ingestedAt;
}

export function summarizeMessage(message: Pick<MessageItem, "bodyText" | "subject">): string | null {
  const body = message.bodyText?.trim();
  if (body) {
    return body.length > 140 ? `${body.slice(0, 137)}...` : body;
  }

  const subject = message.subject.trim();
  if (!subject) {
    return null;
  }
  return subject.length > 140 ? `${subject.slice(0, 137)}...` : subject;
}

export function inferSyncedMessageIdentity(input: {
  bookingRequest: Pick<BookingRequest, "guestEmail">;
  fromAddress: string;
  existingOrigin?: MessageOrigin | null;
  existingCreatedByUserId?: string | null;
}): { direction: MessageItem["direction"]; origin: MessageOrigin } {
  if (input.existingOrigin) {
    return {
      direction: input.existingOrigin === "guest_inbound" ? "inbound" : "outbound",
      origin: input.existingOrigin,
    };
  }

  const fromAddress = normalizeAddress(input.fromAddress);
  const guestAddress = normalizeAddress(input.bookingRequest.guestEmail);

  if (fromAddress === guestAddress || !isReservationsMailboxAddress(fromAddress)) {
    return { direction: "inbound", origin: "guest_inbound" };
  }

  if (input.existingCreatedByUserId) {
    return { direction: "outbound", origin: "erp_outbound" };
  }

  return { direction: "outbound", origin: "external_outbound" };
}

export function deriveBookingRequestLane(input: {
  bookingRequest: Pick<BookingRequest, "status" | "syncStatus">;
  messages: MessageItem[];
  conflicts: AvailabilityConflict[];
}): BookingRequestLane {
  const { bookingRequest, messages, conflicts } = input;

  if (bookingRequest.status === "cancelled" || bookingRequest.status === "converted_to_reservation") {
    return "closed";
  }

  if (conflicts.length > 0 || bookingRequest.status === "needs_attention" || bookingRequest.syncStatus === "degraded") {
    return "conflict";
  }

  if (bookingRequest.status === "proof_received") {
    return "proof_received";
  }

  const latestGuestMessage = messages
    .filter((message) => message.origin === "guest_inbound")
    .sort((left, right) => messageActivityAt(right).localeCompare(messageActivityAt(left)))[0] ?? null;
  const latestTeamMessage = messages
    .filter((message) => message.origin !== "guest_inbound")
    .sort((left, right) => messageActivityAt(right).localeCompare(messageActivityAt(left)))[0] ?? null;

  if (latestGuestMessage && (!latestTeamMessage || messageActivityAt(latestGuestMessage) > messageActivityAt(latestTeamMessage))) {
    return "requires_reply";
  }

  return "waiting_customer";
}

export function buildBookingRequestWorkItem(input: {
  bookingRequest: BookingRequest;
  messages: MessageItem[];
  conflicts: AvailabilityConflict[];
  ownerName?: string | null;
}): BookingRequestWorkItem {
  const latestGuestMessage = input.messages
    .filter((message) => message.origin === "guest_inbound")
    .sort((left, right) => messageActivityAt(right).localeCompare(messageActivityAt(left)))[0] ?? null;
  const latestTeamMessage = input.messages
    .filter((message) => message.origin !== "guest_inbound")
    .sort((left, right) => messageActivityAt(right).localeCompare(messageActivityAt(left)))[0] ?? null;
  const latestMessage =
    [...input.messages].sort((left, right) => messageActivityAt(right).localeCompare(messageActivityAt(left)))[0] ?? null;
  const lane = deriveBookingRequestLane({
    bookingRequest: input.bookingRequest,
    messages: input.messages,
    conflicts: input.conflicts,
  });

  return {
    id: input.bookingRequest.id,
    publicRef: input.bookingRequest.publicRef,
    guestName: input.bookingRequest.guestName,
    guestEmail: input.bookingRequest.guestEmail,
    status: input.bookingRequest.status,
    lane,
    needsReply: lane === "requires_reply",
    latestCustomerMessageAt: latestGuestMessage ? messageActivityAt(latestGuestMessage) : null,
    latestTeamMessageAt: latestTeamMessage ? messageActivityAt(latestTeamMessage) : null,
    lastSnippet: latestMessage ? summarizeMessage(latestMessage) : null,
    ownerUserId: input.bookingRequest.ownerUserId,
    ownerAssignedAt: input.bookingRequest.ownerAssignedAt,
    ownerName: input.ownerName ?? null,
    hasConflict: input.conflicts.length > 0,
    syncHealth: input.bookingRequest.syncStatus,
    requestedCheckIn: input.bookingRequest.requestedCheckIn,
    requestedCheckOut: input.bookingRequest.requestedCheckOut,
    requestedGuests: input.bookingRequest.requestedGuests,
    requestedBungalowType: input.bookingRequest.requestedBungalowType,
    updatedAt: input.bookingRequest.updatedAt,
  };
}
