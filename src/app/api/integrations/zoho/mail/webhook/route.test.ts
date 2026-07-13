import { createHmac } from "node:crypto";

import { beforeEach, describe, expect, it, vi } from "vitest";

const { listBookingRequestsMock, syncBookingRequestThreadMock } = vi.hoisted(() => ({
  listBookingRequestsMock: vi.fn(),
  syncBookingRequestThreadMock: vi.fn(),
}));

vi.mock("@/lib/reservations/store", () => ({
  reservationStore: {
    listBookingRequests: listBookingRequestsMock,
    syncBookingRequestThread: syncBookingRequestThreadMock,
  },
}));

import { POST } from "./route";

describe("POST /api/integrations/zoho/mail/webhook", () => {
  beforeEach(() => {
    process.env.ZOHO_WEBHOOK_SECRET = "whsec_test";
    listBookingRequestsMock.mockReset();
    syncBookingRequestThreadMock.mockReset();
  });

  it("accepts a valid webhook and triggers a thread sync", async () => {
    listBookingRequestsMock.mockResolvedValue([
      {
        id: "request-1",
        publicRef: "WR-2026-0001",
        threadKey: "booking-request:WR-2026-0001",
      },
    ]);
    syncBookingRequestThreadMock.mockResolvedValue({});

    const body = JSON.stringify({
      subject: "Re: Solicitud WR-2026-0001",
    });
    const signature = createHmac("sha256", "whsec_test").update(body).digest("hex");

    const response = await POST(
      new Request("http://localhost/api/integrations/zoho/mail/webhook", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-hook-signature": signature,
        },
        body,
      }),
    );

    expect(response.status).toBe(202);
    expect(syncBookingRequestThreadMock).toHaveBeenCalledWith("request-1");
  });
});
