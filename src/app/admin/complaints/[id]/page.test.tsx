import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdminPageAccessMock, getComplaintMock, notFoundMock } = vi.hoisted(() => ({
  requireAdminPageAccessMock: vi.fn(),
  getComplaintMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/app/admin/require-admin-page-access", () => ({
  requireAdminPageAccess: requireAdminPageAccessMock,
}));

vi.mock("@/lib/reservations/store", () => ({
  reservationStore: {
    getComplaint: getComplaintMock,
  },
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

import ComplaintDetailPage from "./page";

describe("complaint detail admin page", () => {
  beforeEach(() => {
    requireAdminPageAccessMock.mockReset();
    getComplaintMock.mockReset();
    notFoundMock.mockClear();
    requireAdminPageAccessMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "dev-admin",
    });
  });

  it("renders the complaint detail for the operator", async () => {
    getComplaintMock.mockResolvedValue({
      id: "complaint-1",
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
      contractedService: "Estadía en bungalow familiar",
      complaintDetail: "La habitación no estuvo lista al llegar.",
      consumerRequest: "Solicito una respuesta formal.",
      acceptedDeclaration: true,
      createdAt: "2026-07-02T10:00:00.000Z",
      updatedAt: "2026-07-02T10:00:00.000Z",
    });

    const html = renderToStaticMarkup(
      await ComplaintDetailPage({
        params: Promise.resolve({ id: "complaint-1" }),
      }),
    );

    expect(html).toContain("LRC-2026-0001");
    expect(html).toContain("Ada Lovelace");
    expect(html).toContain("Hospedaje");
    expect(html).toContain("La habitación no estuvo lista al llegar.");
    expect(html).toContain("mailto:ada@example.com");
    expect(html).toContain("/admin/complaints");
  });

  it("delegates to notFound when the complaint does not exist", async () => {
    getComplaintMock.mockResolvedValue(null);

    await expect(
      ComplaintDetailPage({
        params: Promise.resolve({ id: "missing" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
