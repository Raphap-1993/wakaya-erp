import { randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";

import { canBlockOccupancy, nightsForReservation } from "@/lib/reservations/availability";
import { createReservationAuditEntry } from "@/lib/reservations/audit";
import { nextBookingRequestPublicRef } from "@/lib/reservations/numbering";
import type {
  CreateBookingRequestResult,
  CreateReservationResult,
  ReservationDetail,
  ReservationListItem,
  ReservationServiceLike,
} from "@/lib/reservations/repository";
import { nextReservationStatus } from "@/lib/reservations/state-machine";
import type {
  BookingRequest,
  BookingRequestCreateInput,
  Bungalow,
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
} from "@/lib/reservations/types";

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
  responsible_id: string | null;
  start_date: string;
  end_date: string;
  amount_total_cents: number | null;
  amount_paid_cents: number | null;
  payment_status: ReservationPaymentStatus | null;
  currency_code: "PEN" | null;
  updated_at: string;
  bungalow_code?: string | null;
  bungalow_name?: string | null;
  bungalow_active?: boolean | null;
  bungalow_capacity?: number | null;
  audit_count?: string | number | null;
};

type OccupancyRow = {
  id: string;
  reservation_id: string;
  bungalow_id: string;
  date: string;
  source: ReservationChannel;
  status: ReservationOccupancy["status"];
  created_at: string;
};

type AuditRow = {
  id: string;
  reservation_id: string;
  actor_id: string;
  action: string;
  previous_status: Reservation["status"];
  next_status: Reservation["status"];
  reason: string;
  created_at: string;
};

type BookingRequestRow = {
  id: string;
  public_ref: string;
  status: BookingRequest["status"];
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  requested_check_in: string;
  requested_check_out: string;
  requested_guests: number;
  requested_bungalow_type: string | null;
  source_channel: BookingRequest["sourceChannel"];
  thread_id: string | null;
  notes: string | null;
  last_message_at: string | null;
  sync_status: BookingRequest["syncStatus"];
  created_at: string;
  updated_at: string;
};

export class PostgresReservationStore implements ReservationServiceLike {
  private bootstrapPromise: Promise<void> | null = null;

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

  async listBungalows(): Promise<Bungalow[]> {
    await this.ensureBootstrap();
    const result = await this.pool.query<Bungalow>(
      `select id, code, name, active, capacity from bungalow order by name asc`,
    );
    return result.rows;
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
      const availability = canBlockOccupancy(await this.loadExistingOccupancies(client), {
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
        amountTotalCents,
        amountPaidCents,
        paymentStatus: derivePaymentStatus(amountTotalCents, amountPaidCents),
        currencyCode: DEFAULT_CURRENCY_CODE,
        updatedAt,
        sourceRequestId: null,
      };

      await client.query(
        `
          insert into reservation (
            id, number, channel, status, source_request_id, bungalow_id, responsible_id,
            start_date, end_date, amount_total_cents, amount_paid_cents, payment_status,
            currency_code, updated_at
          ) values (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11, $12,
            $13, $14
          )
        `,
        [
          reservation.id,
          reservation.number,
          reservation.channel,
          reservation.status,
          null,
          reservation.bungalowId,
          reservation.responsibleId,
          reservation.startDate,
          reservation.endDate,
          reservation.amountTotalCents ?? null,
          reservation.amountPaidCents ?? null,
          reservation.paymentStatus ?? null,
          reservation.currencyCode ?? null,
          reservation.updatedAt,
        ],
      );

      const occupancy = await this.insertOccupancyRows(
        client,
        reservation,
        input.bungalowId,
        occupancyStatusForReservation(status),
      );
      const audit = createReservationAuditEntry({
        reservationId,
        actorId: input.responsibleId ?? "system",
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

      const existingRefs = await client.query<Pick<BookingRequestRow, "public_ref">>(
        `select public_ref from booking_request`,
      );
      const now = isoNow();
      const bookingRequest: BookingRequest = {
        id: randomUUID(),
        publicRef: nextBookingRequestPublicRef(
          existingRefs.rows.map((row) => ({ publicRef: row.public_ref })),
        ),
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

      await client.query(
        `
          insert into booking_request(
            id, public_ref, status, guest_name, guest_email, guest_phone,
            requested_check_in, requested_check_out, requested_guests, requested_bungalow_type,
            source_channel, thread_id, notes, last_message_at, sync_status, created_at, updated_at
          ) values (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17
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
          bookingRequest.sourceChannel,
          bookingRequest.threadId,
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

  async update(reservationId: string, input: ReservationUpdateInput): Promise<ReservationDetail> {
    await this.ensureBootstrap();
    return this.withTransaction(async (client) => {
      const reservation = await this.mustGetReservation(client, reservationId);
      const bungalow = await this.mustGetBungalow(client, input.bungalowId);
      if (!bungalow.active) throw new Error("bungalow_inactive");

      const nights = nightsForReservation(input.startDate, input.endDate);
      const amountTotalCents = normalizeAmount(input.amountTotalCents ?? nights.length * DEFAULT_NIGHTLY_RATE_CENTS);
      const amountPaidCents = Math.min(normalizeAmount(input.amountPaidCents), amountTotalCents);
      const shouldOccupy = reservation.status !== "cancelled" && reservation.status !== "no_show";
      if (shouldOccupy) {
        const availability = canBlockOccupancy(await this.loadExistingOccupancies(client, reservationId), {
          bungalowId: input.bungalowId,
          startDate: input.startDate,
          endDate: input.endDate,
        });
        if (!availability.ok) {
          throw new Error(availability.reason ?? "occupancy_conflict");
        }
      }

      await client.query(`delete from reservation_occupancy where reservation_id = $1`, [reservationId]);

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
      const availability = canBlockOccupancy(await this.loadExistingOccupancies(client, reservationId), {
        bungalowId: input.bungalowId,
        startDate: reservation.startDate,
        endDate: reservation.endDate,
      });
      if (!availability.ok) throw new Error(availability.reason ?? "occupancy_conflict");

      await client.query(`delete from reservation_occupancy where reservation_id = $1`, [reservationId]);

      const nextReservation: Reservation = {
        ...reservation,
        bungalowId: input.bungalowId,
        status: nextStatus,
        updatedAt: isoNow(),
      };

      await this.updateReservationRow(client, nextReservation);
      await this.insertOccupancyRows(client, nextReservation, input.bungalowId, "confirmed");
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

    this.bootstrapPromise = Promise.resolve();

    await this.bootstrapPromise;
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

  private toReservation(row: ReservationRow): Reservation {
    return {
      id: row.id,
      number: row.number,
      channel: row.channel,
      status: row.status,
      sourceRequestId: row.source_request_id,
      bungalowId: row.bungalow_id,
      responsibleId: row.responsible_id,
      startDate: row.start_date,
      endDate: row.end_date,
      amountTotalCents: row.amount_total_cents ?? undefined,
      amountPaidCents: row.amount_paid_cents ?? undefined,
      paymentStatus: row.payment_status ?? undefined,
      currencyCode: row.currency_code ?? undefined,
      updatedAt: row.updated_at,
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
      createdAt: row.created_at,
    };
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

  private async loadExistingOccupancies(
    client: PoolClient,
    excludeReservationId?: string,
  ): Promise<Array<{ bungalowId: string; date: string }>> {
    const result = excludeReservationId
      ? await client.query<OccupancyRow>(
          `select id, reservation_id, bungalow_id, date, source, status, created_at from reservation_occupancy where reservation_id <> $1`,
          [excludeReservationId],
        )
      : await client.query<OccupancyRow>(
          `select id, reservation_id, bungalow_id, date, source, status, created_at from reservation_occupancy`,
        );

    return result.rows.map((row) => ({
      bungalowId: row.bungalow_id,
      date: row.date,
    }));
  }

  private async insertOccupancyRows(
    client: PoolClient,
    reservation: Reservation,
    bungalowId: string,
    status: ReservationOccupancy["status"],
  ): Promise<ReservationOccupancy[]> {
    const createdAt = isoNow();
    const rows: ReservationOccupancy[] = [];
    for (const date of nightsForReservation(reservation.startDate, reservation.endDate)) {
      const occupancy: ReservationOccupancy = {
        id: randomUUID(),
        reservationId: reservation.id,
        bungalowId,
        date,
        source: reservation.channel,
        status,
        createdAt,
      };
      await client.query(
        `
          insert into reservation_occupancy(id, reservation_id, bungalow_id, date, source, status, created_at)
          values($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          occupancy.id,
          occupancy.reservationId,
          occupancy.bungalowId,
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
          responsible_id = $7,
          start_date = $8,
          end_date = $9,
          amount_total_cents = $10,
          amount_paid_cents = $11,
          payment_status = $12,
          currency_code = $13,
          updated_at = $14
        where id = $1
      `,
      [
        reservation.id,
        reservation.number,
        reservation.channel,
        reservation.status,
        reservation.sourceRequestId ?? null,
        reservation.bungalowId,
        reservation.responsibleId,
        reservation.startDate,
        reservation.endDate,
        reservation.amountTotalCents ?? null,
        reservation.amountPaidCents ?? null,
        reservation.paymentStatus ?? null,
        reservation.currencyCode ?? null,
        reservation.updatedAt,
      ],
    );
  }
}
