import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  dedupeProviderMessages,
  hashAttachmentContent,
  isSupportedAttachment,
} from "@/lib/mail/thread-sync";
import { buildInitialBookingRequestSubject } from "@/lib/mail/email-outbox";
import {
  listThreadMessages,
  searchThreadIdByBookingRequest,
  sendThreadReply,
  sendTransactionalZohoEmail,
} from "@/lib/mail/zoho-client";
import {
  buildBookingRequestWorkItem,
  inferSyncedMessageIdentity,
  messageActivityAt,
  RESERVATIONS_MAILBOX_ADDRESS,
} from "@/lib/reservations/booking-request-workbench";
import {
  buildBookingRequestOperationsItem,
  buildReservationOperationsItem,
} from "@/lib/reservations/operations-workbench";
import { nightsForStay as nightsForReservation } from "@/lib/reservations/stay-intervals";
import { createReservationAuditEntry } from "@/lib/reservations/audit";
import { registerBookingRequestReconciliation } from "@/lib/reservations/booking-request-reconciliation";
import { detectRequestConflicts } from "@/lib/reservations/conflicts";
import {
  buildBungalowId,
  bungalowHasDuplicateCode,
  normalizeBungalowInput,
} from "@/lib/reservations/bungalows";
import { calculateCapacityAvailability, isCapacityBlockingStatus } from "@/lib/bungalow-capacity/availability";
import { getInMemoryCapacitySnapshot } from "@/lib/bungalow-capacity/store";
import {
  getDefaultBungalowPublicContent,
  listDefaultBungalowPublicContent,
} from "@/lib/reservations/wakaya-bungalow-public-content";
import { WAKAYA_OPERATIONAL_BUNGALOWS } from "@/lib/reservations/wakaya-bungalows";
import type { ReservationServiceLike } from "@/lib/reservations/repository";
import type {
  BookingRequestStatusTransitionInput,
  RecordBookingRequestMessageResult,
  BookingRequestReplyInput,
  BookingRequestReplyResult,
  BookingRequestThreadView,
  ConfirmBookingRequestTransferResult,
  CreateComplaintResult,
  CreateBookingRequestResult,
  CreateReservationResult,
  OperationThreadView,
  ReservationDetail,
  ReservationListItem,
  SyncBookingRequestThreadResult,
  UpdateBookingRequestResult,
} from "@/lib/reservations/repository";
import { nextBookingRequestPublicRef, nextComplaintPublicCode, nextReservationNumber } from "@/lib/reservations/numbering";
import { buildReservationService } from "@/lib/reservations/service";
import { nextBookingRequestStatus, nextReservationStatus } from "@/lib/reservations/state-machine";
import type {
  AvailabilityConflict,
  BookingRequest,
  BookingRequestCreateInput,
  BookingRequestMessageInput,
  BookingRequestOwnerAssignmentInput,
  BookingRequestUpdateInput,
  QuickReplyTemplate,
  QuickReplyTemplateUpsertInput,
  ComplaintCase,
  ComplaintCreateInput,
  Bungalow,
  BungalowCreateInput,
  BungalowPublicContent,
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
  Reservation,
  ReservationAudit,
  ReservationAssignmentInput,
  ReservationChannel,
  ReservationCreateInput,
  ReservationListFilters,
  ReservationOccupancy,
  ReservationPaymentInput,
  ReservationPaymentStatus,
  ReservationStatusChangeInput,
  ReservationUpdateInput,
} from "@/lib/reservations/types";
export type { CreateReservationResult, ReservationDetail, ReservationListItem } from "@/lib/reservations/repository";

interface SeedData {
  storagePath?: string;
  bungalows?: Bungalow[];
  bungalowPublicContents?: BungalowPublicContent[];
  reservations?: Reservation[];
  occupancies?: ReservationOccupancy[];
  audits?: ReservationAudit[];
}

const MEMORY_SNAPSHOTS = new Map<
  string,
  {
    bungalows: Bungalow[];
    bungalowPublicContents: BungalowPublicContent[];
    reservations: Reservation[];
    occupancies: ReservationOccupancy[];
    audits: ReservationAudit[];
  }
>();

const FALLBACK_REQUEST_SNAPSHOTS = new Map<string, PersistedFallbackRequestSnapshot>();

type PersistedReservationSnapshot = {
  bungalows: Bungalow[];
  bungalowPublicContents: BungalowPublicContent[];
  reservations: Reservation[];
  occupancies: ReservationOccupancy[];
  audits: ReservationAudit[];
};

type PersistedFallbackRequestSnapshot = {
  complaints: ComplaintCase[];
  bookingRequests: BookingRequest[];
  threads: MessageThread[];
  messages: MessageItem[];
  conflicts: AvailabilityConflict[];
  quickReplyTemplates: QuickReplyTemplate[];
  otaConnections: OtaConnection[];
  otaRoomMappings: OtaRoomMapping[];
  otaRatePlanMappings: OtaRatePlanMapping[];
  otaLinks: OtaReservationLink[];
};

type PersistedFallbackSnapshot = {
  reservations?: PersistedReservationSnapshot;
  bookingRequests?: PersistedFallbackRequestSnapshot;
};

function isoNow(): string {
  return new Date().toISOString();
}

function cloneSnapshotValue<T>(value: T): T {
  return structuredClone(value);
}

function normalizeFallbackRequestSnapshot(
  snapshot: Partial<PersistedFallbackRequestSnapshot> | null | undefined,
  defaults: PersistedFallbackRequestSnapshot,
): PersistedFallbackRequestSnapshot {
  return {
    complaints: cloneSnapshotValue(snapshot?.complaints ?? defaults.complaints),
    bookingRequests: cloneSnapshotValue(snapshot?.bookingRequests ?? defaults.bookingRequests),
    threads: cloneSnapshotValue(snapshot?.threads ?? defaults.threads),
    messages: cloneSnapshotValue(snapshot?.messages ?? defaults.messages),
    conflicts: cloneSnapshotValue(snapshot?.conflicts ?? defaults.conflicts),
    quickReplyTemplates: cloneSnapshotValue(snapshot?.quickReplyTemplates ?? defaults.quickReplyTemplates),
    otaConnections: cloneSnapshotValue(snapshot?.otaConnections ?? defaults.otaConnections),
    otaRoomMappings: cloneSnapshotValue(snapshot?.otaRoomMappings ?? defaults.otaRoomMappings),
    otaRatePlanMappings: cloneSnapshotValue(snapshot?.otaRatePlanMappings ?? defaults.otaRatePlanMappings),
    otaLinks: cloneSnapshotValue(snapshot?.otaLinks ?? defaults.otaLinks),
  };
}

function resolveFallbackStoragePath() {
  const configured = process.env.WAKAYA_RESERVATIONS_DB_PATH?.trim();
  if (configured) {
    return configured;
  }
  return process.env.NODE_ENV === "test" ? null : ".data/wakaya-reservations.snapshot.json";
}

function readPersistedFallbackSnapshot(storagePath: string): PersistedFallbackSnapshot | null {
  try {
    if (!existsSync(storagePath)) {
      return null;
    }
    const raw = readFileSync(storagePath, "utf8").trim();
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as PersistedFallbackSnapshot;
  } catch {
    return null;
  }
}

function writePersistedFallbackSnapshot(
  storagePath: string,
  update: Partial<PersistedFallbackSnapshot>,
) {
  const current = readPersistedFallbackSnapshot(storagePath) ?? {};
  const next: PersistedFallbackSnapshot = {
    ...current,
    ...update,
  };

  mkdirSync(dirname(storagePath), { recursive: true });
  writeFileSync(storagePath, JSON.stringify(next, null, 2));
}

function normalizeSource(channel: ReservationChannel): ReservationChannel {
  return channel;
}

function defaultStatus(channel: ReservationChannel) {
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

export class ReservationStore {
  private readonly bungalows = new Map<string, Bungalow>();
  private readonly bungalowPublicContents = new Map<string, BungalowPublicContent>();
  private readonly reservations = new Map<string, Reservation>();
  private readonly occupancies = new Map<string, ReservationOccupancy>();
  private readonly audits = new Map<string, ReservationAudit[]>();
  private readonly storagePath: string | null;

  constructor(seed: SeedData = {}) {
    const bungalowSeeds: Bungalow[] =
      seed.bungalows ?? WAKAYA_OPERATIONAL_BUNGALOWS.map((bungalow) => ({ ...bungalow }));
    const bungalowPublicContentSeeds: BungalowPublicContent[] =
      seed.bungalowPublicContents ?? listDefaultBungalowPublicContent();
    const reservationSeeds = seed.reservations ?? [];
    const occupancySeeds = seed.occupancies ?? [];
    const auditSeeds = seed.audits ?? [];
    const snapshot = {
      bungalows: bungalowSeeds,
      bungalowPublicContents: bungalowPublicContentSeeds,
      reservations: reservationSeeds,
      occupancies: occupancySeeds,
      audits: auditSeeds,
    };

    this.storagePath = seed.storagePath ?? null;
    const persistedSnapshot = this.storagePath
      ? (() => {
          const diskSnapshot = readPersistedFallbackSnapshot(this.storagePath)?.reservations;
          const nextSnapshot = cloneSnapshotValue(
            diskSnapshot ??
              MEMORY_SNAPSHOTS.get(this.storagePath) ?? {
                bungalows: snapshot.bungalows,
                bungalowPublicContents: snapshot.bungalowPublicContents,
                reservations: snapshot.reservations,
                occupancies: snapshot.occupancies,
                audits: snapshot.audits,
              },
          );
          MEMORY_SNAPSHOTS.set(this.storagePath, nextSnapshot);
          return nextSnapshot;
        })()
      : snapshot;

    persistedSnapshot.bungalows.forEach((bungalow) => this.bungalows.set(bungalow.id, bungalow));
    persistedSnapshot.bungalowPublicContents.forEach((publicContent) =>
      this.bungalowPublicContents.set(publicContent.bungalowId, publicContent),
    );
    persistedSnapshot.reservations.forEach((reservation) => this.reservations.set(reservation.id, reservation));
    persistedSnapshot.occupancies.forEach((occupancy) => this.occupancies.set(occupancy.id, occupancy));
    persistedSnapshot.audits.forEach((audit) => {
      const list = this.audits.get(audit.reservationId) ?? [];
      list.push(audit);
      this.audits.set(audit.reservationId, list);
    });
  }

  list(filters: ReservationListFilters = {}): ReservationListItem[] {
    this.refreshFromPersistence();
    const items = Array.from(this.reservations.values())
      .filter((reservation) => {
        if (filters.status && reservation.status !== filters.status) return false;
        if (filters.responsibleId && reservation.responsibleId !== filters.responsibleId) return false;
        if (filters.channel && reservation.channel !== filters.channel) return false;
        if (filters.date) {
          if (reservation.startDate > filters.date || reservation.endDate < filters.date) return false;
        }
        if (filters.startDate && reservation.endDate < filters.startDate) return false;
        if (filters.endDate && reservation.startDate > filters.endDate) return false;
        return true;
      })
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

    return items.map((reservation) => ({
      ...reservation,
      bungalow: reservation.bungalowId ? this.bungalows.get(reservation.bungalowId) ?? null : null,
    }));
  }

  get(id: string): ReservationDetail | null {
    this.refreshFromPersistence();
    const reservation = this.reservations.get(id);
    if (!reservation) return null;
    return {
      ...reservation,
      bungalow: reservation.bungalowId ? this.bungalows.get(reservation.bungalowId) ?? null : null,
      auditCount: this.getAuditTrail(id).length,
    };
  }

  getBungalow(id: string): Bungalow | null {
    this.refreshFromPersistence();
    return this.bungalows.get(id) ?? null;
  }

  getBungalowPublicContent(id: string): BungalowPublicContent | null {
    this.refreshFromPersistence();
    return this.bungalowPublicContents.get(id) ?? getDefaultBungalowPublicContent(id);
  }

  listBungalows(): Bungalow[] {
    this.refreshFromPersistence();
    return Array.from(this.bungalows.values()).sort((left, right) => left.name.localeCompare(right.name));
  }

  listBungalowPublicContent(): BungalowPublicContent[] {
    this.refreshFromPersistence();
    return Array.from(this.bungalowPublicContents.values()).sort((left, right) => {
      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder;
      }
      return left.bungalowId.localeCompare(right.bungalowId);
    });
  }

  createBungalow(input: BungalowCreateInput): Bungalow {
    this.refreshFromPersistence();
    const normalized = normalizeBungalowInput(input);
    const current = Array.from(this.bungalows.values());
    if (bungalowHasDuplicateCode(current, normalized.code)) {
      throw new Error("bungalow_code_taken");
    }

    const bungalow: Bungalow = {
      id: buildBungalowId(normalized.code),
      code: normalized.code,
      name: normalized.name,
      active: normalized.active,
      capacity: normalized.capacity,
    };
    this.bungalows.set(bungalow.id, bungalow);
    this.persistState();
    return bungalow;
  }

  updateBungalow(id: string, input: BungalowUpdateInput): Bungalow {
    this.refreshFromPersistence();
    const current = this.mustGetBungalow(id);
    const normalized = normalizeBungalowInput(input);
    const items = Array.from(this.bungalows.values());
    if (bungalowHasDuplicateCode(items, normalized.code, id)) {
      throw new Error("bungalow_code_taken");
    }

    const bungalow: Bungalow = {
      ...current,
      code: normalized.code,
      name: normalized.name,
      active: normalized.active,
      capacity: normalized.capacity,
    };
    this.bungalows.set(id, bungalow);
    this.persistState();
    return bungalow;
  }

  updateBungalowPublicContent(id: string, input: BungalowPublicContentUpdateInput): BungalowPublicContent {
    this.refreshFromPersistence();
    this.mustGetBungalow(id);

    const nextContent: BungalowPublicContent = {
      bungalowId: id,
      featuredOnHome: input.featuredOnHome,
      sortOrder: input.sortOrder,
      heroImageUrl: input.heroImageUrl,
      galleryUrls: [...input.galleryUrls],
      nightlyRatePen: input.nightlyRatePen,
      areaSqm: input.areaSqm,
      localeContent: structuredClone(input.localeContent),
      updatedAt: isoNow(),
    };

    this.bungalowPublicContents.set(id, nextContent);
    this.persistState();
    return nextContent;
  }

  getAuditTrail(reservationId: string): ReservationAudit[] {
    this.refreshFromPersistence();
    return [...(this.audits.get(reservationId) ?? [])].sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    );
  }

  create(input: ReservationCreateInput): CreateReservationResult {
    this.refreshFromPersistence();
    const reservationId = randomUUID();
    const status = defaultStatus(input.channel);
    const updatedAt = isoNow();
    const nights = nightsForReservation(input.startDate, input.endDate);
    const amountTotalCents = normalizeAmount(input.amountTotalCents ?? nights.length * DEFAULT_NIGHTLY_RATE_CENTS);
    const amountPaidCents = Math.min(normalizeAmount(input.amountPaidCents), amountTotalCents);
    if (input.bungalowId) {
      const bungalow = this.mustGetBungalow(input.bungalowId);
      if (!bungalow.active) {
        throw new Error("bungalow_inactive");
      }
      if (isCapacityBlockingStatus(status)) {
        const snapshot = getInMemoryCapacitySnapshot(input.bungalowId);
        if (!snapshot?.capacity) throw new Error("availability_unavailable");
        const availability = calculateCapacityAvailability({
          capacity: snapshot.capacity,
          reservations: Array.from(this.reservations.values()).map((item) => ({
            id: item.id,
            bungalowId: item.bungalowId,
            checkIn: item.startDate,
            checkOut: item.endDate,
            status: item.status,
          })),
          checkIn: input.startDate,
          checkOut: input.endDate,
          excludeReservationId: reservationId,
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
      sourceRequestId: input.sourceRequestId ?? null,
      responsibleId: input.responsibleId ?? null,
      startDate: input.startDate,
      endDate: input.endDate,
      amountTotalCents,
      amountPaidCents,
      paymentStatus: derivePaymentStatus(amountTotalCents, amountPaidCents),
      currencyCode: DEFAULT_CURRENCY_CODE,
      updatedAt,
    };

    const occupancy: ReservationOccupancy[] = input.bungalowId && isCapacityBlockingStatus(status)
      ? nights.map((date) => ({
          id: randomUUID(),
          reservationId,
          bungalowId: input.bungalowId!,
          bungalowUnitId: null,
          date,
          source: normalizeSource(input.channel),
          status: occupancyStatusForReservation(status),
          createdAt: updatedAt,
        }))
      : [];

    const audit = createReservationAuditEntry({
      reservationId,
      actorId: input.actorId,
      action: "create",
      previousStatus: status,
      nextStatus: status,
      reason: "initial reservation creation",
    });

    this.reservations.set(reservationId, reservation);
    occupancy.forEach((block) => this.occupancies.set(block.id, block));
    this.appendAudit(audit);
    this.persistState();

    return { reservation, occupancy, audit };
  }

  update(reservationId: string, input: ReservationUpdateInput): ReservationDetail {
    this.refreshFromPersistence();
    const reservation = this.mustGetReservation(reservationId);
    const bungalow = this.mustGetBungalow(input.bungalowId);
    if (!bungalow.active) {
      throw new Error("bungalow_inactive");
    }

    const nights = nightsForReservation(input.startDate, input.endDate);
    const amountTotalCents = normalizeAmount(input.amountTotalCents ?? nights.length * DEFAULT_NIGHTLY_RATE_CENTS);
    const amountPaidCents = Math.min(normalizeAmount(input.amountPaidCents), amountTotalCents);
    const shouldOccupy = isCapacityBlockingStatus(reservation.status);

    if (shouldOccupy) {
      const snapshot = getInMemoryCapacitySnapshot(input.bungalowId);
      if (!snapshot?.capacity) throw new Error("availability_unavailable");
      const availability = calculateCapacityAvailability({
        capacity: snapshot.capacity,
        reservations: Array.from(this.reservations.values()).map((item) => ({
          id: item.id,
          bungalowId: item.bungalowId,
          checkIn: item.startDate,
          checkOut: item.endDate,
          status: item.status,
        })),
        checkIn: input.startDate,
        checkOut: input.endDate,
        excludeReservationId: reservationId,
      });
      if (!availability.canAcceptOneMore) throw new Error("bungalow_capacity_unavailable");
    }

    this.releaseReservationOccupancy(reservationId);
    const updatedAt = isoNow();
    const nextReservation: Reservation = {
      ...reservation,
      channel: input.channel,
      bungalowId: input.bungalowId,
      bungalowUnitId: null,
      responsibleId: input.responsibleId === undefined ? reservation.responsibleId : input.responsibleId,
      startDate: input.startDate,
      endDate: input.endDate,
      amountTotalCents,
      amountPaidCents,
      paymentStatus: derivePaymentStatus(amountTotalCents, amountPaidCents),
      updatedAt,
    };

    this.reservations.set(reservationId, nextReservation);
    if (shouldOccupy) {
      this.blockReservationOccupancy(nextReservation, input.bungalowId, occupancyStatusForReservation(nextReservation.status));
    }

    this.appendAudit(
      createReservationAuditEntry({
        reservationId,
        actorId: input.actorId,
        action: "update",
        previousStatus: reservation.status,
        nextStatus: nextReservation.status,
        reason: input.reason,
      }),
    );
    this.persistState();

    const detail = this.get(reservationId);
    if (!detail) {
      throw new Error("reservation_not_found");
    }
    return detail;
  }

  assign(reservationId: string, input: ReservationAssignmentInput): ReservationDetail {
    this.refreshFromPersistence();
    const reservation = this.mustGetReservation(reservationId);
    const bungalow = this.mustGetBungalow(input.bungalowId);
    if (!bungalow.active) {
      throw new Error("bungalow_inactive");
    }
    const nextStatus = nextReservationStatus(reservation.status, "assign");
    const capacitySnapshot = getInMemoryCapacitySnapshot(input.bungalowId);
    if (!capacitySnapshot?.capacity) throw new Error("availability_unavailable");
    const availability = calculateCapacityAvailability({
      capacity: capacitySnapshot.capacity,
      reservations: Array.from(this.reservations.values()).map((item) => ({
        id: item.id,
        bungalowId: item.bungalowId,
        checkIn: item.startDate,
        checkOut: item.endDate,
        status: item.status,
      })),
      checkIn: reservation.startDate,
      checkOut: reservation.endDate,
      excludeReservationId: reservationId,
    });
    if (!availability.canAcceptOneMore) throw new Error("bungalow_capacity_unavailable");

    this.releaseReservationOccupancy(reservationId);
    const updatedAt = isoNow();
    const nextReservation: Reservation = {
      ...reservation,
      bungalowId: input.bungalowId,
      bungalowUnitId: null,
      status: nextStatus,
      updatedAt,
    };

    this.reservations.set(reservationId, nextReservation);
    this.blockReservationOccupancy(nextReservation, input.bungalowId, "confirmed");
    this.appendAudit(
      createReservationAuditEntry({
        reservationId,
        actorId: input.actorId,
        action: "assign",
        previousStatus: reservation.status,
        nextStatus,
        reason: input.reason,
      }),
    );
    this.persistState();

    const detail = this.get(reservationId);
    if (!detail) {
      throw new Error("reservation_not_found");
    }
    return detail;
  }

  transition(reservationId: string, input: ReservationStatusChangeInput): ReservationDetail {
    this.refreshFromPersistence();
    const reservation = this.mustGetReservation(reservationId);
    const nextStatus = nextReservationStatus(reservation.status, input.action);
    if (
      reservation.bungalowId &&
      isCapacityBlockingStatus(nextStatus) &&
      !isCapacityBlockingStatus(reservation.status)
    ) {
      const snapshot = getInMemoryCapacitySnapshot(reservation.bungalowId);
      if (!snapshot?.capacity) throw new Error("availability_unavailable");
      const availability = calculateCapacityAvailability({
        capacity: snapshot.capacity,
        reservations: Array.from(this.reservations.values()).map((item) => ({
          id: item.id,
          bungalowId: item.bungalowId,
          checkIn: item.startDate,
          checkOut: item.endDate,
          status: item.status,
        })),
        checkIn: reservation.startDate,
        checkOut: reservation.endDate,
        excludeReservationId: reservationId,
      });
      if (!availability.canAcceptOneMore) throw new Error("bungalow_capacity_unavailable");
    }
    const updatedAt = isoNow();
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
      updatedAt,
    };

    this.reservations.set(reservationId, nextReservation);
    if (nextStatus === "cancelled" || nextStatus === "no_show") {
      this.releaseReservationOccupancy(reservationId);
    }
    if (nextStatus === "paid") {
      this.markReservationOccupancy(reservationId, "confirmed");
    }
    if (nextStatus === "checked_in") {
      this.markReservationOccupancy(reservationId, "confirmed");
    }

    this.appendAudit(
      createReservationAuditEntry({
        reservationId,
        actorId: input.actorId,
        action: input.action,
        previousStatus: reservation.status,
        nextStatus,
        reason: input.reason,
      }),
    );
    this.persistState();

    const detail = this.get(reservationId);
    if (!detail) {
      throw new Error("reservation_not_found");
    }
    return detail;
  }

  recordPayment(reservationId: string, input: ReservationPaymentInput): ReservationDetail {
    this.refreshFromPersistence();
    const reservation = this.mustGetReservation(reservationId);
    if (reservation.status === "cancelled" || reservation.status === "no_show") {
      throw new Error("invalid_transition");
    }

    const totalCents = normalizeAmount(reservation.amountTotalCents);
    if (totalCents <= 0) {
      throw new Error("invalid_payload");
    }

    const paidBefore = normalizeAmount(reservation.amountPaidCents);
    const paidAfter = Math.min(totalCents, paidBefore + normalizeAmount(input.amountPaidCents));
    const paymentStatus = derivePaymentStatus(totalCents, paidAfter);
    const shouldCloseAsPaid = paymentStatus === "paid" && reservation.status === "checked_out";
    const updatedAt = isoNow();
    const nextReservation: Reservation = {
      ...reservation,
      amountPaidCents: paidAfter,
      paymentStatus,
      status: shouldCloseAsPaid ? "paid" : reservation.status,
      updatedAt,
    };

    this.reservations.set(reservationId, nextReservation);
    this.appendAudit(
      createReservationAuditEntry({
        reservationId,
        actorId: input.actorId,
        action: shouldCloseAsPaid ? "mark_paid" : "register_payment",
        previousStatus: reservation.status,
        nextStatus: nextReservation.status,
        reason: input.reason,
      }),
    );
    this.persistState();

    const detail = this.get(reservationId);
    if (!detail) {
      throw new Error("reservation_not_found");
    }
    return detail;
  }

  private mustGetReservation(id: string): Reservation {
    const reservation = this.reservations.get(id);
    if (!reservation) {
      throw new Error("reservation_not_found");
    }
    return reservation;
  }

  private mustGetBungalow(id: string): Bungalow {
    const bungalow = this.bungalows.get(id);
    if (!bungalow) {
      throw new Error("bungalow_not_found");
    }
    return bungalow;
  }

  private appendAudit(entry: ReservationAudit): void {
    const list = this.audits.get(entry.reservationId) ?? [];
    list.unshift(entry);
    this.audits.set(entry.reservationId, list);
  }

  private releaseReservationOccupancy(reservationId: string): void {
    for (const [id, occupancy] of this.occupancies.entries()) {
      if (occupancy.reservationId !== reservationId) continue;
      this.occupancies.delete(id);
    }
  }

  private markReservationOccupancy(reservationId: string, status: ReservationOccupancy["status"]): void {
    for (const [id, occupancy] of this.occupancies.entries()) {
      if (occupancy.reservationId !== reservationId) continue;
      this.occupancies.set(id, { ...occupancy, status });
    }
  }

  private persistState(): void {
    if (!this.storagePath) return;

    const nextSnapshot = {
      bungalows: Array.from(this.bungalows.values()),
      bungalowPublicContents: Array.from(this.bungalowPublicContents.values()),
      reservations: Array.from(this.reservations.values()),
      occupancies: Array.from(this.occupancies.values()),
      audits: Array.from(this.audits.values()).flat().sort((left, right) =>
        right.createdAt.localeCompare(left.createdAt),
      ),
    };

    MEMORY_SNAPSHOTS.set(this.storagePath, nextSnapshot);
    writePersistedFallbackSnapshot(this.storagePath, { reservations: nextSnapshot });
  }

  private refreshFromPersistence(): void {
    if (!this.storagePath) return;

    const snapshot =
      readPersistedFallbackSnapshot(this.storagePath)?.reservations ??
      MEMORY_SNAPSHOTS.get(this.storagePath);
    if (!snapshot) return;
    MEMORY_SNAPSHOTS.set(this.storagePath, cloneSnapshotValue(snapshot));
    this.bungalows.clear();
    this.bungalowPublicContents.clear();
    this.reservations.clear();
    this.occupancies.clear();
    this.audits.clear();

    snapshot.bungalows.forEach((bungalow) => this.bungalows.set(bungalow.id, bungalow));
    snapshot.bungalowPublicContents.forEach((publicContent) =>
      this.bungalowPublicContents.set(publicContent.bungalowId, publicContent),
    );
    snapshot.reservations.forEach((reservation) => this.reservations.set(reservation.id, reservation));
    snapshot.occupancies.forEach((occupancy) => this.occupancies.set(occupancy.id, occupancy));
    snapshot.audits.forEach((audit) => {
      const list = this.audits.get(audit.reservationId) ?? [];
      list.push(audit);
      this.audits.set(audit.reservationId, list);
    });
  }

  private blockReservationOccupancy(
    reservation: Reservation,
    bungalowId: string,
    blockStatus: ReservationOccupancy["status"],
  ): void {
    const nights = nightsForReservation(reservation.startDate, reservation.endDate);
    const updatedAt = isoNow();
    nights.forEach((date) => {
      const block: ReservationOccupancy = {
        id: randomUUID(),
        reservationId: reservation.id,
        bungalowId,
        bungalowUnitId: reservation.bungalowUnitId ?? null,
        date,
        source: reservation.channel,
        status: blockStatus,
        createdAt: updatedAt,
      };
      this.occupancies.set(block.id, block);
    });
  }
}

function hasOperationalDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

let cachedRuntimeReservationService:
  | { mode: "db" | "fallback"; service: ReservationServiceLike }
  | null = null;

function getRuntimeReservationService(): ReservationServiceLike {
  const mode = hasOperationalDatabaseUrl() ? "db" : "fallback";
  if (cachedRuntimeReservationService?.mode === mode) {
    return cachedRuntimeReservationService.service;
  }

  const service = mode === "db" ? buildReservationService() : createFallbackReservationService();
  registerBookingRequestReconciliation(service);
  cachedRuntimeReservationService = { mode, service };
  return service;
}

function wrapSyncStore(
  store: ReservationStore,
): Omit<
  ReservationServiceLike,
  | "listBookingRequests"
  | "listComplaints"
  | "getComplaint"
  | "getBookingRequest"
  | "getBookingRequestThreadView"
  | "transitionBookingRequest"
  | "updateBookingRequest"
  | "syncBookingRequestThread"
  | "replyToBookingRequestThread"
  | "createComplaint"
  | "createBookingRequest"
  | "confirmBookingRequestTransfer"
  | "listBookingRequestWorkItems"
  | "assignBookingRequestOwner"
  | "recordBookingRequestMessage"
  | "listQuickReplyTemplates"
  | "createQuickReplyTemplate"
  | "updateQuickReplyTemplate"
  | "deactivateQuickReplyTemplate"
  | "listOperationsWorkbenchItems"
  | "getOperationThreadView"
  | "listOtaConnections"
  | "upsertOtaConnection"
  | "listOtaRoomMappings"
  | "upsertOtaRoomMapping"
  | "listOtaRatePlanMappings"
  | "upsertOtaRatePlanMapping"
  | "importOtaReservation"
  | "syncOtaProvider"
  | "getOtaReservationLink"
  | "resyncOtaReservation"
  | "resolveOtaReservationConflict"
> {
  return {
    list: async (filters) => store.list(filters),
    get: async (id) => store.get(id),
    getBungalow: async (id) => store.getBungalow(id),
    getBungalowPublicContent: async (id) => store.getBungalowPublicContent(id),
    listBungalows: async () => store.listBungalows(),
    listBungalowPublicContent: async () => store.listBungalowPublicContent(),
    createBungalow: async (input) => store.createBungalow(input),
    updateBungalow: async (id, input) => store.updateBungalow(id, input),
    updateBungalowPublicContent: async (id, input) => store.updateBungalowPublicContent(id, input),
    getAuditTrail: async (reservationId) => store.getAuditTrail(reservationId),
    create: async (input) => store.create(input),
    update: async (reservationId, input) => store.update(reservationId, input),
    assign: async (reservationId, input) => store.assign(reservationId, input),
    transition: async (reservationId, input) => store.transition(reservationId, input),
    recordPayment: async (reservationId, input) => store.recordPayment(reservationId, input),
  };
}

function createTestFixtureSeed(): SeedData {
  return {
    bungalows: WAKAYA_OPERATIONAL_BUNGALOWS.map((bungalow) => ({ ...bungalow })),
    reservations: [
      {
        id: "reservation-demo-1",
        number: "RESERVATION-2026-0001",
        channel: "web",
        status: "pending_review",
        amountTotalCents: 36000,
        amountPaidCents: 0,
        paymentStatus: "pending",
        bungalowId: "bungalow-suite",
        responsibleId: "user-reception-1",
        startDate: "2026-06-12",
        endDate: "2026-06-14",
        updatedAt: "2026-05-29T00:00:00.000Z",
      },
      {
        id: "reservation-demo-2",
        number: "RESERVATION-2026-0002",
        channel: "ota",
        status: "ota_imported_confirmed",
        amountTotalCents: 24000,
        amountPaidCents: 24000,
        paymentStatus: "paid",
        bungalowId: "bungalow-family",
        responsibleId: "user-reception-2",
        startDate: "2026-06-15",
        endDate: "2026-06-16",
        updatedAt: "2026-05-29T00:00:00.000Z",
      },
      {
        id: "reservation-demo-3",
        number: "RESERVATION-2026-0003",
        channel: "ota",
        status: "checked_in",
        amountTotalCents: 48000,
        amountPaidCents: 12000,
        paymentStatus: "partial",
        bungalowId: "bungalow-matrimonial",
        responsibleId: "user-reception-3",
        startDate: "2026-06-17",
        endDate: "2026-06-19",
        updatedAt: "2026-05-29T00:00:00.000Z",
      },
      {
        id: "reservation-conflict-1",
        number: "RESERVATION-2026-0100",
        channel: "ota",
        status: "confirmed",
        amountTotalCents: 24000,
        amountPaidCents: 24000,
        paymentStatus: "paid",
        bungalowId: "bungalow-family",
        responsibleId: "user-reception-4",
        startDate: "2026-07-11",
        endDate: "2026-07-13",
        updatedAt: "2026-06-30T00:00:00.000Z",
      },
    ],
    occupancies: [
      {
        id: "occupancy-demo-1",
        reservationId: "reservation-demo-1",
        bungalowId: "bungalow-suite",
        date: "2026-06-12",
        source: "web",
        status: "provisional",
        createdAt: "2026-05-29T00:00:00.000Z",
      },
      {
        id: "occupancy-demo-2",
        reservationId: "reservation-demo-1",
        bungalowId: "bungalow-suite",
        date: "2026-06-13",
        source: "web",
        status: "provisional",
        createdAt: "2026-05-29T00:00:00.000Z",
      },
      {
        id: "occupancy-demo-3",
        reservationId: "reservation-demo-1",
        bungalowId: "bungalow-suite",
        date: "2026-06-14",
        source: "web",
        status: "provisional",
        createdAt: "2026-05-29T00:00:00.000Z",
      },
      {
        id: "occupancy-demo-4",
        reservationId: "reservation-demo-2",
        bungalowId: "bungalow-family",
        date: "2026-06-15",
        source: "ota",
        status: "confirmed",
        createdAt: "2026-05-29T00:00:00.000Z",
      },
      {
        id: "occupancy-demo-5",
        reservationId: "reservation-demo-2",
        bungalowId: "bungalow-family",
        date: "2026-06-16",
        source: "ota",
        status: "confirmed",
        createdAt: "2026-05-29T00:00:00.000Z",
      },
      {
        id: "occupancy-demo-6",
        reservationId: "reservation-demo-3",
        bungalowId: "bungalow-matrimonial",
        date: "2026-06-17",
        source: "ota",
        status: "confirmed",
        createdAt: "2026-05-29T00:00:00.000Z",
      },
      {
        id: "occupancy-demo-7",
        reservationId: "reservation-demo-3",
        bungalowId: "bungalow-matrimonial",
        date: "2026-06-18",
        source: "ota",
        status: "confirmed",
        createdAt: "2026-05-29T00:00:00.000Z",
      },
      {
        id: "occupancy-demo-8",
        reservationId: "reservation-demo-3",
        bungalowId: "bungalow-matrimonial",
        date: "2026-06-19",
        source: "ota",
        status: "confirmed",
        createdAt: "2026-05-29T00:00:00.000Z",
      },
      {
        id: "occupancy-conflict-1",
        reservationId: "reservation-conflict-1",
        bungalowId: "bungalow-family",
        date: "2026-07-11",
        source: "ota",
        status: "confirmed",
        createdAt: "2026-06-30T00:00:00.000Z",
      },
      {
        id: "occupancy-conflict-2",
        reservationId: "reservation-conflict-1",
        bungalowId: "bungalow-family",
        date: "2026-07-12",
        source: "ota",
        status: "confirmed",
        createdAt: "2026-06-30T00:00:00.000Z",
      },
      {
        id: "occupancy-conflict-3",
        reservationId: "reservation-conflict-1",
        bungalowId: "bungalow-family",
        date: "2026-07-13",
        source: "ota",
        status: "confirmed",
        createdAt: "2026-06-30T00:00:00.000Z",
      },
    ],
    audits: [
      {
        id: "audit-demo-1",
        reservationId: "reservation-demo-1",
        actorId: "system",
        action: "create",
        previousStatus: "pending_review",
        nextStatus: "pending_review",
        reason: "initial reservation creation",
        createdAt: "2026-05-29T00:00:00.000Z",
      },
      {
        id: "audit-demo-2",
        reservationId: "reservation-demo-2",
        actorId: "system",
        action: "create",
        previousStatus: "ota_imported_confirmed",
        nextStatus: "ota_imported_confirmed",
        reason: "initial reservation creation",
        createdAt: "2026-05-29T00:00:00.000Z",
      },
      {
        id: "audit-demo-3",
        reservationId: "reservation-demo-3",
        actorId: "system",
        action: "check_in",
        previousStatus: "assigned",
        nextStatus: "checked_in",
        reason: "guest checked in",
        createdAt: "2026-05-29T00:00:00.000Z",
      },
      {
        id: "audit-conflict-1",
        reservationId: "reservation-conflict-1",
        actorId: "system",
        action: "confirm",
        previousStatus: "confirmed",
        nextStatus: "confirmed",
        reason: "ota import",
        createdAt: "2026-06-30T00:00:00.000Z",
      },
    ],
  };
}

function createTestBookingRequests(): BookingRequest[] {
  return [
    {
      id: "request-1",
      publicRef: "WR-2026-0001",
      status: "proof_received",
      guestName: "Ada Lovelace",
      guestEmail: "ada@example.com",
      guestPhone: "+51987654321",
      requestedCheckIn: "2026-07-10",
      requestedCheckOut: "2026-07-12",
      requestedGuests: 2,
      requestedBungalowType: null,
      sourceChannel: "web_public",
      threadId: "thread-request-1",
      threadKey: "booking-request:WR-2026-0001",
      ownerUserId: "user-reception-1",
      ownerAssignedAt: "2026-07-01T09:10:00.000Z",
      notes: null,
      lastMessageAt: "2026-07-01T10:00:00.000Z",
      syncStatus: "pending",
      createdAt: "2026-07-01T09:00:00.000Z",
      updatedAt: "2026-07-01T10:00:00.000Z",
    },
    {
      id: "request-conflict",
      publicRef: "WR-2026-0002",
      status: "proof_received",
      guestName: "Grace Hopper",
      guestEmail: "grace@example.com",
      guestPhone: "+51999999999",
      requestedCheckIn: "2026-07-11",
      requestedCheckOut: "2026-07-12",
      requestedGuests: 2,
      requestedBungalowType: "bungalow-family",
      sourceChannel: "web_public",
      threadId: "thread-request-conflict",
      threadKey: "booking-request:WR-2026-0002",
      ownerUserId: null,
      ownerAssignedAt: null,
      notes: null,
      lastMessageAt: "2026-07-01T11:00:00.000Z",
      syncStatus: "pending",
      createdAt: "2026-07-01T10:30:00.000Z",
      updatedAt: "2026-07-01T11:00:00.000Z",
    },
  ];
}

function createTestThreads(): MessageThread[] {
  return [
    {
      id: "thread-request-1",
      mailboxAddress: "reservas@wakayaecolodge.com",
      provider: "zoho_mail",
      providerThreadId: "zoho-thread-1",
      subject: buildInitialBookingRequestSubject("WR-2026-0001"),
      threadKey: "booking-request:WR-2026-0001",
      linkedEntityType: "booking_request",
      linkedEntityId: "request-1",
      lastSyncedAt: null,
      syncStatus: "pending",
      createdAt: "2026-07-01T09:00:00.000Z",
      updatedAt: "2026-07-01T09:00:00.000Z",
    },
    {
      id: "thread-request-conflict",
      mailboxAddress: "reservas@wakayaecolodge.com",
      provider: "zoho_mail",
      providerThreadId: "zoho-thread-conflict",
      subject: buildInitialBookingRequestSubject("WR-2026-0002"),
      threadKey: "booking-request:WR-2026-0002",
      linkedEntityType: "booking_request",
      linkedEntityId: "request-conflict",
      lastSyncedAt: null,
      syncStatus: "pending",
      createdAt: "2026-07-01T10:30:00.000Z",
      updatedAt: "2026-07-01T10:30:00.000Z",
    },
  ];
}

function createTestMessages(): MessageItem[] {
  return [
    {
      id: "message-request-1-seed",
      threadId: "thread-request-1",
      direction: "outbound",
      origin: "system_outbound",
      providerMessageId: "zoho-seed-1",
      fromAddress: "reservas@wakayaecolodge.com",
      toAddresses: ["ada@example.com"],
      ccAddresses: [],
      subject: buildInitialBookingRequestSubject("WR-2026-0001"),
      bodyText: "Recibimos tu solicitud y el equipo de reservas ya la está revisando.",
      bodyHtml: null,
      sentAt: "2026-07-01T09:05:00.000Z",
      receivedAt: null,
      ingestedAt: "2026-07-01T09:05:00.000Z",
      createdByUserId: null,
      attachments: [],
    },
  ];
}

function createTestQuickReplyTemplates(): QuickReplyTemplate[] {
  return [
    {
      id: "reply-template-proof-followup",
      key: "proof_followup",
      label: "Seguimiento de comprobante",
      category: "Cobranza",
      subjectMode: "keep_thread_subject",
      bodyText:
        "Hola {{guestName}}, recibimos tu solicitud {{publicRef}}. Cuando tengas el comprobante, respóndelo por este mismo hilo para validar las fechas {{checkIn}} → {{checkOut}}.",
      isActive: true,
      sortOrder: 10,
      updatedByUserId: "user-admin-1",
      updatedAt: "2026-07-01T08:30:00.000Z",
    },
    {
      id: "reply-template-reschedule",
      key: "reschedule_offer",
      label: "Propuesta de reprogramación",
      category: "Conflictos",
      subjectMode: "keep_thread_subject",
      bodyText:
        "Hola {{guestName}}, detectamos un cruce operativo para {{requestedBungalowType}}. Podemos ayudarte a mover la solicitud {{publicRef}} a nuevas fechas sin perder el seguimiento.",
      isActive: true,
      sortOrder: 20,
      updatedByUserId: "user-admin-1",
      updatedAt: "2026-07-01T08:35:00.000Z",
    },
  ];
}

function shouldBootstrapFallbackDemoData(): boolean {
  return process.env.NODE_ENV === "test" || process.env.WAKAYA_BOOTSTRAP_FALLBACK_DATA?.trim() === "true";
}

function createOperationalFallbackSeed(): SeedData {
  return {
    bungalows: WAKAYA_OPERATIONAL_BUNGALOWS.map((bungalow) => ({ ...bungalow })),
    reservations: [],
    occupancies: [],
    audits: [],
  };
}

export function createFallbackReservationService(): ReservationServiceLike {
  const shouldSeedDemoData = shouldBootstrapFallbackDemoData();
  const complaintSeeds: ComplaintCase[] = [];
  const bookingRequestSeeds: BookingRequest[] = shouldSeedDemoData ? createTestBookingRequests() : [];
  const threadSeeds: MessageThread[] = shouldSeedDemoData ? createTestThreads() : [];
  const messageSeeds: MessageItem[] = shouldSeedDemoData ? createTestMessages() : [];
  const conflictSeeds: AvailabilityConflict[] = [];
  const quickReplyTemplateSeeds: QuickReplyTemplate[] =
    shouldSeedDemoData ? createTestQuickReplyTemplates() : [];
  const storagePath = resolveFallbackStoragePath();
  const sharedSnapshotKey =
    storagePath || (process.env.NODE_ENV === "test" ? null : "__wakaya_booking_requests_fallback__");
  const sharedRequestSnapshot: PersistedFallbackRequestSnapshot | null = sharedSnapshotKey
    ? FALLBACK_REQUEST_SNAPSHOTS.get(sharedSnapshotKey) ??
      (() => {
        const diskSnapshot = storagePath
          ? readPersistedFallbackSnapshot(storagePath)?.bookingRequests
          : null;
        const snapshot = normalizeFallbackRequestSnapshot(diskSnapshot, {
          complaints: complaintSeeds,
          bookingRequests: bookingRequestSeeds,
          threads: threadSeeds,
          messages: messageSeeds,
          conflicts: conflictSeeds,
          quickReplyTemplates: quickReplyTemplateSeeds,
          otaConnections: [],
          otaRoomMappings: [],
          otaRatePlanMappings: [],
          otaLinks: [],
        });
        FALLBACK_REQUEST_SNAPSHOTS.set(sharedSnapshotKey, snapshot);
        return snapshot;
      })()
    : null;
  const bookingRequests = sharedRequestSnapshot?.bookingRequests ?? bookingRequestSeeds;
  const complaints = sharedRequestSnapshot?.complaints ?? complaintSeeds;
  const threads = sharedRequestSnapshot?.threads ?? threadSeeds;
  const messages = sharedRequestSnapshot?.messages ?? messageSeeds;
  const conflicts = sharedRequestSnapshot?.conflicts ?? conflictSeeds;
  const quickReplyTemplates = sharedRequestSnapshot?.quickReplyTemplates ?? quickReplyTemplateSeeds;
  const otaConnections: OtaConnection[] = sharedRequestSnapshot?.otaConnections ?? [];
  const otaRoomMappings: OtaRoomMapping[] = sharedRequestSnapshot?.otaRoomMappings ?? [];
  const otaRatePlanMappings: OtaRatePlanMapping[] = sharedRequestSnapshot?.otaRatePlanMappings ?? [];
  const otaLinks: OtaReservationLink[] = sharedRequestSnapshot?.otaLinks ?? [];
  const seed = shouldSeedDemoData ? createTestFixtureSeed() : createOperationalFallbackSeed();

  const store = new ReservationStore({
    storagePath: storagePath ?? undefined,
    ...seed,
  });

  function persistRequestSnapshot() {
    if (!sharedSnapshotKey) return;

    const nextSnapshot = {
      complaints: cloneSnapshotValue(complaints),
      bookingRequests: cloneSnapshotValue(bookingRequests),
      threads: cloneSnapshotValue(threads),
      messages: cloneSnapshotValue(messages),
      conflicts: cloneSnapshotValue(conflicts),
      quickReplyTemplates: cloneSnapshotValue(quickReplyTemplates),
      otaConnections: cloneSnapshotValue(otaConnections),
      otaRoomMappings: cloneSnapshotValue(otaRoomMappings),
      otaRatePlanMappings: cloneSnapshotValue(otaRatePlanMappings),
      otaLinks: cloneSnapshotValue(otaLinks),
    };

    FALLBACK_REQUEST_SNAPSHOTS.set(sharedSnapshotKey, nextSnapshot);
    if (storagePath) {
      writePersistedFallbackSnapshot(storagePath, { bookingRequests: nextSnapshot });
    }
  }

  function refreshRequestSnapshot() {
    if (!sharedSnapshotKey) return;

    const latestSnapshot =
      (storagePath ? readPersistedFallbackSnapshot(storagePath)?.bookingRequests : null) ??
      FALLBACK_REQUEST_SNAPSHOTS.get(sharedSnapshotKey);
    if (!latestSnapshot) return;

    const normalizedSnapshot = normalizeFallbackRequestSnapshot(latestSnapshot, {
      complaints,
      bookingRequests,
      threads,
      messages,
      conflicts,
      quickReplyTemplates,
      otaConnections,
      otaRoomMappings,
      otaRatePlanMappings,
      otaLinks,
    });

    FALLBACK_REQUEST_SNAPSHOTS.set(sharedSnapshotKey, cloneSnapshotValue(normalizedSnapshot));
    complaints.splice(0, complaints.length, ...cloneSnapshotValue(normalizedSnapshot.complaints));
    bookingRequests.splice(0, bookingRequests.length, ...cloneSnapshotValue(normalizedSnapshot.bookingRequests));
    threads.splice(0, threads.length, ...cloneSnapshotValue(normalizedSnapshot.threads));
    messages.splice(0, messages.length, ...cloneSnapshotValue(normalizedSnapshot.messages));
    conflicts.splice(0, conflicts.length, ...cloneSnapshotValue(normalizedSnapshot.conflicts));
    quickReplyTemplates.splice(
      0,
      quickReplyTemplates.length,
      ...cloneSnapshotValue(normalizedSnapshot.quickReplyTemplates),
    );
    otaConnections.splice(0, otaConnections.length, ...cloneSnapshotValue(normalizedSnapshot.otaConnections));
    otaRoomMappings.splice(0, otaRoomMappings.length, ...cloneSnapshotValue(normalizedSnapshot.otaRoomMappings));
    otaRatePlanMappings.splice(
      0,
      otaRatePlanMappings.length,
      ...cloneSnapshotValue(normalizedSnapshot.otaRatePlanMappings),
    );
    otaLinks.splice(0, otaLinks.length, ...cloneSnapshotValue(normalizedSnapshot.otaLinks));
  }

  function getThreadByRequestId(requestId: string): MessageThread | null {
    refreshRequestSnapshot();
    return threads.find((item) => item.linkedEntityId === requestId) ?? null;
  }

  function getConflictsForRequest(requestId: string): AvailabilityConflict[] {
    refreshRequestSnapshot();
    return conflicts
      .filter((item) => item.requestId === requestId && item.status === "open")
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  function getConflictsForReservation(reservationId: string): AvailabilityConflict[] {
    refreshRequestSnapshot();
    return conflicts
      .filter((item) => item.reservationId === reservationId && item.status === "open")
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  function getThreadByReservationId(reservationId: string): MessageThread | null {
    refreshRequestSnapshot();
    return threads.find((item) => item.linkedEntityType === "reservation" && item.linkedEntityId === reservationId) ?? null;
  }

  function createSyntheticProviderMessageId(prefix: string, requestId: string) {
    return `${prefix}:${requestId}:${randomUUID()}`;
  }

  function buildSystemMessage(
    bookingRequest: BookingRequest,
    thread: MessageThread,
    input: Omit<BookingRequestMessageInput, "providerMessageId"> & { providerMessageId?: string | null },
  ): MessageItem {
    const activityAt = input.sentAt ?? input.receivedAt ?? isoNow();
    return {
      id: randomUUID(),
      threadId: thread.id,
      direction: input.direction,
      origin: input.origin,
      providerMessageId: input.providerMessageId ?? createSyntheticProviderMessageId(input.origin, bookingRequest.id),
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

  function buildThreadView(bookingRequest: BookingRequest): BookingRequestThreadView {
    refreshRequestSnapshot();
    const thread = getThreadByRequestId(bookingRequest.id);
    const threadMessages = thread
      ? messages
          .filter((item) => item.threadId === thread.id)
          .sort((left, right) =>
            (right.receivedAt ?? right.sentAt ?? right.ingestedAt).localeCompare(
              left.receivedAt ?? left.sentAt ?? left.ingestedAt,
            ),
          )
      : [];
    const attachments = threadMessages.flatMap((item) => item.attachments);

    return {
      bookingRequest,
      thread,
      messages: threadMessages,
      attachments,
      conflicts: getConflictsForRequest(bookingRequest.id),
      workItem: buildBookingRequestWorkItem({
        bookingRequest,
        messages: threadMessages,
        conflicts: getConflictsForRequest(bookingRequest.id),
        ownerName: bookingRequest.ownerUserId,
      }),
    };
  }

  function buildOperationThreadView(id: string): OperationThreadView | null {
    refreshRequestSnapshot();
    const bookingRequest = bookingRequests.find((item) => item.id === id) ?? null;
    if (bookingRequest) {
      const detail = buildThreadView(bookingRequest);
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

    const reservation = store.get(id);
    if (!reservation || reservation.channel !== "ota") {
      return null;
    }

    const thread = getThreadByReservationId(reservation.id);
    const threadMessages = thread
      ? messages
          .filter((item) => item.threadId === thread.id)
          .sort((left, right) =>
            (right.receivedAt ?? right.sentAt ?? right.ingestedAt).localeCompare(
              left.receivedAt ?? left.sentAt ?? left.ingestedAt,
            ),
          )
      : [];
    const reservationConflicts = getConflictsForReservation(reservation.id);
    const otaLink = otaLinks.find((item) => item.reservationId === reservation.id) ?? null;

    return {
      kind: "reservation",
      bookingRequest: null,
      reservation,
      thread,
      messages: threadMessages,
      attachments: threadMessages.flatMap((item) => item.attachments),
      conflicts: reservationConflicts,
      workItem: buildReservationOperationsItem({
        reservation,
        messages: threadMessages,
        conflicts: reservationConflicts,
        syncHealth: reservationConflicts.length > 0 ? "degraded" : otaLink ? "synced" : "pending",
        ownerName: reservation.responsibleId,
      }),
      otaLink,
      availableConversationProviders: thread?.provider ? [thread.provider] : [],
    };
  }

  function listOperationalReservationsForRequestConflict(sourceRequestId?: string) {
    return store
      .list()
      .filter((item) => item.status !== "cancelled" && item.status !== "no_show" && item.status !== "pending_review")
      .filter((item) => item.sourceRequestId !== sourceRequestId)
      .map((item) => ({
        reservationId: item.id,
        reservationNumber: item.number,
        bungalowId: item.bungalowId,
        channel: item.channel,
        status: item.status,
        paymentStatus: item.paymentStatus ?? null,
        sourceRequestId: item.sourceRequestId ?? null,
        startDate: item.startDate,
        endDate: item.endDate,
      }));
  }

  function resolveOpenConflictsForRequest(requestId: string, keepReservationIds: Set<string>, actorId: string) {
    const now = isoNow();
    conflicts.forEach((conflict) => {
      if (conflict.requestId !== requestId || conflict.status !== "open") {
        return;
      }
      if (conflict.reservationId && keepReservationIds.has(conflict.reservationId)) {
        return;
      }
      conflict.status = "resolved";
      conflict.resolvedAt = now;
      conflict.resolvedBy = actorId;
    });
  }

  function resolveOpenConflictsForReservation(
    reservationId: string,
    keepRequestIds: Set<string>,
    actorId: string,
  ) {
    const now = isoNow();
    conflicts.forEach((conflict) => {
      if (conflict.reservationId !== reservationId || conflict.status !== "open") {
        return;
      }
      if (conflict.requestId && keepRequestIds.has(conflict.requestId)) {
        return;
      }
      conflict.status = "resolved";
      conflict.resolvedAt = now;
      conflict.resolvedBy = actorId;
    });
  }

  function upsertOpenConflict(input: {
    requestId: string;
    reservationId: string;
    actorId: string;
    title: string;
    detail: string;
    overlappingReservationIds: string[];
  }) {
    const existing = conflicts.find(
      (conflict) =>
        conflict.requestId === input.requestId &&
        conflict.reservationId === input.reservationId &&
        conflict.status === "open",
    );

    if (existing) {
      existing.notes = input.detail;
      existing.createdBy = existing.createdBy ?? input.actorId;
      existing.metadata = {
        ...(existing.metadata ?? {}),
        title: input.title,
        overlappingReservationIds: input.overlappingReservationIds,
      };
      return existing;
    }

    const conflict: AvailabilityConflict = {
      id: randomUUID(),
      status: "open",
      conflictType: "date_overlap",
      requestId: input.requestId,
      reservationId: input.reservationId,
      notes: input.detail,
      createdBy: input.actorId,
      resolvedBy: null,
      createdAt: isoNow(),
      resolvedAt: null,
      metadata: {
        title: input.title,
        overlappingReservationIds: input.overlappingReservationIds,
      },
    };
    conflicts.unshift(conflict);
    return conflict;
  }

  function reconcileBookingRequestConflicts(bookingRequest: BookingRequest, actorId: string) {
    const conflictResult = detectRequestConflicts(
      {
        requestedCheckIn: bookingRequest.requestedCheckIn,
        requestedCheckOut: bookingRequest.requestedCheckOut,
        requestedBungalowType: bookingRequest.requestedBungalowType,
      },
      listOperationalReservationsForRequestConflict(bookingRequest.id),
    );

    const keepReservationIds = new Set(conflictResult.overlappingReservationIds);
    resolveOpenConflictsForRequest(bookingRequest.id, keepReservationIds, actorId);

    conflictResult.matches.forEach((match) => {
      upsertOpenConflict({
        requestId: bookingRequest.id,
        reservationId: match.reservationId,
        actorId,
        title: match.policy.title,
        detail: match.policy.detail,
        overlappingReservationIds: conflictResult.overlappingReservationIds,
      });
    });

    return conflictResult;
  }

  function listOpenBookingRequestsForReservation() {
    return bookingRequests.filter(
      (item) => item.status !== "converted_to_reservation" && item.status !== "cancelled",
    );
  }

  function reconcileReservationConflictsAgainstOpenRequests(reservation: Reservation, actorId: string) {
    const keepRequestIds = new Set<string>();

    if (reservation.bungalowId) {
      const reservations = [
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
      ];

      listOpenBookingRequestsForReservation()
        .filter((request) => request.id !== reservation.sourceRequestId)
        .forEach((request) => {
          const result = detectRequestConflicts(
            {
              requestedCheckIn: request.requestedCheckIn,
              requestedCheckOut: request.requestedCheckOut,
              requestedBungalowType: request.requestedBungalowType,
            },
            reservations,
          );
          if (!result.hasConflict) {
            return;
          }

          keepRequestIds.add(request.id);
          const match = result.matches[0];
          if (!match) {
            return;
          }
          upsertOpenConflict({
            requestId: request.id,
            reservationId: reservation.id,
            actorId,
            title: match.policy.title,
            detail: match.policy.detail,
            overlappingReservationIds: result.overlappingReservationIds,
          });
        });
    }

    resolveOpenConflictsForReservation(reservation.id, keepRequestIds, actorId);
  }

  function syncLinkedBookingRequestFromReservation(
    reservation: Reservation,
    actorId: string,
    reason: string,
  ): BookingRequest | null {
    const requestId = reservation.sourceRequestId;
    if (!requestId) {
      return null;
    }

    const bookingRequest = bookingRequests.find((item) => item.id === requestId) ?? null;
    if (!bookingRequest || bookingRequest.status === "cancelled" || bookingRequest.status === "converted_to_reservation") {
      return bookingRequest;
    }

    bookingRequest.requestedCheckIn = reservation.startDate;
    bookingRequest.requestedCheckOut = reservation.endDate;
    bookingRequest.requestedBungalowType = reservation.bungalowId;
    bookingRequest.notes = bookingRequest.notes ?? reason;
    bookingRequest.updatedAt = isoNow();
    reconcileBookingRequestConflicts(bookingRequest, actorId);
    return bookingRequest;
  }

  return {
    ...wrapSyncStore(store),
    listComplaints: async () => {
      refreshRequestSnapshot();
      return [...complaints].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    },
    getComplaint: async (id: string) => {
      refreshRequestSnapshot();
      return complaints.find((item) => item.id === id) ?? null;
    },
    listBookingRequests: async () => {
      refreshRequestSnapshot();
      return [...bookingRequests].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    },
    listOperationsWorkbenchItems: async (filters) => {
      refreshRequestSnapshot();
      const bookingItems = bookingRequests.map((bookingRequest) => {
        const detail = buildThreadView(bookingRequest);
        return buildBookingRequestOperationsItem({
          bookingRequest,
          messages: detail.messages,
          conflicts: detail.conflicts,
          ownerName: detail.workItem.ownerName,
        });
      });
      const otaItems = store
        .list({ channel: "ota" })
        .map((reservation) =>
          buildReservationOperationsItem({
            reservation,
            messages: [],
            conflicts: getConflictsForReservation(reservation.id),
            syncHealth: "pending",
            ownerName: reservation.responsibleId,
          }),
        );

      return [...bookingItems, ...otaItems]
        .filter((item) => (filters?.lane ? item.lane === filters.lane : true))
        .filter((item) => (filters?.ownerUserId ? item.ownerUserId === filters.ownerUserId : true))
        .filter((item) => {
          const query = filters?.query?.trim().toLowerCase();
          if (!query) return true;
          return [item.displayRef, item.guestName, item.guestEmail, item.lastSnippet ?? ""].some((value) =>
            value.toLowerCase().includes(query),
          );
        })
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    },
    getOperationThreadView: async (id: string) => {
      refreshRequestSnapshot();
      return buildOperationThreadView(id);
    },
    listBookingRequestWorkItems: async (filters) => {
      refreshRequestSnapshot();
      return bookingRequests
        .map((item) => buildThreadView(item).workItem)
        .filter((item) => (filters?.lane ? item.lane === filters.lane : true))
        .filter((item) => (filters?.ownerUserId ? item.ownerUserId === filters.ownerUserId : true))
        .filter((item) => {
          const query = filters?.query?.trim().toLowerCase();
          if (!query) return true;
          return [item.publicRef, item.guestName, item.guestEmail, item.lastSnippet ?? ""].some((value) =>
            value.toLowerCase().includes(query),
          );
        })
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    },
    getBookingRequest: async (id: string) => {
      refreshRequestSnapshot();
      return bookingRequests.find((item) => item.id === id) ?? null;
    },
    getBookingRequestThreadView: async (id: string) => {
      refreshRequestSnapshot();
      const bookingRequest = bookingRequests.find((item) => item.id === id) ?? null;
      return bookingRequest ? buildThreadView(bookingRequest) : null;
    },
    updateBookingRequest: async (
      id: string,
      input: BookingRequestUpdateInput,
    ): Promise<UpdateBookingRequestResult> => {
      refreshRequestSnapshot();
      const bookingRequest = bookingRequests.find((item) => item.id === id);
      if (!bookingRequest) {
        throw new Error("booking_request_not_found");
      }
      if (bookingRequest.status === "cancelled" || bookingRequest.status === "converted_to_reservation") {
        throw new Error("invalid_transition");
      }

      bookingRequest.requestedCheckIn = input.requestedCheckIn;
      bookingRequest.requestedCheckOut = input.requestedCheckOut;
      bookingRequest.requestedBungalowType = input.requestedBungalowType ?? null;
      bookingRequest.requestedExperienceId = input.requestedExperienceId ?? bookingRequest.requestedExperienceId ?? null;
      bookingRequest.notes = input.notes ?? bookingRequest.notes;
      bookingRequest.updatedAt = isoNow();
      reconcileBookingRequestConflicts(bookingRequest, input.actorId);
      persistRequestSnapshot();
      return buildThreadView(bookingRequest);
    },
    transitionBookingRequest: async (
      id: string,
      input: BookingRequestStatusTransitionInput,
    ): Promise<BookingRequest> => {
      refreshRequestSnapshot();
      const bookingRequest = bookingRequests.find((item) => item.id === id);
      if (!bookingRequest) {
        throw new Error("booking_request_not_found");
      }

      bookingRequest.status = nextBookingRequestStatus(bookingRequest.status, input.action);
      bookingRequest.updatedAt = isoNow();
      persistRequestSnapshot();
      return bookingRequest;
    },
    createComplaint: async (input: ComplaintCreateInput): Promise<CreateComplaintResult> => {
      refreshRequestSnapshot();
      const now = isoNow();
      const complaint: ComplaintCase = {
        id: randomUUID(),
        publicCode: nextComplaintPublicCode(complaints),
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
      complaints.push(complaint);
      persistRequestSnapshot();
      return { complaint };
    },
    createBookingRequest: async (input: BookingRequestCreateInput): Promise<CreateBookingRequestResult> => {
      refreshRequestSnapshot();
      const now = isoNow();
      const nextPublicRef = nextBookingRequestPublicRef([
        ...bookingRequests.map((item) => ({ publicRef: item.publicRef })),
        ...threads.map((item) => ({ publicRef: item.threadKey })),
      ]);
      const threadId = randomUUID();
      const threadKey = `booking-request:${nextPublicRef}`;
      const bookingRequest: BookingRequest = {
        id: randomUUID(),
        publicRef: nextPublicRef,
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
      bookingRequests.push(bookingRequest);
      threads.push({
        id: threadId,
        mailboxAddress: "reservas@wakayaecolodge.com",
        provider: "zoho_mail",
        providerThreadId: null,
        subject: buildInitialBookingRequestSubject(bookingRequest.publicRef),
        threadKey,
        linkedEntityType: "booking_request",
        linkedEntityId: bookingRequest.id,
        lastSyncedAt: null,
        syncStatus: "pending",
        createdAt: now,
        updatedAt: now,
      });
      persistRequestSnapshot();
      return { bookingRequest };
    },
    recordBookingRequestMessage: async (
      id: string,
      input: BookingRequestMessageInput,
    ): Promise<RecordBookingRequestMessageResult> => {
      refreshRequestSnapshot();
      const bookingRequest = bookingRequests.find((item) => item.id === id);
      if (!bookingRequest) {
        throw new Error("booking_request_not_found");
      }

      const thread = getThreadByRequestId(bookingRequest.id);
      if (!thread) {
        throw new Error("booking_request_not_found");
      }

      const message = buildSystemMessage(bookingRequest, thread, input);
      messages.push(message);

      if (input.providerThreadId) {
        thread.providerThreadId = input.providerThreadId;
      }
      if (input.subject.trim()) {
        thread.subject = input.subject;
      }
      thread.updatedAt = isoNow();
      bookingRequest.lastMessageAt = messageActivityAt(message);
      bookingRequest.syncStatus = input.origin === "system_outbound" ? "pending" : bookingRequest.syncStatus;
      bookingRequest.updatedAt = isoNow();
      persistRequestSnapshot();

      const detail = buildThreadView(bookingRequest);
      return { ...detail, message };
    },
    assignBookingRequestOwner: async (id: string, input: BookingRequestOwnerAssignmentInput) => {
      refreshRequestSnapshot();
      const bookingRequest = bookingRequests.find((item) => item.id === id);
      if (!bookingRequest) {
        throw new Error("booking_request_not_found");
      }

      const thread = getThreadByRequestId(bookingRequest.id);
      if (!thread) {
        throw new Error("booking_request_not_found");
      }

      bookingRequest.ownerUserId = input.ownerUserId;
      bookingRequest.ownerAssignedAt = isoNow();
      bookingRequest.updatedAt = bookingRequest.ownerAssignedAt;
      messages.push(
        buildSystemMessage(bookingRequest, thread, {
          direction: "outbound",
          origin: "system_outbound",
          fromAddress: RESERVATIONS_MAILBOX_ADDRESS,
          toAddresses: [],
          subject: thread.subject ?? `Solicitud ${bookingRequest.publicRef}`,
          bodyText: input.ownerUserId
            ? `Usuario asignado: ${input.ownerName ?? input.ownerUserId}.`
            : `Ownership liberado por ${input.actorId}.`,
          createdByUserId: input.actorId,
          sentAt: bookingRequest.ownerAssignedAt,
        }),
      );
      persistRequestSnapshot();
      return buildThreadView(bookingRequest);
    },
    syncBookingRequestThread: async (id: string): Promise<SyncBookingRequestThreadResult> => {
      refreshRequestSnapshot();
      const bookingRequest = bookingRequests.find((item) => item.id === id);
      if (!bookingRequest) {
        throw new Error("booking_request_not_found");
      }

      const thread = getThreadByRequestId(bookingRequest.id);
      if (!thread) {
        throw new Error("booking_request_not_found");
      }

      const providerThreadId =
        thread.providerThreadId ??
        (await searchThreadIdByBookingRequest({
          publicRef: bookingRequest.publicRef,
        }));
      if (!providerThreadId) {
        return buildThreadView(bookingRequest);
      }

      const providerMessages = await listThreadMessages(providerThreadId);
      const normalizedMessages = dedupeProviderMessages(providerMessages);
      const now = isoNow();

      normalizedMessages.forEach((providerMessage) => {
        const existingMessage = messages.find((item) => item.providerMessageId === providerMessage.providerMessageId);
        const messageId = existingMessage?.id ?? randomUUID();
        const nextAttachments: MessageAttachment[] = providerMessage.attachments.map((attachment) => ({
          id: existingMessage?.attachments.find(
            (item) =>
              item.providerAttachmentId === attachment.providerAttachmentId ||
              item.fileHash ===
                hashAttachmentContent({
                  providerAttachmentId: attachment.providerAttachmentId,
                  fileName: attachment.fileName,
                  contentBase64: attachment.contentBase64,
                }),
          )?.id ?? randomUUID(),
          messageId,
          providerAttachmentId: attachment.providerAttachmentId,
          fileName: attachment.fileName,
          contentType: attachment.contentType,
          fileSizeBytes: attachment.fileSizeBytes,
          storageKey: `${thread.threadKey}/${providerMessage.providerMessageId}/${attachment.fileName}`,
          fileHash: hashAttachmentContent({
            providerAttachmentId: attachment.providerAttachmentId,
            fileName: attachment.fileName,
            contentBase64: attachment.contentBase64,
          }),
          isSupported: isSupportedAttachment(attachment.contentType, attachment.fileName),
          contentBase64: attachment.contentBase64,
          createdAt: now,
        }));

        const nextMessage: MessageItem = {
          id: messageId,
          threadId: thread.id,
          ...inferSyncedMessageIdentity({
            bookingRequest,
            fromAddress: providerMessage.fromAddress,
            existingOrigin: existingMessage?.origin ?? null,
            existingCreatedByUserId: existingMessage?.createdByUserId ?? null,
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
          ingestedAt: now,
          createdByUserId: existingMessage?.createdByUserId ?? null,
          attachments: nextAttachments,
        };

        const index = messages.findIndex((item) => item.providerMessageId === providerMessage.providerMessageId);
        if (index >= 0) {
          messages[index] = nextMessage;
        } else {
          messages.push(nextMessage);
        }
      });

      thread.providerThreadId = normalizedMessages[0]?.providerThreadId ?? providerThreadId;
      thread.lastSyncedAt = now;
      thread.syncStatus = normalizedMessages.length > 0 ? "synced" : "pending";
      thread.updatedAt = now;
      bookingRequest.syncStatus = thread.syncStatus;
      bookingRequest.lastMessageAt =
        normalizedMessages[0]?.receivedAt ?? normalizedMessages[0]?.sentAt ?? bookingRequest.lastMessageAt;
      bookingRequest.updatedAt = now;
      persistRequestSnapshot();

      return buildThreadView(bookingRequest);
    },
    replyToBookingRequestThread: async (
      id: string,
      input: BookingRequestReplyInput,
    ): Promise<BookingRequestReplyResult> => {
      refreshRequestSnapshot();
      const bookingRequest = bookingRequests.find((item) => item.id === id);
      if (!bookingRequest) {
        throw new Error("booking_request_not_found");
      }

      const thread = getThreadByRequestId(bookingRequest.id);
      if (!thread) {
        throw new Error("booking_request_not_found");
      }

      let parentMessage =
        messages
          .filter((item) => item.threadId === thread.id)
          .sort((left, right) =>
            (right.receivedAt ?? right.sentAt ?? right.ingestedAt).localeCompare(
              left.receivedAt ?? left.sentAt ?? left.ingestedAt,
            ),
          )[0] ?? null;

      if (!parentMessage) {
        const providerThreadId =
          thread.providerThreadId ??
          (await searchThreadIdByBookingRequest({
            publicRef: bookingRequest.publicRef,
          }));

        if (providerThreadId) {
          const normalizedMessages = dedupeProviderMessages(await listThreadMessages(providerThreadId));
          const syncedAt = isoNow();

          normalizedMessages.forEach((providerMessage) => {
            const existingMessage = messages.find((item) => item.providerMessageId === providerMessage.providerMessageId);
            const messageId = existingMessage?.id ?? randomUUID();
            const nextAttachments: MessageAttachment[] = providerMessage.attachments.map((attachment) => ({
              id:
                existingMessage?.attachments.find(
                  (item) =>
                    item.providerAttachmentId === attachment.providerAttachmentId ||
                    item.fileHash ===
                      hashAttachmentContent({
                        providerAttachmentId: attachment.providerAttachmentId,
                        fileName: attachment.fileName,
                        contentBase64: attachment.contentBase64,
                      }),
                )?.id ?? randomUUID(),
              messageId,
              providerAttachmentId: attachment.providerAttachmentId,
              fileName: attachment.fileName,
              contentType: attachment.contentType,
              fileSizeBytes: attachment.fileSizeBytes,
              storageKey: `${thread.threadKey}/${providerMessage.providerMessageId}/${attachment.fileName}`,
              fileHash: hashAttachmentContent({
                providerAttachmentId: attachment.providerAttachmentId,
                fileName: attachment.fileName,
                contentBase64: attachment.contentBase64,
              }),
              isSupported: isSupportedAttachment(attachment.contentType, attachment.fileName),
              contentBase64: attachment.contentBase64,
              createdAt: syncedAt,
            }));

            const nextMessage: MessageItem = {
              id: messageId,
              threadId: thread.id,
              ...inferSyncedMessageIdentity({
                bookingRequest,
                fromAddress: providerMessage.fromAddress,
                existingOrigin: existingMessage?.origin ?? null,
                existingCreatedByUserId: existingMessage?.createdByUserId ?? null,
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
              ingestedAt: syncedAt,
              createdByUserId: existingMessage?.createdByUserId ?? null,
              attachments: nextAttachments,
            };

            const index = messages.findIndex((item) => item.providerMessageId === providerMessage.providerMessageId);
            if (index >= 0) {
              messages[index] = nextMessage;
            } else {
              messages.push(nextMessage);
            }
          });

          thread.providerThreadId = normalizedMessages[0]?.providerThreadId ?? providerThreadId;
          thread.lastSyncedAt = syncedAt;
          thread.syncStatus = normalizedMessages.length > 0 ? "synced" : "pending";
          thread.updatedAt = syncedAt;
          bookingRequest.syncStatus = thread.syncStatus;
          bookingRequest.lastMessageAt =
            normalizedMessages[0]?.receivedAt ?? normalizedMessages[0]?.sentAt ?? bookingRequest.lastMessageAt;
          bookingRequest.updatedAt = syncedAt;

          parentMessage =
            messages
              .filter((item) => item.threadId === thread.id)
              .sort((left, right) =>
                (right.receivedAt ?? right.sentAt ?? right.ingestedAt).localeCompare(
                  left.receivedAt ?? left.sentAt ?? left.ingestedAt,
                ),
              )[0] ?? null;
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
      thread.subject = nextSubject;
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
      messages.push(reply);

      thread.providerThreadId = providerReply.providerThreadId ?? thread.providerThreadId;
      thread.updatedAt = now;
      bookingRequest.updatedAt = now;
      bookingRequest.lastMessageAt = reply.sentAt;
      persistRequestSnapshot();

      return {
        bookingRequest,
        thread,
        reply,
      };
    },
    listQuickReplyTemplates: async () => {
      refreshRequestSnapshot();
      return [...quickReplyTemplates].sort((left, right) => left.sortOrder - right.sortOrder);
    },
    createQuickReplyTemplate: async (input: QuickReplyTemplateUpsertInput) => {
      refreshRequestSnapshot();
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
      quickReplyTemplates.push(template);
      persistRequestSnapshot();
      return template;
    },
    updateQuickReplyTemplate: async (id: string, input: QuickReplyTemplateUpsertInput) => {
      refreshRequestSnapshot();
      const template = quickReplyTemplates.find((item) => item.id === id);
      if (!template) {
        throw new Error("booking_request_not_found");
      }
      template.key = input.key;
      template.label = input.label;
      template.category = input.category;
      template.subjectMode = input.subjectMode;
      template.bodyText = input.bodyText;
      template.isActive = input.isActive ?? true;
      template.sortOrder = input.sortOrder;
      template.updatedByUserId = input.updatedByUserId;
      template.updatedAt = isoNow();
      persistRequestSnapshot();
      return template;
    },
    deactivateQuickReplyTemplate: async (id: string, actorId: string) => {
      refreshRequestSnapshot();
      const template = quickReplyTemplates.find((item) => item.id === id);
      if (!template) {
        throw new Error("booking_request_not_found");
      }
      template.isActive = false;
      template.updatedByUserId = actorId;
      template.updatedAt = isoNow();
      persistRequestSnapshot();
      return template;
    },
    listOtaConnections: async (providerKey?: OtaConnection["providerKey"]) => {
      return providerKey
        ? otaConnections.filter((item) => item.providerKey === providerKey)
        : [...otaConnections];
    },
    upsertOtaConnection: async (providerKey: OtaConnection["providerKey"], input: OtaConnectionUpsertInput, id?: string) => {
      const existing = id ? otaConnections.find((item) => item.id === id) ?? null : null;
      const connection: OtaConnection = {
        id: existing?.id ?? randomUUID(),
        providerKey,
        accountLabel: input.accountLabel,
        externalPropertyId: input.externalPropertyId ?? null,
        isActive: input.isActive ?? true,
        messagesEnabled: input.messagesEnabled ?? false,
        ariEnabled: input.ariEnabled ?? false,
        recoveryEnabled: input.recoveryEnabled ?? false,
        metadata: input.metadata ?? {},
        createdAt: existing?.createdAt ?? isoNow(),
        updatedAt: isoNow(),
      };
      if (existing) {
        const index = otaConnections.findIndex((item) => item.id === existing.id);
        otaConnections[index] = connection;
      } else {
        otaConnections.push(connection);
      }
      persistRequestSnapshot();
      return connection;
    },
    listOtaRoomMappings: async (connectionId: string) =>
      otaRoomMappings
        .filter((item) => item.connectionId === connectionId)
        .sort((left, right) => left.externalRoomTypeCode.localeCompare(right.externalRoomTypeCode)),
    upsertOtaRoomMapping: async (connectionId: string, input: OtaRoomMappingUpsertInput, id?: string) => {
      const existing = id
        ? otaRoomMappings.find((item) => item.id === id && item.connectionId === connectionId) ?? null
        : otaRoomMappings.find(
            (item) =>
              item.connectionId === connectionId &&
              item.externalRoomTypeCode.toLowerCase() === input.externalRoomTypeCode.toLowerCase(),
          ) ?? null;
      const mapping: OtaRoomMapping = {
        id: existing?.id ?? randomUUID(),
        connectionId,
        externalRoomTypeCode: input.externalRoomTypeCode,
        bungalowId: input.bungalowId ?? null,
        createdAt: existing?.createdAt ?? isoNow(),
        updatedAt: isoNow(),
      };
      if (existing) {
        const index = otaRoomMappings.findIndex((item) => item.id === existing.id);
        otaRoomMappings[index] = mapping;
      } else {
        otaRoomMappings.push(mapping);
      }
      persistRequestSnapshot();
      return mapping;
    },
    listOtaRatePlanMappings: async (connectionId: string) =>
      otaRatePlanMappings
        .filter((item) => item.connectionId === connectionId)
        .sort((left, right) => left.externalRatePlanCode.localeCompare(right.externalRatePlanCode)),
    upsertOtaRatePlanMapping: async (connectionId: string, input: OtaRatePlanMappingUpsertInput, id?: string) => {
      const existing = id
        ? otaRatePlanMappings.find((item) => item.id === id && item.connectionId === connectionId) ?? null
        : otaRatePlanMappings.find(
            (item) =>
              item.connectionId === connectionId &&
              item.externalRatePlanCode.toLowerCase() === input.externalRatePlanCode.toLowerCase(),
          ) ?? null;
      const mapping: OtaRatePlanMapping = {
        id: existing?.id ?? randomUUID(),
        connectionId,
        externalRatePlanCode: input.externalRatePlanCode,
        internalRatePlanCode: input.internalRatePlanCode ?? null,
        createdAt: existing?.createdAt ?? isoNow(),
        updatedAt: isoNow(),
      };
      if (existing) {
        const index = otaRatePlanMappings.findIndex((item) => item.id === existing.id);
        otaRatePlanMappings[index] = mapping;
      } else {
        otaRatePlanMappings.push(mapping);
      }
      persistRequestSnapshot();
      return mapping;
    },
    importOtaReservation: async (_input: OtaReservationImportInput): Promise<OtaReservationImportResult> => {
      throw new Error("ota_provider_not_supported");
    },
    syncOtaProvider: async (
      providerKey: OtaConnection["providerKey"],
      mode: "incremental" | "recovery",
    ): Promise<OtaReservationSyncResult> => {
      const startedAt = isoNow();
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
    },
    getOtaReservationLink: async (reservationId: string) =>
      otaLinks.find((item) => item.reservationId === reservationId) ?? null,
    resyncOtaReservation: async (reservationId: string) => {
      const detail = buildOperationThreadView(reservationId);
      if (!detail) {
        throw new Error("reservation_not_found");
      }
      return detail;
    },
    resolveOtaReservationConflict: async (reservationId: string, actorId: string, notes: string) => {
      const now = isoNow();
      conflicts.forEach((conflict) => {
        if (conflict.reservationId === reservationId && conflict.status === "open") {
          conflict.status = "resolved";
          conflict.resolvedBy = actorId;
          conflict.resolvedAt = now;
          conflict.notes = conflict.notes ? `${conflict.notes}\n${notes}` : notes;
        }
      });
      persistRequestSnapshot();
      const detail = buildOperationThreadView(reservationId);
      if (!detail) {
        throw new Error("reservation_not_found");
      }
      return detail;
    },
    confirmBookingRequestTransfer: async (
      id: string,
      actorId: string,
      reason: string,
    ): Promise<ConfirmBookingRequestTransferResult> => {
      refreshRequestSnapshot();
      const current = bookingRequests.find((item) => item.id === id);
      if (!current) {
        throw new Error("booking_request_not_found");
      }

      current.status = nextBookingRequestStatus(current.status, "confirm_transfer");
      current.updatedAt = isoNow();

      const created = store.create({
        number: nextReservationNumber(store.list()),
        channel: "web",
        bungalowId: current.requestedBungalowType,
        actorId,
        responsibleId: actorId,
        startDate: current.requestedCheckIn,
        endDate: current.requestedCheckOut,
        sourceRequestId: current.id,
      });
      const reservation = store.transition(created.reservation.id, {
        action: "confirm",
        actorId,
        reason,
      });
      reconcileReservationConflictsAgainstOpenRequests(reservation, actorId);
      persistRequestSnapshot();

      return {
        bookingRequest: current,
        reservation,
      };
    },
    create: async (input) => {
      const result = store.create(input);
      reconcileReservationConflictsAgainstOpenRequests(result.reservation, input.responsibleId ?? "system");
      persistRequestSnapshot();
      return result;
    },
    update: async (reservationId, input) => {
      const detail = store.update(reservationId, input);
      const reservation = store.get(reservationId);
      if (!reservation) {
        throw new Error("reservation_not_found");
      }
      reconcileReservationConflictsAgainstOpenRequests(reservation, input.actorId);
      syncLinkedBookingRequestFromReservation(reservation, input.actorId, input.reason);
      persistRequestSnapshot();
      return detail;
    },
    assign: async (reservationId, input) => {
      const detail = store.assign(reservationId, input);
      const reservation = store.get(reservationId);
      if (!reservation) {
        throw new Error("reservation_not_found");
      }
      reconcileReservationConflictsAgainstOpenRequests(reservation, input.actorId);
      syncLinkedBookingRequestFromReservation(reservation, input.actorId, input.reason);
      persistRequestSnapshot();
      return detail;
    },
    transition: async (reservationId, input) => {
      const detail = store.transition(reservationId, input);
      const reservation = store.get(reservationId);
      if (!reservation) {
        throw new Error("reservation_not_found");
      }
      reconcileReservationConflictsAgainstOpenRequests(reservation, input.actorId);
      if (reservation.sourceRequestId) {
        syncLinkedBookingRequestFromReservation(reservation, input.actorId, input.reason);
      }
      persistRequestSnapshot();
      return detail;
    },
  };
}

export const reservationStore: ReservationServiceLike = new Proxy({} as ReservationServiceLike, {
  get(_target, property) {
    const service = getRuntimeReservationService();
    const value = service[property as keyof ReservationServiceLike];
    return typeof value === "function" ? value.bind(service) : value;
  },
});
