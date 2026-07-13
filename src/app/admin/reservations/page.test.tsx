import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { useRouterMock, redirectMock, notFoundMock, requireAdminPageAccessMock } = vi.hoisted(() => ({
  useRouterMock: vi.fn(),
  redirectMock: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  requireAdminPageAccessMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: useRouterMock,
  redirect: redirectMock,
  notFound: notFoundMock,
}));

vi.mock("../require-admin-page-access", () => ({
  requireAdminPageAccess: requireAdminPageAccessMock,
}));

import ReservationsAdminPage from "./page";

describe("ReservationsAdminPage", () => {
  beforeEach(() => {
    useRouterMock.mockReturnValue({
      replace: vi.fn(),
    });
    redirectMock.mockClear();
    requireAdminPageAccessMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "dev-admin",
    });
  });

  it("renders the reservations monitor shell with the selected reservation", async () => {
    const html = renderToStaticMarkup(
      await ReservationsAdminPage({
        searchParams: {
          selected: "reservation-demo-1",
        },
      }),
    );

    expect(html).toContain("Agenda operativa de reservas");
    expect(html).toContain("RESERVATION-2026-0001");
    expect(html).toContain("selected=reservation-demo-1");
    expect(html).toContain("Nueva reserva manual");
    expect(html).toContain("Roster de flujos");
    expect(html).not.toContain('href="/admin/reservations?view=agenda"');
    expect(html).not.toContain('href="/admin/reservations/occupancy?view=occupancy"');
    expect(html).toContain("Ver reporte financiero");
    expect(html).toContain("Exportar CSV");
    expect(html).not.toContain("Saldo total");
    expect(html).toContain('name="status"');
    expect(html).toContain('name="channel"');
    expect(html).not.toContain('name="responsibleId"');
    expect(html).not.toContain('name="date"');
    expect(html).not.toContain('name="startDate"');
    expect(html).not.toContain('name="endDate"');
    expect(html).toContain('title="Abrir ficha"');
    expect(html).toContain('title="Editar"');
    expect(html).toContain('title="Ocupación"');
  });

  it("redirects to the canonical selected reservation when the requested selection is filtered out", async () => {
    await expect(
      ReservationsAdminPage({
        searchParams: {
          status: "pending_review",
          selected: "reservation-demo-2",
        },
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/admin/reservations?status=pending_review&selected=reservation-demo-1");

    expect(redirectMock).toHaveBeenCalledWith(
      "/admin/reservations?status=pending_review&selected=reservation-demo-1",
    );
  });

  it("redirects to a canonical URL when filters remove every reservation", async () => {
    await expect(
      ReservationsAdminPage({
        searchParams: {
          status: "cancelled",
          selected: "reservation-demo-1",
        },
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/admin/reservations?status=cancelled");

    expect(redirectMock).toHaveBeenCalledWith("/admin/reservations?status=cancelled");
  });

  it("drops invalid enum filters and keeps the selected reservation canonical", async () => {
    await expect(
      ReservationsAdminPage({
        searchParams: {
          status: "foo",
          channel: "bar",
          selected: "reservation-demo-1",
        },
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/admin/reservations?selected=reservation-demo-1");

    expect(redirectMock).toHaveBeenCalledWith("/admin/reservations?selected=reservation-demo-1");
  });

  it("drops legacy agenda filters from the canonical URL", async () => {
    await expect(
      ReservationsAdminPage({
        searchParams: {
          responsibleId: "user-reception-1",
          date: "2026-06-12",
          startDate: "2026-06-12",
          endDate: "2026-06-14",
          selected: "reservation-demo-1",
        },
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/admin/reservations?selected=reservation-demo-1");

    expect(redirectMock).toHaveBeenCalledWith("/admin/reservations?selected=reservation-demo-1");
  });

  it("filters reservations by status", async () => {
    const html = renderToStaticMarkup(
      await ReservationsAdminPage({
        searchParams: {
          status: "pending_review",
          selected: "reservation-demo-1",
        },
      }),
    );

    expect(html).toContain("RESERVATION-2026-0001");
    expect(html).not.toContain("RESERVATION-2026-0002");
  });

  it("hides write actions for read-only users", async () => {
    requireAdminPageAccessMock.mockResolvedValueOnce({
      authenticated: true,
      roles: ["viewer"],
      subject: "viewer-user-1",
    });

    const html = renderToStaticMarkup(
      await ReservationsAdminPage({
        searchParams: {
          selected: "reservation-demo-1",
        },
      }),
    );

    expect(html).not.toContain("Nueva reserva manual");
    expect(html).not.toContain('title="Editar"');
    expect(html).toContain('title="Abrir ficha"');
  });

  it("renders an empty state when filters return no reservations", async () => {
    const html = renderToStaticMarkup(
      await ReservationsAdminPage({
        searchParams: {
          status: "cancelled",
        },
      }),
    );

    expect(html).toContain("No hay reservas con estos filtros");
    expect(html).not.toContain("Abre la ficha de una reserva para ver detalle, auditoría y edición en una pantalla aparte.");
  });

  it("rejects unauthenticated requests before loading the monitor", async () => {
    requireAdminPageAccessMock.mockRejectedValueOnce(
      new Error("NEXT_REDIRECT:/login?next=%2Fadmin%2Freservations"),
    );

    await expect(
      ReservationsAdminPage({
        searchParams: {
          selected: "reservation-demo-1",
        },
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/login?next=%2Fadmin%2Freservations");
  });
});
