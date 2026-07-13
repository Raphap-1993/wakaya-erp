import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdminPageAccessMock, listMock, listBookingRequestsMock, listComplaintsMock } = vi.hoisted(() => ({
  requireAdminPageAccessMock: vi.fn(),
  listMock: vi.fn(),
  listBookingRequestsMock: vi.fn(),
  listComplaintsMock: vi.fn(),
}));

vi.mock("./require-admin-page-access", () => ({
  requireAdminPageAccess: requireAdminPageAccessMock,
}));

vi.mock("@/lib/reservations/store", () => ({
  reservationStore: {
    list: listMock,
    listBookingRequests: listBookingRequestsMock,
    listComplaints: listComplaintsMock,
  },
}));

import AdminDashboardPage from "./page";

describe("AdminDashboardPage", () => {
  beforeEach(() => {
    requireAdminPageAccessMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "dev-admin",
      claims: { email: "reservas@wakayaecolodge.com" },
    });
    listMock.mockResolvedValue([
      {
        id: "reservation-1",
        number: "RESERVATION-2026-0001",
        channel: "web",
        status: "pending_review",
        bungalowId: null,
        responsibleId: "dev-admin",
        startDate: "2026-07-10",
        endDate: "2026-07-12",
        amountTotalCents: 36000,
        amountPaidCents: 0,
        paymentStatus: "pending",
        currencyCode: "PEN",
        updatedAt: "2026-07-01T12:00:00.000Z",
      },
      {
        id: "reservation-2",
        number: "RESERVATION-2026-0002",
        channel: "ota",
        status: "confirmed",
        bungalowId: "bungalow-family",
        responsibleId: "dev-admin",
        startDate: "2026-07-11",
        endDate: "2026-07-13",
        amountTotalCents: 48000,
        amountPaidCents: 48000,
        paymentStatus: "paid",
        currencyCode: "PEN",
        updatedAt: "2026-07-01T13:00:00.000Z",
      },
    ]);
    listBookingRequestsMock.mockResolvedValue([
      {
        id: "request-1",
        publicRef: "WR-2026-0001",
        status: "proof_received",
        guestName: "Ada Lovelace",
        guestEmail: "ada@example.com",
        guestPhone: "+51987654321",
        requestedCheckIn: "2026-07-10",
        requestedCheckOut: "2026-07-12",
        requestedGuests: 2,
        requestedBungalowType: null,
        sourceChannel: "web_public",
        threadId: null,
        threadKey: "booking-request:WR-2026-0001",
        notes: null,
        lastMessageAt: "2026-07-01T11:00:00.000Z",
        syncStatus: "degraded",
        createdAt: "2026-07-01T09:00:00.000Z",
        updatedAt: "2026-07-01T11:00:00.000Z",
      },
    ]);
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
  });

  it("renders the operational dashboard with semaphorized summaries and real module entry points", async () => {
    const html = renderToStaticMarkup(await AdminDashboardPage());

    expect(html).toContain("Panel operativo");
    expect(html).toContain("Solicitudes pendientes");
    expect(html).toContain("Sync degradado");
    expect(html).toContain("Saldo pendiente");
    expect(html).toContain("Atención inmediata");
    expect(html).toContain("Seguimiento");
    expect(html).toContain("Por cobrar");
    expect(html).toContain("/admin/content");
    expect(html).toContain("/admin/bungalow-capacity");
    expect(html).toContain("/admin/reservations");
    expect(html).toContain("/admin/reservations/requests");
    expect(html).toContain("/admin/complaints");
    expect(html).toContain("/admin/reservations/occupancy");
    expect(html).toContain("reservas@wakayaecolodge.com");
    expect(html).toContain("Permisos activos");
    expect(html).toContain("reservation:read");
    expect(html).toContain("reservation:approve");
    expect(html).toContain('data-module-tone="brand"');
    expect(html).toContain('data-module-tone="mint"');
    expect(html).toContain('data-module-tone="amber"');
  });
});
