import { beforeEach, describe, expect, it, vi } from "vitest";

const { requirePermissionMock, listComplaintsMock } = vi.hoisted(() => ({
  requirePermissionMock: vi.fn(),
  listComplaintsMock: vi.fn(),
}));

vi.mock("@/middleware/authn", () => ({
  requirePermission: requirePermissionMock,
}));

vi.mock("@/lib/reservations/store", () => ({
  reservationStore: {
    listComplaints: listComplaintsMock,
  },
}));

async function loadRoute() {
  return import("./route");
}

describe("GET /api/admin/complaints", () => {
  beforeEach(() => {
    requirePermissionMock.mockReset();
    listComplaintsMock.mockReset();
  });

  it("returns the complaints inbox for authorized operators", async () => {
    requirePermissionMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "dev-admin",
    });
    listComplaintsMock.mockResolvedValue([
      {
        id: "complaint-1",
        publicCode: "LRC-2026-0001",
        type: "reclamo",
        status: "submitted",
        fullName: "Ada Lovelace",
        documentType: "dni",
        documentNumber: "12345678",
        email: "ada@example.com",
        phone: null,
        address: null,
        serviceType: "lodging",
        contractedService: "Estadía en bungalow familiar",
        complaintDetail: "La habitación no estuvo lista al llegar.",
        consumerRequest: "Solicito una respuesta formal.",
        acceptedDeclaration: true,
        createdAt: "2026-07-02T10:00:00.000Z",
        updatedAt: "2026-07-02T10:00:00.000Z",
      },
    ]);

    const { GET } = await loadRoute();
    const response = await GET(new Request("http://localhost/api/admin/complaints"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      items: [
        {
          publicCode: "LRC-2026-0001",
          status: "submitted",
        },
      ],
    });
  });

  it("passes through auth failures", async () => {
    requirePermissionMock.mockResolvedValue(
      new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 }),
    );

    const { GET } = await loadRoute();
    const response = await GET(new Request("http://localhost/api/admin/complaints"));

    expect(response.status).toBe(401);
  });
});
