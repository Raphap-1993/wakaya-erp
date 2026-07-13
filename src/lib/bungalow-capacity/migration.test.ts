import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = resolve(process.cwd(), "db/migrations/012_bungalow_capacity_inventory.sql");

describe("migration 012 bungalow capacity", () => {
  it("creates aggregate capacity and audited quantity blocks", () => {
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain("create table if not exists bungalow_capacity");
    expect(sql).toContain("create table if not exists bungalow_capacity_block");
    expect(sql).toContain("check (total_units >= 0)");
    expect(sql).toContain("check (quantity > 0)");
    expect(sql).toContain("legacy_unit_block_id uuid unique");
  });

  it("validates the five legacy active totals before seeding 17 aggregate units", () => {
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain("bungalow_capacity_legacy_count_mismatch");
    expect(sql).toContain("('bungalow-family', 5)");
    expect(sql).toContain("('bungalow-matrimonial', 4)");
    expect(sql).toContain("('bungalow-individual', 5)");
    expect(sql).toContain("('bungalow-suite', 2)");
    expect(sql).toContain("('bungalow-triple', 1)");
  });

  it("copies every legacy block as quantity one while preserving its audit", () => {
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain("from bungalow_unit_block legacy_block");
    expect(sql).toContain("inner join bungalow_unit legacy_unit");
    expect(sql).toMatch(/legacy_unit\.bungalow_id,\s*1,/);
    expect(sql).toContain("legacy_block.cancelled_by");
    expect(sql).toContain("on conflict (legacy_unit_block_id) do nothing");
  });
});
