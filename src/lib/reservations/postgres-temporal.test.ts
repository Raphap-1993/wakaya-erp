import { describe, expect, it } from "vitest";

import { normalizePgDateOnly, normalizePgTimestamp } from "./postgres-temporal";

describe("normalizePgDateOnly", () => {
  it("converts Date objects from PostgreSQL date columns into YYYY-MM-DD strings", () => {
    expect(normalizePgDateOnly(new Date("2026-07-23T05:00:00.000Z"))).toBe("2026-07-23");
  });

  it("keeps already-normalized date-only strings intact", () => {
    expect(normalizePgDateOnly("2026-07-23")).toBe("2026-07-23");
  });
});

describe("normalizePgTimestamp", () => {
  it("converts Date objects from PostgreSQL timestamp columns into ISO strings", () => {
    expect(normalizePgTimestamp(new Date("2026-07-23T05:00:00.000Z"))).toBe("2026-07-23T05:00:00.000Z");
  });

  it("keeps null values as null", () => {
    expect(normalizePgTimestamp(null)).toBeNull();
  });
});
