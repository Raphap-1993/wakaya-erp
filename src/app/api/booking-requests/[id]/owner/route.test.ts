import { beforeEach, describe, expect, it, vi } from "vitest";

const { requirePermissionMock, getUserMock, assignBookingRequestOwnerMock } = vi.hoisted(() => ({
  requirePermissionMock: vi.fn(),
  getUserMock: vi.fn(),
  assignBookingRequestOwnerMock: vi.fn(),
}));

vi.mock("@/middleware/authn", () => ({
  requirePermission: requirePermissionMock,
}));

vi.mock("@/lib/backoffice-auth/store", () => ({
  backofficeAuthStore: {
    getUser: getUserMock,
  },
}));

vi.mock("@/lib/reservations/store", () => ({
  reservationStore: {
    assignBookingRequestOwner: assignBookingRequestOwnerMock,
  },
}));

async function loadRoute() {
  requirePermissionMock.mockResolvedValue({
    authenticated: true,
    roles: ["admin"],
    subject: "user-admin-1",
  });
  return import("./route");
}

describe("POST /api/booking-requests/[id]/owner", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
    getUserMock.mockReset();
    assignBookingRequestOwnerMock.mockReset();
  });

  it("assigns the selected owner to the booking request", async () => {
    getUserMock.mockResolvedValue({
      id: "user-reception-1",
      active: true,
      name: "Recepción Wakaya",
    });
    assignBookingRequestOwnerMock.mockResolvedValue({
      bookingRequest: { id: "request-1", ownerUserId: "user-reception-1" },
    });

    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/booking-requests/request-1/owner", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer valid" },
        body: JSON.stringify({ ownerUserId: "user-reception-1" }),
      }),
      { params: Promise.resolve({ id: "request-1" }) },
    );

    expect(response.status).toBe(200);
    expect(assignBookingRequestOwnerMock).toHaveBeenCalledWith("request-1", {
      actorId: "user-admin-1",
      ownerUserId: "user-reception-1",
      ownerName: "Recepción Wakaya",
    });
  });
});
