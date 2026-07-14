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

    const sql = readFileSync(migrationPath, "utf8");
    const statement = sql.match(
      /alter\s+table(?:\s+if\s+exists)?\s+media_asset\s+add\s+column\s+if\s+not\s+exists\s+original_filename\s+text\s*;/i,
    )?.[0];

    expect(statement).toBeDefined();
    expect(statement).not.toMatch(/\bnot\s+null\b/i);
  });
});
