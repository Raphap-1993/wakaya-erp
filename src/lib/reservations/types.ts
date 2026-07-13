export type ReservationChannel = "web" | "ota";
export type ReservationSourceProvider = "booking_com" | "expedia" | "airbnb" | "manual";
export type ComplaintType = "queja" | "reclamo";
export type ComplaintStatus = "submitted" | "in_review" | "resolved" | "closed";
export type ComplaintDocumentType = "dni" | "ce" | "passport" | "ruc" | "other";
export type ComplaintServiceType = "lodging" | "food" | "event" | "transport" | "other";

export type BookingRequestStatus =
  | "request_received"
  | "awaiting_initial_email"
  | "awaiting_transfer"
  | "proof_received"
  | "needs_attention"
  | "converted_to_reservation"
  | "cancelled";

export type BookingRequestAction =
  | "mark_initial_email_sent"
  | "mark_proof_received"
  | "confirm_transfer"
  | "mark_needs_attention"
  | "cancel";

export type BookingRequestLane =
  | "requires_reply"
  | "proof_received"
  | "conflict"
  | "waiting_customer"
  | "closed";

export type OperationsWorkbenchLane =
  | BookingRequestLane
  | "pending_mapping"
  | "pending_ack"
  | "sync_error";

export type LinkedEntityType = "booking_request" | "reservation";
export type ConversationProvider = "zoho_mail" | "booking_messaging";
export type SyncHealth = "pending" | "synced" | "degraded";

export type MessageOrigin =
  | "guest_inbound"
  | "system_outbound"
  | "erp_outbound"
  | "external_outbound";

export type ReservationPaymentStatus = "pending" | "partial" | "paid";

export type ReservationStatus =
  | "pending_review"
  | "ota_imported_confirmed"
  | "confirmed"
  | "assigned"
  | "checked_in"
  | "checked_out"
  | "paid"
  | "cancelled"
  | "no_show";

export type ReservationAction =
  | "confirm"
  | "assign"
  | "check_in"
  | "check_out"
  | "mark_paid"
  | "cancel"
  | "mark_no_show";

export interface BookingRequest {
  id: string;
  publicRef: string;
  status: BookingRequestStatus;
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  requestedCheckIn: string;
  requestedCheckOut: string;
  requestedGuests: number;
  requestedBungalowType: string | null;
  requestedExperienceId?: string | null;
  sourceChannel: "web_public";
  threadId: string | null;
  threadKey: string;
  ownerUserId: string | null;
  ownerAssignedAt: string | null;
  notes: string | null;
  lastMessageAt: string | null;
  syncStatus: SyncHealth;
  createdAt: string;
  updatedAt: string;
}

export interface MessageThread {
  id: string;
  mailboxAddress: string;
  provider: ConversationProvider;
  providerThreadId: string | null;
  subject: string | null;
  threadKey: string;
  linkedEntityType: LinkedEntityType;
  linkedEntityId: string;
  lastSyncedAt: string | null;
  syncStatus: SyncHealth;
  createdAt: string;
  updatedAt: string;
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  providerAttachmentId: string | null;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  storageKey: string;
  fileHash: string;
  isSupported: boolean;
  contentBase64: string | null;
  createdAt: string;
}

export interface MessageItem {
  id: string;
  threadId: string;
  direction: "inbound" | "outbound";
  origin: MessageOrigin;
  providerMessageId: string;
  fromAddress: string;
  toAddresses: string[];
  ccAddresses: string[];
  subject: string;
  bodyText: string | null;
  bodyHtml: string | null;
  sentAt: string | null;
  receivedAt: string | null;
  ingestedAt: string;
  createdByUserId: string | null;
  attachments: MessageAttachment[];
}

export interface BookingRequestWorkItem {
  id: string;
  publicRef: string;
  guestName: string;
  guestEmail: string;
  status: BookingRequestStatus;
  lane: BookingRequestLane;
  needsReply: boolean;
  latestCustomerMessageAt: string | null;
  latestTeamMessageAt: string | null;
  lastSnippet: string | null;
  ownerUserId: string | null;
  ownerAssignedAt: string | null;
  ownerName: string | null;
  hasConflict: boolean;
  syncHealth: SyncHealth;
  requestedCheckIn: string;
  requestedCheckOut: string;
  requestedGuests: number;
  requestedBungalowType: string | null;
  updatedAt: string;
}

export interface OperationsWorkbenchItem {
  kind: LinkedEntityType;
  id: string;
  displayRef: string;
  publicRef: string | null;
  reservationNumber: string | null;
  guestName: string;
  guestEmail: string;
  status: BookingRequestStatus | ReservationStatus;
  lane: OperationsWorkbenchLane;
  needsReply: boolean;
  latestCustomerMessageAt: string | null;
  latestTeamMessageAt: string | null;
  lastSnippet: string | null;
  ownerUserId: string | null;
  ownerAssignedAt: string | null;
  ownerName: string | null;
  hasConflict: boolean;
  syncHealth: SyncHealth;
  sourceProvider: ReservationSourceProvider | null;
  requestedCheckIn: string;
  requestedCheckOut: string;
  requestedGuests: number | null;
  requestedBungalowType: string | null;
  updatedAt: string;
}

export interface QuickReplyTemplate {
  id: string;
  key: string;
  label: string;
  category: string;
  subjectMode: "keep_thread_subject" | "custom_subject";
  bodyText: string;
  isActive: boolean;
  sortOrder: number;
  updatedByUserId: string | null;
  updatedAt: string;
}

export interface AvailabilityConflict {
  id: string;
  status: "open" | "resolved";
  conflictType: "date_overlap" | "assignment_overlap";
  requestId: string | null;
  reservationId: string | null;
  notes: string | null;
  createdBy: string | null;
  resolvedBy: string | null;
  createdAt: string;
  resolvedAt: string | null;
  metadata?: Record<string, unknown>;
}

export interface BookingRequestCreateInput {
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  requestedCheckIn: string;
  requestedCheckOut: string;
  requestedGuests: number;
  requestedBungalowType?: string | null;
  requestedExperienceId?: string | null;
  notes?: string;
}

export interface BookingRequestUpdateInput {
  actorId: string;
  requestedCheckIn: string;
  requestedCheckOut: string;
  requestedBungalowType?: string | null;
  requestedExperienceId?: string | null;
  notes?: string | null;
  reason: string;
}

export interface BookingRequestOwnerAssignmentInput {
  actorId: string;
  ownerUserId: string | null;
  ownerName?: string | null;
}

export interface BookingRequestMessageInput {
  direction: MessageItem["direction"];
  origin: MessageItem["origin"];
  providerMessageId?: string | null;
  providerThreadId?: string | null;
  fromAddress: string;
  toAddresses: string[];
  ccAddresses?: string[];
  subject: string;
  bodyText?: string | null;
  bodyHtml?: string | null;
  sentAt?: string | null;
  receivedAt?: string | null;
  createdByUserId?: string | null;
}

export interface QuickReplyTemplateUpsertInput {
  key: string;
  label: string;
  category: string;
  subjectMode: QuickReplyTemplate["subjectMode"];
  bodyText: string;
  isActive?: boolean;
  sortOrder: number;
  updatedByUserId: string;
}

export interface ComplaintCase {
  id: string;
  publicCode: string;
  type: ComplaintType;
  status: ComplaintStatus;
  fullName: string;
  documentType: ComplaintDocumentType;
  documentNumber: string;
  email: string;
  phone: string | null;
  address: string | null;
  serviceType: ComplaintServiceType | null;
  contractedService: string | null;
  complaintDetail: string;
  consumerRequest: string;
  acceptedDeclaration: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ComplaintCreateInput {
  type: ComplaintType;
  fullName: string;
  documentType: ComplaintDocumentType;
  documentNumber: string;
  email: string;
  phone?: string;
  address?: string;
  serviceType?: ComplaintServiceType | null;
  contractedService?: string;
  complaintDetail: string;
  consumerRequest: string;
  acceptedDeclaration: boolean;
}

export interface Reservation {
  id: string;
  number: string;
  channel: ReservationChannel;
  status: ReservationStatus;
  paymentStatus?: ReservationPaymentStatus;
  amountTotalCents?: number;
  amountPaidCents?: number;
  currencyCode?: "PEN";
  bungalowId: string | null;
  bungalowUnitId?: string | null;
  responsibleId: string | null;
  startDate: string;
  endDate: string;
  guestName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  guestCount?: number | null;
  sourceProvider?: ReservationSourceProvider | null;
  externalReservationId?: string | null;
  externalPropertyId?: string | null;
  externalRoomTypeCode?: string | null;
  externalRatePlanCode?: string | null;
  providerStatus?: string | null;
  providerPayloadChecksum?: string | null;
  providerLastEventAt?: string | null;
  updatedAt: string;
  sourceRequestId?: string | null;
}

export interface Bungalow {
  id: string;
  code: string;
  name: string;
  active: boolean;
  capacity: number;
}

export interface BungalowPublicLocaleContent {
  displayName: string;
  displayEyebrow: string;
  displayDescription: string;
  displayTagline: string;
  displayLongDescription: string;
  displayHighlights: string[];
  displayAmenities: string[];
  displayIncluded: string[];
}

export interface BungalowPublicContentLocaleMap {
  es: BungalowPublicLocaleContent;
  en: BungalowPublicLocaleContent;
}

export interface BungalowPublicContent {
  bungalowId: string;
  revisionVersion?: number;
  featuredOnHome: boolean;
  sortOrder: number;
  heroImageUrl: string;
  galleryUrls: string[];
  nightlyRatePen: number;
  areaSqm: number;
  localeContent: BungalowPublicContentLocaleMap;
  heroAssetId?: string | null;
  galleryAssetIds?: string[];
  updatedAt: string;
}

export interface BungalowCreateInput {
  code: string;
  name: string;
  active?: boolean;
  capacity: number;
}

export type BungalowUpdateInput = BungalowCreateInput;

export interface BungalowPublicContentUpdateInput {
  expectedVersion?: number;
  featuredOnHome: boolean;
  sortOrder: number;
  heroImageUrl: string;
  galleryUrls: string[];
  nightlyRatePen: number;
  areaSqm: number;
  localeContent: BungalowPublicContentLocaleMap;
  heroAssetId?: string | null;
  galleryAssetIds?: string[];
}

export interface ReservationOccupancy {
  id: string;
  reservationId: string;
  bungalowId: string;
  bungalowUnitId?: string | null;
  date: string;
  source: ReservationChannel;
  status: "provisional" | "confirmed" | "released";
  createdAt: string;
}

export interface ReservationAudit {
  id: string;
  reservationId: string;
  actorId: string;
  action: string;
  previousStatus: ReservationStatus;
  nextStatus: ReservationStatus;
  reason: string;
  createdAt: string;
}

export interface ReservationListFilters {
  status?: ReservationStatus;
  responsibleId?: string;
  channel?: ReservationChannel;
  date?: string;
  startDate?: string;
  endDate?: string;
}

export interface ReservationCreateInput {
  number: string;
  channel: ReservationChannel;
  bungalowId: string | null;
  actorId: string;
  responsibleId?: string | null;
  startDate: string;
  endDate: string;
  amountTotalCents?: number;
  amountPaidCents?: number;
  guestName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  guestCount?: number | null;
  sourceProvider?: ReservationSourceProvider | null;
  externalReservationId?: string | null;
  externalPropertyId?: string | null;
  externalRoomTypeCode?: string | null;
  externalRatePlanCode?: string | null;
  providerStatus?: string | null;
  providerPayloadChecksum?: string | null;
  providerLastEventAt?: string | null;
  sourceRequestId?: string | null;
}

export interface ReservationUpdateInput extends Omit<ReservationCreateInput, "number" | "actorId"> {
  bungalowId: string;
  actorId: string;
  reason: string;
}

export interface ReservationAssignmentInput {
  bungalowId: string;
  actorId: string;
  reason: string;
}

export interface ReservationStatusChangeInput {
  action: ReservationAction;
  actorId: string;
  reason: string;
}

export interface ReservationPaymentInput {
  amountPaidCents: number;
  actorId: string;
  reason: string;
}

export interface OtaConnection {
  id: string;
  providerKey: ReservationSourceProvider;
  accountLabel: string;
  externalPropertyId: string | null;
  isActive: boolean;
  messagesEnabled: boolean;
  ariEnabled: boolean;
  recoveryEnabled: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface OtaRoomMapping {
  id: string;
  connectionId: string;
  externalRoomTypeCode: string;
  bungalowId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OtaRatePlanMapping {
  id: string;
  connectionId: string;
  externalRatePlanCode: string;
  internalRatePlanCode: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OtaRoomMappingUpsertInput {
  externalRoomTypeCode: string;
  bungalowId?: string | null;
}

export interface OtaRatePlanMappingUpsertInput {
  externalRatePlanCode: string;
  internalRatePlanCode?: string | null;
}

export interface OtaReservationLink {
  reservationId: string;
  providerKey: ReservationSourceProvider;
  connectionId: string | null;
  externalReservationId: string;
  externalPropertyId: string | null;
  externalRoomTypeCode: string | null;
  externalRatePlanCode: string | null;
  providerStatus: string | null;
  providerPayloadChecksum: string | null;
  providerEventVersion: string | null;
  providerThreadId: string | null;
  providerLastEventAt: string | null;
  rawPayload: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface OtaConnectionUpsertInput {
  accountLabel: string;
  externalPropertyId?: string | null;
  isActive?: boolean;
  messagesEnabled?: boolean;
  ariEnabled?: boolean;
  recoveryEnabled?: boolean;
  metadata?: Record<string, unknown>;
}

export interface OtaReservationImportInput {
  connectionId: string | null;
  sourceProvider: ReservationSourceProvider;
  externalReservationId: string;
  externalPropertyId: string | null;
  externalRoomTypeCode: string | null;
  externalRatePlanCode: string | null;
  providerStatus: string | null;
  providerPayloadChecksum: string | null;
  providerEventVersion?: string | null;
  providerThreadId?: string | null;
  providerLastEventAt?: string | null;
  guestName: string;
  guestEmail: string;
  guestPhone?: string | null;
  guestCount?: number | null;
  startDate: string;
  endDate: string;
  bungalowId?: string | null;
  amountTotalCents?: number;
  amountPaidCents?: number;
  rawPayload?: Record<string, unknown> | null;
}

export type OtaReservationInventoryStatus = "assigned" | "conflict" | "released" | "pending_mapping";

export interface OtaReservationImportResult {
  reservationId: string;
  reservationNumber: string;
  bungalowTypeId: string | null;
  bungalowUnitId: string | null;
  inventoryStatus: OtaReservationInventoryStatus;
  availabilityConflictId: string | null;
  idempotentReplay: boolean;
  created: boolean;
  updated: boolean;
  occupancyBlocked: boolean;
  conflictIds: string[];
  pendingMapping: boolean;
  acknowledgedExternally: boolean;
}

export interface OtaSyncRun {
  id: string;
  providerKey: ReservationSourceProvider;
  connectionId: string | null;
  mode: "incremental" | "recovery" | "messaging" | "inventory";
  status: "running" | "completed" | "failed";
  summary: Record<string, unknown>;
  errorMessage: string | null;
  startedAt: string;
  finishedAt: string | null;
}

export interface OtaReservationSyncResult {
  providerKey: ReservationSourceProvider;
  mode: "incremental" | "recovery";
  imported: number;
  acknowledged: number;
  skipped: number;
  pendingMapping: number;
  conflicts: number;
  failures: number;
  startedAt: string;
  finishedAt: string;
}
