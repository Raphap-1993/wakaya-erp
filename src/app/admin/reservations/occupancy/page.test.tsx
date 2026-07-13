import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { useRouterMock, requireAdminPageAccessMock, notFoundMock, redirectMock } = vi.hoisted(() => ({
  useRouterMock: vi.fn(),
  requireAdminPageAccessMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirectMock: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: useRouterMock,
  notFound: notFoundMock,
  redirect: redirectMock,
}));

vi.mock("@/app/admin/require-admin-page-access", () => ({
  requireAdminPageAccess: requireAdminPageAccessMock,
}));

import ReservationsOccupancyPage from "./page";

describe("ReservationsOccupancyPage", () => {
  beforeEach(() => {
    useRouterMock.mockReturnValue({
      replace: vi.fn(),
    });
    redirectMock.mockReset();
    requireAdminPageAccessMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "dev-admin",
    });
  });

  it("renders the occupancy shell with compact week navigation", async () => {
    const html = renderToStaticMarkup(
      await ReservationsOccupancyPage({
        searchParams: {
          week: "2026-W24",
          date: "2026-06-15",
          selected: "reservation-demo-2",
        },
      }),
    );

    expect(html).toContain("Ocupación semanal");
    expect(html).not.toContain('href="/admin/reservations?view=agenda"');
    expect(html).not.toContain('href="/admin/reservations/occupancy?view=occupancy"');
    expect(html).toContain("Libre");
    expect(html).toContain("Leyenda operativa");
    expect(html).toContain("Semana anterior");
    expect(html).toContain("Semana actual");
    expect(html).toContain("Semana siguiente");
    expect(html).not.toContain("Selección activa");
    expect(html).not.toContain("Abrir resumen");
    expect(html).not.toContain("Detalle diario");
    expect(html).not.toContain("Semana activa");
    expect(html).not.toContain("Fecha ancla");
    expect(html).not.toContain("Contexto activo");
    expect(html).not.toContain("Navegación temporal");
    expect(html).not.toContain("Superficies operativas");
    expect(html).not.toContain("Mes -");
    expect(html).not.toContain("Sem -");
    expect(html).not.toContain("Sem +");
    expect(html).not.toContain("Mes +");
    expect(html).not.toContain(">W23<");
    expect(html).not.toContain(">W24<");
    expect(html).not.toContain(">W25<");
    expect(html).not.toContain(">W26<");
    expect(html).not.toContain(">W27<");
  });

  it("redirects to the canonical occupancy selection when selection is missing", async () => {
    await expect(
      ReservationsOccupancyPage({
        searchParams: {
          week: "2026-W24",
          date: "2026-06-15",
        },
      }),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirectMock).toHaveBeenCalledWith(
      expect.stringContaining("/admin/reservations/occupancy?"),
    );
    const redirectCall = redirectMock.mock.calls[0] as unknown as [string] | undefined;
    const redirectHref = redirectCall?.[0] ?? "";
    expect(redirectHref).toContain("date=2026-06-12");
    expect(redirectHref).toContain("selected=reservation-demo-1");
    expect(redirectHref).toContain("view=occupancy");
  });

  it("rejects unauthenticated requests before rendering occupancy", async () => {
    requireAdminPageAccessMock.mockRejectedValueOnce(
      new Error("NEXT_REDIRECT:/login?next=%2Fadmin%2Freservations%2Foccupancy"),
    );

    await expect(
      ReservationsOccupancyPage({
        searchParams: {
          week: "2026-W24",
        },
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/login?next=%2Fadmin%2Freservations%2Foccupancy");
  });
});
