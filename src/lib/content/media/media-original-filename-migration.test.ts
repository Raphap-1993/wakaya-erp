import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = resolve(
  process.cwd(),
  "db/migrations/013_media_original_filename.sql",
);

describe("media original filename migration", () => {
  it("adds an optional original_filename column to media_asset", () => {
    expect(existsSync(migrationPath), "migration 013 must exist").toBe(true);
    if (!existsSync(migrationPath)) {
      return;
    }

    const normalizedSql = readFileSync(migrationPath, "utf8").replace(/\s+/g, " ").trim();

    expect(normalizedSql).toBe(
      "alter table media_asset add column if not exists original_filename text;",
    );
    expect(normalizedSql).not.toMatch(/alter\s+table\s+if\s+exists/i);
  });
});
