import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { ReservationStore } from "@/lib/reservations/store";

describe("reservation store persistence", () => {
  it("persists reservations across store instances when a storage path is provided", () => {
    const dir = mkdtempSync(join(tmpdir(), "wakaya-reservations-"));
    const dbPath = join(dir, "reservations.sqlite");

    try {
      const first = new ReservationStore({ storagePath: dbPath });
      const created = first.create({
        number: "RESERVATION-2026-0200",
        channel: "web",
        bungalowId: "bungalow-family",
        responsibleId: "user-reception-1",
        startDate: "2026-08-10",
        endDate: "2026-08-12",
      });

      const second = new ReservationStore({ storagePath: dbPath });
      expect(second.get(created.reservation.id)?.number).toBe("RESERVATION-2026-0200");
      expect(second.getAuditTrail(created.reservation.id)).toHaveLength(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
