import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Pool, PoolClient } from "pg";

import { PostgresReservationStore } from "@/lib/reservations/postgres-repository";

const { connectMock, queryMock, releaseMock } = vi.hoisted(() => ({
  connectMock: vi.fn(),
  queryMock: vi.fn(),
  releaseMock: vi.fn(),
}));

function createClient(): PoolClient {
  return {
    query: queryMock,
    release: releaseMock,
  } as unknown as PoolClient;
}

function createPool(): Pool {
  return {
    connect: connectMock,
    query: queryMock,
  } as unknown as Pool;
}

function isRuntimeBootstrapQuery(normalizedSql: string) {
  return [
    "alter table if exists reservation add column if not exists guest_name",
    "alter table if exists reservation_occupancy add column if not exists bungalow_unit_id",
    "create unique index if not exists idx_reservation_provider_external_id",
    "create table if not exists ota_connection",
    "create index if not exists idx_ota_connection_provider_active",
    "create table if not exists ota_room_mapping",
    "create table if not exists ota_rate_plan_mapping",
    "create table if not exists ota_reservation_link",
    "create table if not exists ota_sync_cursor",
    "create table if not exists ota_sync_run",
    "create unique index if not exists idx_ota_sync_run_identity",
    "create table if not exists ota_event_log",
    "insert into bungalow (id, code, name, active, capacity)",
  ].some((prefix) => normalizedSql.startsWith(prefix));
}

describe("PostgresReservationStore", () => {
  beforeEach(() => {
    queryMock.mockReset();
    releaseMock.mockReset();
    connectMock.mockReset();
    connectMock.mockResolvedValue(createClient());
  });

  it("upserts all canonical Wakaya bungalow categories when the database already has older rows", async () => {
    const store = new PostgresReservationStore(createPool());
    const inserts: Array<unknown[]> = [];
    const publicContentInserts: Array<unknown[]> = [];

    queryMock.mockImplementation(async (sql: string, values?: unknown[]) => {
      const normalized = sql.replace(/\s+/g, " ").trim().toLowerCase();

      if (normalized === "select count(*)::int as count from bungalow") {
        return {
          rows: [{ count: 4 }],
          rowCount: 1,
        };
      }

      if (normalized.startsWith("insert into bungalow (id, code, name, active, capacity)")) {
        inserts.push(values ?? []);
        return {
          rows: [],
          rowCount: 1,
        };
      }

      if (isRuntimeBootstrapQuery(normalized)) {
        return { rows: [], rowCount: 0 };
      }

      if (normalized.startsWith("insert into bungalow_public_content")) {
        publicContentInserts.push(values ?? []);
        return {
          rows: [],
          rowCount: 1,
        };
      }

      if (normalized === "select id, code, name, active, capacity from bungalow order by name asc") {
        return {
          rows: [
            { id: "bungalow-suite", code: "SUITE", name: "Bungalow Doble", active: true, capacity: 2 },
            { id: "bungalow-family", code: "FAMILY", name: "Bungalow Familiar", active: true, capacity: 4 },
            { id: "bungalow-matrimonial", code: "MATRIMONIAL", name: "Bungalow Matrimonial", active: true, capacity: 2 },
            { id: "bungalow-individual", code: "INDIVIDUAL", name: "Bungalow Individual", active: true, capacity: 1 },
            { id: "bungalow-triple", code: "TRIPLE", name: "Bungalow Triple", active: true, capacity: 3 },
          ],
          rowCount: 5,
        };
      }

      throw new Error(`Unexpected query: ${normalized}`);
    });

    const items = await store.listBungalows();

    expect(items).toHaveLength(5);
    expect(items.map((item) => item.id)).toEqual([
      "bungalow-suite",
      "bungalow-family",
      "bungalow-matrimonial",
      "bungalow-individual",
      "bungalow-triple",
    ]);
    expect(inserts).toHaveLength(5);
    expect(publicContentInserts).toHaveLength(5);
    expect(inserts).toContainEqual([
      "bungalow-individual",
      "INDIVIDUAL",
      "Bungalow Individual",
      true,
      1,
    ]);
    expect(inserts).toContainEqual([
      "bungalow-triple",
      "TRIPLE",
      "Bungalow Triple",
      true,
      3,
    ]);
  });

  it("confirms a web request against aggregate capacity for its requested category", async () => {
    const store = new PostgresReservationStore(createPool());
    let insertReservationValues: unknown[] | undefined;

    queryMock.mockImplementation(async (sql: string, values?: unknown[]) => {
      const normalized = sql.replace(/\s+/g, " ").trim().toLowerCase();

      if (isRuntimeBootstrapQuery(normalized)) {
        return { rows: [], rowCount: 0 };
      }

      if (normalized === "select count(*)::int as count from bungalow") {
        return {
          rows: [{ count: 4 }],
          rowCount: 1,
        };
      }

      if (normalized === "begin" || normalized === "commit" || normalized === "rollback") {
        return { rows: [], rowCount: 0 };
      }

      if (normalized.startsWith("insert into bungalow_public_content")) {
        return { rows: [], rowCount: 1 };
      }

      if (normalized.includes("lock table booking_request in share row exclusive mode")) {
        return { rows: [], rowCount: 0 };
      }

      if (
        normalized.includes("from booking_request") &&
        normalized.includes("where id = $1") &&
        normalized.includes("limit 1")
      ) {
        return {
          rows: [
            {
              id: "request-typed",
              public_ref: "WR-2026-0009",
              status: "proof_received",
              guest_name: "Ada Lovelace",
              guest_email: "ada@example.com",
              guest_phone: "+51987654321",
              requested_check_in: "2026-07-20",
              requested_check_out: "2026-07-22",
              requested_guests: 4,
              requested_bungalow_type: "bungalow-family",
              source_channel: "web_public",
              thread_id: "thread-typed",
              thread_key: "booking-request:WR-2026-0009",
              notes: null,
              last_message_at: null,
              sync_status: "pending",
              created_at: "2026-07-01T09:00:00.000Z",
              updated_at: "2026-07-01T10:00:00.000Z",
            },
          ],
          rowCount: 1,
        };
      }

      if (
        normalized.includes("from reservation") &&
        normalized.includes("source_request_id is distinct from $1::uuid")
      ) {
        return { rows: [], rowCount: 0 };
      }

      if (
        normalized.includes("from availability_conflict") &&
        normalized.includes("where request_id = $1") &&
        normalized.includes("status = 'open'")
      ) {
        return { rows: [], rowCount: 0 };
      }

      if (normalized.startsWith("update booking_request")) {
        return { rows: [], rowCount: 1 };
      }

      if (normalized === "select number from reservation") {
        return {
          rows: [{ number: "RESERVATION-2026-0008" }],
          rowCount: 1,
        };
      }

      if (normalized === "select id, code, name, active, capacity from bungalow where id = $1 limit 1") {
        return {
          rows: [{ id: "bungalow-family", code: "FAMILY", name: "Bungalow Familiar", active: true, capacity: 4 }],
          rowCount: 1,
        };
      }

      if (normalized === "select pg_advisory_xact_lock(hashtext('bungalow-capacity:' || $1))") {
        return { rows: [], rowCount: 1 };
      }

      if (normalized.startsWith("select bungalow_id, total_units, version, updated_by, created_at, updated_at from bungalow_capacity")) {
        return {
          rows: [{
            bungalow_id: "bungalow-family",
            total_units: 5,
            version: 1,
            updated_by: null,
            created_at: "2026-07-12T00:00:00.000Z",
            updated_at: "2026-07-12T00:00:00.000Z",
          }],
          rowCount: 1,
        };
      }

      if (normalized.startsWith("select * from reservation where id <> $1 and bungalow_id = $2")) {
        return { rows: [], rowCount: 0 };
      }

      if (normalized.includes("from bungalow_capacity_block") && normalized.includes("status = 'active'")) {
        return { rows: [], rowCount: 0 };
      }

      if (normalized.startsWith("insert into reservation (")) {
        insertReservationValues = values as unknown[];
        return { rows: [], rowCount: 1 };
      }

      if (normalized.startsWith("insert into reservation_audit(")) {
        return { rows: [], rowCount: 1 };
      }

      if (normalized.startsWith("insert into reservation_occupancy(")) {
        return { rows: [], rowCount: 1 };
      }

      if (normalized.includes("from reservation r") && normalized.includes("left join bungalow b")) {
        return {
          rows: [
            {
              id: insertReservationValues?.[0],
              number: insertReservationValues?.[1],
              channel: "web",
              status: "confirmed",
              source_request_id: "request-typed",
              bungalow_id: "bungalow-family",
              bungalow_unit_id: null,
              responsible_id: "user-reception-1",
              start_date: "2026-07-20",
              end_date: "2026-07-22",
              amount_total_cents: null,
              amount_paid_cents: 0,
              payment_status: "pending",
              currency_code: "PEN",
              updated_at: insertReservationValues?.[13],
              audit_count: 1,
              bungalow_code: "FAMILY",
              bungalow_name: "Bungalow Familiar",
              bungalow_active: true,
              bungalow_capacity: 4,
            },
          ],
          rowCount: 1,
        };
      }

      throw new Error(`Unexpected query: ${normalized}`);
    });

    const result = await store.confirmBookingRequestTransfer(
      "request-typed",
      "user-reception-1",
      "proof validated",
    );

    expect(result.bookingRequest.status).toBe("converted_to_reservation");
    expect(result.reservation.status).toBe("confirmed");
    expect(result.reservation.channel).toBe("web");
    expect(result.reservation.bungalowId).toBe("bungalow-family");
    expect(result.reservation.bungalowUnitId).toBeNull();
    expect(insertReservationValues?.[4]).toBe("request-typed");
    expect(insertReservationValues?.[5]).toBe("bungalow-family");
    expect(releaseMock).toHaveBeenCalledTimes(1);
  });

  it("persists the assigned physical unit when an operational reservation is assigned", async () => {
    const store = new PostgresReservationStore(createPool());
    let updatedReservationValues: unknown[] | undefined;
    let insertedOccupancyValues: unknown[] | undefined;
    const lockSteps: string[] = [];

    queryMock.mockImplementation(async (sql: string, values?: unknown[]) => {
      const normalized = sql.replace(/\s+/g, " ").trim().toLowerCase();

      if (isRuntimeBootstrapQuery(normalized)) {
        return { rows: [], rowCount: 0 };
      }

      if (normalized === "begin" || normalized === "commit" || normalized === "rollback") {
        return { rows: [], rowCount: 0 };
      }

      if (normalized === "select count(*)::int as count from bungalow") {
        return {
          rows: [{ count: 4 }],
          rowCount: 1,
        };
      }

      if (normalized.startsWith("insert into bungalow_public_content")) {
        return { rows: [], rowCount: 1 };
      }

      if (normalized === "select * from reservation where id = $1 limit 1") {
        return {
          rows: [
            {
              id: "reservation-demo-2",
              number: "RESERVATION-2026-0002",
              channel: "ota",
              status: "ota_imported_confirmed",
              source_request_id: null,
              bungalow_id: "bungalow-family",
              bungalow_unit_id: null,
              responsible_id: "user-reception-2",
              start_date: "2026-06-15",
              end_date: "2026-06-16",
              guest_name: null,
              guest_email: null,
              guest_phone: null,
              guest_count: null,
              source_provider: null,
              external_reservation_id: null,
              external_property_id: null,
              external_room_type_code: null,
              external_rate_plan_code: null,
              provider_status: null,
              provider_payload_checksum: null,
              provider_last_event_at: null,
              amount_total_cents: 24000,
              amount_paid_cents: 24000,
              payment_status: "paid",
              currency_code: "PEN",
              updated_at: "2026-06-14T10:00:00.000Z",
            },
          ],
          rowCount: 1,
        };
      }

      if (normalized === "select id, code, name, active, capacity from bungalow where id = $1 limit 1") {
        return {
          rows: [
            {
              id: "bungalow-family",
              code: "FAMILY",
              name: "Bungalow Familiar",
              active: true,
              capacity: 4,
            },
          ],
          rowCount: 1,
        };
      }

      if (
        normalized ===
        "select id, bungalow_id, code, name, active, sort_order, notes, version, created_at, updated_at from bungalow_unit where bungalow_id = $1 order by sort_order asc, code asc"
      ) {
        return {
          rows: [
            {
              id: "unit_fam_01",
              bungalow_id: "bungalow-family",
              code: "FAM-01",
              name: "Familiar 01",
              active: true,
              sort_order: 1,
              notes: null,
              version: 1,
              created_at: "2026-06-01T00:00:00.000Z",
              updated_at: "2026-06-01T00:00:00.000Z",
            },
            {
              id: "unit_fam_02",
              bungalow_id: "bungalow-family",
              code: "FAM-02",
              name: "Familiar 02",
              active: true,
              sort_order: 2,
              notes: null,
              version: 1,
              created_at: "2026-06-01T00:00:00.000Z",
              updated_at: "2026-06-01T00:00:00.000Z",
            },
          ],
          rowCount: 2,
        };
      }

      if (normalized === "select id from reservation where id = $1 for update") {
        lockSteps.push("reservation-row");
        return { rows: [{ id: "reservation-demo-2" }], rowCount: 1 };
      }

      if (normalized === "select pg_advisory_xact_lock(hashtext('bungalow-capacity:' || $1))") {
        lockSteps.push(`bungalow-capacity:${String(values?.[0] ?? "unknown")}`);
        return { rows: [], rowCount: 1 };
      }

      if (normalized.startsWith("select bungalow_id, total_units, version, updated_by, created_at, updated_at from bungalow_capacity")) {
        return {
          rows: [{
            bungalow_id: "bungalow-family",
            total_units: 5,
            version: 1,
            updated_by: null,
            created_at: "2026-06-01T00:00:00.000Z",
            updated_at: "2026-06-01T00:00:00.000Z",
          }],
          rowCount: 1,
        };
      }

      if (normalized.startsWith("select * from reservation where id <> $1 and bungalow_id = $2")) {
        return { rows: [], rowCount: 0 };
      }

      if (normalized.includes("from bungalow_unit_block block") && normalized.includes("block.status = 'active'")) {
        return { rows: [], rowCount: 0 };
      }

      if (normalized.includes("from bungalow_capacity_block") && normalized.includes("status = 'active'")) {
        return { rows: [], rowCount: 0 };
      }

      if (normalized === "delete from reservation_occupancy where reservation_id = $1") {
        return { rows: [], rowCount: 1 };
      }

      if (normalized.startsWith("update reservation set")) {
        updatedReservationValues = values as unknown[];
        return { rows: [], rowCount: 1 };
      }

      if (normalized.startsWith("insert into reservation_occupancy(")) {
        insertedOccupancyValues = values as unknown[];
        return { rows: [], rowCount: 1 };
      }

      if (
        normalized.startsWith("select id, public_ref, status, guest_name, guest_email, guest_phone") &&
        normalized.includes("from booking_request") &&
        normalized.includes("status not in ('converted_to_reservation', 'cancelled')")
      ) {
        return { rows: [], rowCount: 0 };
      }

      if (
        normalized.startsWith("select id, status, conflict_type, request_id, reservation_id, notes") &&
        normalized.includes("from availability_conflict") &&
        normalized.includes("where reservation_id = $1")
      ) {
        return { rows: [], rowCount: 0 };
      }

      if (normalized.startsWith("insert into reservation_audit(")) {
        return { rows: [], rowCount: 1 };
      }

      if (normalized.startsWith("select r.*, b.code as bungalow_code")) {
        return {
          rows: [
            {
              id: "reservation-demo-2",
              number: "RESERVATION-2026-0002",
              channel: "ota",
              status: "assigned",
              source_request_id: null,
              bungalow_id: "bungalow-family",
              bungalow_unit_id: updatedReservationValues?.[6] ?? null,
              responsible_id: "user-reception-2",
              start_date: "2026-06-15",
              end_date: "2026-06-16",
              guest_name: null,
              guest_email: null,
              guest_phone: null,
              guest_count: null,
              source_provider: null,
              external_reservation_id: null,
              external_property_id: null,
              external_room_type_code: null,
              external_rate_plan_code: null,
              provider_status: null,
              provider_payload_checksum: null,
              provider_last_event_at: null,
              amount_total_cents: 24000,
              amount_paid_cents: 24000,
              payment_status: "paid",
              currency_code: "PEN",
              updated_at: updatedReservationValues?.[26] ?? "2026-06-15T00:00:00.000Z",
              audit_count: 1,
              bungalow_code: "FAMILY",
              bungalow_name: "Bungalow Familiar",
              bungalow_active: true,
              bungalow_capacity: 4,
            },
          ],
          rowCount: 1,
        };
      }

      throw new Error(`Unexpected query: ${normalized}`);
    });

    const result = await store.assign("reservation-demo-2", {
      bungalowId: "bungalow-family",
      actorId: "user-admin-1",
      reason: "assign bungalow on arrival",
    });

    expect(result.status).toBe("assigned");
    expect(result.bungalowId).toBe("bungalow-family");
    expect(result.bungalowUnitId).toBeNull();
    expect(updatedReservationValues?.[6]).toBeNull();
    expect(insertedOccupancyValues?.[3]).toBeNull();
    expect(lockSteps).toEqual(["reservation-row", "bungalow-capacity:bungalow-family"]);
  });

  it("rejects an assignment when aggregate category capacity is sold out", async () => {
    const store = new PostgresReservationStore(createPool());

    queryMock.mockImplementation(async (sql: string) => {
      const normalized = sql.replace(/\s+/g, " ").trim().toLowerCase();

      if (isRuntimeBootstrapQuery(normalized)) {
        return { rows: [], rowCount: 0 };
      }

      if (normalized === "begin" || normalized === "commit" || normalized === "rollback") {
        return { rows: [], rowCount: 0 };
      }

      if (normalized === "select count(*)::int as count from bungalow") {
        return { rows: [{ count: 4 }], rowCount: 1 };
      }

      if (normalized.startsWith("insert into bungalow_public_content")) {
        return { rows: [], rowCount: 1 };
      }

      if (normalized === "select * from reservation where id = $1 limit 1") {
        return {
          rows: [
            {
              id: "reservation-demo-2",
              number: "RESERVATION-2026-0002",
              channel: "ota",
              status: "ota_imported_confirmed",
              source_request_id: null,
              bungalow_id: "bungalow-family",
              bungalow_unit_id: null,
              responsible_id: "user-reception-2",
              start_date: "2026-06-15",
              end_date: "2026-06-16",
              guest_name: null,
              guest_email: null,
              guest_phone: null,
              guest_count: null,
              source_provider: null,
              external_reservation_id: null,
              external_property_id: null,
              external_room_type_code: null,
              external_rate_plan_code: null,
              provider_status: null,
              provider_payload_checksum: null,
              provider_last_event_at: null,
              amount_total_cents: 24000,
              amount_paid_cents: 24000,
              payment_status: "paid",
              currency_code: "PEN",
              updated_at: "2026-06-14T10:00:00.000Z",
            },
          ],
          rowCount: 1,
        };
      }

      if (normalized === "select id, code, name, active, capacity from bungalow where id = $1 limit 1") {
        return {
          rows: [{ id: "bungalow-family", code: "FAMILY", name: "Bungalow Familiar", active: true, capacity: 4 }],
          rowCount: 1,
        };
      }

      if (
        normalized ===
        "select id, bungalow_id, code, name, active, sort_order, notes, version, created_at, updated_at from bungalow_unit where bungalow_id = $1 order by sort_order asc, code asc"
      ) {
        return {
          rows: [
            {
              id: "unit_fam_01",
              bungalow_id: "bungalow-family",
              code: "FAM-01",
              name: "Familiar 01",
              active: true,
              sort_order: 1,
              notes: null,
              version: 1,
              created_at: "2026-06-01T00:00:00.000Z",
              updated_at: "2026-06-01T00:00:00.000Z",
            },
            {
              id: "unit_fam_02",
              bungalow_id: "bungalow-family",
              code: "FAM-02",
              name: "Familiar 02",
              active: true,
              sort_order: 2,
              notes: null,
              version: 1,
              created_at: "2026-06-01T00:00:00.000Z",
              updated_at: "2026-06-01T00:00:00.000Z",
            },
          ],
          rowCount: 2,
        };
      }

      if (normalized === "select id from reservation where id = $1 for update") {
        return { rows: [{ id: "reservation-demo-2" }], rowCount: 1 };
      }

      if (normalized === "select pg_advisory_xact_lock(hashtext('bungalow-capacity:' || $1))") {
        return { rows: [], rowCount: 1 };
      }

      if (normalized.startsWith("select bungalow_id, total_units, version, updated_by, created_at, updated_at from bungalow_capacity")) {
        return {
          rows: [{
            bungalow_id: "bungalow-family",
            total_units: 2,
            version: 1,
            updated_by: null,
            created_at: "2026-06-01T00:00:00.000Z",
            updated_at: "2026-06-01T00:00:00.000Z",
          }],
          rowCount: 1,
        };
      }

      if (normalized.startsWith("select * from reservation where id <> $1 and bungalow_id = $2")) {
        return {
          rows: [
            {
              id: "reservation-existing-1",
              bungalow_id: "bungalow-family",
              status: "confirmed",
              start_date: "2026-06-15",
              end_date: "2026-06-16",
            },
            {
              id: "reservation-existing-2",
              bungalow_id: "bungalow-family",
              status: "ota_imported_confirmed",
              start_date: "2026-06-15",
              end_date: "2026-06-16",
            },
          ],
          rowCount: 2,
        };
      }

      throw new Error(`Unexpected query: ${normalized}`);
    });

    await expect(
      store.assign("reservation-demo-2", {
        bungalowId: "bungalow-family",
        actorId: "user-admin-1",
        reason: "assign bungalow on arrival",
      }),
    ).rejects.toThrow("bungalow_capacity_unavailable");
  });

  it("commits aggregate capacity when importing an OTA reservation with a mapped category", async () => {
    const store = new PostgresReservationStore(createPool());
    const insertedOccupancyValues: unknown[][] = [];
    let insertedReservationValues: unknown[] | undefined;

    queryMock.mockImplementation(async (sql: string, values?: unknown[]) => {
      const normalized = sql.replace(/\s+/g, " ").trim().toLowerCase();

      if (isRuntimeBootstrapQuery(normalized)) {
        return { rows: [], rowCount: 0 };
      }

      if (normalized === "begin" || normalized === "commit" || normalized === "rollback") {
        return { rows: [], rowCount: 0 };
      }

      if (normalized === "select count(*)::int as count from bungalow") {
        return { rows: [{ count: 4 }], rowCount: 1 };
      }

      if (normalized.startsWith("insert into bungalow_public_content")) {
        return { rows: [], rowCount: 1 };
      }

      if (normalized === "select pg_advisory_xact_lock(hashtext($1))") {
        return { rows: [], rowCount: 1 };
      }

      if (normalized === "select pg_advisory_xact_lock(hashtext('bungalow-capacity:' || $1))") {
        return { rows: [], rowCount: 1 };
      }

      if (normalized.startsWith("select bungalow_id, total_units, version, updated_by, created_at, updated_at from bungalow_capacity")) {
        return {
          rows: [{
            bungalow_id: "bungalow-family",
            total_units: 5,
            version: 1,
            updated_by: "user-admin-1",
            created_at: "2026-07-12T00:00:00.000Z",
            updated_at: "2026-07-12T00:00:00.000Z",
          }],
          rowCount: 1,
        };
      }

      if (normalized.includes("from bungalow_capacity_block") && normalized.includes("status = 'active'")) {
        return { rows: [], rowCount: 0 };
      }

      if (
        normalized ===
        "select bungalow_id from ota_room_mapping where connection_id = $1 and external_room_type_code = $2 limit 1"
      ) {
        return { rows: [{ bungalow_id: "bungalow-family" }], rowCount: 1 };
      }

      if (normalized.includes("from ota_reservation_link") && normalized.includes("external_reservation_id = $2")) {
        return { rows: [], rowCount: 0 };
      }

      if (normalized === "select number from reservation order by number asc") {
        return { rows: [{ number: "RESERVATION-2026-0008" }], rowCount: 1 };
      }

      if (
        normalized ===
        "select id, bungalow_id, code, name, active, sort_order, notes, version, created_at, updated_at from bungalow_unit where bungalow_id = $1 order by sort_order asc, code asc"
      ) {
        return {
          rows: [
            {
              id: "unit_fam_01",
              bungalow_id: "bungalow-family",
              code: "FAM-01",
              name: "Familiar 01",
              active: true,
              sort_order: 1,
              notes: null,
              version: 1,
              created_at: "2026-06-01T00:00:00.000Z",
              updated_at: "2026-06-01T00:00:00.000Z",
            },
            {
              id: "unit_fam_02",
              bungalow_id: "bungalow-family",
              code: "FAM-02",
              name: "Familiar 02",
              active: true,
              sort_order: 2,
              notes: null,
              version: 1,
              created_at: "2026-06-01T00:00:00.000Z",
              updated_at: "2026-06-01T00:00:00.000Z",
            },
          ],
          rowCount: 2,
        };
      }

      if (normalized.startsWith("select * from reservation where id <> $1 and bungalow_id = $2")) {
        return { rows: [], rowCount: 0 };
      }

      if (normalized.includes("from bungalow_unit_block block") && normalized.includes("block.status = 'active'")) {
        return { rows: [], rowCount: 0 };
      }

      if (normalized.startsWith("insert into reservation (")) {
        insertedReservationValues = values as unknown[];
        return { rows: [], rowCount: 1 };
      }

      if (normalized.startsWith("insert into reservation_occupancy(")) {
        insertedOccupancyValues.push([...(values ?? [])]);
        return { rows: [], rowCount: 1 };
      }

      if (
        normalized.startsWith("select id, public_ref, status, guest_name, guest_email, guest_phone") &&
        normalized.includes("from booking_request") &&
        normalized.includes("status not in ('converted_to_reservation', 'cancelled')")
      ) {
        return { rows: [], rowCount: 0 };
      }

      if (
        normalized.startsWith("select id, status, conflict_type, request_id, reservation_id, notes") &&
        normalized.includes("from availability_conflict") &&
        normalized.includes("where reservation_id = $1")
      ) {
        return { rows: [], rowCount: 0 };
      }

      if (
        normalized.startsWith("update availability_conflict") &&
        normalized.includes("coalesce(metadata->>'scope', '') = 'reservation_only'")
      ) {
        return { rows: [], rowCount: 0 };
      }

      if (normalized.startsWith("insert into ota_reservation_link")) {
        return { rows: [], rowCount: 1 };
      }

      if (normalized.startsWith("insert into ota_event_log")) {
        return { rows: [], rowCount: 1 };
      }

      if (normalized.startsWith("insert into reservation_audit(")) {
        return { rows: [], rowCount: 1 };
      }

      throw new Error(`Unexpected query: ${normalized}`);
    });

    const result = await store.importOtaReservation({
      connectionId: "connection-booking-1",
      sourceProvider: "booking_com",
      externalReservationId: "booking-res-201",
      externalPropertyId: "5571744",
      externalRoomTypeCode: "FAMILY",
      externalRatePlanCode: "BAR",
      providerStatus: "booked",
      providerPayloadChecksum: "checksum-booking-res-201",
      providerLastEventAt: "2026-07-10T09:00:00.000Z",
      guestName: "Ada Lovelace",
      guestEmail: "ada@example.com",
      guestPhone: "+51987654321",
      guestCount: 4,
      startDate: "2026-07-20",
      endDate: "2026-07-22",
      amountTotalCents: 56000,
      rawPayload: { reservationId: "booking-res-201" },
    });

    expect(result).toMatchObject({
      created: true,
      updated: false,
      pendingMapping: false,
      occupancyBlocked: true,
      bungalowTypeId: "bungalow-family",
      bungalowUnitId: null,
      inventoryStatus: "assigned",
      availabilityConflictId: null,
      idempotentReplay: false,
      conflictIds: [],
    });
    expect(insertedReservationValues?.[6]).toBeNull();
    expect(insertedOccupancyValues).toHaveLength(2);
    expect(insertedOccupancyValues[0]?.[3]).toBeNull();
    expect(insertedOccupancyValues[1]?.[3]).toBeNull();
  });

  it("creates a single open availability conflict when an OTA reservation arrives sold out", async () => {
    const store = new PostgresReservationStore(createPool());
    const insertedOccupancyValues: unknown[][] = [];
    let insertedConflictValues: unknown[] | undefined;

    queryMock.mockImplementation(async (sql: string, values?: unknown[]) => {
      const normalized = sql.replace(/\s+/g, " ").trim().toLowerCase();

      if (isRuntimeBootstrapQuery(normalized)) {
        return { rows: [], rowCount: 0 };
      }

      if (normalized === "begin" || normalized === "commit" || normalized === "rollback") {
        return { rows: [], rowCount: 0 };
      }

      if (normalized === "select count(*)::int as count from bungalow") {
        return { rows: [{ count: 4 }], rowCount: 1 };
      }

      if (normalized.startsWith("insert into bungalow_public_content")) {
        return { rows: [], rowCount: 1 };
      }

      if (normalized === "select pg_advisory_xact_lock(hashtext($1))") {
        return { rows: [], rowCount: 1 };
      }

      if (normalized === "select pg_advisory_xact_lock(hashtext('bungalow-capacity:' || $1))") {
        return { rows: [], rowCount: 1 };
      }

      if (normalized.startsWith("select bungalow_id, total_units, version, updated_by, created_at, updated_at from bungalow_capacity")) {
        return {
          rows: [{
            bungalow_id: "bungalow-family",
            total_units: 2,
            version: 1,
            updated_by: "user-admin-1",
            created_at: "2026-07-12T00:00:00.000Z",
            updated_at: "2026-07-12T00:00:00.000Z",
          }],
          rowCount: 1,
        };
      }

      if (normalized.includes("from bungalow_capacity_block") && normalized.includes("status = 'active'")) {
        return { rows: [], rowCount: 0 };
      }

      if (
        normalized ===
        "select bungalow_id from ota_room_mapping where connection_id = $1 and external_room_type_code = $2 limit 1"
      ) {
        return { rows: [{ bungalow_id: "bungalow-family" }], rowCount: 1 };
      }

      if (normalized.includes("from ota_reservation_link") && normalized.includes("external_reservation_id = $2")) {
        return { rows: [], rowCount: 0 };
      }

      if (normalized === "select number from reservation order by number asc") {
        return { rows: [{ number: "RESERVATION-2026-0008" }], rowCount: 1 };
      }

      if (
        normalized ===
        "select id, bungalow_id, code, name, active, sort_order, notes, version, created_at, updated_at from bungalow_unit where bungalow_id = $1 order by sort_order asc, code asc"
      ) {
        return {
          rows: [
            {
              id: "unit_fam_01",
              bungalow_id: "bungalow-family",
              code: "FAM-01",
              name: "Familiar 01",
              active: true,
              sort_order: 1,
              notes: null,
              version: 1,
              created_at: "2026-06-01T00:00:00.000Z",
              updated_at: "2026-06-01T00:00:00.000Z",
            },
            {
              id: "unit_fam_02",
              bungalow_id: "bungalow-family",
              code: "FAM-02",
              name: "Familiar 02",
              active: true,
              sort_order: 2,
              notes: null,
              version: 1,
              created_at: "2026-06-01T00:00:00.000Z",
              updated_at: "2026-06-01T00:00:00.000Z",
            },
          ],
          rowCount: 2,
        };
      }

      if (normalized.startsWith("select * from reservation where id <> $1 and bungalow_id = $2")) {
        return {
          rows: [
            {
              id: "reservation-existing-1",
              number: "RESERVATION-2026-0101",
              bungalow_id: "bungalow-family",
              bungalow_unit_id: "unit_fam_01",
              start_date: "2026-07-20",
              end_date: "2026-07-22",
              status: "assigned",
            },
            {
              id: "reservation-existing-2",
              number: "RESERVATION-2026-0102",
              bungalow_id: "bungalow-family",
              bungalow_unit_id: "unit_fam_02",
              start_date: "2026-07-20",
              end_date: "2026-07-22",
              status: "assigned",
            },
          ],
          rowCount: 2,
        };
      }

      if (normalized.includes("from bungalow_unit_block block") && normalized.includes("block.status = 'active'")) {
        return { rows: [], rowCount: 0 };
      }

      if (normalized.startsWith("insert into reservation (")) {
        return { rows: [], rowCount: 1 };
      }

      if (
        normalized.startsWith("select id, status, conflict_type, request_id, reservation_id, notes") &&
        normalized.includes("from availability_conflict") &&
        normalized.includes("request_id is null") &&
        normalized.includes("coalesce(metadata->>'scope', '') = 'reservation_only'")
      ) {
        return { rows: [], rowCount: 0 };
      }

      if (normalized.startsWith("insert into availability_conflict(")) {
        insertedConflictValues = values as unknown[];
        return { rows: [], rowCount: 1 };
      }

      if (
        normalized.startsWith("select id, public_ref, status, guest_name, guest_email, guest_phone") &&
        normalized.includes("from booking_request") &&
        normalized.includes("status not in ('converted_to_reservation', 'cancelled')")
      ) {
        return { rows: [], rowCount: 0 };
      }

      if (
        normalized.startsWith("select id, status, conflict_type, request_id, reservation_id, notes") &&
        normalized.includes("from availability_conflict") &&
        normalized.includes("where reservation_id = $1")
      ) {
        return {
          rows: insertedConflictValues
            ? [
                {
                  id: insertedConflictValues[0],
                  status: "open",
                  conflict_type: "assignment_overlap",
                  request_id: null,
                  reservation_id: insertedConflictValues[4],
                  notes: insertedConflictValues[5],
                  created_by: insertedConflictValues[6],
                  resolved_by: null,
                  created_at: insertedConflictValues[8],
                  resolved_at: null,
                  metadata: JSON.parse(String(insertedConflictValues[10])),
                },
              ]
            : [],
          rowCount: insertedConflictValues ? 1 : 0,
        };
      }

      if (normalized.startsWith("insert into ota_reservation_link")) {
        return { rows: [], rowCount: 1 };
      }

      if (normalized.startsWith("insert into ota_event_log")) {
        return { rows: [], rowCount: 1 };
      }

      if (normalized.startsWith("insert into reservation_audit(")) {
        return { rows: [], rowCount: 1 };
      }

      if (normalized.startsWith("insert into reservation_occupancy(")) {
        insertedOccupancyValues.push([...(values ?? [])]);
        return { rows: [], rowCount: 1 };
      }

      throw new Error(`Unexpected query: ${normalized}`);
    });

    const result = await store.importOtaReservation({
      connectionId: "connection-booking-1",
      sourceProvider: "booking_com",
      externalReservationId: "booking-res-202",
      externalPropertyId: "5571744",
      externalRoomTypeCode: "FAMILY",
      externalRatePlanCode: "BAR",
      providerStatus: "booked",
      providerPayloadChecksum: "checksum-booking-res-202",
      providerLastEventAt: "2026-07-10T09:30:00.000Z",
      guestName: "Grace Hopper",
      guestEmail: "grace@example.com",
      guestPhone: "+51981234567",
      guestCount: 4,
      startDate: "2026-07-20",
      endDate: "2026-07-22",
      amountTotalCents: 56000,
      rawPayload: { reservationId: "booking-res-202" },
    });

    expect(result.created).toBe(true);
    expect(result.updated).toBe(false);
    expect(result.pendingMapping).toBe(false);
    expect(result.occupancyBlocked).toBe(false);
    expect(result.bungalowTypeId).toBe("bungalow-family");
    expect(result.bungalowUnitId).toBeNull();
    expect(result.inventoryStatus).toBe("conflict");
    expect(result.availabilityConflictId).toBeTruthy();
    expect(result.conflictIds).toEqual([result.availabilityConflictId]);
    expect(result.idempotentReplay).toBe(false);
    expect(insertedOccupancyValues).toHaveLength(0);
  });

  it("bootstraps bungalow public content even when the bungalow inventory already exists", async () => {
    const store = new PostgresReservationStore(createPool());
    const publicContentInserts: Array<unknown[]> = [];

    queryMock.mockImplementation(async (sql: string, values?: unknown[]) => {
      const normalized = sql.replace(/\s+/g, " ").trim().toLowerCase();

      if (isRuntimeBootstrapQuery(normalized)) {
        return { rows: [], rowCount: 0 };
      }

      if (normalized === "select count(*)::int as count from bungalow") {
        return {
          rows: [{ count: 4 }],
          rowCount: 1,
        };
      }

      if (normalized.startsWith("insert into bungalow_public_content")) {
        publicContentInserts.push(values ?? []);
        return {
          rows: [],
          rowCount: 1,
        };
      }

      if (normalized.includes("from bungalow_public_content") && normalized.includes("order by sort_order asc")) {
        return {
          rows: [
            {
              bungalow_id: "bungalow-family",
              featured_on_home: true,
              sort_order: 1,
              hero_image_url: "https://wakayaecolodge.com/es/images/wakaya/habitaciones/BF_1.jpg",
              gallery_urls: ["https://wakayaecolodge.com/es/images/wakaya/habitaciones/BF_1.jpg"],
              nightly_rate_pen: 350,
              area_sqm: 55,
              locale_content: {
                es: {
                  displayName: "Bungalow Familiar",
                  displayEyebrow: "Wakaya Ecolodge · Pucallpa",
                  displayDescription: "Dos habitaciones independientes.",
                  displayTagline: "El hogar de la familia en la selva",
                  displayLongDescription: "Más espacio para viajar en familia.",
                  displayHighlights: ["Dos dormitorios"],
                  displayAmenities: ["WiFi"],
                  displayIncluded: ["Desayuno"],
                },
                en: {
                  displayName: "Family Bungalow",
                  displayEyebrow: "Wakaya Ecolodge · Pucallpa",
                  displayDescription: "Two separate bedrooms.",
                  displayTagline: "The family home in the jungle",
                  displayLongDescription: "More space for family trips.",
                  displayHighlights: ["Two bedrooms"],
                  displayAmenities: ["WiFi"],
                  displayIncluded: ["Breakfast"],
                },
              },
              updated_at: "2026-07-02T00:00:00.000Z",
            },
          ],
          rowCount: 1,
        };
      }

      throw new Error(`Unexpected query: ${normalized}`);
    });

    const items = await store.listBungalowPublicContent();

    expect(items).toHaveLength(1);
    expect(publicContentInserts).toHaveLength(5);
    expect(publicContentInserts[0]?.[0]).toBe("bungalow-family");
  });

  it("creates booking requests with a requested experience reference when present", async () => {
    const store = new PostgresReservationStore(createPool());
    let insertBookingRequestValues: unknown[] | undefined;

    queryMock.mockImplementation(async (sql: string, values?: unknown[]) => {
      const normalized = sql.replace(/\s+/g, " ").trim().toLowerCase();

      if (isRuntimeBootstrapQuery(normalized)) {
        return { rows: [], rowCount: 0 };
      }

      if (normalized === "select count(*)::int as count from bungalow") {
        return {
          rows: [{ count: 4 }],
          rowCount: 1,
        };
      }

      if (normalized === "begin" || normalized === "commit" || normalized === "rollback") {
        return { rows: [], rowCount: 0 };
      }

      if (normalized.startsWith("insert into bungalow_public_content")) {
        return { rows: [], rowCount: 1 };
      }

      if (normalized.includes("lock table booking_request in share row exclusive mode")) {
        return { rows: [], rowCount: 0 };
      }

      if (
        normalized.includes("select public_ref") &&
        normalized.includes("from booking_request") &&
        normalized.includes("union")
      ) {
        return { rows: [], rowCount: 0 };
      }

      if (normalized.startsWith("insert into message_thread(")) {
        return { rows: [], rowCount: 1 };
      }

      if (normalized.startsWith("insert into booking_request(")) {
        insertBookingRequestValues = values as unknown[];
        return { rows: [], rowCount: 1 };
      }

      throw new Error(`Unexpected query: ${normalized}`);
    });

    const result = await store.createBookingRequest({
      guestName: "Ada Lovelace",
      guestEmail: "ada@example.com",
      guestPhone: "+51987654321",
      requestedCheckIn: "2026-07-20",
      requestedCheckOut: "2026-07-22",
      requestedGuests: 2,
      requestedBungalowType: "bungalow-suite",
      requestedExperienceId: "exp_01",
      notes: "Llegan por la experiencia de laguna.",
    });

    expect(result.bookingRequest.requestedExperienceId).toBe("exp_01");
    expect(insertBookingRequestValues?.[10]).toBe("exp_01");
  });

  it("ensures the complaint schema exists before listing complaints", async () => {
    const store = new PostgresReservationStore(createPool());
    let complaintSchemaReady = false;

    queryMock.mockImplementation(async (sql: string, _values?: unknown[]) => {
      const normalized = sql.replace(/\s+/g, " ").trim().toLowerCase();

      if (isRuntimeBootstrapQuery(normalized)) {
        return { rows: [], rowCount: 0 };
      }

      if (normalized === "select count(*)::int as count from bungalow") {
        return {
          rows: [{ count: 4 }],
          rowCount: 1,
        };
      }

      if (normalized.startsWith("insert into bungalow_public_content")) {
        return {
          rows: [],
          rowCount: 1,
        };
      }

      if (normalized.startsWith("create table if not exists complaint_case")) {
        complaintSchemaReady = true;
        return {
          rows: [],
          rowCount: 0,
        };
      }

      if (normalized.startsWith("create index if not exists idx_complaint_case_status_updated_at")) {
        return {
          rows: [],
          rowCount: 0,
        };
      }

      if (normalized.startsWith("create index if not exists idx_complaint_case_created_at")) {
        return {
          rows: [],
          rowCount: 0,
        };
      }

      if (normalized.includes("from complaint_case") && normalized.includes("order by updated_at desc")) {
        if (!complaintSchemaReady) {
          throw new Error('relation "complaint_case" does not exist');
        }

        return {
          rows: [],
          rowCount: 0,
        };
      }

      throw new Error(`Unexpected query: ${normalized}`);
    });

    await expect(store.listComplaints()).resolves.toEqual([]);
  });

  it("creates a complaint with a generated public tracking code", async () => {
    const store = new PostgresReservationStore(createPool());
    let complaintInsertValues: unknown[] | undefined;

    queryMock.mockImplementation(async (sql: string, values?: unknown[]) => {
      const normalized = sql.replace(/\s+/g, " ").trim().toLowerCase();

      if (isRuntimeBootstrapQuery(normalized)) {
        return { rows: [], rowCount: 0 };
      }

      if (normalized === "select count(*)::int as count from bungalow") {
        return {
          rows: [{ count: 4 }],
          rowCount: 1,
        };
      }

      if (normalized === "begin" || normalized === "commit" || normalized === "rollback") {
        return { rows: [], rowCount: 0 };
      }

      if (normalized.startsWith("insert into bungalow_public_content")) {
        return { rows: [], rowCount: 1 };
      }

      if (normalized.startsWith("create table if not exists complaint_case")) {
        return { rows: [], rowCount: 0 };
      }

      if (normalized.startsWith("create index if not exists idx_complaint_case_status_updated_at")) {
        return { rows: [], rowCount: 0 };
      }

      if (normalized.startsWith("create index if not exists idx_complaint_case_created_at")) {
        return { rows: [], rowCount: 0 };
      }

      if (normalized === "select public_code from complaint_case") {
        return {
          rows: [{ public_code: "LRC-2026-0007" }],
          rowCount: 1,
        };
      }

      if (normalized.startsWith("insert into complaint_case (")) {
        complaintInsertValues = values as unknown[];
        return { rows: [], rowCount: 1 };
      }

      if (
        normalized.includes("from complaint_case") &&
        normalized.includes("where id = $1") &&
        normalized.includes("limit 1")
      ) {
        return {
          rows: [
            {
              id: complaintInsertValues?.[0],
              public_code: complaintInsertValues?.[1],
              type: "reclamo",
              status: "submitted",
              full_name: "Ada Lovelace",
              document_type: "dni",
              document_number: "12345678",
              email: "ada@example.com",
              phone: "+51987654321",
              address: "Jr. Ucayali 123, Pucallpa",
              service_type: "lodging",
              contracted_service: "Estadia en bungalow matrimonial",
              complaint_detail: "La habitacion no estuvo lista al llegar.",
              consumer_request: "Solicito una respuesta formal y compensacion.",
              accepted_declaration: true,
              created_at: complaintInsertValues?.[15],
              updated_at: complaintInsertValues?.[16],
            },
          ],
          rowCount: 1,
        };
      }

      throw new Error(`Unexpected query: ${normalized}`);
    });

    const result = await store.createComplaint({
      type: "reclamo",
      fullName: "Ada Lovelace",
      documentType: "dni",
      documentNumber: "12345678",
      email: "ada@example.com",
      phone: "+51987654321",
      address: "Jr. Ucayali 123, Pucallpa",
      serviceType: "lodging",
      contractedService: "Estadia en bungalow matrimonial",
      complaintDetail: "La habitacion no estuvo lista al llegar.",
      consumerRequest: "Solicito una respuesta formal y compensacion.",
      acceptedDeclaration: true,
    });

    expect(result.complaint.publicCode).toBe("LRC-2026-0008");
    expect(result.complaint.status).toBe("submitted");
    expect(complaintInsertValues?.[13]).toBe("Solicito una respuesta formal y compensacion.");
    expect(complaintInsertValues?.[14]).toBe(true);
    expect(releaseMock).toHaveBeenCalledTimes(1);
  });
});
