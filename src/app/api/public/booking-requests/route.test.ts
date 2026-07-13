import { beforeEach, describe, expect, it } from "vitest";

import { POST } from "./route";

describe("POST /api/public/booking-requests", () => {
  beforeEach(() => {
    delete process.env.RESEND_API_KEY;
  });

  it("creates a booking request and queues the initial transfer email", async () => {
    const response = await POST(
      new Request("http://localhost/api/public/booking-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          guestName: "Ada Lovelace",
          guestEmail: "ada@example.com",
          guestPhone: "+51987654321",
          requestedCheckIn: "2026-07-10",
          requestedCheckOut: "2026-07-12",
          requestedGuests: 2,
          requestedBungalowType: "bungalow-matrimonial",
          requestedExperienceId: "exp_02",
        }),
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      bookingRequest: {
        status: "awaiting_transfer",
        publicRef: expect.stringMatching(/^WR-\d{4}-\d{4}$/),
        requestedExperienceId: "exp_02",
      },
      email: { status: "queued" },
      delivery: { status: "queued_without_provider", provider: "none" },
    });
  });
});
