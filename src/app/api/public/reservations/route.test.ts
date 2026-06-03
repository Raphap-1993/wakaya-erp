import { describe, expect, it } from "vitest";

import { POST } from "./route";

describe("POST /api/public/reservations", () => {
  it("creates a public web reservation with a server-generated number", async () => {
    const response = await POST(
      new Request("http://localhost/api/public/reservations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          bungalowId: "bungalow-suite",
          startDate: "2026-07-20",
          endDate: "2026-07-21",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.reservation.status).toBe("pending_review");
    expect(body.reservation.number).toMatch(/^RESERVATION-\d{4}-\d{4}$/);
    expect(body.occupancy).toHaveLength(2);
  });

  it("rejects non-object JSON payloads", async () => {
    const response = await POST(
      new Request("http://localhost/api/public/reservations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(["bungalow-suite"]),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("invalid_payload");
  });
});
