import type {
  ComplaintCase,
  ComplaintCreateInput,
  ConversationProvider,
  AvailabilityConflict,
  BookingRequestAction,
  BookingRequest,
  BookingRequestCreateInput,
  BookingRequestLane,
  BookingRequestMessageInput,
  BookingRequestOwnerAssignmentInput,
  BookingRequestUpdateInput,
  BookingRequestWorkItem,
  Bungalow,
  BungalowCreateInput,
  BungalowPublicContent,
  BungalowPublicContentUpdateInput,
  BungalowUpdateInput,
  MessageAttachment,
  MessageItem,
  MessageThread,
  OperationsWorkbenchItem,
  OtaConnection,
  OtaConnectionUpsertInput,
  OtaRatePlanMapping,
  OtaRatePlanMappingUpsertInput,
  OtaReservationImportInput,
  OtaReservationImportResult,
  OtaReservationLink,
  OtaRoomMapping,
  OtaRoomMappingUpsertInput,
  OtaReservationSyncResult,
  QuickReplyTemplate,
  QuickReplyTemplateUpsertInput,
  Reservation,
  ReservationAssignmentInput,
  ReservationAudit,
  ReservationCreateInput,
  ReservationListFilters,
  ReservationPaymentInput,
  ReservationStatusChangeInput,
  ReservationUpdateInput,
} from "@/lib/reservations/types";

export interface ReservationDetail extends Reservation {
  bungalow: Bungalow | null;
  auditCount: number;
}

export interface ReservationListItem extends Reservation {
  bungalow: Bungalow | null;
}

export interface CreateReservationResult {
  reservation: Reservation;
  occupancy: Array<{
    id: string;
    reservationId: string;
    bungalowId: string;
    date: string;
    source: Reservation["channel"];
    status: "provisional" | "confirmed" | "released";
    createdAt: string;
  }>;
  audit: ReservationAudit;
}

export interface CreateBookingRequestResult {
  bookingRequest: BookingRequest;
}

export interface CreateComplaintResult {
  complaint: ComplaintCase;
}

export interface ConfirmBookingRequestTransferResult {
  bookingRequest: BookingRequest;
  reservation: ReservationDetail;
}

export interface BookingRequestThreadView {
  bookingRequest: BookingRequest;
  thread: MessageThread | null;
  messages: MessageItem[];
  attachments: MessageAttachment[];
  conflicts: AvailabilityConflict[];
  workItem: BookingRequestWorkItem;
}

export interface OperationThreadView {
  kind: "booking_request" | "reservation";
  bookingRequest: BookingRequest | null;
  reservation: ReservationDetail | null;
  thread: MessageThread | null;
  messages: MessageItem[];
  attachments: MessageAttachment[];
  conflicts: AvailabilityConflict[];
  workItem: OperationsWorkbenchItem;
  otaLink: OtaReservationLink | null;
  availableConversationProviders: ConversationProvider[];
}

export interface SyncBookingRequestThreadResult extends BookingRequestThreadView {}

export interface UpdateBookingRequestResult extends BookingRequestThreadView {}

export interface BookingRequestReplyInput {
  actorId: string;
  subject?: string;
  bodyText: string;
}

export interface BookingRequestReplyResult {
  bookingRequest: BookingRequest;
  thread: MessageThread;
  reply: MessageItem;
}

export interface RecordBookingRequestMessageResult extends BookingRequestThreadView {
  message: MessageItem;
}

export interface BookingRequestStatusTransitionInput {
  action: Exclude<BookingRequestAction, "confirm_transfer">;
  actorId: string;
  reason?: string;
}

export interface ReservationStoreLike {
  list(filters?: ReservationListFilters): ReservationListItem[];
  get(id: string): ReservationDetail | null;
  getBungalow(id: string): Bungalow | null;
  getBungalowPublicContent(id: string): BungalowPublicContent | null;
  listBungalows(): Bungalow[];
  listBungalowPublicContent(): BungalowPublicContent[];
  createBungalow(input: BungalowCreateInput): Bungalow;
  updateBungalow(id: string, input: BungalowUpdateInput): Bungalow;
  updateBungalowPublicContent(id: string, input: BungalowPublicContentUpdateInput): BungalowPublicContent;
  getAuditTrail(reservationId: string): ReservationAudit[];
  create(input: ReservationCreateInput): CreateReservationResult;
  update(reservationId: string, input: ReservationUpdateInput): ReservationDetail;
  assign(reservationId: string, input: ReservationAssignmentInput): ReservationDetail;
  transition(reservationId: string, input: ReservationStatusChangeInput): ReservationDetail;
  recordPayment(reservationId: string, input: ReservationPaymentInput): ReservationDetail;
}

export interface ReservationServiceLike {
  listComplaints(): Promise<ComplaintCase[]>;
  getComplaint(id: string): Promise<ComplaintCase | null>;
  listBookingRequests(): Promise<BookingRequest[]>;
  listOperationsWorkbenchItems(filters?: {
    lane?: BookingRequestLane | "pending_mapping" | "pending_ack" | "sync_error";
    ownerUserId?: string;
    query?: string;
  }): Promise<OperationsWorkbenchItem[]>;
  getOperationThreadView(id: string): Promise<OperationThreadView | null>;
  listBookingRequestWorkItems(filters?: {
    lane?: BookingRequestLane;
    ownerUserId?: string;
    query?: string;
  }): Promise<BookingRequestWorkItem[]>;
  getBookingRequest(id: string): Promise<BookingRequest | null>;
  getBookingRequestThreadView(id: string): Promise<BookingRequestThreadView | null>;
  updateBookingRequest(id: string, input: BookingRequestUpdateInput): Promise<UpdateBookingRequestResult>;
  assignBookingRequestOwner(
    id: string,
    input: BookingRequestOwnerAssignmentInput,
  ): Promise<BookingRequestThreadView>;
  transitionBookingRequest(
    id: string,
    input: BookingRequestStatusTransitionInput,
  ): Promise<BookingRequest>;
  recordBookingRequestMessage(
    id: string,
    input: BookingRequestMessageInput,
  ): Promise<RecordBookingRequestMessageResult>;
  syncBookingRequestThread(id: string): Promise<SyncBookingRequestThreadResult>;
  replyToBookingRequestThread(
    id: string,
    input: BookingRequestReplyInput,
  ): Promise<BookingRequestReplyResult>;
  listQuickReplyTemplates(): Promise<QuickReplyTemplate[]>;
  createQuickReplyTemplate(input: QuickReplyTemplateUpsertInput): Promise<QuickReplyTemplate>;
  updateQuickReplyTemplate(id: string, input: QuickReplyTemplateUpsertInput): Promise<QuickReplyTemplate>;
  deactivateQuickReplyTemplate(id: string, actorId: string): Promise<QuickReplyTemplate>;
  listOtaConnections(providerKey?: OtaConnection["providerKey"]): Promise<OtaConnection[]>;
  upsertOtaConnection(
    providerKey: OtaConnection["providerKey"],
    input: OtaConnectionUpsertInput,
    id?: string,
  ): Promise<OtaConnection>;
  listOtaRoomMappings(connectionId: string): Promise<OtaRoomMapping[]>;
  upsertOtaRoomMapping(
    connectionId: string,
    input: OtaRoomMappingUpsertInput,
    id?: string,
  ): Promise<OtaRoomMapping>;
  listOtaRatePlanMappings(connectionId: string): Promise<OtaRatePlanMapping[]>;
  upsertOtaRatePlanMapping(
    connectionId: string,
    input: OtaRatePlanMappingUpsertInput,
    id?: string,
  ): Promise<OtaRatePlanMapping>;
  importOtaReservation(input: OtaReservationImportInput): Promise<OtaReservationImportResult>;
  syncOtaProvider(
    providerKey: OtaConnection["providerKey"],
    mode: "incremental" | "recovery",
    actorId: string,
  ): Promise<OtaReservationSyncResult>;
  getOtaReservationLink(reservationId: string): Promise<OtaReservationLink | null>;
  resyncOtaReservation(reservationId: string, actorId: string): Promise<OperationThreadView>;
  resolveOtaReservationConflict(
    reservationId: string,
    actorId: string,
    notes: string,
  ): Promise<OperationThreadView>;
  list(filters?: ReservationListFilters): Promise<ReservationListItem[]>;
  get(id: string): Promise<ReservationDetail | null>;
  getBungalow(id: string): Promise<Bungalow | null>;
  getBungalowPublicContent(id: string): Promise<BungalowPublicContent | null>;
  listBungalows(): Promise<Bungalow[]>;
  listBungalowPublicContent(): Promise<BungalowPublicContent[]>;
  createBungalow(input: BungalowCreateInput): Promise<Bungalow>;
  updateBungalow(id: string, input: BungalowUpdateInput): Promise<Bungalow>;
  updateBungalowPublicContent(id: string, input: BungalowPublicContentUpdateInput): Promise<BungalowPublicContent>;
  getAuditTrail(reservationId: string): Promise<ReservationAudit[]>;
  create(input: ReservationCreateInput): Promise<CreateReservationResult>;
  createComplaint(input: ComplaintCreateInput): Promise<CreateComplaintResult>;
  createBookingRequest(input: BookingRequestCreateInput): Promise<CreateBookingRequestResult>;
  confirmBookingRequestTransfer(
    id: string,
    actorId: string,
    reason: string,
  ): Promise<ConfirmBookingRequestTransferResult>;
  update(reservationId: string, input: ReservationUpdateInput): Promise<ReservationDetail>;
  assign(reservationId: string, input: ReservationAssignmentInput): Promise<ReservationDetail>;
  transition(reservationId: string, input: ReservationStatusChangeInput): Promise<ReservationDetail>;
  recordPayment(reservationId: string, input: ReservationPaymentInput): Promise<ReservationDetail>;
}
