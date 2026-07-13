import { beforeEach, describe, expect, it, vi } from "vitest";

const { requirePermissionMock } = vi.hoisted(() => ({
  requirePermissionMock: vi.fn(),
}));

vi.mock("@/middleware/authn", () => ({
  requirePermission: requirePermissionMock,
}));

async function loadRoute() {
  requirePermissionMock.mockResolvedValue({
    authenticated: true,
    roles: ["admin"],
    subject: "user-admin-1",
  });
  return import("./route");
}

describe("GET /api/booking-requests/[id]", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
  });

  it("returns the booking request thread view", async () => {
    const { GET } = await loadRoute();
    const response = await GET(
      new Request("http://localhost/api/booking-requests/request-1"),
      { params: { id: "request-1" } },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.bookingRequest.id).toBe("request-1");
  });
});

describe("PUT /api/booking-requests/[id]", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
  });

  it("reprograms the request and returns the refreshed operational thread view", async () => {
    const { PUT, GET } = await loadRoute();
    const response = await PUT(
      new Request("http://localhost/api/booking-requests/request-1", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          requestedCheckIn: "2026-07-14",
          requestedCheckOut: "2026-07-15",
          requestedBungalowType: "bungalow-suite",
          requestedExperienceId: "exp_02",
          notes: "Cliente acepta moverse un día.",
          reason: "conflicto operacional",
        }),
      }),
      { params: { id: "request-1" } },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.bookingRequest.requestedCheckIn).toBe("2026-07-14");
    expect(body.bookingRequest.requestedCheckOut).toBe("2026-07-15");
    expect(body.bookingRequest.requestedExperienceId).toBe("exp_02");

    const detailResponse = await GET(
      new Request("http://localhost/api/booking-requests/request-1"),
      { params: { id: "request-1" } },
    );
    const detailBody = await detailResponse.json();
    expect(detailBody.bookingRequest.requestedCheckIn).toBe("2026-07-14");
    expect(detailBody.bookingRequest.requestedExperienceId).toBe("exp_02");
  });
});
