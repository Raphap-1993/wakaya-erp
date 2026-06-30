import { randomUUID } from "node:crypto";
import { canBlockOccupancy, nightsForReservation } from "@/lib/reservations/availability";
import { createReservationAuditEntry } from "@/lib/reservations/audit";
import type { ReservationServiceLike } from "@/lib/reservations/repository";
import type {
  ConfirmBookingRequestTransferResult,
  CreateBookingRequestResult,
  CreateReservationResult,
  ReservationDetail,
  ReservationListItem,
} from "@/lib/reservations/repository";
import { nextBookingRequestPublicRef, nextReservationNumber } from "@/lib/reservations/numbering";
import { buildReservationService } from "@/lib/reservations/service";
import { nextBookingRequestStatus, nextReservationStatus } from "@/lib/reservations/state-machine";
import type {
  BookingRequest,
  BookingRequestCreateInput,
  Bungalow,
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
  reservations?: Reservation[];
  occupancies?: ReservationOccupancy[];
  audits?: ReservationAudit[];
}

const MEMORY_SNAPSHOTS = new Map<
  string,
  {
    bungalows: Bungalow[];
    reservations: Reservation[];
    occupancies: ReservationOccupancy[];
    audits: ReservationAudit[];
  }
>();

function isoNow(): string {
  return new Date().toISOString();
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
  private readonly reservations = new Map<string, Reservation>();
  private readonly occupancies = new Map<string, ReservationOccupancy>();
  private readonly audits = new Map<string, ReservationAudit[]>();
  private readonly storagePath: string | null;

  constructor(seed: SeedData = {}) {
    const bungalowSeeds: Bungalow[] =
      seed.bungalows ?? [
        { id: "bungalow-suite", code: "SUITE", name: "Bungalow Suite", active: true, capacity: 2 },
        { id: "bungalow-family", code: "FAMILY", name: "Bungalow Familiar", active: true, capacity: 4 },
        { id: "bungalow-matrimonial", code: "MATRIMONIAL", name: "Bungalow Matrimonial", active: true, capacity: 2 },
      ];
    const reservationSeeds = seed.reservations ?? [];
    const occupancySeeds = seed.occupancies ?? [];
    const auditSeeds = seed.audits ?? [];
    const snapshot = {
      bungalows: bungalowSeeds,
      reservations: reservationSeeds,
      occupancies: occupancySeeds,
      audits: auditSeeds,
    };

    this.storagePath = seed.storagePath ?? null;
    const persistedSnapshot = this.storagePath
      ? MEMORY_SNAPSHOTS.get(this.storagePath) ??
        (MEMORY_SNAPSHOTS.set(this.storagePath, snapshot), MEMORY_SNAPSHOTS.get(this.storagePath)!)
      : snapshot;

    persistedSnapshot.bungalows.forEach((bungalow) => this.bungalows.set(bungalow.id, bungalow));
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

  listBungalows(): Bungalow[] {
    this.refreshFromPersistence();
    return Array.from(this.bungalows.values()).sort((left, right) => left.name.localeCompare(right.name));
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
      const existingOccupancies = Array.from(this.occupancies.values());
      const availability = canBlockOccupancy(existingOccupancies, {
        bungalowId: input.bungalowId,
        startDate: input.startDate,
        endDate: input.endDate,
      });
      if (!availability.ok) {
        throw new Error(availability.reason ?? "occupancy_conflict");
      }
    }

    const reservation: Reservation = {
      id: reservationId,
      number: input.number,
      channel: input.channel,
      status,
      bungalowId: input.bungalowId,
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

    const occupancy: ReservationOccupancy[] = input.bungalowId
      ? nights.map((date) => ({
          id: randomUUID(),
          reservationId,
          bungalowId: input.bungalowId!,
          date,
          source: normalizeSource(input.channel),
          status: occupancyStatusForReservation(status),
          createdAt: updatedAt,
        }))
      : [];

    const audit = createReservationAuditEntry({
      reservationId,
      actorId: input.responsibleId ?? "system",
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
    const shouldOccupy = reservation.status !== "cancelled" && reservation.status !== "no_show";
    const existingOccupancies = Array.from(this.occupancies.values()).filter(
      (occupancy) => occupancy.reservationId !== reservationId,
    );

    if (shouldOccupy) {
      const availability = canBlockOccupancy(existingOccupancies, {
        bungalowId: input.bungalowId,
        startDate: input.startDate,
        endDate: input.endDate,
      });
      if (!availability.ok) {
        throw new Error(availability.reason ?? "occupancy_conflict");
      }
    }

    this.releaseReservationOccupancy(reservationId);
    const updatedAt = isoNow();
    const nextReservation: Reservation = {
      ...reservation,
      number: input.number,
      channel: input.channel,
      bungalowId: input.bungalowId,
      responsibleId: input.responsibleId ?? null,
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

    const existingOccupancies = Array.from(this.occupancies.values()).filter(
      (occupancy) => occupancy.reservationId !== reservationId,
    );
    const availability = canBlockOccupancy(existingOccupancies, {
      bungalowId: input.bungalowId,
      startDate: reservation.startDate,
      endDate: reservation.endDate,
    });
    if (!availability.ok) {
      throw new Error(availability.reason ?? "occupancy_conflict");
    }

    this.releaseReservationOccupancy(reservationId);
    const updatedAt = isoNow();
    const nextReservation: Reservation = {
      ...reservation,
      bungalowId: input.bungalowId,
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

    MEMORY_SNAPSHOTS.set(this.storagePath, {
      bungalows: Array.from(this.bungalows.values()),
      reservations: Array.from(this.reservations.values()),
      occupancies: Array.from(this.occupancies.values()),
      audits: Array.from(this.audits.values()).flat().sort((left, right) =>
        right.createdAt.localeCompare(left.createdAt),
      ),
    });
  }

  private refreshFromPersistence(): void {
    if (!this.storagePath) return;

    const snapshot = MEMORY_SNAPSHOTS.get(this.storagePath);
    if (!snapshot) return;
    this.bungalows.clear();
    this.reservations.clear();
    this.occupancies.clear();
    this.audits.clear();

    snapshot.bungalows.forEach((bungalow) => this.bungalows.set(bungalow.id, bungalow));
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

function wrapSyncStore(
  store: ReservationStore,
): Omit<
  ReservationServiceLike,
  "listBookingRequests" | "getBookingRequest" | "createBookingRequest" | "confirmBookingRequestTransfer"
> {
  return {
    list: async (filters) => store.list(filters),
    get: async (id) => store.get(id),
    getBungalow: async (id) => store.getBungalow(id),
    listBungalows: async () => store.listBungalows(),
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
    bungalows: [
      { id: "bungalow-suite", code: "SUITE", name: "Bungalow Suite", active: true, capacity: 2 },
      { id: "bungalow-family", code: "FAMILY", name: "Bungalow Familiar", active: true, capacity: 4 },
      { id: "bungalow-matrimonial", code: "MATRIMONIAL", name: "Bungalow Matrimonial", active: true, capacity: 2 },
    ],
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
      threadId: null,
      notes: null,
      lastMessageAt: "2026-07-01T10:00:00.000Z",
      syncStatus: "pending",
      createdAt: "2026-07-01T09:00:00.000Z",
      updatedAt: "2026-07-01T10:00:00.000Z",
    },
  ];
}

function createFallbackReservationService(): ReservationServiceLike {
  const bookingRequests: BookingRequest[] = process.env.NODE_ENV === "test" ? createTestBookingRequests() : [];
  const seed = process.env.NODE_ENV === "test"
    ? createTestFixtureSeed()
    : {
        bungalows: [],
        reservations: [],
        occupancies: [],
        audits: [],
      };

  const store = new ReservationStore({
    storagePath: process.env.WAKAYA_RESERVATIONS_DB_PATH,
    ...seed,
  });

  return {
    ...wrapSyncStore(store),
    listBookingRequests: async () => [...bookingRequests].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    getBookingRequest: async (id: string) => bookingRequests.find((item) => item.id === id) ?? null,
    createBookingRequest: async (input: BookingRequestCreateInput): Promise<CreateBookingRequestResult> => {
      const now = isoNow();
      const bookingRequest: BookingRequest = {
        id: randomUUID(),
        publicRef: nextBookingRequestPublicRef(bookingRequests),
        status: "awaiting_initial_email",
        guestName: input.guestName,
        guestEmail: input.guestEmail,
        guestPhone: input.guestPhone ?? null,
        requestedCheckIn: input.requestedCheckIn,
        requestedCheckOut: input.requestedCheckOut,
        requestedGuests: input.requestedGuests,
        requestedBungalowType: input.requestedBungalowType ?? null,
        sourceChannel: "web_public",
        threadId: null,
        notes: input.notes ?? null,
        lastMessageAt: null,
        syncStatus: "pending",
        createdAt: now,
        updatedAt: now,
      };
      bookingRequests.push(bookingRequest);
      return { bookingRequest };
    },
    confirmBookingRequestTransfer: async (
      id: string,
      actorId: string,
      reason: string,
    ): Promise<ConfirmBookingRequestTransferResult> => {
      const current = bookingRequests.find((item) => item.id === id);
      if (!current) {
        throw new Error("booking_request_not_found");
      }

      current.status = nextBookingRequestStatus(current.status, "confirm_transfer");
      current.updatedAt = isoNow();

      const created = store.create({
        number: nextReservationNumber(store.list()),
        channel: "web",
        bungalowId: null,
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

      return {
        bookingRequest: current,
        reservation,
      };
    },
  };
}

export const reservationStore: ReservationServiceLike = hasOperationalDatabaseUrl()
  ? buildReservationService()
  : createFallbackReservationService();
