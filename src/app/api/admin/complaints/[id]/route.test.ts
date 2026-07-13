import { beforeEach, describe, expect, it, vi } from "vitest";

const { requirePermissionMock, getComplaintMock } = vi.hoisted(() => ({
  requirePermissionMock: vi.fn(),
  getComplaintMock: vi.fn(),
}));

vi.mock("@/middleware/authn", () => ({
  requirePermission: requirePermissionMock,
}));

vi.mock("@/lib/reservations/store", () => ({
  reservationStore: {
    getComplaint: getComplaintMock,
  },
}));

async function loadRoute() {
  return import("./route");
}

describe("GET /api/admin/complaints/[id]", () => {
  beforeEach(() => {
    requirePermissionMock.mockReset();
    getComplaintMock.mockReset();
  });

  it("returns a complaint detail for authorized operators", async () => {
    requirePermissionMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "dev-admin",
    });
    getComplaintMock.mockResolvedValue({
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
    });

    const { GET } = await loadRoute();
    const response = await GET(new Request("http://localhost/api/admin/complaints/complaint-1"), {
      params: Promise.resolve({ id: "complaint-1" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      complaint: {
        publicCode: "LRC-2026-0001",
        status: "submitted",
      },
    });
  });

  it("returns 404 when the complaint does not exist", async () => {
    requirePermissionMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "dev-admin",
    });
    getComplaintMock.mockResolvedValue(null);

    const { GET } = await loadRoute();
    const response = await GET(new Request("http://localhost/api/admin/complaints/missing"), {
      params: Promise.resolve({ id: "missing" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: "complaint_not_found",
    });
  });
});
