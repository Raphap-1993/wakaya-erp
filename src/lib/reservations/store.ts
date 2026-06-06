import { randomUUID } from "node:crypto";
import { canBlockOccupancy, nightsForReservation } from "@/lib/reservations/availability";
import { createReservationAuditEntry } from "@/lib/reservations/audit";
import { nextReservationStatus } from "@/lib/reservations/state-machine";
import { ReservationSqlitePersistence } from "@/lib/reservations/sqlite-persistence";
import type {
  Bungalow,
  Reservation,
  ReservationAudit,
  ReservationAssignmentInput,
  ReservationChannel,
  ReservationCreateInput,
  ReservationListFilters,
  ReservationOccupancy,
  ReservationStatusChangeInput,
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
  occupancy: ReservationOccupancy[];
  audit: ReservationAudit;
}

interface SeedData {
  storagePath?: string;
  bungalows?: Bungalow[];
  reservations?: Reservation[];
  occupancies?: ReservationOccupancy[];
  audits?: ReservationAudit[];
}

function isoNow(): string {
  return new Date().toISOString();
}

function normalizeSource(channel: ReservationChannel): ReservationChannel {
  return channel;
}

function defaultStatus(channel: ReservationChannel) {
  return channel === "ota" ? "ota_imported_confirmed" : "pending_review";
}

export class ReservationStore {
  private readonly bungalows = new Map<string, Bungalow>();
  private readonly reservations = new Map<string, Reservation>();
  private readonly occupancies = new Map<string, ReservationOccupancy>();
  private readonly audits = new Map<string, ReservationAudit[]>();
  private readonly persistence: ReservationSqlitePersistence | null;

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

    this.persistence = seed.storagePath ? new ReservationSqlitePersistence(seed.storagePath) : null;
    const persistedSnapshot = this.persistence
      ? this.persistence.isEmpty()
        ? (this.persistence.replaceSnapshot(snapshot), this.persistence.loadSnapshot())
        : this.persistence.loadSnapshot()
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
    const items = Array.from(this.reservations.values())
      .filter((reservation) => {
        if (filters.status && reservation.status !== filters.status) return false;
        if (filters.responsibleId && reservation.responsibleId !== filters.responsibleId) return false;
        if (filters.channel && reservation.channel !== filters.channel) return false;
        return true;
      })
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

    return items.map((reservation) => ({
      ...reservation,
      bungalow: reservation.bungalowId ? this.bungalows.get(reservation.bungalowId) ?? null : null,
    }));
  }

  get(id: string): ReservationDetail | null {
    const reservation = this.reservations.get(id);
    if (!reservation) return null;
    return {
      ...reservation,
      bungalow: reservation.bungalowId ? this.bungalows.get(reservation.bungalowId) ?? null : null,
      auditCount: this.getAuditTrail(id).length,
    };
  }

  getBungalow(id: string): Bungalow | null {
    return this.bungalows.get(id) ?? null;
  }

  listBungalows(): Bungalow[] {
    return Array.from(this.bungalows.values()).sort((left, right) => left.name.localeCompare(right.name));
  }

  getAuditTrail(reservationId: string): ReservationAudit[] {
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
    const existingOccupancies = Array.from(this.occupancies.values());
    const availability = canBlockOccupancy(existingOccupancies, {
      bungalowId: input.bungalowId,
      startDate: input.startDate,
      endDate: input.endDate,
    });
    if (!availability.ok) {
      throw new Error(availability.reason ?? "occupancy_conflict");
    }

    const reservation: Reservation = {
      id: reservationId,
      number: input.number,
      channel: input.channel,
      status,
      bungalowId: input.bungalowId,
      responsibleId: input.responsibleId ?? null,
      startDate: input.startDate,
      endDate: input.endDate,
      updatedAt,
    };

    const occupancy: ReservationOccupancy[] = nights.map((date) => ({
      id: randomUUID(),
      reservationId,
      bungalowId: input.bungalowId,
      date,
      source: normalizeSource(input.channel),
      status: (status === "pending_review" ? "provisional" : "confirmed") as ReservationOccupancy["status"],
      createdAt: updatedAt,
    }));

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
      this.occupancies.set(id, { ...occupancy, status: "released" });
    }
  }

  private markReservationOccupancy(reservationId: string, status: ReservationOccupancy["status"]): void {
    for (const [id, occupancy] of this.occupancies.entries()) {
      if (occupancy.reservationId !== reservationId) continue;
      this.occupancies.set(id, { ...occupancy, status });
    }
  }

  private persistState(): void {
    if (!this.persistence) return;

    this.persistence.replaceSnapshot({
      bungalows: Array.from(this.bungalows.values()),
      reservations: Array.from(this.reservations.values()),
      occupancies: Array.from(this.occupancies.values()),
      audits: Array.from(this.audits.values()).flat().sort((left, right) =>
        right.createdAt.localeCompare(left.createdAt),
      ),
    });
  }

  private refreshFromPersistence(): void {
    if (!this.persistence) return;

    const snapshot = this.persistence.loadSnapshot();
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

export const reservationStore = new ReservationStore({
  storagePath: process.env.WAKAYA_RESERVATIONS_DB_PATH,
  reservations: [
    {
      id: "reservation-demo-1",
      number: "RESERVATION-2026-0001",
      channel: "web",
      status: "pending_review",
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
      bungalowId: "bungalow-family",
      responsibleId: "user-reception-2",
      startDate: "2026-06-15",
      endDate: "2026-06-16",
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
  ],
});
