import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

import type {
  Bungalow,
  Reservation,
  ReservationAudit,
  ReservationOccupancy,
} from "@/lib/reservations/types";

export interface ReservationSnapshot {
  bungalows: Bungalow[];
  reservations: Reservation[];
  occupancies: ReservationOccupancy[];
  audits: ReservationAudit[];
}

const SCHEMA = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS bungalow (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  active INTEGER NOT NULL,
  capacity INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS reservation (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  channel TEXT NOT NULL,
  status TEXT NOT NULL,
  amount_total_cents INTEGER NOT NULL DEFAULT 0,
  amount_paid_cents INTEGER NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  currency_code TEXT NOT NULL DEFAULT 'PEN',
  bungalow_id TEXT,
  responsible_id TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (bungalow_id) REFERENCES bungalow(id)
);

CREATE INDEX IF NOT EXISTS idx_reservation_status_updated_at
  ON reservation(status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_reservation_responsible_updated_at
  ON reservation(responsible_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS reservation_occupancy (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL,
  bungalow_id TEXT NOT NULL,
  date TEXT NOT NULL,
  source TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (reservation_id) REFERENCES reservation(id) ON DELETE CASCADE,
  FOREIGN KEY (bungalow_id) REFERENCES bungalow(id),
  UNIQUE (bungalow_id, date)
);

CREATE INDEX IF NOT EXISTS idx_reservation_occupancy_reservation
  ON reservation_occupancy(reservation_id);

CREATE INDEX IF NOT EXISTS idx_reservation_occupancy_bungalow
  ON reservation_occupancy(bungalow_id, date);

CREATE TABLE IF NOT EXISTS reservation_audit (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  previous_status TEXT NOT NULL,
  next_status TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (reservation_id) REFERENCES reservation(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reservation_audit_reservation_created_at
  ON reservation_audit(reservation_id, created_at DESC);
`;

function toInt(value: boolean): number {
  return value ? 1 : 0;
}

function toBool(value: number): boolean {
  return value === 1;
}

export class ReservationSqlitePersistence {
  private readonly db: DatabaseSync;

  constructor(path: string) {
    mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec("PRAGMA foreign_keys = ON;");
    this.db.exec(SCHEMA);
    this.ensureReservationColumns();
  }

  isEmpty(): boolean {
    const bungalowCount = this.db.prepare("SELECT COUNT(*) AS count FROM bungalow").get() as {
      count: number;
    };
    const reservationCount = this.db.prepare("SELECT COUNT(*) AS count FROM reservation").get() as {
      count: number;
    };
    return bungalowCount.count === 0 && reservationCount.count === 0;
  }

  loadSnapshot(): ReservationSnapshot {
    const bungalows = this.db
      .prepare("SELECT id, code, name, active, capacity FROM bungalow ORDER BY name ASC")
      .all()
      .map((row) => ({
        id: String((row as { id: string }).id),
        code: String((row as { code: string }).code),
        name: String((row as { name: string }).name),
        active: toBool(Number((row as { active: number }).active)),
        capacity: Number((row as { capacity: number }).capacity),
      }));

    const reservations = this.db
      .prepare(
        "SELECT id, number, channel, status, COALESCE(amount_total_cents, 0) AS amount_total_cents, COALESCE(amount_paid_cents, 0) AS amount_paid_cents, COALESCE(payment_status, 'pending') AS payment_status, COALESCE(currency_code, 'PEN') AS currency_code, bungalow_id, responsible_id, start_date, end_date, updated_at FROM reservation ORDER BY updated_at DESC",
      )
      .all()
      .map((row) => ({
        id: String((row as { id: string }).id),
        number: String((row as { number: string }).number),
        channel: String((row as { channel: string }).channel) as Reservation["channel"],
        status: String((row as { status: string }).status) as Reservation["status"],
        amountTotalCents: Number((row as { amount_total_cents: number }).amount_total_cents),
        amountPaidCents: Number((row as { amount_paid_cents: number }).amount_paid_cents),
        paymentStatus: String((row as { payment_status: string }).payment_status) as NonNullable<
          Reservation["paymentStatus"]
        >,
        currencyCode: String((row as { currency_code: string }).currency_code) as NonNullable<
          Reservation["currencyCode"]
        >,
        bungalowId: (row as { bungalow_id: string | null }).bungalow_id ?? null,
        responsibleId: (row as { responsible_id: string | null }).responsible_id ?? null,
        startDate: String((row as { start_date: string }).start_date),
        endDate: String((row as { end_date: string }).end_date),
        updatedAt: String((row as { updated_at: string }).updated_at),
      }));

    const occupancies = this.db
      .prepare(
        "SELECT id, reservation_id, bungalow_id, date, source, status, created_at FROM reservation_occupancy ORDER BY created_at ASC",
      )
      .all()
      .map((row) => ({
        id: String((row as { id: string }).id),
        reservationId: String((row as { reservation_id: string }).reservation_id),
        bungalowId: String((row as { bungalow_id: string }).bungalow_id),
        date: String((row as { date: string }).date),
        source: String((row as { source: string }).source) as ReservationOccupancy["source"],
        status: String((row as { status: string }).status) as ReservationOccupancy["status"],
        createdAt: String((row as { created_at: string }).created_at),
      }));

    const audits = this.db
      .prepare(
        "SELECT id, reservation_id, actor_id, action, previous_status, next_status, reason, created_at FROM reservation_audit ORDER BY created_at DESC",
      )
      .all()
      .map((row) => ({
        id: String((row as { id: string }).id),
        reservationId: String((row as { reservation_id: string }).reservation_id),
        actorId: String((row as { actor_id: string }).actor_id),
        action: String((row as { action: string }).action),
        previousStatus: String((row as { previous_status: string }).previous_status) as ReservationAudit["previousStatus"],
        nextStatus: String((row as { next_status: string }).next_status) as ReservationAudit["nextStatus"],
        reason: String((row as { reason: string }).reason),
        createdAt: String((row as { created_at: string }).created_at),
      }));

    return { bungalows, reservations, occupancies, audits };
  }

  replaceSnapshot(snapshot: ReservationSnapshot): void {
    const insertBungalow = this.db.prepare(
      "INSERT INTO bungalow (id, code, name, active, capacity) VALUES (?, ?, ?, ?, ?)",
    );
    const insertReservation = this.db.prepare(
      "INSERT INTO reservation (id, number, channel, status, amount_total_cents, amount_paid_cents, payment_status, currency_code, bungalow_id, responsible_id, start_date, end_date, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    );
    const insertOccupancy = this.db.prepare(
      "INSERT INTO reservation_occupancy (id, reservation_id, bungalow_id, date, source, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    );
    const insertAudit = this.db.prepare(
      "INSERT INTO reservation_audit (id, reservation_id, actor_id, action, previous_status, next_status, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    );

    this.db.exec("BEGIN IMMEDIATE TRANSACTION;");
    try {
      this.db.exec("DELETE FROM reservation_audit;");
      this.db.exec("DELETE FROM reservation_occupancy;");
      this.db.exec("DELETE FROM reservation;");
      this.db.exec("DELETE FROM bungalow;");

      for (const bungalow of snapshot.bungalows) {
        insertBungalow.run(bungalow.id, bungalow.code, bungalow.name, toInt(bungalow.active), bungalow.capacity);
      }

      for (const reservation of snapshot.reservations) {
        insertReservation.run(
          reservation.id,
          reservation.number,
          reservation.channel,
          reservation.status,
          reservation.amountTotalCents ?? 0,
          reservation.amountPaidCents ?? 0,
          reservation.paymentStatus ?? "pending",
          reservation.currencyCode ?? "PEN",
          reservation.bungalowId,
          reservation.responsibleId,
          reservation.startDate,
          reservation.endDate,
          reservation.updatedAt,
        );
      }

      for (const occupancy of snapshot.occupancies) {
        insertOccupancy.run(
          occupancy.id,
          occupancy.reservationId,
          occupancy.bungalowId,
          occupancy.date,
          occupancy.source,
          occupancy.status,
          occupancy.createdAt,
        );
      }

      for (const audit of snapshot.audits) {
        insertAudit.run(
          audit.id,
          audit.reservationId,
          audit.actorId,
          audit.action,
          audit.previousStatus,
          audit.nextStatus,
          audit.reason,
          audit.createdAt,
        );
      }

      this.db.exec("COMMIT;");
    } catch (error) {
      this.db.exec("ROLLBACK;");
      throw error;
    }
  }

  private ensureReservationColumns(): void {
    const columns = this.db
      .prepare("PRAGMA table_info(reservation)")
      .all()
      .map((row) => String((row as { name: string }).name));

    if (!columns.includes("amount_total_cents")) {
      this.db.exec("ALTER TABLE reservation ADD COLUMN amount_total_cents INTEGER NOT NULL DEFAULT 0;");
    }
    if (!columns.includes("amount_paid_cents")) {
      this.db.exec("ALTER TABLE reservation ADD COLUMN amount_paid_cents INTEGER NOT NULL DEFAULT 0;");
    }
    if (!columns.includes("payment_status")) {
      this.db.exec("ALTER TABLE reservation ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'pending';");
    }
    if (!columns.includes("currency_code")) {
      this.db.exec("ALTER TABLE reservation ADD COLUMN currency_code TEXT NOT NULL DEFAULT 'PEN';");
    }
  }
}
