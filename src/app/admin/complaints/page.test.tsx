import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdminPageAccessMock, listComplaintsMock } = vi.hoisted(() => ({
  requireAdminPageAccessMock: vi.fn(),
  listComplaintsMock: vi.fn(),
}));

vi.mock("@/app/admin/require-admin-page-access", () => ({
  requireAdminPageAccess: requireAdminPageAccessMock,
}));

vi.mock("@/lib/reservations/store", () => ({
  reservationStore: {
    listComplaints: listComplaintsMock,
  },
}));

import ComplaintsAdminPage from "./page";

describe("complaints admin page", () => {
  beforeEach(() => {
    requireAdminPageAccessMock.mockReset();
    listComplaintsMock.mockReset();
    requireAdminPageAccessMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "dev-admin",
    });
  });

  it("renders the complaints inbox with core case data", async () => {
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

    const html = renderToStaticMarkup(await ComplaintsAdminPage());

    expect(html).toContain("Libro de reclamaciones");
    expect(html).toContain("Inbox operativo");
    expect(html).toContain("LRC-2026-0001");
    expect(html).toContain("Ada Lovelace");
    expect(html).toContain("Hospedaje");
    expect(html).toContain("/admin/complaints/complaint-1");
  });

  it("renders the empty state when there are no cases", async () => {
    listComplaintsMock.mockResolvedValue([]);

    const html = renderToStaticMarkup(await ComplaintsAdminPage());

    expect(html).toContain("No hay reclamos visibles.");
    expect(html).toContain("esta bandeja mostrará la cola pública del lodge");
  });
});
