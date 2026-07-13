import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdminPageAccessMock, useRouterMock } = vi.hoisted(() => ({
  requireAdminPageAccessMock: vi.fn(),
  useRouterMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  useRouter: useRouterMock,
}));

vi.mock("@/app/admin/require-admin-page-access", () => ({
  requireAdminPageAccess: requireAdminPageAccessMock,
}));

import ReservationDetailPage from "./page";

describe("ReservationDetailPage", () => {
  beforeEach(() => {
    useRouterMock.mockReturnValue({
      refresh: vi.fn(),
      replace: vi.fn(),
      push: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      reload: vi.fn(),
    });
    requireAdminPageAccessMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "dev-admin",
    });
  });

  it("renders reservation detail and operational actions", async () => {
    const html = renderToStaticMarkup(
      await ReservationDetailPage({ params: { id: "reservation-demo-1" } }),
    );

    expect(html).toContain("RESERVATION-2026-0001");
    expect(html).toContain("Detalle operativo");
    expect(html).toContain("Cobro");
    expect(html).toContain("Bungalows disponibles");
    expect(html).toContain("Confirmar");
    expect(html).toContain("Auditoría");
    expect(html).toContain("Pendiente");
    expect(html).toContain("Editar reserva");
    expect(html).not.toContain("Responsable");
  });

  it("renders no_show as a valid quick action for an OTA confirmed reservation", async () => {
    const html = renderToStaticMarkup(
      await ReservationDetailPage({ params: { id: "reservation-demo-2" } }),
    );

    expect(html).toContain("Marcar no show");
    expect(html).toContain("OTA preaprobada");
  });

  it("renders administrative cancelation for checked_in reservations", async () => {
    const html = renderToStaticMarkup(
      await ReservationDetailPage({ params: { id: "reservation-demo-3" } }),
    );

    expect(html).toContain("Registrar check-out");
    expect(html).toContain("Check-in");
  });

  it("hides write actions for read-only users", async () => {
    requireAdminPageAccessMock.mockResolvedValueOnce({
      authenticated: true,
      roles: ["viewer"],
      subject: "viewer-user-1",
    });

    const html = renderToStaticMarkup(
      await ReservationDetailPage({ params: { id: "reservation-demo-1" } }),
    );

    expect(html).not.toContain("Editar reserva");
  });
});
