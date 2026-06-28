import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { useRouterMock, redirectMock, notFoundMock, authenticateMock } = vi.hoisted(() => ({
  useRouterMock: vi.fn(),
  redirectMock: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  authenticateMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: useRouterMock,
  redirect: redirectMock,
  notFound: notFoundMock,
}));

vi.mock("next/headers", () => ({
  headers: () => new Headers(),
}));

vi.mock("@/middleware/authn", () => ({
  authenticate: authenticateMock,
}));

import ReservationsAdminPage from "./page";

describe("ReservationsAdminPage", () => {
  beforeEach(() => {
    useRouterMock.mockReturnValue({
      replace: vi.fn(),
    });
    redirectMock.mockClear();
    authenticateMock.mockResolvedValue({
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
          date: "2026-06-12",
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
    expect(html).toContain("Saldo total");
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

  it("renders an empty state when filters return no reservations", async () => {
    const html = renderToStaticMarkup(
      await ReservationsAdminPage({
        searchParams: {
          responsibleId: "user-reception-9",
        },
      }),
    );

    expect(html).toContain("No hay reservas con estos filtros");
    expect(html).not.toContain("Abre la ficha de una reserva para ver detalle, auditoría y edición en una pantalla aparte.");
  });

  it("rejects unauthenticated requests before loading the monitor", async () => {
    authenticateMock.mockResolvedValueOnce({
      authenticated: false,
      roles: [],
      reason: "missing_bearer",
    });

    await expect(
      ReservationsAdminPage({
        searchParams: {
          selected: "reservation-demo-1",
        },
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFoundMock).toHaveBeenCalled();
  });
});
