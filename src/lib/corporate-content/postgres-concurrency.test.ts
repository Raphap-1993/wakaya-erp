import { randomUUID } from "node:crypto";

import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { DEFAULT_CORPORATE_CONTENT } from "./default-content";
import { PostgresCorporateContentStore } from "./store";

const hasDatabase = Boolean(process.env.DATABASE_URL?.trim());

describe.skipIf(!hasDatabase)("PostgresCorporateContentStore concurrency", () => {
  const schema = `corporate_content_test_${randomUUID().replaceAll("-", "")}`;
  let adminPool: Pool;
  let testPool: Pool;
  let store: PostgresCorporateContentStore;

  beforeAll(async () => {
    adminPool = new Pool({ connectionString: process.env.DATABASE_URL });
    await adminPool.query(`create schema "${schema}"`);

    testPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      options: `-c search_path=${schema},public`,
      max: 4,
    });
    await testPool.query(`
      create table corporate_content_revision (
        version bigserial primary key,
        document jsonb not null,
        published_by_user_id text,
        restored_from_version bigint references corporate_content_revision(version),
        created_at timestamptz not null default now()
      )
    `);
    store = new PostgresCorporateContentStore(testPool);
  });

  afterAll(async () => {
    await testPool?.end();
    if (adminPool) {
      await adminPool.query(`drop schema if exists "${schema}" cascade`);
      await adminPool.end();
    }
  });

  it("accepts exactly one of two simultaneous publications from the same version", async () => {
    const left = structuredClone(DEFAULT_CORPORATE_CONTENT);
    left.contact.hours.es = "Lun–Dom · 7:00 — 20:01";
    const right = structuredClone(DEFAULT_CORPORATE_CONTENT);
    right.contact.hours.es = "Lun–Dom · 7:00 — 20:02";

    const results = await Promise.allSettled([
      store.publish({ document: left, expectedVersion: 0, actorId: "left" }),
      store.publish({ document: right, expectedVersion: 0, actorId: "right" }),
    ]);

    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");
    const published = await store.getPublished();

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]).toMatchObject({
      reason: expect.objectContaining({ message: "corporate_content_version_conflict" }),
    });
    expect(published.revisionVersion).toBe(1);
  });
});
