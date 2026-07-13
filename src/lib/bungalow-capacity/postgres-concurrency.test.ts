import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PostgresReservationStore } from "@/lib/reservations/postgres-repository";
import { APPROVED_BUNGALOW_CAPACITIES } from "./seed";
import { PostgresBungalowCapacityStore } from "./store";

const hasDatabase = Boolean(process.env.DATABASE_URL?.trim());

describe.skipIf(!hasDatabase)("PostgresBungalowCapacityStore concurrency", () => {
  const schema = `bungalow_capacity_test_${randomUUID().replaceAll("-", "")}`;
  let adminPool: Pool;
  let testPool: Pool;
  let store: PostgresBungalowCapacityStore;

  beforeAll(async () => {
    adminPool = new Pool({ connectionString: process.env.DATABASE_URL });
    await adminPool.query(`create schema "${schema}"`);

    testPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      options: `-c search_path=${schema},public`,
      max: 4,
    });
    await testPool.query(`create table bungalow (id text primary key)`);
    await testPool.query(`
      create table reservation (
        id text primary key,
        bungalow_id text not null references bungalow(id),
        start_date date not null,
        end_date date not null,
        status text not null
      )
    `);
    for (const seed of APPROVED_BUNGALOW_CAPACITIES) {
      await testPool.query(`insert into bungalow (id) values ($1)`, [seed.bungalowId]);
    }
    store = new PostgresBungalowCapacityStore(testPool);
  });

  afterAll(async () => {
    await testPool?.end();
    if (adminPool) {
      await adminPool.query(`drop schema if exists "${schema}" cascade`);
      await adminPool.end();
    }
  });

  it("accepts exactly one of two simultaneous updates from the same version", async () => {
    const target = APPROVED_BUNGALOW_CAPACITIES[0];
    const input = { totalUnits: target.totalUnits + 1, expectedVersion: 1 };

    const results = await Promise.allSettled([
      store.updateCapacity(target.bungalowId, { ...input, actorId: "left" }),
      store.updateCapacity(target.bungalowId, { ...input, actorId: "right" }),
    ]);

    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");
    const saved = await store.getCapacity(target.bungalowId);

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]).toMatchObject({
      reason: expect.objectContaining({ message: "capacity_version_conflict" }),
    });
    expect(saved).toMatchObject({ totalUnits: target.totalUnits + 1, version: 2 });
  });
});

describe.skipIf(!hasDatabase)("PostgresReservationStore capacity concurrency", () => {
  const schema = `reservation_capacity_test_${randomUUID().replaceAll("-", "")}`;
  let adminPool: Pool;
  let testPool: Pool;
  let store: PostgresReservationStore;

  beforeAll(async () => {
    adminPool = new Pool({ connectionString: process.env.DATABASE_URL });
    await adminPool.query(`create schema "${schema}"`);

    testPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      options: `-c search_path=${schema},public`,
      max: 6,
    });

    for (const migration of [
      "001_hybrid_reservations.sql",
      "002_mail_threads_and_conflicts.sql",
      "003_backoffice_auth.sql",
      "004_bungalow_public_content.sql",
      "005_complaint_case.sql",
      "006_zoho_inbox_workbench.sql",
      "007_ota_platform.sql",
      "008_home_content.sql",
      "009_public_content_hub.sql",
      "010_bungalow_unit_inventory.sql",
      "011_corporate_content.sql",
    ]) {
      await testPool.query(readFileSync(resolve(process.cwd(), "db/migrations", migration), "utf8"));
    }

    await testPool.query(
      `insert into bungalow (id, code, name, active, capacity) values ('bungalow-suite', 'DOUBLE', 'Bungalow Doble', true, 2)`,
    );
    await testPool.query(`
      create table bungalow_capacity (
        bungalow_id text primary key references bungalow(id),
        total_units integer not null check (total_units >= 0),
        version integer not null default 1,
        updated_by text,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `);
    await testPool.query(
      `insert into bungalow_capacity (bungalow_id, total_units, updated_by) values ('bungalow-suite', 2, 'test')`,
    );
    store = new PostgresReservationStore(testPool);
  });

  afterAll(async () => {
    await testPool?.end();
    if (adminPool) {
      await adminPool.query(`drop schema if exists "${schema}" cascade`);
      await adminPool.end();
    }
  });

  it("accepts exactly two of three simultaneous Doble confirmations", async () => {
    const results = await Promise.allSettled(
      [1, 2, 3].map((index) =>
        store.create({
          number: `CONCURRENT-DOUBLE-${index}`,
          channel: "ota",
          bungalowId: "bungalow-suite",
          actorId: `concurrency-${index}`,
          responsibleId: `concurrency-${index}`,
          startDate: "2026-08-20",
          endDate: "2026-08-22",
        }),
      ),
    );

    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");
    const saved = await testPool.query<{ count: number }>(
      `select count(*)::int as count from reservation where bungalow_id = 'bungalow-suite' and status = 'ota_imported_confirmed'`,
    );

    expect(fulfilled).toHaveLength(2);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]).toMatchObject({
      reason: expect.objectContaining({ message: "bungalow_capacity_unavailable" }),
    });
    expect(saved.rows[0]?.count).toBe(2);
  });
});
