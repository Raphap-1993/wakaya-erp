import { randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";

import {
  dedupeProviderMessages,
  hashAttachmentContent,
  isSupportedAttachment,
} from "@/lib/mail/thread-sync";
import { getOtaProvider } from "@/lib/integrations/otas/provider-registry";
import type { OtaProviderRuntime } from "@/lib/integrations/otas/provider-types";
import {
  calculateCapacityAvailability,
  isCapacityBlockingStatus,
} from "@/lib/bungalow-capacity/availability";
import {
  listThreadMessages,
  searchThreadIdByBookingRequest,
  sendThreadReply,
  sendTransactionalZohoEmail,
} from "@/lib/mail/zoho-client";
import { nightsForStay as nightsForReservation } from "@/lib/reservations/stay-intervals";
import { createReservationAuditEntry } from "@/lib/reservations/audit";
import {
  inferSyncedMessageIdentity,
  messageActivityAt,
  RESERVATIONS_MAILBOX_ADDRESS,
} from "@/lib/reservations/booking-request-workbench";
import { buildInitialBookingRequestSubject } from "@/lib/mail/email-outbox";
import { detectRequestConflicts } from "@/lib/reservations/conflicts";
import {
  buildBookingRequestOperationsItem,
  buildReservationOperationsItem,
} from "@/lib/reservations/operations-workbench";
import {
  buildBungalowId,
  normalizeBungalowInput,
} from "@/lib/reservations/bungalows";
import { WAKAYA_BUNGALOW_PUBLIC_CONTENT } from "@/lib/reservations/wakaya-bungalow-public-content";
import { WAKAYA_OPERATIONAL_BUNGALOWS } from "@/lib/reservations/wakaya-bungalows";
import { nextBookingRequestPublicRef, nextComplaintPublicCode, nextReservationNumber } from "@/lib/reservations/numbering";
import { normalizePgDateOnly, normalizePgTimestamp } from "@/lib/reservations/postgres-temporal";
import type {
  BookingRequestStatusTransitionInput,
  BookingRequestReplyInput,
  BookingRequestReplyResult,
  BookingRequestThreadView,
  CreateComplaintResult,
  CreateBookingRequestResult,
  CreateReservationResult,
  OperationThreadView,
  RecordBookingRequestMessageResult,
  ReservationDetail,
  ReservationListItem,
  ReservationServiceLike,
  SyncBookingRequestThreadResult,
  UpdateBookingRequestResult,
} from "@/lib/reservations/repository";
import { nextBookingRequestStatus, nextReservationStatus } from "@/lib/reservations/state-machine";
import type {
  AvailabilityConflict,
  BookingRequest,
  BookingRequestCreateInput,
  BookingRequestLane,
  BookingRequestMessageInput,
  BookingRequestOwnerAssignmentInput,
  BookingRequestUpdateInput,
  ComplaintCase,
  ComplaintCreateInput,
  Bungalow,
  BungalowCreateInput,
  BungalowPublicContent,
  BungalowPublicContentLocaleMap,
  BungalowPublicContentUpdateInput,
  BungalowUpdateInput,
  MessageAttachment,
  MessageItem,
  MessageThread,
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
  ReservationChannel,
  ReservationCreateInput,
  ReservationListFilters,
  ReservationOccupancy,
  ReservationPaymentInput,
  ReservationPaymentStatus,
  ReservationStatusChangeInput,
  ReservationUpdateInput,
  SyncHealth,
} from "@/lib/reservations/types";
import { buildBookingRequestWorkItem } from "@/lib/reservations/booking-request-workbench";

function isoNow(): string {
  return new Date().toISOString();
}

function defaultStatus(channel: ReservationChannel): Reservation["status"] {
  return channel === "ota" ? "ota_imported_confirmed" : "pending_review";
}

const DEFAULT_NIGHTLY_RATE_CENTS = 12_000;
const DEFAULT_CURRENCY_CODE = "PEN";

function normalizeAmount(value: number | undefined): number {
  const normalized = value ?? 0;
  return Number.isFinite(normalized) && normalized >= 0 ? Math.floor(normalized) : 0;
}

function derivePaymentStatus(totalCents: number, paidCents: number): ReservationPaymentStatus {
  if (totalCents > 0 && paidCents >= totalCents) {
    return "paid";
  }
  if (paidCents > 0) {
    return "partial";
  }
  return "pending";
}

function occupancyStatusForReservation(status: Reservation["status"]): ReservationOccupancy["status"] {
  return status === "pending_review" ? "provisional" : "confirmed";
}

type ReservationRow = {
  id: string;
  number: string;
  channel: ReservationChannel;
  status: Reservation["status"];
  source_request_id: string | null;
  bungalow_id: string | null;
  bungalow_unit_id?: string | null;
  responsible_id: string | null;
  start_date: string | Date;
  end_date: string | Date;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  guest_count: number | null;
  source_provider: Reservation["sourceProvider"];
  external_reservation_id: string | null;
  external_property_id: string | null;
  external_room_type_code: string | null;
  external_rate_plan_code: string | null;
  provider_status: string | null;
  provider_payload_checksum: string | null;
  provider_last_event_at: string | Date | null;
  amount_total_cents: number | null;
  amount_paid_cents: number | null;
  payment_status: ReservationPaymentStatus | null;
  currency_code: "PEN" | null;
  updated_at: string | Date;
  bungalow_code?: string | null;
  bungalow_name?: string | null;
  bungalow_active?: boolean | null;
  bungalow_capacity?: number | null;
  audit_count?: string | number | null;
};

type ComplaintRow = {
  id: string;
  public_code: string;
  type: ComplaintCase["type"];
  status: ComplaintCase["status"];
  full_name: string;
  document_type: ComplaintCase["documentType"];
  document_number: string;
  email: string;
  phone: string | null;
  address: string | null;
  service_type: ComplaintCase["serviceType"];
  contracted_service: string | null;
  complaint_detail: string;
  consumer_request: string;
  accepted_declaration: boolean;
  created_at: string | Date;
  updated_at: string | Date;
};

type BungalowPublicContentRow = {
  bungalow_id: string;
  revision_version?: number;
  featured_on_home: boolean;
  sort_order: number;
  hero_image_url: string;
  gallery_urls: string[];
  nightly_rate_pen: number;
  area_sqm: number;
  locale_content: BungalowPublicContentLocaleMap;
  hero_asset_id?: string | null;
  gallery_asset_ids?: string[] | null;
  updated_at: string | Date;
};

type AuditRow = {
  id: string;
  reservation_id: string;
  actor_id: string;
  action: string;
  previous_status: Reservation["status"];
  next_status: Reservation["status"];
  reason: string;
  created_at: string | Date;
};

type BookingRequestRow = {
  id: string;
  public_ref: string;
  status: BookingRequest["status"];
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  requested_check_in: string | Date;
  requested_check_out: string | Date;
  requested_guests: number;
  requested_bungalow_type: string | null;
  requested_experience_id?: string | null;
  source_channel: BookingRequest["sourceChannel"];
  thread_id: string | null;
  thread_key: string;
  owner_user_id: string | null;
  owner_assigned_at: string | Date | null;
  notes: string | null;
  last_message_at: string | Date | null;
  sync_status: BookingRequest["syncStatus"];
  created_at: string | Date;
  updated_at: string | Date;
};

type MessageThreadRow = {
  id: string;
  mailbox_address: string;
  provider: MessageThread["provider"];
  provider_thread_id: string | null;
  subject: string | null;
  thread_key: string;
  linked_entity_type: MessageThread["linkedEntityType"];
  linked_entity_id: string;
  last_synced_at: string | Date | null;
  sync_status: MessageThread["syncStatus"];
  created_at: string | Date;
  updated_at: string | Date;
};

type OtaConnectionRow = {
  id: string;
  provider_key: OtaConnection["providerKey"];
  account_label: string;
  external_property_id: string | null;
  is_active: boolean;
  messages_enabled: boolean;
  ari_enabled: boolean;
  recovery_enabled: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string | Date;
  updated_at: string | Date;
};

type OtaRoomMappingRow = {
  id: string;
  connection_id: string;
  external_room_type_code: string;
  bungalow_id: string | null;
  created_at: string | Date;
  updated_at: string | Date;
};

type OtaRatePlanMappingRow = {
  id: string;
  connection_id: string;
  external_rate_plan_code: string;
  internal_rate_plan_code: string | null;
  created_at: string | Date;
  updated_at: string | Date;
};

type OtaReservationLinkRow = {
  reservation_id: string;
  provider_key: OtaReservationLink["providerKey"];
  connection_id: string | null;
  external_reservation_id: string;
  external_property_id: string | null;
  external_room_type_code: string | null;
  external_rate_plan_code: string | null;
  provider_status: string | null;
  provider_payload_checksum: string | null;
  provider_event_version: string | null;
  provider_thread_id: string | null;
  provider_last_event_at: string | Date | null;
  raw_payload: Record<string, unknown> | null;
  created_at: string | Date;
  updated_at: string | Date;
};

type MessageItemRow = {
  id: string;
  thread_id: string;
  direction: MessageItem["direction"];
  origin: MessageItem["origin"];
  provider_message_id: string;
  from_address: string;
  to_addresses: string[];
  cc_addresses: string[];
  subject: string;
  body_text: string | null;
  body_html: string | null;
  sent_at: string | Date | null;
  received_at: string | Date | null;
  ingested_at: string | Date;
  created_by_user_id: string | null;
};

type MessageAttachmentRow = {
  id: string;
  message_id: string;
  provider_attachment_id: string | null;
  file_name: string;
  content_type: string;
  file_size_bytes: number;
  storage_key: string;
  file_hash: string;
  is_supported: boolean;
  content_base64: string | null;
  created_at: string | Date;
};

type AvailabilityConflictRow = {
  id: string;
  status: AvailabilityConflict["status"];
  conflict_type: AvailabilityConflict["conflictType"];
  request_id: string | null;
  reservation_id: string | null;
  notes: string | null;
  created_by: string | null;
  resolved_by: string | null;
  created_at: string | Date;
  resolved_at: string | Date | null;
  metadata: Record<string, unknown> | null;
};

type QuickReplyTemplateRow = {
  id: string;
  key: string;
  label: string;
  category: string;
  subject_mode: QuickReplyTemplate["subjectMode"];
  body_text: string;
  is_active: boolean;
  sort_order: number;
  updated_by_user_id: string | null;
  updated_at: string | Date;
};

export class PostgresReservationStore implements ReservationServiceLike {
  private bootstrapPromise: Promise<void> | null = null;
  private complaintSchemaPromise: Promise<void> | null = null;

  constructor(private readonly pool: Pool) {}

  async list(filters: ReservationListFilters = {}): Promise<ReservationListItem[]> {
    await this.ensureBootstrap();
    const clauses: string[] = [];
    const values: string[] = [];
    let index = 1;

    if (filters.status) {
      clauses.push(`r.status = $${index++}`);
      values.push(filters.status);
    }
    if (filters.responsibleId) {
      clauses.push(`r.responsible_id = $${index++}`);
      values.push(filters.responsibleId);
    }
    if (filters.channel) {
      clauses.push(`r.channel = $${index++}`);
      values.push(filters.channel);
    }
    if (filters.date) {
      clauses.push(`r.start_date <= $${index} and r.end_date >= $${index}`);
      values.push(filters.date);
      index++;
    }
    if (filters.startDate) {
      clauses.push(`r.end_date >= $${index++}`);
      values.push(filters.startDate);
    }
    if (filters.endDate) {
      clauses.push(`r.start_date <= $${index++}`);
      values.push(filters.endDate);
    }

    const where = clauses.length > 0 ? `where ${clauses.join(" and ")}` : "";
    const result = await this.pool.query<ReservationRow>(
      `
        select
          r.*,
          b.code as bungalow_code,
          b.name as bungalow_name,
          b.active as bungalow_active,
          b.capacity as bungalow_capacity
        from reservation r
        left join bungalow b on b.id = r.bungalow_id
        ${where}
        order by r.updated_at desc
      `,
      values,
    );

    return result.rows.map((row) => this.toReservationListItem(row));
  }

  async listBookingRequests(): Promise<BookingRequest[]> {
    await this.ensureBootstrap();
    const result = await this.pool.query<BookingRequestRow>(
        `
          select
            id, public_ref, status, guest_name, guest_email, guest_phone,
            requested_check_in, requested_check_out, requested_guests, requested_bungalow_type, requested_experience_id,
            source_channel, thread_id, thread_key, owner_user_id, owner_assigned_at,
            notes, last_message_at, sync_status, created_at, updated_at
        from booking_request
        order by updated_at desc
      `,
    );

    return result.rows.map((row) => this.toBookingRequest(row));
  }

  async listBookingRequestWorkItems(filters: {
    lane?: BookingRequestLane;
    ownerUserId?: string;
    query?: string;
  } = {}) {
    const items = await this.listBookingRequests();
    const details = await Promise.all(items.map((item) => this.getBookingRequestThreadView(item.id)));
    return details
      .filter((item): item is BookingRequestThreadView => item !== null)
      .map((item) => item.workItem)
      .filter((item) => (filters.lane ? item.lane === filters.lane : true))
      .filter((item) => (filters.ownerUserId ? item.ownerUserId === filters.ownerUserId : true))
      .filter((item) => {
        const query = filters.query?.trim().toLowerCase();
        if (!query) return true;
        return [item.publicRef, item.guestName, item.guestEmail, item.lastSnippet ?? ""].some((value) =>
          value.toLowerCase().includes(query),
        );
      })
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  async listOperationsWorkbenchItems(filters: {
    lane?: BookingRequestLane | "pending_mapping" | "pending_ack" | "sync_error";
    ownerUserId?: string;
    query?: string;
  } = {}): Promise<import("@/lib/reservations/types").OperationsWorkbenchItem[]> {
    await this.ensureBootstrap();
    return this.withTransaction(async (client) => {
      const bookingRequests = await this.listBookingRequestsWithClient(client);
      const bookingRequestViews = await Promise.all(
        bookingRequests.map((bookingRequest) => this.buildBookingRequestThreadView(client, bookingRequest)),
      );

      const otaReservations = await this.listOtaReservationsWithClient(client);
      const reservationViews = await Promise.all(
        otaReservations.map((reservation) => this.buildReservationOperationThreadView(client, reservation)),
      );

      return [
        ...bookingRequestViews.map((detail) =>
          buildBookingRequestOperationsItem({
            bookingRequest: detail.bookingRequest,
            messages: detail.messages,
            conflicts: detail.conflicts,
            ownerName: detail.workItem.ownerName,
          }),
        ),
        ...reservationViews.map((detail) => detail.workItem),
      ]
        .filter((item) => (filters.lane ? item.lane === filters.lane : true))
        .filter((item) => (filters.ownerUserId ? item.ownerUserId === filters.ownerUserId : true))
        .filter((item) => {
          const query = filters.query?.trim().toLowerCase();
          if (!query) return true;
          return [
            item.displayRef,
            item.publicRef ?? "",
            item.reservationNumber ?? "",
            item.guestName,
            item.guestEmail,
            item.ownerName ?? "",
            item.lastSnippet ?? "",
          ].some((value) => value.toLowerCase().includes(query));
        })
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    });
  }

  async getOperationThreadView(id: string): Promise<OperationThreadView | null> {
    await this.ensureBootstrap();
    return this.withTransaction(async (client) => {
      const bookingRequest = await this.getBookingRequestWithClient(client, id);
      if (bookingRequest) {
        const detail = await this.buildBookingRequestThreadView(client, bookingRequest);
        return {
          kind: "booking_request",
          bookingRequest: detail.bookingRequest,
          reservation: null,
          thread: detail.thread,
          messages: detail.messages,
          attachments: detail.attachments,
          conflicts: detail.conflicts,
          workItem: buildBookingRequestOperationsItem({
            bookingRequest: detail.bookingRequest,
            messages: detail.messages,
            conflicts: detail.conflicts,
            ownerName: detail.workItem.ownerName,
          }),
          otaLink: null,
          availableConversationProviders: ["zoho_mail"],
        };
      }

      const reservation = await this.getDetail(client, id);
      if (!reservation || reservation.channel !== "ota") {
        return null;
      }

      return this.buildReservationOperationThreadView(client, reservation);
    });
  }

  async listComplaints(): Promise<ComplaintCase[]> {
    await this.ensureBootstrap();
    await this.ensureComplaintSchema();
    const result = await this.pool.query<ComplaintRow>(
      `
        select
          id, public_code, type, status, full_name, document_type, document_number,
          email, phone, address, service_type, contracted_service,
          complaint_detail, consumer_request, accepted_declaration, created_at, updated_at
        from complaint_case
        order by updated_at desc
      `,
    );

    return result.rows.map((row) => this.toComplaint(row));
  }

  async getComplaint(id: string): Promise<ComplaintCase | null> {
    await this.ensureBootstrap();
    await this.ensureComplaintSchema();
    const result = await this.pool.query<ComplaintRow>(
      `
        select
          id, public_code, type, status, full_name, document_type, document_number,
          email, phone, address, service_type, contracted_service,
          complaint_detail, consumer_request, accepted_declaration, created_at, updated_at
        from complaint_case
        where id = $1
        limit 1
      `,
      [id],
    );

    const row = result.rows[0];
    return row ? this.toComplaint(row) : null;
  }

  async getBookingRequest(id: string): Promise<BookingRequest | null> {
    await this.ensureBootstrap();
    const result = await this.pool.query<BookingRequestRow>(
        `
          select
            id, public_ref, status, guest_name, guest_email, guest_phone,
            requested_check_in, requested_check_out, requested_guests, requested_bungalow_type, requested_experience_id,
            source_channel, thread_id, thread_key, owner_user_id, owner_assigned_at,
            notes, last_message_at, sync_status, created_at, updated_at
        from booking_request
        where id = $1
        limit 1
      `,
      [id],
    );

    const row = result.rows[0];
    return row ? this.toBookingRequest(row) : null;
  }

  async getBookingRequestThreadView(id: string): Promise<BookingRequestThreadView | null> {
    await this.ensureBootstrap();
    return this.withTransaction(async (client) => {
      const bookingRequest = await this.getBookingRequestWithClient(client, id);
      return bookingRequest ? this.buildBookingRequestThreadView(client, bookingRequest) : null;
    });
  }

  async listOtaConnections(providerKey?: OtaConnection["providerKey"]): Promise<OtaConnection[]> {
    await this.ensureBootstrap();
    const result = providerKey
      ? await this.pool.query<OtaConnectionRow>(
          `
            select
              id, provider_key, account_label, external_property_id, is_active,
              messages_enabled, ari_enabled, recovery_enabled, metadata, created_at, updated_at
            from ota_connection
            where provider_key = $1
            order by updated_at desc, account_label asc
          `,
          [providerKey],
        )
      : await this.pool.query<OtaConnectionRow>(
          `
            select
              id, provider_key, account_label, external_property_id, is_active,
              messages_enabled, ari_enabled, recovery_enabled, metadata, created_at, updated_at
            from ota_connection
            order by provider_key asc, updated_at desc, account_label asc
          `,
        );

    return result.rows.map((row) => this.toOtaConnection(row));
  }

  async upsertOtaConnection(
    providerKey: OtaConnection["providerKey"],
    input: OtaConnectionUpsertInput,
    id?: string,
  ): Promise<OtaConnection> {
    await this.ensureBootstrap();
    const now = isoNow();
    const connectionId = id ?? randomUUID();
    const result = await this.pool.query<OtaConnectionRow>(
      `
        insert into ota_connection (
          id, provider_key, account_label, external_property_id, is_active,
          messages_enabled, ari_enabled, recovery_enabled, metadata, created_at, updated_at
        ) values (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9::jsonb, $10, $10
        )
        on conflict (id) do update
        set
          provider_key = excluded.provider_key,
          account_label = excluded.account_label,
          external_property_id = excluded.external_property_id,
          is_active = excluded.is_active,
          messages_enabled = excluded.messages_enabled,
          ari_enabled = excluded.ari_enabled,
          recovery_enabled = excluded.recovery_enabled,
          metadata = excluded.metadata,
          updated_at = excluded.updated_at
        returning
          id, provider_key, account_label, external_property_id, is_active,
          messages_enabled, ari_enabled, recovery_enabled, metadata, created_at, updated_at
      `,
      [
        connectionId,
        providerKey,
        input.accountLabel,
        input.externalPropertyId ?? null,
        input.isActive ?? true,
        input.messagesEnabled ?? false,
        input.ariEnabled ?? false,
        input.recoveryEnabled ?? false,
        JSON.stringify(input.metadata ?? {}),
        now,
      ],
    );

    return this.toOtaConnection(result.rows[0]);
  }

  async listOtaRoomMappings(connectionId: string): Promise<OtaRoomMapping[]> {
    await this.ensureBootstrap();
    const result = await this.pool.query<OtaRoomMappingRow>(
      `
        select
          id, connection_id, external_room_type_code, bungalow_id, created_at, updated_at
        from ota_room_mapping
        where connection_id = $1
        order by external_room_type_code asc, created_at asc
      `,
      [connectionId],
    );
    return result.rows.map((row) => this.toOtaRoomMapping(row));
  }

  async upsertOtaRoomMapping(
    connectionId: string,
    input: OtaRoomMappingUpsertInput,
    id?: string,
  ): Promise<OtaRoomMapping> {
    await this.ensureBootstrap();
    const now = isoNow();
    const mappingId = id ?? randomUUID();
    const result = await this.pool.query<OtaRoomMappingRow>(
      `
        insert into ota_room_mapping (
          id, connection_id, external_room_type_code, bungalow_id, created_at, updated_at
        ) values (
          $1, $2, $3, $4, $5, $5
        )
        on conflict (connection_id, external_room_type_code) do update
        set
          bungalow_id = excluded.bungalow_id,
          updated_at = excluded.updated_at
        returning
          id, connection_id, external_room_type_code, bungalow_id, created_at, updated_at
      `,
      [mappingId, connectionId, input.externalRoomTypeCode, input.bungalowId ?? null, now],
    );
    return this.toOtaRoomMapping(result.rows[0]);
  }

  async listOtaRatePlanMappings(connectionId: string): Promise<OtaRatePlanMapping[]> {
    await this.ensureBootstrap();
    const result = await this.pool.query<OtaRatePlanMappingRow>(
      `
        select
          id, connection_id, external_rate_plan_code, internal_rate_plan_code, created_at, updated_at
        from ota_rate_plan_mapping
        where connection_id = $1
        order by external_rate_plan_code asc, created_at asc
      `,
      [connectionId],
    );
    return result.rows.map((row) => this.toOtaRatePlanMapping(row));
  }

  async upsertOtaRatePlanMapping(
    connectionId: string,
    input: OtaRatePlanMappingUpsertInput,
    id?: string,
  ): Promise<OtaRatePlanMapping> {
    await this.ensureBootstrap();
    const now = isoNow();
    const mappingId = id ?? randomUUID();
    const result = await this.pool.query<OtaRatePlanMappingRow>(
      `
        insert into ota_rate_plan_mapping (
          id, connection_id, external_rate_plan_code, internal_rate_plan_code, created_at, updated_at
        ) values (
          $1, $2, $3, $4, $5, $5
        )
        on conflict (connection_id, external_rate_plan_code) do update
        set
          internal_rate_plan_code = excluded.internal_rate_plan_code,
          updated_at = excluded.updated_at
        returning
          id, connection_id, external_rate_plan_code, internal_rate_plan_code, created_at, updated_at
      `,
      [mappingId, connectionId, input.externalRatePlanCode, input.internalRatePlanCode ?? null, now],
    );
    return this.toOtaRatePlanMapping(result.rows[0]);
  }

  async importOtaReservation(input: OtaReservationImportInput): Promise<OtaReservationImportResult> {
    await this.ensureBootstrap();
    return this.withTransaction(async (client) => {
      const actorId = "ota-sync";
      const now = isoNow();
      await client.query("select pg_advisory_xact_lock(hashtext($1))", [
        `ota:${input.sourceProvider}:${input.externalReservationId}`,
      ]);
      const mappedBungalowId =
        input.bungalowId ?? (await this.getMappedBungalowIdForOta(client, input.connectionId, input.externalRoomTypeCode));
      const existingLink = await this.getOtaReservationLinkByExternalId(
        client,
        input.sourceProvider,
        input.externalReservationId,
      );
      const existingReservation = existingLink ? await this.mustGetReservation(client, existingLink.reservationId) : null;
      const nextStatus = this.deriveOtaReservationStatus(input.providerStatus);
      const nights = nightsForReservation(input.startDate, input.endDate);
      const amountTotalCents = normalizeAmount(input.amountTotalCents ?? nights.length * DEFAULT_NIGHTLY_RATE_CENTS);
      const amountPaidCents = Math.min(normalizeAmount(input.amountPaidCents), amountTotalCents);
      const reservationId = existingReservation?.id ?? randomUUID();
      const reservationNumber =
        existingReservation?.number ??
        nextReservationNumber(
          (
            await client.query<Pick<ReservationRow, "number">>(`select number from reservation order by number asc`)
          ).rows,
        );
      const baseReservation: Reservation = {
        id: reservationId,
        number: reservationNumber,
        channel: "ota",
        status: nextStatus,
        sourceRequestId: existingReservation?.sourceRequestId ?? null,
        bungalowId: mappedBungalowId,
        bungalowUnitId: null,
        responsibleId: existingReservation?.responsibleId ?? null,
        startDate: input.startDate,
        endDate: input.endDate,
        guestName: input.guestName,
        guestEmail: input.guestEmail,
        guestPhone: input.guestPhone ?? null,
        guestCount: input.guestCount ?? null,
        sourceProvider: input.sourceProvider,
        externalReservationId: input.externalReservationId,
        externalPropertyId: input.externalPropertyId,
        externalRoomTypeCode: input.externalRoomTypeCode,
        externalRatePlanCode: input.externalRatePlanCode,
        providerStatus: input.providerStatus,
        providerPayloadChecksum: input.providerPayloadChecksum,
        providerLastEventAt: input.providerLastEventAt ?? now,
        amountTotalCents,
        amountPaidCents,
        paymentStatus: derivePaymentStatus(amountTotalCents, amountPaidCents),
        currencyCode: DEFAULT_CURRENCY_CODE,
        updatedAt: now,
      };
      const isBlockingStatus = isCapacityBlockingStatus(baseReservation.status);

      const isUnchanged =
        Boolean(existingReservation) &&
        existingLink?.providerPayloadChecksum === input.providerPayloadChecksum &&
        existingReservation?.startDate === baseReservation.startDate &&
        existingReservation?.endDate === baseReservation.endDate &&
        existingReservation?.bungalowId === baseReservation.bungalowId &&
        existingReservation?.status === baseReservation.status &&
        existingReservation?.guestEmail === baseReservation.guestEmail &&
        existingReservation?.guestName === baseReservation.guestName;

      if (isUnchanged && existingReservation) {
        const currentConflict = await this.getOpenReservationOnlyConflict(client, existingReservation.id);
        const inventoryStatus = !baseReservation.bungalowId
          ? "pending_mapping"
          : !isBlockingStatus
            ? "released"
            : currentConflict
              ? "conflict"
              : "assigned";

        await this.upsertOtaReservationLink(client, {
          reservationId: existingReservation.id,
          providerKey: input.sourceProvider,
          connectionId: input.connectionId,
          externalReservationId: input.externalReservationId,
          externalPropertyId: input.externalPropertyId,
          externalRoomTypeCode: input.externalRoomTypeCode,
          externalRatePlanCode: input.externalRatePlanCode,
          providerStatus: input.providerStatus,
          providerPayloadChecksum: input.providerPayloadChecksum,
          providerEventVersion: input.providerEventVersion ?? input.providerPayloadChecksum,
          providerThreadId: input.providerThreadId ?? existingLink?.providerThreadId ?? null,
          providerLastEventAt: input.providerLastEventAt ?? now,
          rawPayload: input.rawPayload ?? null,
        });
        await this.recordOtaEvent(client, {
          providerKey: input.sourceProvider,
          connectionId: input.connectionId,
          reservationId: existingReservation.id,
          externalReservationId: input.externalReservationId,
          eventType: "reservation_skipped",
          payload: input.rawPayload ?? {},
        });

        return {
          reservationId: existingReservation.id,
          reservationNumber: existingReservation.number,
          bungalowTypeId: baseReservation.bungalowId ?? null,
          bungalowUnitId: null,
          inventoryStatus,
          availabilityConflictId: currentConflict?.id ?? null,
          idempotentReplay: true,
          created: false,
          updated: false,
          occupancyBlocked: inventoryStatus === "assigned",
          conflictIds: currentConflict ? [currentConflict.id] : [],
          pendingMapping: !baseReservation.bungalowId,
          acknowledgedExternally: false,
        };
      }

      let nextReservation: Reservation = {
        ...baseReservation,
        bungalowUnitId: null,
      };
      let availabilityConflict: AvailabilityConflict | null = null;
      let inventoryStatus: "assigned" | "conflict" | "released" | "pending_mapping";

      if (nextReservation.bungalowId && isBlockingStatus) {
        const availability = await this.loadAggregateCapacityAvailability(client, {
          reservationId,
          bungalowId: nextReservation.bungalowId,
          checkIn: nextReservation.startDate,
          checkOut: nextReservation.endDate,
          lockReservationRow: Boolean(existingReservation),
        });

        if (availability.canAcceptOneMore) {
          inventoryStatus = "assigned";
        } else {
          availabilityConflict = await this.upsertReservationOnlyConflict(client, {
            reservationId,
            actorId,
            notes: `Sin cupos disponibles para ${nextReservation.startDate} → ${nextReservation.endDate}.`,
            metadata: {
              scope: "reservation_only",
              title: "Conflicto crítico OTA",
              overlappingReservationIds: [],
            },
          });
          inventoryStatus = "conflict";
        }
      } else {
        nextReservation = {
          ...nextReservation,
          bungalowUnitId: null,
        };
        inventoryStatus = nextReservation.bungalowId ? "released" : "pending_mapping";
      }

      if (existingReservation) {
        await client.query(`delete from reservation_occupancy where reservation_id = $1`, [existingReservation.id]);
        await this.updateReservationRow(client, nextReservation);
      } else {
        await client.query(
          `
            insert into reservation (
              id, number, channel, status, source_request_id, bungalow_id, bungalow_unit_id, responsible_id,
              start_date, end_date, guest_name, guest_email, guest_phone, guest_count,
              source_provider, external_reservation_id, external_property_id,
              external_room_type_code, external_rate_plan_code, provider_status,
              provider_payload_checksum, provider_last_event_at,
              amount_total_cents, amount_paid_cents, payment_status, currency_code, updated_at
            ) values (
              $1, $2, $3, $4, $5, $6, $7, $8,
              $9, $10, $11, $12, $13, $14,
              $15, $16, $17,
              $18, $19, $20,
              $21, $22,
              $23, $24, $25, $26, $27
            )
          `,
          [
            nextReservation.id,
            nextReservation.number,
            nextReservation.channel,
            nextReservation.status,
            nextReservation.sourceRequestId,
            nextReservation.bungalowId,
            nextReservation.bungalowUnitId ?? null,
            nextReservation.responsibleId,
            nextReservation.startDate,
            nextReservation.endDate,
            nextReservation.guestName,
            nextReservation.guestEmail,
            nextReservation.guestPhone,
            nextReservation.guestCount,
            nextReservation.sourceProvider,
            nextReservation.externalReservationId,
            nextReservation.externalPropertyId,
            nextReservation.externalRoomTypeCode,
            nextReservation.externalRatePlanCode,
            nextReservation.providerStatus,
            nextReservation.providerPayloadChecksum,
            nextReservation.providerLastEventAt,
            nextReservation.amountTotalCents ?? null,
            nextReservation.amountPaidCents ?? null,
            nextReservation.paymentStatus ?? null,
            nextReservation.currencyCode ?? null,
            nextReservation.updatedAt,
          ],
        );
      }

      if (inventoryStatus === "assigned" && nextReservation.bungalowId) {
        await this.insertOccupancyRows(
          client,
          nextReservation,
          nextReservation.bungalowId,
          occupancyStatusForReservation(nextReservation.status),
        );
        await this.resolveReservationOnlyConflicts(client, nextReservation.id, actorId);
      } else if (inventoryStatus !== "conflict") {
        await this.resolveReservationOnlyConflicts(client, nextReservation.id, actorId);
      }

      await this.reconcileReservationConflictsAgainstOpenRequests(client, nextReservation, actorId);
      await this.upsertOtaReservationLink(client, {
        reservationId: nextReservation.id,
        providerKey: input.sourceProvider,
        connectionId: input.connectionId,
        externalReservationId: input.externalReservationId,
        externalPropertyId: input.externalPropertyId,
        externalRoomTypeCode: input.externalRoomTypeCode,
        externalRatePlanCode: input.externalRatePlanCode,
        providerStatus: input.providerStatus,
        providerPayloadChecksum: input.providerPayloadChecksum,
        providerEventVersion: input.providerEventVersion ?? input.providerPayloadChecksum,
        providerThreadId: input.providerThreadId ?? existingLink?.providerThreadId ?? null,
        providerLastEventAt: input.providerLastEventAt ?? now,
        rawPayload: input.rawPayload ?? null,
      });
      await this.recordOtaEvent(client, {
        providerKey: input.sourceProvider,
        connectionId: input.connectionId,
        reservationId: nextReservation.id,
        externalReservationId: input.externalReservationId,
        eventType: existingReservation ? (isUnchanged ? "reservation_skipped" : "reservation_updated") : "reservation_imported",
        payload: input.rawPayload ?? {},
      });

      if (!existingReservation) {
        await this.insertAudit(
          client,
          createReservationAuditEntry({
            reservationId: nextReservation.id,
            actorId,
            action: "ota_import",
            previousStatus: nextReservation.status,
            nextStatus: nextReservation.status,
            reason: `Importada desde ${input.sourceProvider}`,
          }),
        );
      }

      return {
        reservationId: nextReservation.id,
        reservationNumber: nextReservation.number,
        bungalowTypeId: nextReservation.bungalowId ?? null,
        bungalowUnitId: nextReservation.bungalowUnitId ?? null,
        inventoryStatus,
        availabilityConflictId: availabilityConflict?.id ?? null,
        idempotentReplay: false,
        created: !existingReservation,
        updated: Boolean(existingReservation && !isUnchanged),
        occupancyBlocked: inventoryStatus === "assigned",
        conflictIds: availabilityConflict ? [availabilityConflict.id] : [],
        pendingMapping: !nextReservation.bungalowId,
        acknowledgedExternally: false,
      };
    });
  }

  async syncOtaProvider(
    providerKey: OtaConnection["providerKey"],
    mode: "incremental" | "recovery",
    _actorId: string,
  ): Promise<OtaReservationSyncResult> {
    await this.ensureBootstrap();
    return this.withOtaSyncLock(`ota-sync:${providerKey}:${mode}`, async () => {
      const connections = (await this.listOtaConnections(providerKey)).filter((connection) => connection.isActive);
      const eligibleConnections = connections.filter((connection) =>
        mode === "recovery" ? connection.recoveryEnabled : true,
      );
      const startedAt = isoNow();
      if (eligibleConnections.length === 0) {
        return {
          providerKey,
          mode,
          imported: 0,
          acknowledged: 0,
          skipped: 0,
          pendingMapping: 0,
          conflicts: 0,
          failures: 0,
          startedAt,
          finishedAt: isoNow(),
        };
      }

      const runtime: OtaProviderRuntime = {
        importReservation: async (input) => this.importOtaReservation(input),
        logSyncRun: async (input) => this.logOtaSyncRun(input),
      };
      const provider = getOtaProvider(providerKey, runtime);

      let imported = 0;
      let acknowledged = 0;
      let skipped = 0;
      let pendingMapping = 0;
      let conflicts = 0;
      let failures = 0;

      for (const connection of eligibleConnections) {
        try {
          const result = await provider.syncReservations({ connection, mode });
          imported += result.imported;
          acknowledged += result.acknowledged;
          skipped += result.skipped;
          pendingMapping += result.pendingMapping;
          conflicts += result.conflicts;
          await this.updateOtaSyncCursor(connection.id, providerKey, mode, result.finishedAt);
        } catch {
          failures += 1;
        }
      }

      return {
        providerKey,
        mode,
        imported,
        acknowledged,
        skipped,
        pendingMapping,
        conflicts,
        failures,
        startedAt,
        finishedAt: isoNow(),
      };
    });
  }

  async getOtaReservationLink(reservationId: string): Promise<OtaReservationLink | null> {
    await this.ensureBootstrap();
    const result = await this.pool.query<OtaReservationLinkRow>(
      `
        select
          reservation_id, provider_key, connection_id, external_reservation_id, external_property_id,
          external_room_type_code, external_rate_plan_code, provider_status, provider_payload_checksum,
          provider_event_version, provider_thread_id, provider_last_event_at, raw_payload, created_at, updated_at
        from ota_reservation_link
        where reservation_id = $1
        limit 1
      `,
      [reservationId],
    );
    return result.rows[0] ? this.toOtaReservationLink(result.rows[0]) : null;
  }

  async resyncOtaReservation(reservationId: string, actorId: string): Promise<OperationThreadView> {
    await this.ensureBootstrap();
    const link = await this.getOtaReservationLink(reservationId);
    if (!link) {
      throw new Error("reservation_not_found");
    }
    await this.syncOtaProvider(link.providerKey, "incremental", actorId);
    const detail = await this.getOperationThreadView(reservationId);
    if (!detail) {
      throw new Error("reservation_not_found");
    }
    return detail;
  }

  async resolveOtaReservationConflict(
    reservationId: string,
    actorId: string,
    notes: string,
  ): Promise<OperationThreadView> {
    await this.ensureBootstrap();
    return this.withTransaction(async (client) => {
      const now = isoNow();
      await client.query(
        `
          update availability_conflict
          set
            status = 'resolved',
            resolved_by = $2,
            resolved_at = $3,
            notes = case
              when coalesce(notes, '') = '' then $4
              else notes || E'\n' || $4
            end
          where reservation_id = $1
            and status = 'open'
        `,
        [reservationId, actorId, now, notes],
      );

      const detail = await this.getDetail(client, reservationId);
      if (!detail || detail.channel !== "ota") {
        throw new Error("reservation_not_found");
      }
      return this.buildReservationOperationThreadView(client, detail);
    });
  }

  async assignBookingRequestOwner(
    id: string,
    input: BookingRequestOwnerAssignmentInput,
  ): Promise<BookingRequestThreadView> {
    await this.ensureBootstrap();
    return this.withTransaction(async (client) => {
      const bookingRequest = await this.getBookingRequestWithClient(client, id);
      if (!bookingRequest) {
        throw new Error("booking_request_not_found");
      }

      const thread = await this.ensureThreadForBookingRequest(client, bookingRequest);
      const assignedAt = isoNow();
      await client.query(
        `
          update booking_request
          set owner_user_id = $2, owner_assigned_at = $3, updated_at = $3
          where id = $1
        `,
        [bookingRequest.id, input.ownerUserId, assignedAt],
      );

      await this.insertMessageItem(
        client,
        this.buildSyntheticMessage(bookingRequest, thread, {
          direction: "outbound",
          origin: "system_outbound",
          fromAddress: RESERVATIONS_MAILBOX_ADDRESS,
          toAddresses: [],
          subject: thread.subject ?? `Solicitud ${bookingRequest.publicRef}`,
          bodyText: input.ownerUserId
            ? `Usuario asignado: ${input.ownerName ?? input.ownerUserId}.`
            : `Ownership liberado por ${input.actorId}.`,
          sentAt: assignedAt,
          createdByUserId: input.actorId,
        }),
      );

      const refreshed = await this.getBookingRequestWithClient(client, id);
      if (!refreshed) {
        throw new Error("booking_request_not_found");
      }
      return this.buildBookingRequestThreadView(client, refreshed);
    });
  }

  async updateBookingRequest(
    id: string,
    input: BookingRequestUpdateInput,
  ): Promise<UpdateBookingRequestResult> {
    await this.ensureBootstrap();
    return this.withTransaction(async (client) => {
      const bookingRequest = await this.getBookingRequestWithClient(client, id);
      if (!bookingRequest) {
        throw new Error("booking_request_not_found");
      }
      if (bookingRequest.status === "cancelled" || bookingRequest.status === "converted_to_reservation") {
        throw new Error("invalid_transition");
      }

      const updatedBookingRequest: BookingRequest = {
        ...bookingRequest,
        requestedCheckIn: input.requestedCheckIn,
        requestedCheckOut: input.requestedCheckOut,
        requestedBungalowType: input.requestedBungalowType ?? null,
        requestedExperienceId: input.requestedExperienceId ?? bookingRequest.requestedExperienceId ?? null,
        notes: input.notes ?? bookingRequest.notes,
        updatedAt: isoNow(),
      };

      await client.query(
        `
          update booking_request
          set
            requested_check_in = $2,
            requested_check_out = $3,
            requested_bungalow_type = $4,
            requested_experience_id = $5,
            notes = $6,
            updated_at = $7
          where id = $1
        `,
        [
          updatedBookingRequest.id,
          updatedBookingRequest.requestedCheckIn,
          updatedBookingRequest.requestedCheckOut,
          updatedBookingRequest.requestedBungalowType,
          updatedBookingRequest.requestedExperienceId,
          updatedBookingRequest.notes,
          updatedBookingRequest.updatedAt,
        ],
      );

      await this.reconcileBookingRequestConflicts(client, updatedBookingRequest, input.actorId);
      return this.buildBookingRequestThreadView(client, updatedBookingRequest);
    });
  }

  async recordBookingRequestMessage(
    id: string,
    input: BookingRequestMessageInput,
  ): Promise<RecordBookingRequestMessageResult> {
    await this.ensureBootstrap();
    return this.withTransaction(async (client) => {
      const bookingRequest = await this.getBookingRequestWithClient(client, id);
      if (!bookingRequest) {
        throw new Error("booking_request_not_found");
      }

      const thread = await this.ensureThreadForBookingRequest(client, bookingRequest);
      const message = this.buildSyntheticMessage(bookingRequest, thread, input);
      await this.insertMessageItem(client, message);
      await client.query(
        `
          update message_thread
          set provider_thread_id = coalesce($2, provider_thread_id), subject = $3, updated_at = $4
          where id = $1
        `,
        [thread.id, input.providerThreadId ?? null, input.subject, isoNow()],
      );
      await client.query(
        `
          update booking_request
          set last_message_at = $2, sync_status = $3, updated_at = $4
          where id = $1
        `,
        [bookingRequest.id, messageActivityAt(message), input.origin === "system_outbound" ? "pending" : bookingRequest.syncStatus, isoNow()],
      );

      const refreshed = await this.getBookingRequestWithClient(client, id);
      if (!refreshed) {
        throw new Error("booking_request_not_found");
      }
      const detail = await this.buildBookingRequestThreadView(client, refreshed);
      return { ...detail, message };
    });
  }

  async transitionBookingRequest(
    id: string,
    input: BookingRequestStatusTransitionInput,
  ): Promise<BookingRequest> {
    await this.ensureBootstrap();
    return this.withTransaction(async (client) => {
      const bookingRequest = await this.getBookingRequestWithClient(client, id);
      if (!bookingRequest) {
        throw new Error("booking_request_not_found");
      }

      const nextStatus = nextBookingRequestStatus(bookingRequest.status, input.action);
      const updatedAt = isoNow();

      await client.query(
        `
          update booking_request
          set status = $2, updated_at = $3
          where id = $1
        `,
        [bookingRequest.id, nextStatus, updatedAt],
      );

      return {
        ...bookingRequest,
        status: nextStatus,
        updatedAt,
      };
    });
  }

  async syncBookingRequestThread(id: string): Promise<SyncBookingRequestThreadResult> {
    await this.ensureBootstrap();
    return this.withTransaction(async (client) => {
      const bookingRequest = await this.getBookingRequestWithClient(client, id);
      if (!bookingRequest) {
        throw new Error("booking_request_not_found");
      }

      const thread = await this.ensureThreadForBookingRequest(client, bookingRequest);
      const providerThreadId =
        thread.providerThreadId ??
        (await searchThreadIdByBookingRequest({
          publicRef: bookingRequest.publicRef,
        }));
      if (!providerThreadId) {
        return this.buildBookingRequestThreadView(client, bookingRequest);
      }

      const providerMessages = dedupeProviderMessages(await listThreadMessages(providerThreadId));
      const now = isoNow();
      const nextSyncStatus = providerMessages.length > 0 ? "synced" : "pending";

      for (const providerMessage of providerMessages) {
        const message = await this.upsertThreadMessage(client, thread, bookingRequest, providerMessage, now);
        await this.upsertMessageAttachments(client, thread, message, providerMessage.attachments, now);
      }

      await client.query(
        `
          update message_thread
          set provider_thread_id = $2, sync_status = $3, last_synced_at = $4, updated_at = $4
          where id = $1
        `,
        [thread.id, providerMessages[0]?.providerThreadId ?? providerThreadId, nextSyncStatus, now],
      );
      await client.query(
        `
          update booking_request
          set sync_status = $2, last_message_at = $3, updated_at = $4
          where id = $1
        `,
        [
          bookingRequest.id,
          nextSyncStatus,
          providerMessages[0]?.receivedAt ?? providerMessages[0]?.sentAt ?? bookingRequest.lastMessageAt,
          now,
        ],
      );

      const refreshed = await this.getBookingRequestWithClient(client, id);
      if (!refreshed) {
        throw new Error("booking_request_not_found");
      }
      return this.buildBookingRequestThreadView(client, refreshed);
    });
  }

  async replyToBookingRequestThread(
    id: string,
    input: BookingRequestReplyInput,
  ): Promise<BookingRequestReplyResult> {
    await this.ensureBootstrap();
    return this.withTransaction(async (client) => {
      const bookingRequest = await this.getBookingRequestWithClient(client, id);
      if (!bookingRequest) {
        throw new Error("booking_request_not_found");
      }

      const thread = await this.ensureThreadForBookingRequest(client, bookingRequest);
      let parentMessage = await this.getLatestThreadMessage(client, thread.id);
      if (!parentMessage) {
        const providerThreadId =
          thread.providerThreadId ??
          (await searchThreadIdByBookingRequest({
            publicRef: bookingRequest.publicRef,
          }));

        if (providerThreadId) {
          const providerMessages = dedupeProviderMessages(await listThreadMessages(providerThreadId));
          const syncedAt = isoNow();
          const nextSyncStatus = providerMessages.length > 0 ? "synced" : "pending";

          for (const providerMessage of providerMessages) {
            const message = await this.upsertThreadMessage(client, thread, bookingRequest, providerMessage, syncedAt);
            await this.upsertMessageAttachments(client, thread, message, providerMessage.attachments, syncedAt);
          }

          await client.query(
            `
              update message_thread
              set provider_thread_id = $2, sync_status = $3, last_synced_at = $4, updated_at = $4
              where id = $1
            `,
            [thread.id, providerMessages[0]?.providerThreadId ?? providerThreadId, nextSyncStatus, syncedAt],
          );
          await client.query(
            `
              update booking_request
              set sync_status = $2, last_message_at = $3, updated_at = $4
              where id = $1
            `,
            [
              bookingRequest.id,
              nextSyncStatus,
              providerMessages[0]?.receivedAt ?? providerMessages[0]?.sentAt ?? bookingRequest.lastMessageAt,
              syncedAt,
            ],
          );

          parentMessage = await this.getLatestThreadMessage(client, thread.id);
        }
      }

      const nextSubject = input.subject ?? thread.subject ?? `Solicitud ${bookingRequest.publicRef}`;
      let providerReply: {
        providerMessageId: string;
        providerThreadId: string | null;
        sentAt: string;
      };

      if (!parentMessage) {
        const delivery = await sendTransactionalZohoEmail({
          to: [bookingRequest.guestEmail],
          subject: nextSubject,
          replyTo: RESERVATIONS_MAILBOX_ADDRESS,
          text: input.bodyText,
          html: "",
          idempotencyKey: `booking-request:${bookingRequest.publicRef}:erp-reply:${randomUUID()}`,
          threadKey: thread.threadKey,
        });

        if (delivery.status !== "sent" || !delivery.providerMessageId) {
          throw new Error("zoho_sync_failed");
        }

        providerReply = {
          providerMessageId: delivery.providerMessageId,
          providerThreadId: delivery.providerThreadId ?? null,
          sentAt: delivery.sentAt ?? isoNow(),
        };
      } else {
        providerReply = await sendThreadReply({
          providerMessageId: parentMessage.providerMessageId,
          toAddress: bookingRequest.guestEmail,
          subject: nextSubject,
          bodyText: input.bodyText,
        });
      }
      const now = isoNow();
      const reply: MessageItem = {
        id: randomUUID(),
        threadId: thread.id,
        direction: "outbound",
        origin: "erp_outbound",
        providerMessageId: providerReply.providerMessageId,
        fromAddress: "reservas@wakayaecolodge.com",
        toAddresses: [bookingRequest.guestEmail],
        ccAddresses: [],
        subject: nextSubject,
        bodyText: input.bodyText,
        bodyHtml: null,
        sentAt: providerReply.sentAt,
        receivedAt: null,
        ingestedAt: now,
        createdByUserId: input.actorId,
        attachments: [],
      };

      await this.insertMessageItem(client, reply);
      await client.query(
        `
          update message_thread
          set provider_thread_id = coalesce($2, provider_thread_id), subject = $3, updated_at = $4
          where id = $1
        `,
        [thread.id, providerReply.providerThreadId, nextSubject, now],
      );
      await client.query(
        `
          update booking_request
          set last_message_at = $2, updated_at = $3
          where id = $1
        `,
        [bookingRequest.id, reply.sentAt ?? now, now],
      );

      return {
        bookingRequest: {
          ...bookingRequest,
          lastMessageAt: reply.sentAt ?? now,
          updatedAt: now,
        },
        thread: {
          ...thread,
          providerThreadId: providerReply.providerThreadId ?? thread.providerThreadId,
          subject: nextSubject,
          updatedAt: now,
        },
        reply,
      };
    });
  }

  async listQuickReplyTemplates(): Promise<QuickReplyTemplate[]> {
    await this.ensureBootstrap();
    const result = await this.pool.query<QuickReplyTemplateRow>(
      `
        select
          id, key, label, category, subject_mode, body_text,
          is_active, sort_order, updated_by_user_id, updated_at
        from quick_reply_template
        order by sort_order asc, label asc
      `,
    );

    return result.rows.map((row) => this.toQuickReplyTemplate(row));
  }

  async createQuickReplyTemplate(input: QuickReplyTemplateUpsertInput): Promise<QuickReplyTemplate> {
    await this.ensureBootstrap();
    const template: QuickReplyTemplate = {
      id: randomUUID(),
      key: input.key,
      label: input.label,
      category: input.category,
      subjectMode: input.subjectMode,
      bodyText: input.bodyText,
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder,
      updatedByUserId: input.updatedByUserId,
      updatedAt: isoNow(),
    };

    await this.pool.query(
      `
        insert into quick_reply_template(
          id, key, label, category, subject_mode, body_text,
          is_active, sort_order, updated_by_user_id, updated_at
        ) values (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10
        )
      `,
      [
        template.id,
        template.key,
        template.label,
        template.category,
        template.subjectMode,
        template.bodyText,
        template.isActive,
        template.sortOrder,
        template.updatedByUserId,
        template.updatedAt,
      ],
    );

    return template;
  }

  async updateQuickReplyTemplate(id: string, input: QuickReplyTemplateUpsertInput): Promise<QuickReplyTemplate> {
    await this.ensureBootstrap();
    const updatedAt = isoNow();
    const result = await this.pool.query<QuickReplyTemplateRow>(
      `
        update quick_reply_template
        set
          key = $2,
          label = $3,
          category = $4,
          subject_mode = $5,
          body_text = $6,
          is_active = $7,
          sort_order = $8,
          updated_by_user_id = $9,
          updated_at = $10
        where id = $1
        returning
          id, key, label, category, subject_mode, body_text,
          is_active, sort_order, updated_by_user_id, updated_at
      `,
      [
        id,
        input.key,
        input.label,
        input.category,
        input.subjectMode,
        input.bodyText,
        input.isActive ?? true,
        input.sortOrder,
        input.updatedByUserId,
        updatedAt,
      ],
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error("booking_request_not_found");
    }
    return this.toQuickReplyTemplate(row);
  }

  async deactivateQuickReplyTemplate(id: string, actorId: string): Promise<QuickReplyTemplate> {
    await this.ensureBootstrap();
    const updatedAt = isoNow();
    const result = await this.pool.query<QuickReplyTemplateRow>(
      `
        update quick_reply_template
        set is_active = false, updated_by_user_id = $2, updated_at = $3
        where id = $1
        returning
          id, key, label, category, subject_mode, body_text,
          is_active, sort_order, updated_by_user_id, updated_at
      `,
      [id, actorId, updatedAt],
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error("booking_request_not_found");
    }
    return this.toQuickReplyTemplate(row);
  }

  async get(id: string): Promise<ReservationDetail | null> {
    await this.ensureBootstrap();
    return this.getDetail(this.pool, id);
  }

  async getBungalow(id: string): Promise<Bungalow | null> {
    await this.ensureBootstrap();
    const result = await this.pool.query<Bungalow>(
      `select id, code, name, active, capacity from bungalow where id = $1 limit 1`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async getBungalowPublicContent(id: string): Promise<BungalowPublicContent | null> {
    await this.ensureBootstrap();
    const result = await this.pool.query<BungalowPublicContentRow>(
      `
        select
          bungalow_id, revision_version, featured_on_home, sort_order, hero_image_url,
          gallery_urls, nightly_rate_pen, area_sqm, locale_content, hero_asset_id, gallery_asset_ids, updated_at
        from bungalow_public_content
        where bungalow_id = $1
        limit 1
      `,
      [id],
    );
    const row = result.rows[0];
    return row ? this.toBungalowPublicContent(row) : null;
  }

  async listBungalows(): Promise<Bungalow[]> {
    await this.ensureBootstrap();
    const result = await this.pool.query<Bungalow>(
      `select id, code, name, active, capacity from bungalow order by name asc`,
    );
    return result.rows;
  }

  async listBungalowPublicContent(): Promise<BungalowPublicContent[]> {
    await this.ensureBootstrap();
    const result = await this.pool.query<BungalowPublicContentRow>(
      `
        select
          bungalow_id, revision_version, featured_on_home, sort_order, hero_image_url,
          gallery_urls, nightly_rate_pen, area_sqm, locale_content, hero_asset_id, gallery_asset_ids, updated_at
        from bungalow_public_content
        order by sort_order asc, bungalow_id asc
      `,
    );
    return result.rows.map((row) => this.toBungalowPublicContent(row));
  }

  async createBungalow(input: BungalowCreateInput): Promise<Bungalow> {
    await this.ensureBootstrap();
    const normalized = normalizeBungalowInput(input);
    const bungalow: Bungalow = {
      id: buildBungalowId(normalized.code),
      code: normalized.code,
      name: normalized.name,
      active: normalized.active,
      capacity: normalized.capacity,
    };

    try {
      const result = await this.pool.query<Bungalow>(
        `
          insert into bungalow (id, code, name, active, capacity)
          values ($1, $2, $3, $4, $5)
          returning id, code, name, active, capacity
        `,
        [bungalow.id, bungalow.code, bungalow.name, bungalow.active, bungalow.capacity],
      );
      return result.rows[0];
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "23505"
      ) {
        throw new Error("bungalow_code_taken");
      }
      throw error;
    }
  }

  async updateBungalow(id: string, input: BungalowUpdateInput): Promise<Bungalow> {
    await this.ensureBootstrap();
    const normalized = normalizeBungalowInput(input);

    try {
      const result = await this.pool.query<Bungalow>(
        `
          update bungalow
          set code = $2, name = $3, active = $4, capacity = $5
          where id = $1
          returning id, code, name, active, capacity
        `,
        [id, normalized.code, normalized.name, normalized.active, normalized.capacity],
      );
      const bungalow = result.rows[0];
      if (!bungalow) {
        throw new Error("bungalow_not_found");
      }
      return bungalow;
    } catch (error) {
      if (error instanceof Error && error.message === "bungalow_not_found") {
        throw error;
      }
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "23505"
      ) {
        throw new Error("bungalow_code_taken");
      }
      throw error;
    }
  }

  async updateBungalowPublicContent(
    id: string,
    input: BungalowPublicContentUpdateInput,
  ): Promise<BungalowPublicContent> {
    await this.ensureBootstrap();
    return this.withTransaction(async (client) => {
      const bungalow = await client.query<Bungalow>(
        `select id, code, name, active, capacity from bungalow where id = $1 limit 1`,
        [id],
      );
      if (!bungalow.rows[0]) {
        throw new Error("bungalow_not_found");
      }

      const currentVersionResult = await client.query<{ revision_version: number }>(
        `
          select revision_version
          from bungalow_public_content
          where bungalow_id = $1
          limit 1
          for update
        `,
        [id],
      );
      const currentVersion = currentVersionResult.rows[0]?.revision_version ?? 0;
      if (typeof input.expectedVersion === "number" && input.expectedVersion !== currentVersion) {
        throw new Error("content_version_conflict");
      }

      const updatedAt = isoNow();
      const result = await client.query<BungalowPublicContentRow>(
        `
          insert into bungalow_public_content (
            bungalow_id, revision_version, featured_on_home, sort_order, hero_image_url,
            gallery_urls, nightly_rate_pen, area_sqm, locale_content, hero_asset_id, gallery_asset_ids, updated_at
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, $12)
          on conflict (bungalow_id) do update
          set revision_version = excluded.revision_version,
              featured_on_home = excluded.featured_on_home,
              sort_order = excluded.sort_order,
              hero_image_url = excluded.hero_image_url,
              gallery_urls = excluded.gallery_urls,
              nightly_rate_pen = excluded.nightly_rate_pen,
              area_sqm = excluded.area_sqm,
              locale_content = excluded.locale_content,
              hero_asset_id = excluded.hero_asset_id,
              gallery_asset_ids = excluded.gallery_asset_ids,
              updated_at = excluded.updated_at
          returning
            bungalow_id, revision_version, featured_on_home, sort_order, hero_image_url,
            gallery_urls, nightly_rate_pen, area_sqm, locale_content, hero_asset_id, gallery_asset_ids, updated_at
        `,
        [
          id,
          currentVersion + 1,
          input.featuredOnHome,
          input.sortOrder,
          input.heroImageUrl,
          input.galleryUrls,
          input.nightlyRatePen,
          input.areaSqm,
          JSON.stringify(input.localeContent),
          input.heroAssetId ?? null,
          input.galleryAssetIds ?? [],
          updatedAt,
        ],
      );
      return this.toBungalowPublicContent(result.rows[0]);
    });
  }

  async getAuditTrail(reservationId: string): Promise<ReservationAudit[]> {
    await this.ensureBootstrap();
    const result = await this.pool.query<AuditRow>(
      `
        select id, reservation_id, actor_id, action, previous_status, next_status, reason, created_at
        from reservation_audit
        where reservation_id = $1
        order by created_at desc
      `,
      [reservationId],
    );
    return result.rows.map((row) => this.toAudit(row));
  }

  async create(input: ReservationCreateInput): Promise<CreateReservationResult> {
    await this.ensureBootstrap();
    return this.withTransaction(async (client) => {
      const reservationId = randomUUID();
      const status = defaultStatus(input.channel);
      const updatedAt = isoNow();
      const nights = nightsForReservation(input.startDate, input.endDate);
      const amountTotalCents = normalizeAmount(input.amountTotalCents ?? nights.length * DEFAULT_NIGHTLY_RATE_CENTS);
      const amountPaidCents = Math.min(normalizeAmount(input.amountPaidCents), amountTotalCents);
      if (input.bungalowId) {
        const bungalow = await this.mustGetBungalow(client, input.bungalowId);
        if (!bungalow.active) throw new Error("bungalow_inactive");
        if (isCapacityBlockingStatus(status)) {
          const availability = await this.loadAggregateCapacityAvailability(client, {
            reservationId,
            bungalowId: input.bungalowId,
            checkIn: input.startDate,
            checkOut: input.endDate,
            lockReservationRow: false,
          });
          if (!availability.canAcceptOneMore) throw new Error("bungalow_capacity_unavailable");
        }
      }

      const reservation: Reservation = {
        id: reservationId,
        number: input.number,
        channel: input.channel,
        status,
        bungalowId: input.bungalowId,
        bungalowUnitId: null,
        responsibleId: input.responsibleId ?? null,
        startDate: input.startDate,
        endDate: input.endDate,
        guestName: input.guestName ?? null,
        guestEmail: input.guestEmail ?? null,
        guestPhone: input.guestPhone ?? null,
        guestCount: input.guestCount ?? null,
        sourceProvider: input.sourceProvider ?? null,
        externalReservationId: input.externalReservationId ?? null,
        externalPropertyId: input.externalPropertyId ?? null,
        externalRoomTypeCode: input.externalRoomTypeCode ?? null,
        externalRatePlanCode: input.externalRatePlanCode ?? null,
        providerStatus: input.providerStatus ?? null,
        providerPayloadChecksum: input.providerPayloadChecksum ?? null,
        providerLastEventAt: input.providerLastEventAt ?? null,
        amountTotalCents,
        amountPaidCents,
        paymentStatus: derivePaymentStatus(amountTotalCents, amountPaidCents),
        currencyCode: DEFAULT_CURRENCY_CODE,
        updatedAt,
        sourceRequestId: input.sourceRequestId ?? null,
      };

      await client.query(
        `
          insert into reservation (
            id, number, channel, status, source_request_id, bungalow_id, responsible_id,
            start_date, end_date, guest_name, guest_email, guest_phone, guest_count,
            source_provider, external_reservation_id, external_property_id,
            external_room_type_code, external_rate_plan_code, provider_status,
            provider_payload_checksum, provider_last_event_at,
            amount_total_cents, amount_paid_cents, payment_status, currency_code, updated_at
          ) values (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11, $12, $13,
            $14, $15, $16,
            $17, $18, $19,
            $20, $21,
            $22, $23, $24, $25, $26
          )
        `,
        [
          reservation.id,
          reservation.number,
          reservation.channel,
          reservation.status,
          reservation.sourceRequestId,
          reservation.bungalowId,
          reservation.responsibleId,
          reservation.startDate,
          reservation.endDate,
          reservation.guestName,
          reservation.guestEmail,
          reservation.guestPhone,
          reservation.guestCount,
          reservation.sourceProvider,
          reservation.externalReservationId,
          reservation.externalPropertyId,
          reservation.externalRoomTypeCode,
          reservation.externalRatePlanCode,
          reservation.providerStatus,
          reservation.providerPayloadChecksum,
          reservation.providerLastEventAt,
          reservation.amountTotalCents ?? null,
          reservation.amountPaidCents ?? null,
          reservation.paymentStatus ?? null,
          reservation.currencyCode ?? null,
          reservation.updatedAt,
        ],
      );

      const occupancy = isCapacityBlockingStatus(status)
        ? await this.insertOccupancyRows(
            client,
            reservation,
            input.bungalowId,
            occupancyStatusForReservation(status),
          )
        : [];
      await this.reconcileReservationConflictsAgainstOpenRequests(
        client,
        reservation,
        input.actorId,
      );
      const audit = createReservationAuditEntry({
        reservationId,
        actorId: input.actorId,
        action: "create",
        previousStatus: status,
        nextStatus: status,
        reason: "initial reservation creation",
      });

      await this.insertAudit(client, audit);

      return { reservation, occupancy, audit };
    });
  }

  async createBookingRequest(input: BookingRequestCreateInput): Promise<CreateBookingRequestResult> {
    await this.ensureBootstrap();
    return this.withTransaction(async (client) => {
      await client.query("lock table booking_request in share row exclusive mode");

      const existingRefs = await client.query<{ public_ref: string }>(
        `
          select public_ref
          from booking_request
          union
          select thread_key as public_ref
          from message_thread
          where linked_entity_type = 'booking_request'
            and thread_key like 'booking-request:WR-%'
        `,
      );
      const now = isoNow();
      const publicRef = nextBookingRequestPublicRef(
        existingRefs.rows.map((row) => ({ publicRef: row.public_ref })),
      );
      const threadId = randomUUID();
      const threadKey = `booking-request:${publicRef}`;
      const bookingRequest: BookingRequest = {
        id: randomUUID(),
        publicRef,
        status: "awaiting_initial_email",
        guestName: input.guestName,
        guestEmail: input.guestEmail,
        guestPhone: input.guestPhone ?? null,
        requestedCheckIn: input.requestedCheckIn,
        requestedCheckOut: input.requestedCheckOut,
        requestedGuests: input.requestedGuests,
        requestedBungalowType: input.requestedBungalowType ?? null,
        requestedExperienceId: input.requestedExperienceId ?? null,
        sourceChannel: "web_public",
        threadId,
        threadKey,
        ownerUserId: null,
        ownerAssignedAt: null,
        notes: input.notes ?? null,
        lastMessageAt: null,
        syncStatus: "pending",
        createdAt: now,
        updatedAt: now,
      };

      await client.query(
        `
          insert into message_thread(
            id, mailbox_address, provider, provider_thread_id, subject, thread_key,
            linked_entity_type, linked_entity_id, last_synced_at, sync_status, created_at, updated_at
          ) values (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11, $12
          )
        `,
        [
          threadId,
          "reservas@wakayaecolodge.com",
          "zoho_mail",
          null,
          buildInitialBookingRequestSubject(bookingRequest.publicRef),
          threadKey,
          "booking_request",
          bookingRequest.id,
          null,
          "pending",
          now,
          now,
        ],
      );

      await client.query(
        `
          insert into booking_request(
            id, public_ref, status, guest_name, guest_email, guest_phone,
            requested_check_in, requested_check_out, requested_guests, requested_bungalow_type, requested_experience_id,
            source_channel, thread_id, thread_key, owner_user_id, owner_assigned_at,
            notes, last_message_at, sync_status, created_at, updated_at
          ) values (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11,
            $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
          )
        `,
        [
          bookingRequest.id,
          bookingRequest.publicRef,
          bookingRequest.status,
          bookingRequest.guestName,
          bookingRequest.guestEmail,
          bookingRequest.guestPhone,
          bookingRequest.requestedCheckIn,
          bookingRequest.requestedCheckOut,
          bookingRequest.requestedGuests,
          bookingRequest.requestedBungalowType,
          bookingRequest.requestedExperienceId,
          bookingRequest.sourceChannel,
          bookingRequest.threadId,
          bookingRequest.threadKey,
          bookingRequest.ownerUserId,
          bookingRequest.ownerAssignedAt,
          bookingRequest.notes,
          bookingRequest.lastMessageAt,
          bookingRequest.syncStatus,
          bookingRequest.createdAt,
          bookingRequest.updatedAt,
        ],
      );

      return { bookingRequest };
    });
  }

  async createComplaint(input: ComplaintCreateInput): Promise<CreateComplaintResult> {
    await this.ensureBootstrap();
    await this.ensureComplaintSchema();
    return this.withTransaction(async (client) => {
      const existingCodes = await client.query<{ public_code: string }>(`select public_code from complaint_case`);
      const now = isoNow();
      const complaint: ComplaintCase = {
        id: randomUUID(),
        publicCode: nextComplaintPublicCode(existingCodes.rows.map((row) => ({ publicCode: row.public_code }))),
        type: input.type,
        status: "submitted",
        fullName: input.fullName,
        documentType: input.documentType,
        documentNumber: input.documentNumber,
        email: input.email,
        phone: input.phone ?? null,
        address: input.address ?? null,
        serviceType: input.serviceType ?? null,
        contractedService: input.contractedService ?? null,
        complaintDetail: input.complaintDetail,
        consumerRequest: input.consumerRequest,
        acceptedDeclaration: input.acceptedDeclaration,
        createdAt: now,
        updatedAt: now,
      };

      await client.query(
        `
          insert into complaint_case (
            id, public_code, type, status, full_name, document_type, document_number,
            email, phone, address, service_type, contracted_service,
            complaint_detail, consumer_request, accepted_declaration, created_at, updated_at
          ) values (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11, $12,
            $13, $14, $15, $16, $17
          )
        `,
        [
          complaint.id,
          complaint.publicCode,
          complaint.type,
          complaint.status,
          complaint.fullName,
          complaint.documentType,
          complaint.documentNumber,
          complaint.email,
          complaint.phone,
          complaint.address,
          complaint.serviceType,
          complaint.contractedService,
          complaint.complaintDetail,
          complaint.consumerRequest,
          complaint.acceptedDeclaration,
          complaint.createdAt,
          complaint.updatedAt,
        ],
      );

      const stored = await this.getComplaintWithClient(client, complaint.id);
      return { complaint: stored ?? complaint };
    });
  }

  async confirmBookingRequestTransfer(
    id: string,
    actorId: string,
    reason: string,
  ): Promise<{ bookingRequest: BookingRequest; reservation: ReservationDetail }> {
    await this.ensureBootstrap();
    return this.withTransaction(async (client) => {
      await client.query("lock table booking_request in share row exclusive mode");

      const row = await client.query<BookingRequestRow>(
        `
          select
            id, public_ref, status, guest_name, guest_email, guest_phone,
            requested_check_in, requested_check_out, requested_guests, requested_bungalow_type, requested_experience_id,
            source_channel, thread_id, thread_key, owner_user_id, owner_assigned_at,
            notes, last_message_at, sync_status, created_at, updated_at
          from booking_request
          where id = $1
          limit 1
        `,
        [id],
      );
      const current = row.rows[0];
      if (!current) {
        throw new Error("booking_request_not_found");
      }

      const bookingRequest = this.toBookingRequest(current);

      const nextStatus = nextBookingRequestStatus(bookingRequest.status, "confirm_transfer");
      const updatedBookingRequest: BookingRequest = {
        ...bookingRequest,
        status: nextStatus,
        updatedAt: isoNow(),
      };

      await client.query(
        `
          update booking_request
          set status = $2, updated_at = $3
          where id = $1
        `,
        [updatedBookingRequest.id, updatedBookingRequest.status, updatedBookingRequest.updatedAt],
      );

      const reservation = await this.createConfirmedReservationFromBookingRequest(client, {
        bookingRequest: updatedBookingRequest,
        actorId,
        reason,
      });

      return {
        bookingRequest: updatedBookingRequest,
        reservation,
      };
    });
  }

  async update(reservationId: string, input: ReservationUpdateInput): Promise<ReservationDetail> {
    await this.ensureBootstrap();
    return this.withTransaction(async (client) => {
      const reservation = await this.mustGetReservation(client, reservationId);
      const bungalow = await this.mustGetBungalow(client, input.bungalowId);
      if (!bungalow.active) throw new Error("bungalow_inactive");

      const nights = nightsForReservation(input.startDate, input.endDate);
      const amountTotalCents = normalizeAmount(input.amountTotalCents ?? nights.length * DEFAULT_NIGHTLY_RATE_CENTS);
      const amountPaidCents = Math.min(normalizeAmount(input.amountPaidCents), amountTotalCents);
      const shouldOccupy = isCapacityBlockingStatus(reservation.status);
      if (shouldOccupy) {
        const availability = await this.loadAggregateCapacityAvailability(client, {
          reservationId,
          bungalowId: input.bungalowId,
          checkIn: input.startDate,
          checkOut: input.endDate,
          lockReservationRow: true,
        });
        if (!availability.canAcceptOneMore) throw new Error("bungalow_capacity_unavailable");
      }

      await client.query(`delete from reservation_occupancy where reservation_id = $1`, [reservationId]);

      const nextReservation: Reservation = {
        ...reservation,
        channel: input.channel,
        bungalowId: input.bungalowId,
        bungalowUnitId: null,
        responsibleId: input.responsibleId === undefined ? reservation.responsibleId : input.responsibleId,
        startDate: input.startDate,
        endDate: input.endDate,
        guestName: input.guestName === undefined ? reservation.guestName : input.guestName,
        guestEmail: input.guestEmail === undefined ? reservation.guestEmail : input.guestEmail,
        guestPhone: input.guestPhone === undefined ? reservation.guestPhone : input.guestPhone,
        guestCount: input.guestCount === undefined ? reservation.guestCount : input.guestCount,
        sourceProvider: input.sourceProvider === undefined ? reservation.sourceProvider : input.sourceProvider,
        externalReservationId:
          input.externalReservationId === undefined ? reservation.externalReservationId : input.externalReservationId,
        externalPropertyId:
          input.externalPropertyId === undefined ? reservation.externalPropertyId : input.externalPropertyId,
        externalRoomTypeCode:
          input.externalRoomTypeCode === undefined ? reservation.externalRoomTypeCode : input.externalRoomTypeCode,
        externalRatePlanCode:
          input.externalRatePlanCode === undefined ? reservation.externalRatePlanCode : input.externalRatePlanCode,
        providerStatus: input.providerStatus === undefined ? reservation.providerStatus : input.providerStatus,
        providerPayloadChecksum:
          input.providerPayloadChecksum === undefined
            ? reservation.providerPayloadChecksum
            : input.providerPayloadChecksum,
        providerLastEventAt:
          input.providerLastEventAt === undefined ? reservation.providerLastEventAt : input.providerLastEventAt,
        amountTotalCents,
        amountPaidCents,
        paymentStatus: derivePaymentStatus(amountTotalCents, amountPaidCents),
        updatedAt: isoNow(),
      };

      await this.updateReservationRow(client, nextReservation);
      if (shouldOccupy) {
        await this.insertOccupancyRows(
          client,
          nextReservation,
          input.bungalowId,
          occupancyStatusForReservation(nextReservation.status),
        );
      }
      await this.reconcileReservationConflictsAgainstOpenRequests(client, nextReservation, input.actorId);
      await this.syncLinkedBookingRequestFromReservation(client, nextReservation, input.actorId, input.reason);

      await this.insertAudit(
        client,
        createReservationAuditEntry({
          reservationId,
          actorId: input.actorId,
          action: "update",
          previousStatus: reservation.status,
          nextStatus: nextReservation.status,
          reason: input.reason,
        }),
      );

      const detail = await this.getDetail(client, reservationId);
      if (!detail) throw new Error("reservation_not_found");
      return detail;
    });
  }

  async assign(reservationId: string, input: ReservationAssignmentInput): Promise<ReservationDetail> {
    await this.ensureBootstrap();
    return this.withTransaction(async (client) => {
      const reservation = await this.mustGetReservation(client, reservationId);
      const bungalow = await this.mustGetBungalow(client, input.bungalowId);
      if (!bungalow.active) throw new Error("bungalow_inactive");
      const nextStatus = nextReservationStatus(reservation.status, "assign");
      const availability = await this.loadAggregateCapacityAvailability(client, {
        reservationId,
        bungalowId: input.bungalowId,
        checkIn: reservation.startDate,
        checkOut: reservation.endDate,
        lockReservationRow: true,
      });
      if (!availability.canAcceptOneMore) throw new Error("bungalow_capacity_unavailable");

      await client.query(`delete from reservation_occupancy where reservation_id = $1`, [reservationId]);

      const nextReservation: Reservation = {
        ...reservation,
        bungalowId: input.bungalowId,
        bungalowUnitId: null,
        status: nextStatus,
        updatedAt: isoNow(),
      };

      await this.updateReservationRow(client, nextReservation);
      await this.insertOccupancyRows(client, nextReservation, input.bungalowId, "confirmed");
      await this.reconcileReservationConflictsAgainstOpenRequests(client, nextReservation, input.actorId);
      await this.syncLinkedBookingRequestFromReservation(client, nextReservation, input.actorId, input.reason);
      await this.insertAudit(
        client,
        createReservationAuditEntry({
          reservationId,
          actorId: input.actorId,
          action: "assign",
          previousStatus: reservation.status,
          nextStatus,
          reason: input.reason,
        }),
      );

      const detail = await this.getDetail(client, reservationId);
      if (!detail) throw new Error("reservation_not_found");
      return detail;
    });
  }

  async transition(
    reservationId: string,
    input: ReservationStatusChangeInput,
  ): Promise<ReservationDetail> {
    await this.ensureBootstrap();
    return this.withTransaction(async (client) => {
      const reservation = await this.mustGetReservation(client, reservationId);
      const nextStatus = nextReservationStatus(reservation.status, input.action);
      if (
        reservation.bungalowId &&
        isCapacityBlockingStatus(nextStatus) &&
        !isCapacityBlockingStatus(reservation.status)
      ) {
        const availability = await this.loadAggregateCapacityAvailability(client, {
          reservationId,
          bungalowId: reservation.bungalowId,
          checkIn: reservation.startDate,
          checkOut: reservation.endDate,
          lockReservationRow: true,
        });
        if (!availability.canAcceptOneMore) throw new Error("bungalow_capacity_unavailable");
      }
      const nextReservation: Reservation = {
        ...reservation,
        status: nextStatus,
        bungalowId: nextStatus === "cancelled" || nextStatus === "no_show" ? null : reservation.bungalowId,
        amountPaidCents:
          nextStatus === "paid"
            ? reservation.amountTotalCents ?? reservation.amountPaidCents ?? 0
            : reservation.amountPaidCents,
        paymentStatus:
          nextStatus === "paid"
            ? "paid"
            : derivePaymentStatus(reservation.amountTotalCents ?? 0, reservation.amountPaidCents ?? 0),
        updatedAt: isoNow(),
      };

      await this.updateReservationRow(client, nextReservation);

      if (nextStatus === "cancelled" || nextStatus === "no_show") {
        await client.query(`delete from reservation_occupancy where reservation_id = $1`, [reservationId]);
      }
      if (nextStatus === "paid" || nextStatus === "checked_in") {
        await client.query(
          `update reservation_occupancy set status = 'confirmed' where reservation_id = $1`,
          [reservationId],
        );
      }
      await this.reconcileReservationConflictsAgainstOpenRequests(client, nextReservation, input.actorId);
      await this.syncLinkedBookingRequestFromReservation(client, nextReservation, input.actorId, input.reason);

      await this.insertAudit(
        client,
        createReservationAuditEntry({
          reservationId,
          actorId: input.actorId,
          action: input.action,
          previousStatus: reservation.status,
          nextStatus,
          reason: input.reason,
        }),
      );

      const detail = await this.getDetail(client, reservationId);
      if (!detail) throw new Error("reservation_not_found");
      return detail;
    });
  }

  async recordPayment(
    reservationId: string,
    input: ReservationPaymentInput,
  ): Promise<ReservationDetail> {
    await this.ensureBootstrap();
    return this.withTransaction(async (client) => {
      const reservation = await this.mustGetReservation(client, reservationId);
      if (reservation.status === "cancelled" || reservation.status === "no_show") {
        throw new Error("invalid_transition");
      }

      const totalCents = normalizeAmount(reservation.amountTotalCents);
      if (totalCents <= 0) throw new Error("invalid_payload");

      const paidBefore = normalizeAmount(reservation.amountPaidCents);
      const paidAfter = Math.min(totalCents, paidBefore + normalizeAmount(input.amountPaidCents));
      const paymentStatus = derivePaymentStatus(totalCents, paidAfter);
      const shouldCloseAsPaid = paymentStatus === "paid" && reservation.status === "checked_out";

      const nextReservation: Reservation = {
        ...reservation,
        amountPaidCents: paidAfter,
        paymentStatus,
        status: shouldCloseAsPaid ? "paid" : reservation.status,
        updatedAt: isoNow(),
      };

      await this.updateReservationRow(client, nextReservation);
      await this.insertAudit(
        client,
        createReservationAuditEntry({
          reservationId,
          actorId: input.actorId,
          action: shouldCloseAsPaid ? "mark_paid" : "register_payment",
          previousStatus: reservation.status,
          nextStatus: nextReservation.status,
          reason: input.reason,
        }),
      );

      const detail = await this.getDetail(client, reservationId);
      if (!detail) throw new Error("reservation_not_found");
      return detail;
    });
  }

  private async getDetail(
    client: Pick<Pool, "query"> | PoolClient,
    id: string,
  ): Promise<ReservationDetail | null> {
    const result = await client.query<ReservationRow>(
      `
        select
          r.*,
          b.code as bungalow_code,
          b.name as bungalow_name,
          b.active as bungalow_active,
          b.capacity as bungalow_capacity,
          (
            select count(*)
            from reservation_audit a
            where a.reservation_id = r.id
          ) as audit_count
        from reservation r
        left join bungalow b on b.id = r.bungalow_id
        where r.id = $1
        limit 1
      `,
      [id],
    );

    const row = result.rows[0];
    return row ? this.toReservationDetail(row) : null;
  }

  private async ensureBootstrap(): Promise<void> {
    if (this.bootstrapPromise) {
      await this.bootstrapPromise;
      return;
    }

    this.bootstrapPromise = (async () => {
      await this.pool.query(`
        alter table if exists reservation
          add column if not exists guest_name text,
          add column if not exists guest_email text,
          add column if not exists guest_phone text,
          add column if not exists guest_count integer,
          add column if not exists source_provider text,
          add column if not exists external_reservation_id text,
          add column if not exists external_property_id text,
          add column if not exists external_room_type_code text,
          add column if not exists external_rate_plan_code text,
          add column if not exists provider_status text,
          add column if not exists provider_payload_checksum text,
          add column if not exists provider_last_event_at timestamptz,
          add column if not exists bungalow_unit_id text
      `);

      await this.pool.query(`
        alter table if exists reservation_occupancy
          add column if not exists bungalow_unit_id text
      `);

      await this.pool.query(`
        create unique index if not exists idx_reservation_provider_external_id
          on reservation (source_provider, external_reservation_id)
          where source_provider is not null and external_reservation_id is not null
      `);

      await this.pool.query(`
        create table if not exists ota_connection (
          id uuid primary key,
          provider_key text not null,
          account_label text not null,
          external_property_id text,
          is_active boolean not null default true,
          messages_enabled boolean not null default false,
          ari_enabled boolean not null default false,
          recovery_enabled boolean not null default false,
          metadata jsonb not null default '{}'::jsonb,
          created_at timestamptz not null,
          updated_at timestamptz not null
        )
      `);

      await this.pool.query(`
        create index if not exists idx_ota_connection_provider_active
          on ota_connection (provider_key, is_active, updated_at desc)
      `);

      await this.pool.query(`
        create table if not exists ota_room_mapping (
          id uuid primary key,
          connection_id uuid not null references ota_connection(id) on delete cascade,
          external_room_type_code text not null,
          bungalow_id text references bungalow(id),
          created_at timestamptz not null,
          updated_at timestamptz not null,
          unique (connection_id, external_room_type_code)
        )
      `);

      await this.pool.query(`
        create table if not exists ota_rate_plan_mapping (
          id uuid primary key,
          connection_id uuid not null references ota_connection(id) on delete cascade,
          external_rate_plan_code text not null,
          internal_rate_plan_code text,
          created_at timestamptz not null,
          updated_at timestamptz not null,
          unique (connection_id, external_rate_plan_code)
        )
      `);

      await this.pool.query(`
        create table if not exists ota_reservation_link (
          reservation_id uuid primary key references reservation(id) on delete cascade,
          provider_key text not null,
          connection_id uuid references ota_connection(id) on delete set null,
          external_reservation_id text not null,
          external_property_id text,
          external_room_type_code text,
          external_rate_plan_code text,
          provider_status text,
          provider_payload_checksum text,
          provider_event_version text,
          provider_thread_id text,
          provider_last_event_at timestamptz,
          raw_payload jsonb,
          created_at timestamptz not null,
          updated_at timestamptz not null,
          unique (provider_key, external_reservation_id)
        )
      `);

      await this.pool.query(`
        create table if not exists ota_sync_cursor (
          provider_key text not null,
          connection_id uuid references ota_connection(id) on delete cascade,
          mode text not null,
          cursor_value text,
          last_synced_at timestamptz,
          updated_at timestamptz not null,
          primary key (provider_key, connection_id, mode)
        )
      `);

      await this.pool.query(`
        create table if not exists ota_sync_run (
          id uuid primary key,
          provider_key text not null,
          connection_id uuid references ota_connection(id) on delete set null,
          mode text not null,
          status text not null,
          summary jsonb,
          error_message text,
          started_at timestamptz not null,
          finished_at timestamptz
        )
      `);

      await this.pool.query(`
        create unique index if not exists idx_ota_sync_run_identity
          on ota_sync_run (provider_key, connection_id, mode, started_at)
      `);

      await this.pool.query(`
        create table if not exists ota_event_log (
          id uuid primary key,
          provider_key text not null,
          connection_id uuid references ota_connection(id) on delete set null,
          reservation_id uuid references reservation(id) on delete set null,
          external_reservation_id text,
          event_type text not null,
          payload jsonb,
          created_at timestamptz not null
        )
      `);

      await this.pool.query<{ count: number | string }>(`select count(*)::int as count from bungalow`);
      for (const bungalow of WAKAYA_OPERATIONAL_BUNGALOWS) {
        await this.pool.query(
          `
            insert into bungalow (id, code, name, active, capacity)
            values ($1, $2, $3, $4, $5)
            on conflict (id) do update
            set code = excluded.code,
                name = excluded.name,
                active = excluded.active,
                capacity = excluded.capacity
          `,
          [bungalow.id, bungalow.code, bungalow.name, bungalow.active, bungalow.capacity],
        );
      }

      for (const publicContent of WAKAYA_BUNGALOW_PUBLIC_CONTENT) {
        await this.pool.query(
          `
            insert into bungalow_public_content (
              bungalow_id, featured_on_home, sort_order, hero_image_url,
              gallery_urls, nightly_rate_pen, area_sqm, locale_content, updated_at
            )
            values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
            on conflict (bungalow_id) do nothing
          `,
          [
            publicContent.bungalowId,
            publicContent.featuredOnHome,
            publicContent.sortOrder,
            publicContent.heroImageUrl,
            publicContent.galleryUrls,
            publicContent.nightlyRatePen,
            publicContent.areaSqm,
            JSON.stringify(publicContent.localeContent),
            isoNow(),
          ],
        );
      }
    })();

    try {
      await this.bootstrapPromise;
    } catch (error) {
      this.bootstrapPromise = null;
      throw error;
    }
  }

  private async ensureComplaintSchema(): Promise<void> {
    if (this.complaintSchemaPromise) {
      await this.complaintSchemaPromise;
      return;
    }

    this.complaintSchemaPromise = (async () => {
      await this.pool.query(`
        create table if not exists complaint_case (
          id uuid primary key,
          public_code text not null unique,
          type text not null,
          status text not null,
          full_name text not null,
          document_type text not null,
          document_number text not null,
          email text not null,
          phone text,
          address text,
          service_type text,
          contracted_service text,
          complaint_detail text not null,
          consumer_request text not null,
          accepted_declaration boolean not null default false,
          created_at timestamptz not null,
          updated_at timestamptz not null
        )
      `);

      await this.pool.query(`
        create index if not exists idx_complaint_case_status_updated_at
          on complaint_case (status, updated_at desc)
      `);

      await this.pool.query(`
        create index if not exists idx_complaint_case_created_at
          on complaint_case (created_at desc)
      `);
    })();

    try {
      await this.complaintSchemaPromise;
    } catch (error) {
      this.complaintSchemaPromise = null;
      throw error;
    }
  }

  private async withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const result = await callback(client);
      await client.query("commit");
      return result;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  private async withOtaSyncLock<T>(key: string, callback: () => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      const result = await client.query<{ locked: boolean }>(
        `select pg_try_advisory_lock(hashtext($1)) as locked`,
        [key],
      );
      if (!result.rows[0]?.locked) {
        throw new Error("ota_sync_locked");
      }
      return await callback();
    } finally {
      try {
        await client.query(`select pg_advisory_unlock(hashtext($1))`, [key]);
      } catch {
        // ignore unlock failures on best-effort cleanup
      }
      client.release();
    }
  }

  private toReservation(row: ReservationRow): Reservation {
    return {
      id: row.id,
      number: row.number,
      channel: row.channel,
      status: row.status,
      sourceRequestId: row.source_request_id,
      bungalowId: row.bungalow_id,
      bungalowUnitId: row.bungalow_unit_id ?? null,
      responsibleId: row.responsible_id,
      startDate: normalizePgDateOnly(row.start_date),
      endDate: normalizePgDateOnly(row.end_date),
      guestName: row.guest_name,
      guestEmail: row.guest_email,
      guestPhone: row.guest_phone,
      guestCount: row.guest_count,
      sourceProvider: row.source_provider ?? null,
      externalReservationId: row.external_reservation_id,
      externalPropertyId: row.external_property_id,
      externalRoomTypeCode: row.external_room_type_code,
      externalRatePlanCode: row.external_rate_plan_code,
      providerStatus: row.provider_status,
      providerPayloadChecksum: row.provider_payload_checksum,
      providerLastEventAt: normalizePgTimestamp(row.provider_last_event_at),
      amountTotalCents: row.amount_total_cents ?? undefined,
      amountPaidCents: row.amount_paid_cents ?? undefined,
      paymentStatus: row.payment_status ?? undefined,
      currencyCode: row.currency_code ?? undefined,
      updatedAt: normalizePgTimestamp(row.updated_at) ?? "",
    };
  }

  private toBungalow(row: ReservationRow): Bungalow | null {
    if (!row.bungalow_id) return null;
    return {
      id: row.bungalow_id,
      code: row.bungalow_code ?? "",
      name: row.bungalow_name ?? "",
      active: row.bungalow_active ?? true,
      capacity: row.bungalow_capacity ?? 0,
    };
  }

  private toBungalowPublicContent(row: BungalowPublicContentRow): BungalowPublicContent {
    return {
      bungalowId: row.bungalow_id,
      revisionVersion: row.revision_version ?? 1,
      featuredOnHome: row.featured_on_home,
      sortOrder: row.sort_order,
      heroImageUrl: row.hero_image_url,
      galleryUrls: Array.isArray(row.gallery_urls) ? [...row.gallery_urls] : [],
      nightlyRatePen: row.nightly_rate_pen,
      areaSqm: row.area_sqm,
      localeContent: structuredClone(row.locale_content),
      heroAssetId: row.hero_asset_id ?? null,
      galleryAssetIds: Array.isArray(row.gallery_asset_ids) ? [...row.gallery_asset_ids] : [],
      updatedAt: normalizePgTimestamp(row.updated_at) ?? "",
    };
  }

  private toReservationListItem(row: ReservationRow): ReservationListItem {
    return {
      ...this.toReservation(row),
      bungalow: this.toBungalow(row),
    };
  }

  private toReservationDetail(row: ReservationRow): ReservationDetail {
    return {
      ...this.toReservation(row),
      bungalow: this.toBungalow(row),
      auditCount: Number(row.audit_count ?? 0),
    };
  }

  private toAudit(row: AuditRow): ReservationAudit {
    return {
      id: row.id,
      reservationId: row.reservation_id,
      actorId: row.actor_id,
      action: row.action,
      previousStatus: row.previous_status,
      nextStatus: row.next_status,
      reason: row.reason,
      createdAt: normalizePgTimestamp(row.created_at) ?? "",
    };
  }

  private toBookingRequest(row: BookingRequestRow): BookingRequest {
    return {
      id: row.id,
      publicRef: row.public_ref,
      status: row.status,
      guestName: row.guest_name,
      guestEmail: row.guest_email,
      guestPhone: row.guest_phone,
      requestedCheckIn: normalizePgDateOnly(row.requested_check_in),
      requestedCheckOut: normalizePgDateOnly(row.requested_check_out),
      requestedGuests: row.requested_guests,
      requestedBungalowType: row.requested_bungalow_type,
      requestedExperienceId: row.requested_experience_id ?? null,
      sourceChannel: row.source_channel,
      threadId: row.thread_id,
      threadKey: row.thread_key,
      ownerUserId: row.owner_user_id,
      ownerAssignedAt: normalizePgTimestamp(row.owner_assigned_at),
      notes: row.notes,
      lastMessageAt: normalizePgTimestamp(row.last_message_at),
      syncStatus: row.sync_status,
      createdAt: normalizePgTimestamp(row.created_at) ?? "",
      updatedAt: normalizePgTimestamp(row.updated_at) ?? "",
    };
  }

  private toComplaint(row: ComplaintRow): ComplaintCase {
    return {
      id: row.id,
      publicCode: row.public_code,
      type: row.type,
      status: row.status,
      fullName: row.full_name,
      documentType: row.document_type,
      documentNumber: row.document_number,
      email: row.email,
      phone: row.phone,
      address: row.address,
      serviceType: row.service_type,
      contractedService: row.contracted_service,
      complaintDetail: row.complaint_detail,
      consumerRequest: row.consumer_request,
      acceptedDeclaration: row.accepted_declaration,
      createdAt: normalizePgTimestamp(row.created_at) ?? "",
      updatedAt: normalizePgTimestamp(row.updated_at) ?? "",
    };
  }

  private toMessageThread(row: MessageThreadRow): MessageThread {
    return {
      id: row.id,
      mailboxAddress: row.mailbox_address,
      provider: row.provider,
      providerThreadId: row.provider_thread_id,
      subject: row.subject,
      threadKey: row.thread_key,
      linkedEntityType: row.linked_entity_type,
      linkedEntityId: row.linked_entity_id,
      lastSyncedAt: normalizePgTimestamp(row.last_synced_at),
      syncStatus: row.sync_status,
      createdAt: normalizePgTimestamp(row.created_at) ?? "",
      updatedAt: normalizePgTimestamp(row.updated_at) ?? "",
    };
  }

  private toOtaConnection(row: OtaConnectionRow): OtaConnection {
    return {
      id: row.id,
      providerKey: row.provider_key,
      accountLabel: row.account_label,
      externalPropertyId: row.external_property_id,
      isActive: row.is_active,
      messagesEnabled: row.messages_enabled,
      ariEnabled: row.ari_enabled,
      recoveryEnabled: row.recovery_enabled,
      metadata: row.metadata ?? {},
      createdAt: normalizePgTimestamp(row.created_at) ?? "",
      updatedAt: normalizePgTimestamp(row.updated_at) ?? "",
    };
  }

  private toOtaRoomMapping(row: OtaRoomMappingRow): OtaRoomMapping {
    return {
      id: row.id,
      connectionId: row.connection_id,
      externalRoomTypeCode: row.external_room_type_code,
      bungalowId: row.bungalow_id,
      createdAt: normalizePgTimestamp(row.created_at) ?? "",
      updatedAt: normalizePgTimestamp(row.updated_at) ?? "",
    };
  }

  private toOtaRatePlanMapping(row: OtaRatePlanMappingRow): OtaRatePlanMapping {
    return {
      id: row.id,
      connectionId: row.connection_id,
      externalRatePlanCode: row.external_rate_plan_code,
      internalRatePlanCode: row.internal_rate_plan_code,
      createdAt: normalizePgTimestamp(row.created_at) ?? "",
      updatedAt: normalizePgTimestamp(row.updated_at) ?? "",
    };
  }

  private toOtaReservationLink(row: OtaReservationLinkRow): OtaReservationLink {
    return {
      reservationId: row.reservation_id,
      providerKey: row.provider_key,
      connectionId: row.connection_id,
      externalReservationId: row.external_reservation_id,
      externalPropertyId: row.external_property_id,
      externalRoomTypeCode: row.external_room_type_code,
      externalRatePlanCode: row.external_rate_plan_code,
      providerStatus: row.provider_status,
      providerPayloadChecksum: row.provider_payload_checksum,
      providerEventVersion: row.provider_event_version,
      providerThreadId: row.provider_thread_id,
      providerLastEventAt: normalizePgTimestamp(row.provider_last_event_at),
      rawPayload: row.raw_payload ?? null,
      createdAt: normalizePgTimestamp(row.created_at) ?? "",
      updatedAt: normalizePgTimestamp(row.updated_at) ?? "",
    };
  }

  private toMessageAttachment(row: MessageAttachmentRow): MessageAttachment {
    return {
      id: row.id,
      messageId: row.message_id,
      providerAttachmentId: row.provider_attachment_id,
      fileName: row.file_name,
      contentType: row.content_type,
      fileSizeBytes: row.file_size_bytes,
      storageKey: row.storage_key,
      fileHash: row.file_hash,
      isSupported: row.is_supported,
      contentBase64: row.content_base64,
      createdAt: normalizePgTimestamp(row.created_at) ?? "",
    };
  }

  private toMessageItem(row: MessageItemRow, attachments: MessageAttachment[]): MessageItem {
    return {
      id: row.id,
      threadId: row.thread_id,
      direction: row.direction,
      origin: row.origin,
      providerMessageId: row.provider_message_id,
      fromAddress: row.from_address,
      toAddresses: row.to_addresses,
      ccAddresses: row.cc_addresses,
      subject: row.subject,
      bodyText: row.body_text,
      bodyHtml: row.body_html,
      sentAt: normalizePgTimestamp(row.sent_at),
      receivedAt: normalizePgTimestamp(row.received_at),
      ingestedAt: normalizePgTimestamp(row.ingested_at) ?? "",
      createdByUserId: row.created_by_user_id,
      attachments,
    };
  }

  private toQuickReplyTemplate(row: QuickReplyTemplateRow): QuickReplyTemplate {
    return {
      id: row.id,
      key: row.key,
      label: row.label,
      category: row.category,
      subjectMode: row.subject_mode,
      bodyText: row.body_text,
      isActive: row.is_active,
      sortOrder: row.sort_order,
      updatedByUserId: row.updated_by_user_id,
      updatedAt: normalizePgTimestamp(row.updated_at) ?? "",
    };
  }

  private toAvailabilityConflict(row: AvailabilityConflictRow): AvailabilityConflict {
    return {
      id: row.id,
      status: row.status,
      conflictType: row.conflict_type,
      requestId: row.request_id,
      reservationId: row.reservation_id,
      notes: row.notes,
      createdBy: row.created_by,
      resolvedBy: row.resolved_by,
      createdAt: normalizePgTimestamp(row.created_at) ?? "",
      resolvedAt: normalizePgTimestamp(row.resolved_at),
      metadata: row.metadata ?? undefined,
    };
  }

  private buildSyntheticMessage(
    bookingRequest: BookingRequest,
    thread: MessageThread,
    input: BookingRequestMessageInput,
  ): MessageItem {
    const activityAt = input.sentAt ?? input.receivedAt ?? isoNow();
    return {
      id: randomUUID(),
      threadId: thread.id,
      direction: input.direction,
      origin: input.origin,
      providerMessageId: input.providerMessageId ?? `${input.origin}:${bookingRequest.id}:${randomUUID()}`,
      fromAddress: input.fromAddress,
      toAddresses: input.toAddresses,
      ccAddresses: input.ccAddresses ?? [],
      subject: input.subject,
      bodyText: input.bodyText ?? null,
      bodyHtml: input.bodyHtml ?? null,
      sentAt: input.sentAt ?? (input.direction === "outbound" ? activityAt : null),
      receivedAt: input.receivedAt ?? (input.direction === "inbound" ? activityAt : null),
      ingestedAt: isoNow(),
      createdByUserId: input.createdByUserId ?? null,
      attachments: [],
    };
  }

  private async getBookingRequestWithClient(
    client: PoolClient,
    id: string,
  ): Promise<BookingRequest | null> {
    const result = await client.query<BookingRequestRow>(
      `
        select
          id, public_ref, status, guest_name, guest_email, guest_phone,
          requested_check_in, requested_check_out, requested_guests, requested_bungalow_type, requested_experience_id,
          source_channel, thread_id, thread_key, owner_user_id, owner_assigned_at,
          notes, last_message_at, sync_status, created_at, updated_at
        from booking_request
        where id = $1
        limit 1
      `,
      [id],
    );
    const row = result.rows[0];
    return row ? this.toBookingRequest(row) : null;
  }

  private async listBookingRequestsWithClient(client: PoolClient): Promise<BookingRequest[]> {
    const result = await client.query<BookingRequestRow>(
      `
        select
          id, public_ref, status, guest_name, guest_email, guest_phone,
          requested_check_in, requested_check_out, requested_guests, requested_bungalow_type, requested_experience_id,
          source_channel, thread_id, thread_key, owner_user_id, owner_assigned_at,
          notes, last_message_at, sync_status, created_at, updated_at
        from booking_request
        order by updated_at desc
      `,
    );
    return result.rows.map((row) => this.toBookingRequest(row));
  }

  private async listOtaReservationsWithClient(client: PoolClient): Promise<ReservationDetail[]> {
    const result = await client.query<ReservationRow>(
      `
        select
          r.*,
          b.code as bungalow_code,
          b.name as bungalow_name,
          b.active as bungalow_active,
          b.capacity as bungalow_capacity,
          (
            select count(*)
            from reservation_audit a
            where a.reservation_id = r.id
          ) as audit_count
        from reservation r
        left join bungalow b on b.id = r.bungalow_id
        where r.channel = 'ota'
        order by r.updated_at desc
      `,
    );
    return result.rows.map((row) => this.toReservationDetail(row));
  }

  private async getComplaintWithClient(client: PoolClient, id: string): Promise<ComplaintCase | null> {
    const result = await client.query<ComplaintRow>(
      `
        select
          id, public_code, type, status, full_name, document_type, document_number,
          email, phone, address, service_type, contracted_service,
          complaint_detail, consumer_request, accepted_declaration, created_at, updated_at
        from complaint_case
        where id = $1
        limit 1
      `,
      [id],
    );
    const row = result.rows[0];
    return row ? this.toComplaint(row) : null;
  }

  private async ensureThreadForBookingRequest(
    client: PoolClient,
    bookingRequest: BookingRequest,
  ): Promise<MessageThread> {
    const existing = bookingRequest.threadId
      ? await client.query<MessageThreadRow>(
          `
            select
              id, mailbox_address, provider, provider_thread_id, subject, thread_key,
              linked_entity_type, linked_entity_id, last_synced_at, sync_status, created_at, updated_at
            from message_thread
            where id = $1
            limit 1
          `,
          [bookingRequest.threadId],
        )
      : { rows: [] as MessageThreadRow[] };
    const existingRow = existing.rows[0];
    if (existingRow) {
      return this.toMessageThread(existingRow);
    }

    const now = isoNow();
    const thread: MessageThread = {
      id: randomUUID(),
      mailboxAddress: "reservas@wakayaecolodge.com",
      provider: "zoho_mail",
      providerThreadId: null,
      subject: buildInitialBookingRequestSubject(bookingRequest.publicRef),
      threadKey: bookingRequest.threadKey,
      linkedEntityType: "booking_request",
      linkedEntityId: bookingRequest.id,
      lastSyncedAt: null,
      syncStatus: bookingRequest.syncStatus,
      createdAt: now,
      updatedAt: now,
    };
    await client.query(
      `
        insert into message_thread(
          id, mailbox_address, provider, provider_thread_id, subject, thread_key,
          linked_entity_type, linked_entity_id, last_synced_at, sync_status, created_at, updated_at
        ) values (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12
        )
        on conflict (thread_key) do nothing
      `,
      [
        thread.id,
        thread.mailboxAddress,
        thread.provider,
        thread.providerThreadId,
        thread.subject,
        thread.threadKey,
        thread.linkedEntityType,
        thread.linkedEntityId,
        thread.lastSyncedAt,
        thread.syncStatus,
        thread.createdAt,
        thread.updatedAt,
      ],
    );
    const persisted = await client.query<MessageThreadRow>(
      `
        select
          id, mailbox_address, provider, provider_thread_id, subject, thread_key,
          linked_entity_type, linked_entity_id, last_synced_at, sync_status, created_at, updated_at
        from message_thread
        where thread_key = $1
        limit 1
      `,
      [bookingRequest.threadKey],
    );
    const persistedRow = persisted.rows[0];
    if (!persistedRow) {
      throw new Error("booking_request_not_found");
    }
    await client.query(`update booking_request set thread_id = $2 where id = $1`, [bookingRequest.id, persistedRow.id]);
    return this.toMessageThread(persistedRow);
  }

  private async buildBookingRequestThreadView(
    client: PoolClient,
    bookingRequest: BookingRequest,
  ): Promise<BookingRequestThreadView> {
    const thread = await this.ensureThreadForBookingRequest(client, bookingRequest);
    const messages = await this.listMessagesForThread(client, thread.id);
    const conflictRows = await client.query<AvailabilityConflictRow>(
      `
        select
          id, status, conflict_type, request_id, reservation_id, notes,
          created_by, resolved_by, created_at, resolved_at, metadata
        from availability_conflict
        where request_id = $1
          and status = 'open'
        order by created_at desc
      `,
      [bookingRequest.id],
    );
    const conflicts = conflictRows.rows.map((row) => this.toAvailabilityConflict(row));
    const ownerName = await this.getBackofficeOwnerName(client, bookingRequest.ownerUserId);

    return {
      bookingRequest,
      thread,
      messages,
      attachments: messages.flatMap((item) => item.attachments),
      conflicts,
      workItem: buildBookingRequestWorkItem({
        bookingRequest,
        messages,
        conflicts,
        ownerName,
      }),
    };
  }

  private async buildReservationOperationThreadView(
    client: PoolClient,
    reservation: ReservationDetail,
  ): Promise<OperationThreadView> {
    const thread = await this.getThreadByLinkedEntity(client, "reservation", reservation.id);
    const messages = thread ? await this.listMessagesForThread(client, thread.id) : [];
    const conflicts = await this.listOpenConflictsForReservation(client, reservation.id);
    const otaLink = await this.getOtaReservationLinkWithClient(client, reservation.id);
    const ownerName = await this.getBackofficeOwnerName(client, reservation.responsibleId);
    const syncHealth = this.deriveReservationSyncHealth(reservation, otaLink, conflicts);

    return {
      kind: "reservation",
      bookingRequest: null,
      reservation,
      thread,
      messages,
      attachments: messages.flatMap((item) => item.attachments),
      conflicts,
      workItem: buildReservationOperationsItem({
        reservation,
        messages,
        conflicts,
        syncHealth,
        ownerName,
      }),
      otaLink,
      availableConversationProviders:
        thread?.provider
          ? [thread.provider]
          : otaLink?.providerThreadId
            ? ["booking_messaging"]
            : [],
    };
  }

  private async getThreadByLinkedEntity(
    client: PoolClient,
    linkedEntityType: MessageThread["linkedEntityType"],
    linkedEntityId: string,
  ): Promise<MessageThread | null> {
    const result = await client.query<MessageThreadRow>(
      `
        select
          id, mailbox_address, provider, provider_thread_id, subject, thread_key,
          linked_entity_type, linked_entity_id, last_synced_at, sync_status, created_at, updated_at
        from message_thread
        where linked_entity_type = $1
          and linked_entity_id = $2
        limit 1
      `,
      [linkedEntityType, linkedEntityId],
    );
    return result.rows[0] ? this.toMessageThread(result.rows[0]) : null;
  }

  private async listMessagesForThread(client: PoolClient, threadId: string): Promise<MessageItem[]> {
    const messageRows = await client.query<MessageItemRow>(
      `
        select
          id, thread_id, direction, origin, provider_message_id, from_address, to_addresses,
          cc_addresses, subject, body_text, body_html, sent_at, received_at, ingested_at, created_by_user_id
        from message_item
        where thread_id = $1
        order by coalesce(received_at, sent_at, ingested_at) desc
      `,
      [threadId],
    );
    const messageIds = messageRows.rows.map((row) => row.id);
    const attachmentRows = messageIds.length > 0
      ? await client.query<MessageAttachmentRow>(
          `
            select
              id, message_id, provider_attachment_id, file_name, content_type, file_size_bytes,
              storage_key, file_hash, is_supported, content_base64, created_at
            from message_attachment
            where message_id = any($1::uuid[])
            order by created_at asc
          `,
          [messageIds],
        )
      : { rows: [] as MessageAttachmentRow[] };
    const attachmentsByMessageId = new Map<string, MessageAttachment[]>();
    attachmentRows.rows.forEach((row) => {
      const list = attachmentsByMessageId.get(row.message_id) ?? [];
      list.push(this.toMessageAttachment(row));
      attachmentsByMessageId.set(row.message_id, list);
    });
    return messageRows.rows.map((row) => this.toMessageItem(row, attachmentsByMessageId.get(row.id) ?? []));
  }

  private async getBackofficeOwnerName(client: PoolClient, userId: string | null): Promise<string | null> {
    if (!userId) {
      return null;
    }
    try {
      const result = await client.query<{ id: string; name: string }>(
        `select id::text as id, name from backoffice_user where id::text = $1 limit 1`,
        [userId],
      );
      return result.rows[0]?.name ?? userId;
    } catch {
      return userId;
    }
  }

  private async listOpenConflictsForReservation(
    client: PoolClient,
    reservationId: string,
  ): Promise<AvailabilityConflict[]> {
    const result = await client.query<AvailabilityConflictRow>(
      `
        select
          id, status, conflict_type, request_id, reservation_id, notes,
          created_by, resolved_by, created_at, resolved_at, metadata
        from availability_conflict
        where reservation_id = $1
          and status = 'open'
        order by created_at desc
      `,
      [reservationId],
    );
    return result.rows.map((row) => this.toAvailabilityConflict(row));
  }

  private async getOtaReservationLinkWithClient(
    client: PoolClient,
    reservationId: string,
  ): Promise<OtaReservationLink | null> {
    const result = await client.query<OtaReservationLinkRow>(
      `
        select
          reservation_id, provider_key, connection_id, external_reservation_id, external_property_id,
          external_room_type_code, external_rate_plan_code, provider_status, provider_payload_checksum,
          provider_event_version, provider_thread_id, provider_last_event_at, raw_payload, created_at, updated_at
        from ota_reservation_link
        where reservation_id = $1
        limit 1
      `,
      [reservationId],
    );
    return result.rows[0] ? this.toOtaReservationLink(result.rows[0]) : null;
  }

  private async getOtaReservationLinkByExternalId(
    client: PoolClient,
    providerKey: OtaReservationLink["providerKey"],
    externalReservationId: string,
  ): Promise<OtaReservationLink | null> {
    const result = await client.query<OtaReservationLinkRow>(
      `
        select
          reservation_id, provider_key, connection_id, external_reservation_id, external_property_id,
          external_room_type_code, external_rate_plan_code, provider_status, provider_payload_checksum,
          provider_event_version, provider_thread_id, provider_last_event_at, raw_payload, created_at, updated_at
        from ota_reservation_link
        where provider_key = $1
          and external_reservation_id = $2
        limit 1
      `,
      [providerKey, externalReservationId],
    );
    return result.rows[0] ? this.toOtaReservationLink(result.rows[0]) : null;
  }

  private async getMappedBungalowIdForOta(
    client: PoolClient,
    connectionId: string | null,
    externalRoomTypeCode: string | null,
  ): Promise<string | null> {
    if (!connectionId || !externalRoomTypeCode) {
      return null;
    }

    const result = await client.query<{ bungalow_id: string | null }>(
      `
        select bungalow_id
        from ota_room_mapping
        where connection_id = $1
          and external_room_type_code = $2
        limit 1
      `,
      [connectionId, externalRoomTypeCode],
    );

    return result.rows[0]?.bungalow_id ?? null;
  }

  private deriveOtaReservationStatus(providerStatus: string | null): Reservation["status"] {
    const normalized = providerStatus?.trim().toLowerCase() ?? "";
    if (["cancel", "cancelled", "canceled"].includes(normalized)) {
      return "cancelled";
    }
    if (["no_show", "no-show", "noshow"].includes(normalized)) {
      return "no_show";
    }
    return "ota_imported_confirmed";
  }

  private deriveReservationSyncHealth(
    reservation: Reservation,
    otaLink: OtaReservationLink | null,
    conflicts: AvailabilityConflict[],
  ): SyncHealth {
    if (conflicts.length > 0) {
      return "degraded";
    }
    if (!otaLink) {
      return "pending";
    }
    if (!reservation.bungalowId && reservation.status !== "cancelled") {
      return "pending";
    }
    return "synced";
  }

  private async listOpenBookingRequestsForReservation(
    client: PoolClient,
    excludeRequestId?: string | null,
  ): Promise<BookingRequest[]> {
    const values: Array<string> = [];
    const clauses = [
      `status not in ('converted_to_reservation', 'cancelled')`,
    ];

    if (excludeRequestId) {
      values.push(excludeRequestId);
      clauses.push(`id <> $${values.length}`);
    }

    const result = await client.query<BookingRequestRow>(
      `
        select
          id, public_ref, status, guest_name, guest_email, guest_phone,
          requested_check_in, requested_check_out, requested_guests, requested_bungalow_type, requested_experience_id,
          source_channel, thread_id, thread_key, owner_user_id, owner_assigned_at,
          notes, last_message_at, sync_status, created_at, updated_at
        from booking_request
        where ${clauses.join(" and ")}
      `,
      values,
    );

    return result.rows.map((row) => this.toBookingRequest(row));
  }

  private async getLatestThreadMessage(
    client: PoolClient,
    threadId: string,
  ): Promise<MessageItem | null> {
    const result = await client.query<MessageItemRow>(
      `
        select
          id, thread_id, direction, origin, provider_message_id, from_address, to_addresses,
          cc_addresses, subject, body_text, body_html, sent_at, received_at, ingested_at, created_by_user_id
        from message_item
        where thread_id = $1
        order by coalesce(received_at, sent_at, ingested_at) desc
        limit 1
      `,
      [threadId],
    );
    const row = result.rows[0];
    return row ? this.toMessageItem(row, []) : null;
  }

  private async insertMessageItem(client: PoolClient, message: MessageItem): Promise<void> {
    await client.query(
      `
        insert into message_item(
          id, thread_id, direction, origin, provider_message_id, from_address, to_addresses,
          cc_addresses, subject, body_text, body_html, sent_at, received_at, ingested_at, created_by_user_id
        ) values (
          $1, $2, $3, $4, $5, $6, $7::jsonb,
          $8::jsonb, $9, $10, $11, $12, $13, $14, $15
        )
        on conflict (provider_message_id) do update
        set
          subject = excluded.subject,
          body_text = excluded.body_text,
          body_html = excluded.body_html,
          received_at = excluded.received_at,
          sent_at = excluded.sent_at,
          ingested_at = excluded.ingested_at,
          origin = excluded.origin,
          created_by_user_id = coalesce(message_item.created_by_user_id, excluded.created_by_user_id)
      `,
      [
        message.id,
        message.threadId,
        message.direction,
        message.origin,
        message.providerMessageId,
        message.fromAddress,
        JSON.stringify(message.toAddresses),
        JSON.stringify(message.ccAddresses),
        message.subject,
        message.bodyText,
        message.bodyHtml,
        message.sentAt,
        message.receivedAt,
        message.ingestedAt,
        message.createdByUserId,
      ],
    );
  }

  private async upsertThreadMessage(
    client: PoolClient,
    thread: MessageThread,
    bookingRequest: BookingRequest,
    providerMessage: Awaited<ReturnType<typeof listThreadMessages>>[number],
    ingestedAt: string,
  ): Promise<MessageItem> {
    const existing = await client.query<MessageItemRow>(
      `
        select
          id, thread_id, direction, origin, provider_message_id, from_address, to_addresses,
          cc_addresses, subject, body_text, body_html, sent_at, received_at, ingested_at, created_by_user_id
        from message_item
        where provider_message_id = $1
        limit 1
      `,
      [providerMessage.providerMessageId],
    );
    const message: MessageItem = {
      id: existing.rows[0]?.id ?? randomUUID(),
      threadId: thread.id,
      ...inferSyncedMessageIdentity({
        bookingRequest,
        fromAddress: providerMessage.fromAddress,
        existingOrigin: existing.rows[0]?.origin ?? null,
        existingCreatedByUserId: existing.rows[0]?.created_by_user_id ?? null,
      }),
      providerMessageId: providerMessage.providerMessageId,
      fromAddress: providerMessage.fromAddress,
      toAddresses: providerMessage.toAddresses,
      ccAddresses: providerMessage.ccAddresses,
      subject: providerMessage.subject,
      bodyText: providerMessage.bodyText,
      bodyHtml: providerMessage.bodyHtml,
      sentAt: providerMessage.sentAt,
      receivedAt: providerMessage.receivedAt,
      ingestedAt,
      createdByUserId: existing.rows[0]?.created_by_user_id ?? null,
      attachments: [],
    };
    await this.insertMessageItem(client, message);
    return message;
  }

  private async upsertMessageAttachments(
    client: PoolClient,
    thread: MessageThread,
    message: MessageItem,
    attachments: Awaited<ReturnType<typeof listThreadMessages>>[number]["attachments"],
    createdAt: string,
  ): Promise<void> {
    for (const attachment of attachments) {
      const fileHash = hashAttachmentContent({
        providerAttachmentId: attachment.providerAttachmentId,
        fileName: attachment.fileName,
        contentBase64: attachment.contentBase64,
      });
      await client.query(
        `
          insert into message_attachment(
            id, message_id, provider_attachment_id, file_name, content_type, file_size_bytes,
            storage_key, file_hash, is_supported, content_base64, created_at
          ) values (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11
          )
          on conflict (message_id, file_hash) do update
          set
            content_type = excluded.content_type,
            file_size_bytes = excluded.file_size_bytes,
            is_supported = excluded.is_supported,
            content_base64 = excluded.content_base64
        `,
        [
          randomUUID(),
          message.id,
          attachment.providerAttachmentId,
          attachment.fileName,
          attachment.contentType,
          attachment.fileSizeBytes,
          `${thread.threadKey}/${message.providerMessageId}/${attachment.fileName}`,
          fileHash,
          isSupportedAttachment(attachment.contentType, attachment.fileName),
          attachment.contentBase64,
          createdAt,
        ],
      );
    }
  }

  private async listOperationalReservationsForConflicts(
    client: PoolClient,
    sourceRequestId: string,
  ): Promise<
    Array<{
      reservationId: string;
      reservationNumber: string | null;
      bungalowId: string | null;
      channel: ReservationChannel;
      status: string;
      paymentStatus: ReservationPaymentStatus | null;
      sourceRequestId: string | null;
      startDate: string;
      endDate: string;
    }>
  > {
    const result = await client.query<ReservationRow>(
      `
        select *
        from reservation
        where source_request_id is distinct from $1::uuid
          and status not in ('cancelled', 'no_show', 'pending_review')
      `,
      [sourceRequestId],
    );
    return result.rows.map((row) => ({
      reservationId: row.id,
      reservationNumber: row.number,
      bungalowId: row.bungalow_id,
      channel: row.channel,
      status: row.status,
      paymentStatus: row.payment_status,
      sourceRequestId: row.source_request_id,
      startDate: normalizePgDateOnly(row.start_date),
      endDate: normalizePgDateOnly(row.end_date),
    }));
  }

  private async getOpenAvailabilityConflict(
    client: PoolClient,
    requestId: string,
    reservationId: string | null,
  ): Promise<AvailabilityConflict | null> {
    const result = await client.query<AvailabilityConflictRow>(
      `
        select
          id, status, conflict_type, request_id, reservation_id, notes,
          created_by, resolved_by, created_at, resolved_at, metadata
        from availability_conflict
        where request_id = $1
          and reservation_id is not distinct from $2
          and status = 'open'
        limit 1
      `,
      [requestId, reservationId],
    );

    const row = result.rows[0];
    return row ? this.toAvailabilityConflict(row) : null;
  }

  private async resolveAvailabilityConflictsForRequest(
    client: PoolClient,
    requestId: string,
    keepReservationIds: Set<string>,
    actorId: string,
  ): Promise<void> {
    const rows = await client.query<AvailabilityConflictRow>(
      `
        select
          id, status, conflict_type, request_id, reservation_id, notes,
          created_by, resolved_by, created_at, resolved_at, metadata
        from availability_conflict
        where request_id = $1
          and status = 'open'
      `,
      [requestId],
    );
    const now = isoNow();

    for (const row of rows.rows) {
      if (row.reservation_id && keepReservationIds.has(row.reservation_id)) {
        continue;
      }
      await client.query(
        `
          update availability_conflict
          set status = 'resolved', resolved_by = $2, resolved_at = $3
          where id = $1
        `,
        [row.id, actorId, now],
      );
    }
  }

  private async resolveAvailabilityConflictsForReservation(
    client: PoolClient,
    reservationId: string,
    keepRequestIds: Set<string>,
    actorId: string,
  ): Promise<void> {
    const rows = await client.query<AvailabilityConflictRow>(
      `
        select
          id, status, conflict_type, request_id, reservation_id, notes,
          created_by, resolved_by, created_at, resolved_at, metadata
        from availability_conflict
        where reservation_id = $1
          and status = 'open'
      `,
      [reservationId],
    );
    const now = isoNow();

    for (const row of rows.rows) {
      const isReservationOnlyConflict =
        row.request_id === null && (row.metadata?.scope as string | undefined) === "reservation_only";
      if (isReservationOnlyConflict) {
        continue;
      }
      if (row.request_id && keepRequestIds.has(row.request_id)) {
        continue;
      }
      await client.query(
        `
          update availability_conflict
          set status = 'resolved', resolved_by = $2, resolved_at = $3
          where id = $1
        `,
        [row.id, actorId, now],
      );
    }
  }

  private async resolveReservationOnlyConflicts(
    client: PoolClient,
    reservationId: string,
    actorId: string,
  ): Promise<void> {
    const now = isoNow();
    await client.query(
      `
        update availability_conflict
        set status = 'resolved', resolved_by = $2, resolved_at = $3
        where reservation_id = $1
          and request_id is null
          and status = 'open'
          and coalesce(metadata->>'scope', '') = 'reservation_only'
      `,
      [reservationId, actorId, now],
    );
  }

  private async getOpenReservationOnlyConflict(
    client: PoolClient,
    reservationId: string,
  ): Promise<AvailabilityConflict | null> {
    const existing = await client.query<AvailabilityConflictRow>(
      `
        select
          id, status, conflict_type, request_id, reservation_id, notes,
          created_by, resolved_by, created_at, resolved_at, metadata
        from availability_conflict
        where reservation_id = $1
          and request_id is null
          and status = 'open'
          and coalesce(metadata->>'scope', '') = 'reservation_only'
        limit 1
      `,
      [reservationId],
    );

    return existing.rows[0] ? this.toAvailabilityConflict(existing.rows[0]) : null;
  }

  private async upsertAvailabilityConflictForMatch(
    client: PoolClient,
    input: {
      requestId: string;
      reservationId: string;
      actorId: string;
      title: string;
      detail: string;
      overlappingReservationIds: string[];
    },
  ): Promise<AvailabilityConflict> {
    const existing = await this.getOpenAvailabilityConflict(client, input.requestId, input.reservationId);
    if (existing) {
      await client.query(
        `
          update availability_conflict
          set notes = $2, metadata = $3::jsonb
          where id = $1
        `,
        [
          existing.id,
          input.detail,
          JSON.stringify({
            ...(existing.metadata ?? {}),
            title: input.title,
            overlappingReservationIds: input.overlappingReservationIds,
          }),
        ],
      );

      return {
        ...existing,
        notes: input.detail,
        metadata: {
          ...(existing.metadata ?? {}),
          title: input.title,
          overlappingReservationIds: input.overlappingReservationIds,
        },
      };
    }

    return this.insertAvailabilityConflict(client, {
      status: "open",
      conflictType: "date_overlap",
      requestId: input.requestId,
      reservationId: input.reservationId,
      notes: input.detail,
      createdBy: input.actorId,
      resolvedBy: null,
      resolvedAt: null,
      metadata: {
        title: input.title,
        overlappingReservationIds: input.overlappingReservationIds,
      },
    });
  }

  private async reconcileBookingRequestConflicts(
    client: PoolClient,
    bookingRequest: BookingRequest,
    actorId: string,
  ) {
    const operationalReservations = await this.listOperationalReservationsForConflicts(client, bookingRequest.id);
    const conflictResult = detectRequestConflicts(
      {
        requestedCheckIn: bookingRequest.requestedCheckIn,
        requestedCheckOut: bookingRequest.requestedCheckOut,
        requestedBungalowType: bookingRequest.requestedBungalowType,
      },
      operationalReservations,
    );

    await this.resolveAvailabilityConflictsForRequest(
      client,
      bookingRequest.id,
      new Set(conflictResult.overlappingReservationIds),
      actorId,
    );

    for (const match of conflictResult.matches) {
      await this.upsertAvailabilityConflictForMatch(client, {
        requestId: bookingRequest.id,
        reservationId: match.reservationId,
        actorId,
        title: match.policy.title,
        detail: match.policy.detail,
        overlappingReservationIds: conflictResult.overlappingReservationIds,
      });
    }

    return conflictResult;
  }

  private async reconcileReservationConflictsAgainstOpenRequests(
    client: PoolClient,
    reservation: Reservation,
    actorId: string,
  ): Promise<void> {
    const keepRequestIds = new Set<string>();

    if (reservation.bungalowId && !["cancelled", "no_show", "pending_review"].includes(reservation.status)) {
      const requests = await this.listOpenBookingRequestsForReservation(client, reservation.sourceRequestId ?? null);
      for (const request of requests) {
        const result = detectRequestConflicts(
          {
            requestedCheckIn: request.requestedCheckIn,
            requestedCheckOut: request.requestedCheckOut,
            requestedBungalowType: request.requestedBungalowType,
          },
          [
            {
              reservationId: reservation.id,
              reservationNumber: reservation.number,
              bungalowId: reservation.bungalowId,
              channel: reservation.channel,
              status: reservation.status,
              paymentStatus: reservation.paymentStatus ?? null,
              sourceRequestId: reservation.sourceRequestId ?? null,
              startDate: reservation.startDate,
              endDate: reservation.endDate,
            },
          ],
        );

        if (!result.hasConflict) {
          continue;
        }

        keepRequestIds.add(request.id);
        const match = result.matches[0];
        if (!match) {
          continue;
        }
        await this.upsertAvailabilityConflictForMatch(client, {
          requestId: request.id,
          reservationId: reservation.id,
          actorId,
          title: match.policy.title,
          detail: match.policy.detail,
          overlappingReservationIds: result.overlappingReservationIds,
        });
      }
    }

    await this.resolveAvailabilityConflictsForReservation(client, reservation.id, keepRequestIds, actorId);
  }

  private async findOverlappingReservations(
    client: PoolClient,
    reservationId: string,
    bungalowId: string,
    startDate: string,
    endDate: string,
  ): Promise<Array<{ id: string; number: string }>> {
    const result = await client.query<{ id: string; number: string }>(
      `
        select id, number
        from reservation
        where id <> $1
          and bungalow_id = $2
          and status not in ('cancelled', 'no_show', 'pending_review')
          and daterange(start_date, end_date, '[]') && daterange($3::date, $4::date, '[]')
        order by start_date asc, number asc
      `,
      [reservationId, bungalowId, startDate, endDate],
    );
    return result.rows;
  }

  private async upsertReservationOnlyConflict(
    client: PoolClient,
    input: {
      reservationId: string;
      actorId: string;
      notes: string;
      metadata: Record<string, unknown>;
    },
  ): Promise<AvailabilityConflict> {
    const existing = await this.getOpenReservationOnlyConflict(client, input.reservationId);

    if (existing) {
      await client.query(
        `
          update availability_conflict
          set notes = $2, metadata = $3::jsonb
          where id = $1
        `,
        [existing.id, input.notes, JSON.stringify(input.metadata)],
      );
      return {
        ...existing,
        notes: input.notes,
        metadata: input.metadata,
      };
    }

    return this.insertAvailabilityConflict(client, {
      status: "open",
      conflictType: "assignment_overlap",
      requestId: null,
      reservationId: input.reservationId,
      notes: input.notes,
      createdBy: input.actorId,
      resolvedBy: null,
      resolvedAt: null,
      metadata: input.metadata,
    });
  }

  private async syncLinkedBookingRequestFromReservation(
    client: PoolClient,
    reservation: Reservation,
    actorId: string,
    reason: string,
  ): Promise<void> {
    if (!reservation.sourceRequestId) {
      return;
    }

    const bookingRequest = await this.getBookingRequestWithClient(client, reservation.sourceRequestId);
    if (!bookingRequest || bookingRequest.status === "cancelled" || bookingRequest.status === "converted_to_reservation") {
      return;
    }

    const updatedBookingRequest: BookingRequest = {
      ...bookingRequest,
      requestedCheckIn: reservation.startDate,
      requestedCheckOut: reservation.endDate,
      requestedBungalowType: reservation.bungalowId,
      notes: bookingRequest.notes ?? reason,
      updatedAt: isoNow(),
    };

    await client.query(
      `
        update booking_request
        set
          requested_check_in = $2,
          requested_check_out = $3,
          requested_bungalow_type = $4,
          notes = $5,
          updated_at = $6
        where id = $1
      `,
      [
        updatedBookingRequest.id,
        updatedBookingRequest.requestedCheckIn,
        updatedBookingRequest.requestedCheckOut,
        updatedBookingRequest.requestedBungalowType,
        updatedBookingRequest.notes,
        updatedBookingRequest.updatedAt,
      ],
    );

    await this.reconcileBookingRequestConflicts(client, updatedBookingRequest, actorId);
  }

  private async insertAvailabilityConflict(
    client: PoolClient,
    input: Omit<AvailabilityConflict, "id" | "createdAt"> & {
      metadata?: Record<string, unknown>;
    },
  ): Promise<AvailabilityConflict> {
    const conflict: AvailabilityConflict = {
      id: randomUUID(),
      status: input.status,
      conflictType: input.conflictType,
      requestId: input.requestId,
      reservationId: input.reservationId,
      notes: input.notes,
      createdBy: input.createdBy,
      resolvedBy: input.resolvedBy,
      createdAt: isoNow(),
      resolvedAt: input.resolvedAt,
      metadata: input.metadata,
    };
    await client.query(
      `
        insert into availability_conflict(
          id, status, conflict_type, request_id, reservation_id, notes,
          created_by, resolved_by, created_at, resolved_at, metadata
        ) values (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11::jsonb
        )
      `,
      [
        conflict.id,
        conflict.status,
        conflict.conflictType,
        conflict.requestId,
        conflict.reservationId,
        conflict.notes,
        conflict.createdBy,
        conflict.resolvedBy,
        conflict.createdAt,
        conflict.resolvedAt,
        JSON.stringify(conflict.metadata ?? {}),
      ],
    );
    return conflict;
  }

  private async upsertOtaReservationLink(
    client: PoolClient,
    input: Omit<OtaReservationLink, "createdAt" | "updatedAt">,
  ): Promise<void> {
    const now = isoNow();
    await client.query(
      `
        insert into ota_reservation_link (
          reservation_id, provider_key, connection_id, external_reservation_id, external_property_id,
          external_room_type_code, external_rate_plan_code, provider_status, provider_payload_checksum,
          provider_event_version, provider_thread_id, provider_last_event_at, raw_payload, created_at, updated_at
        ) values (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9,
          $10, $11, $12, $13::jsonb, $14, $14
        )
        on conflict (reservation_id) do update
        set
          provider_key = excluded.provider_key,
          connection_id = excluded.connection_id,
          external_reservation_id = excluded.external_reservation_id,
          external_property_id = excluded.external_property_id,
          external_room_type_code = excluded.external_room_type_code,
          external_rate_plan_code = excluded.external_rate_plan_code,
          provider_status = excluded.provider_status,
          provider_payload_checksum = excluded.provider_payload_checksum,
          provider_event_version = excluded.provider_event_version,
          provider_thread_id = coalesce(excluded.provider_thread_id, ota_reservation_link.provider_thread_id),
          provider_last_event_at = excluded.provider_last_event_at,
          raw_payload = excluded.raw_payload,
          updated_at = excluded.updated_at
      `,
      [
        input.reservationId,
        input.providerKey,
        input.connectionId,
        input.externalReservationId,
        input.externalPropertyId,
        input.externalRoomTypeCode,
        input.externalRatePlanCode,
        input.providerStatus,
        input.providerPayloadChecksum,
        input.providerEventVersion,
        input.providerThreadId,
        input.providerLastEventAt,
        JSON.stringify(input.rawPayload ?? {}),
        now,
      ],
    );
  }

  private async recordOtaEvent(
    client: PoolClient,
    input: {
      providerKey: OtaConnection["providerKey"];
      connectionId: string | null;
      reservationId: string | null;
      externalReservationId: string | null;
      eventType: string;
      payload: Record<string, unknown>;
    },
  ): Promise<void> {
    await client.query(
      `
        insert into ota_event_log (
          id, provider_key, connection_id, reservation_id, external_reservation_id,
          event_type, payload, created_at
        ) values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
      `,
      [
        randomUUID(),
        input.providerKey,
        input.connectionId,
        input.reservationId,
        input.externalReservationId,
        input.eventType,
        JSON.stringify(input.payload),
        isoNow(),
      ],
    );
  }

  private async logOtaSyncRun(input: {
    connectionId: string | null;
    providerKey: OtaConnection["providerKey"];
    mode: "incremental" | "recovery";
    status: "running" | "completed" | "failed";
    summary: Record<string, unknown>;
    errorMessage?: string | null;
    startedAt: string;
    finishedAt?: string | null;
  }): Promise<void> {
    const runId = randomUUID();
    await this.pool.query(
      `
        insert into ota_sync_run (
          id, provider_key, connection_id, mode, status, summary, error_message, started_at, finished_at
        ) values (
          $1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9
        )
        on conflict (provider_key, connection_id, mode, started_at) do update
        set
          status = excluded.status,
          summary = excluded.summary,
          error_message = excluded.error_message,
          finished_at = excluded.finished_at
      `,
      [
        runId,
        input.providerKey,
        input.connectionId,
        input.mode,
        input.status,
        JSON.stringify(input.summary),
        input.errorMessage ?? null,
        input.startedAt,
        input.finishedAt ?? null,
      ],
    );
  }

  private async updateOtaSyncCursor(
    connectionId: string | null,
    providerKey: OtaConnection["providerKey"],
    mode: "incremental" | "recovery",
    cursorValue: string,
  ): Promise<void> {
    await this.pool.query(
      `
        insert into ota_sync_cursor (provider_key, connection_id, mode, cursor_value, last_synced_at, updated_at)
        values ($1, $2, $3, $4, $5, $5)
        on conflict (provider_key, connection_id, mode) do update
        set
          cursor_value = excluded.cursor_value,
          last_synced_at = excluded.last_synced_at,
          updated_at = excluded.updated_at
      `,
      [providerKey, connectionId, mode, cursorValue, isoNow()],
    );
  }

  private async loadAggregateCapacityAvailability(
    client: PoolClient,
    input: {
      reservationId: string;
      bungalowId: string;
      checkIn: string;
      checkOut: string;
      lockReservationRow: boolean;
    },
  ): Promise<ReturnType<typeof calculateCapacityAvailability>> {
    if (input.lockReservationRow) {
      await client.query(`select id from reservation where id = $1 for update`, [input.reservationId]);
    }
    await client.query(`select pg_advisory_xact_lock(hashtext('bungalow-capacity:' || $1))`, [input.bungalowId]);

    const capacityResult = await client.query<{
      bungalow_id: string;
      total_units: number;
      version: number;
      updated_by: string | null;
      created_at: string | Date;
      updated_at: string | Date;
    }>(
      `select bungalow_id, total_units, version, updated_by, created_at, updated_at from bungalow_capacity where bungalow_id = $1 for update`,
      [input.bungalowId],
    );
    const capacityRow = capacityResult.rows[0];
    if (!capacityRow) throw new Error("availability_unavailable");

    const overlappingReservations = await client.query<ReservationRow>(
      `select * from reservation where id <> $1 and bungalow_id = $2 and status in ('ota_imported_confirmed', 'confirmed', 'assigned', 'checked_in', 'checked_out', 'paid') and start_date < $4 and $3 < end_date`,
      [input.reservationId, input.bungalowId, input.checkIn, input.checkOut],
    );
    return calculateCapacityAvailability({
      capacity: {
        bungalowId: capacityRow.bungalow_id,
        totalUnits: capacityRow.total_units,
        version: capacityRow.version,
        updatedBy: capacityRow.updated_by,
        createdAt: normalizePgTimestamp(capacityRow.created_at) ?? new Date(0).toISOString(),
        updatedAt: normalizePgTimestamp(capacityRow.updated_at) ?? new Date(0).toISOString(),
      },
      reservations: overlappingReservations.rows.map((row) => ({
        id: row.id,
        bungalowId: row.bungalow_id,
        checkIn: normalizePgDateOnly(row.start_date),
        checkOut: normalizePgDateOnly(row.end_date),
        status: row.status,
      })),
      checkIn: input.checkIn,
      checkOut: input.checkOut,
    });
  }

  private async createConfirmedReservationFromBookingRequest(
    client: PoolClient,
    input: {
      bookingRequest: BookingRequest;
      actorId: string;
      reason: string;
    },
  ): Promise<ReservationDetail> {
    const existingNumbers = await client.query<Pick<ReservationRow, "number">>(
      `select number from reservation`,
    );
    const now = isoNow();
    const bungalowId = input.bookingRequest.requestedBungalowType;
    const reservationId = randomUUID();
    if (bungalowId) {
      const bungalow = await this.mustGetBungalow(client, bungalowId);
      if (!bungalow.active) throw new Error("bungalow_inactive");
      const availability = await this.loadAggregateCapacityAvailability(client, {
        reservationId,
        bungalowId,
        checkIn: input.bookingRequest.requestedCheckIn,
        checkOut: input.bookingRequest.requestedCheckOut,
        lockReservationRow: false,
      });
      if (!availability.canAcceptOneMore) throw new Error("bungalow_capacity_unavailable");
    }
    const reservation: Reservation = {
      id: reservationId,
      number: nextReservationNumber(existingNumbers.rows),
      channel: "web",
      status: "confirmed",
      bungalowId,
      bungalowUnitId: null,
      sourceRequestId: input.bookingRequest.id,
      responsibleId: input.actorId,
      startDate: input.bookingRequest.requestedCheckIn,
      endDate: input.bookingRequest.requestedCheckOut,
      guestName: input.bookingRequest.guestName,
      guestEmail: input.bookingRequest.guestEmail,
      guestPhone: input.bookingRequest.guestPhone,
      guestCount: input.bookingRequest.requestedGuests,
      sourceProvider: "manual",
      externalReservationId: null,
      externalPropertyId: null,
      externalRoomTypeCode: null,
      externalRatePlanCode: null,
      providerStatus: null,
      providerPayloadChecksum: null,
      providerLastEventAt: null,
      amountTotalCents: undefined,
      amountPaidCents: 0,
      paymentStatus: "pending",
      currencyCode: DEFAULT_CURRENCY_CODE,
      updatedAt: now,
    };

    await client.query(
      `
        insert into reservation (
          id, number, channel, status, source_request_id, bungalow_id, responsible_id,
          start_date, end_date, guest_name, guest_email, guest_phone, guest_count,
          source_provider, external_reservation_id, external_property_id,
          external_room_type_code, external_rate_plan_code, provider_status,
          provider_payload_checksum, provider_last_event_at,
          amount_total_cents, amount_paid_cents, payment_status, currency_code, updated_at
        ) values (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13,
          $14, $15, $16,
          $17, $18, $19,
          $20, $21,
          $22, $23, $24, $25, $26
        )
      `,
      [
        reservation.id,
        reservation.number,
        reservation.channel,
        reservation.status,
        reservation.sourceRequestId,
        reservation.bungalowId,
        reservation.responsibleId,
        reservation.startDate,
        reservation.endDate,
        reservation.guestName,
        reservation.guestEmail,
        reservation.guestPhone,
        reservation.guestCount,
        reservation.sourceProvider,
        reservation.externalReservationId,
        reservation.externalPropertyId,
        reservation.externalRoomTypeCode,
        reservation.externalRatePlanCode,
        reservation.providerStatus,
        reservation.providerPayloadChecksum,
        reservation.providerLastEventAt,
        reservation.amountTotalCents ?? null,
        reservation.amountPaidCents ?? null,
        reservation.paymentStatus ?? null,
        reservation.currencyCode ?? null,
        reservation.updatedAt,
      ],
    );

    await this.insertOccupancyRows(
      client,
      reservation,
      reservation.bungalowId,
      occupancyStatusForReservation(reservation.status),
    );
    await this.insertAudit(
      client,
      createReservationAuditEntry({
        reservationId: reservation.id,
        actorId: input.actorId,
        action: "confirm",
        previousStatus: "pending_review",
        nextStatus: "confirmed",
        reason: input.reason,
      }),
    );

    const detail = await this.getDetail(client, reservation.id);
    if (!detail) throw new Error("reservation_not_found");
    return detail;
  }

  private async mustGetReservation(client: PoolClient, id: string): Promise<Reservation> {
    const result = await client.query<ReservationRow>(
      `select * from reservation where id = $1 limit 1`,
      [id],
    );
    const row = result.rows[0];
    if (!row) throw new Error("reservation_not_found");
    return this.toReservation(row);
  }

  private async mustGetBungalow(client: PoolClient, id: string): Promise<Bungalow> {
    const result = await client.query<Bungalow>(
      `select id, code, name, active, capacity from bungalow where id = $1 limit 1`,
      [id],
    );
    const bungalow = result.rows[0];
    if (!bungalow) throw new Error("bungalow_not_found");
    return bungalow;
  }

  private async insertOccupancyRows(
    client: PoolClient,
    reservation: Reservation,
    bungalowId: string | null,
    status: ReservationOccupancy["status"],
  ): Promise<ReservationOccupancy[]> {
    if (!bungalowId) {
      return [];
    }

    const createdAt = isoNow();
    const rows: ReservationOccupancy[] = [];
    for (const date of nightsForReservation(reservation.startDate, reservation.endDate)) {
      const occupancy: ReservationOccupancy = {
        id: randomUUID(),
        reservationId: reservation.id,
        bungalowId,
        bungalowUnitId: reservation.bungalowUnitId ?? null,
        date,
        source: reservation.channel,
        status,
        createdAt,
      };
      await client.query(
        `
          insert into reservation_occupancy(id, reservation_id, bungalow_id, bungalow_unit_id, date, source, status, created_at)
          values($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [
          occupancy.id,
          occupancy.reservationId,
          occupancy.bungalowId,
          occupancy.bungalowUnitId ?? null,
          occupancy.date,
          occupancy.source,
          occupancy.status,
          occupancy.createdAt,
        ],
      );
      rows.push(occupancy);
    }
    return rows;
  }

  private async insertAudit(client: PoolClient, audit: ReservationAudit): Promise<void> {
    await client.query(
      `
        insert into reservation_audit(
          id, reservation_id, actor_id, action, previous_status, next_status, reason, created_at
        ) values ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        audit.id,
        audit.reservationId,
        audit.actorId,
        audit.action,
        audit.previousStatus,
        audit.nextStatus,
        audit.reason,
        audit.createdAt,
      ],
    );
  }

  private async updateReservationRow(client: PoolClient, reservation: Reservation): Promise<void> {
    await client.query(
      `
        update reservation
        set
          number = $2,
          channel = $3,
          status = $4,
          source_request_id = $5,
          bungalow_id = $6,
          bungalow_unit_id = $7,
          responsible_id = $8,
          start_date = $9,
          end_date = $10,
          guest_name = $11,
          guest_email = $12,
          guest_phone = $13,
          guest_count = $14,
          source_provider = $15,
          external_reservation_id = $16,
          external_property_id = $17,
          external_room_type_code = $18,
          external_rate_plan_code = $19,
          provider_status = $20,
          provider_payload_checksum = $21,
          provider_last_event_at = $22,
          amount_total_cents = $23,
          amount_paid_cents = $24,
          payment_status = $25,
          currency_code = $26,
          updated_at = $27
        where id = $1
      `,
      [
        reservation.id,
        reservation.number,
        reservation.channel,
        reservation.status,
        reservation.sourceRequestId ?? null,
        reservation.bungalowId,
        reservation.bungalowUnitId ?? null,
        reservation.responsibleId,
        reservation.startDate,
        reservation.endDate,
        reservation.guestName ?? null,
        reservation.guestEmail ?? null,
        reservation.guestPhone ?? null,
        reservation.guestCount ?? null,
        reservation.sourceProvider ?? null,
        reservation.externalReservationId ?? null,
        reservation.externalPropertyId ?? null,
        reservation.externalRoomTypeCode ?? null,
        reservation.externalRatePlanCode ?? null,
        reservation.providerStatus ?? null,
        reservation.providerPayloadChecksum ?? null,
        reservation.providerLastEventAt ?? null,
        reservation.amountTotalCents ?? null,
        reservation.amountPaidCents ?? null,
        reservation.paymentStatus ?? null,
        reservation.currencyCode ?? null,
        reservation.updatedAt,
      ],
    );
  }
}
