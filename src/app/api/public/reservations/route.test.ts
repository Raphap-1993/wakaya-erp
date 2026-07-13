import { describe, expect, it } from "vitest";

import { POST } from "./route";

describe("POST /api/public/reservations", () => {
  it("keeps the legacy route as a booking-request compatibility shim", async () => {
    const response = await POST(
      new Request("http://localhost/api/public/reservations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          guestName: "Ada Lovelace",
          guestEmail: "ada@example.com",
          guestPhone: "+51987654321",
          requestedCheckIn: "2026-07-20",
          requestedCheckOut: "2026-07-21",
          requestedGuests: 2,
          requestedBungalowType: "bungalow-suite",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.bookingRequest.status).toBe("awaiting_transfer");
    expect(body.bookingRequest.publicRef).toMatch(/^WR-\d{4}-\d{4}$/);
    expect(body.email.status).toBe("queued");
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
