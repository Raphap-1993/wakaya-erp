import { beforeEach, describe, expect, it, vi } from "vitest";

const { createComplaintMock } = vi.hoisted(() => ({
  createComplaintMock: vi.fn(),
}));

vi.mock("@/lib/reservations/store", () => ({
  reservationStore: {
    createComplaint: createComplaintMock,
  },
}));

async function loadRoute() {
  return import("./route");
}

describe("POST /api/public/complaints", () => {
  beforeEach(() => {
    vi.resetModules();
    createComplaintMock.mockReset();
  });

  it("creates a complaint and returns the tracking code", async () => {
    createComplaintMock.mockResolvedValue({
      complaint: {
        id: "complaint-123",
        publicCode: "LRC-2026-0001",
        type: "reclamo",
        status: "submitted",
        fullName: "Ada Lovelace",
        documentType: "dni",
        documentNumber: "12345678",
        email: "ada@example.com",
        phone: "+51987654321",
        address: "Jr. Ucayali 123, Pucallpa",
        serviceType: "lodging",
        contractedService: "Estadia en bungalow matrimonial",
        complaintDetail: "La habitacion no estuvo lista al llegar.",
        consumerRequest: "Solicito una respuesta formal y compensacion.",
        acceptedDeclaration: true,
        createdAt: "2026-07-02T10:00:00.000Z",
        updatedAt: "2026-07-02T10:00:00.000Z",
      },
    });

    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/public/complaints", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "reclamo",
          fullName: "Ada Lovelace",
          documentType: "dni",
          documentNumber: "12345678",
          email: "ada@example.com",
          phone: "+51987654321",
          address: "Jr. Ucayali 123, Pucallpa",
          serviceType: "lodging",
          contractedService: "Estadia en bungalow matrimonial",
          complaintDetail: "La habitacion no estuvo lista al llegar.",
          consumerRequest: "Solicito una respuesta formal y compensacion.",
          acceptedDeclaration: true,
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(createComplaintMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "reclamo",
        fullName: "Ada Lovelace",
      }),
    );
    await expect(response.json()).resolves.toMatchObject({
      complaint: {
        id: "complaint-123",
        publicCode: "LRC-2026-0001",
        status: "submitted",
      },
      trackingCode: "LRC-2026-0001",
    });
  });

  it("rejects invalid payloads", async () => {
    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/public/complaints", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "reclamo",
          fullName: "Ada Lovelace",
          acceptedDeclaration: false,
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "invalid_payload",
    });
  });

  it("accepts progressive form posts as well as json payloads", async () => {
    createComplaintMock.mockResolvedValue({
      complaint: {
        id: "complaint-124",
        publicCode: "LRC-2026-0002",
        type: "reclamo",
        status: "submitted",
        fullName: "Ada Lovelace",
        documentType: "dni",
        documentNumber: "12345678",
        email: "ada@example.com",
        phone: "+51987654321",
        address: "Jr. Ucayali 123, Pucallpa",
        serviceType: "lodging",
        contractedService: "Estadia en bungalow matrimonial",
        complaintDetail: "La habitacion no estuvo lista al llegar.",
        consumerRequest: "Solicito una respuesta formal y compensacion.",
        acceptedDeclaration: true,
        createdAt: "2026-07-02T10:00:00.000Z",
        updatedAt: "2026-07-02T10:00:00.000Z",
      },
    });

    const form = new FormData();
    form.set("type", "reclamo");
    form.set("fullName", "Ada Lovelace");
    form.set("documentType", "dni");
    form.set("documentNumber", "12345678");
    form.set("email", "ada@example.com");
    form.set("phone", "+51987654321");
    form.set("address", "Jr. Ucayali 123, Pucallpa");
    form.set("serviceType", "lodging");
    form.set("contractedService", "Estadia en bungalow matrimonial");
    form.set("complaintDetail", "La habitacion no estuvo lista al llegar.");
    form.set("consumerRequest", "Solicito una respuesta formal y compensacion.");
    form.set("acceptedDeclaration", "true");

    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/public/complaints", {
        method: "POST",
        body: form,
      }),
    );

    expect(response.status).toBe(201);
    expect(createComplaintMock).toHaveBeenCalledWith(
      expect.objectContaining({
        acceptedDeclaration: true,
        fullName: "Ada Lovelace",
      }),
    );
  });
});
