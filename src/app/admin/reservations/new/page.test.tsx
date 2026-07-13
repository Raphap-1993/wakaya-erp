import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdminPageAccessMock, notFoundMock, useRouterMock, listBungalowsMock, listReservationsMock } = vi.hoisted(() => ({
  requireAdminPageAccessMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  useRouterMock: vi.fn(),
  listBungalowsMock: vi.fn(),
  listReservationsMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
  useRouter: useRouterMock,
}));

vi.mock("@/app/admin/require-admin-page-access", () => ({
  requireAdminPageAccess: requireAdminPageAccessMock,
}));

vi.mock("@/lib/reservations/store", () => ({
  reservationStore: {
    listBungalows: listBungalowsMock,
    list: listReservationsMock,
  },
}));

import NewReservationPage from "./page";

describe("NewReservationPage", () => {
  beforeEach(() => {
    useRouterMock.mockReturnValue({
      replace: vi.fn(),
      push: vi.fn(),
      refresh: vi.fn(),
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
    listBungalowsMock.mockResolvedValue([
      {
        id: "bungalow-suite",
        code: "STE",
        name: "Suite",
        active: true,
        capacity: 2,
      },
    ]);
    listReservationsMock.mockResolvedValue([]);
  });

  it("renders the manual reservation form", async () => {
    listReservationsMock.mockResolvedValueOnce([
      {
        id: "reservation-1",
        number: "RESERVATION-2026-0001",
        channel: "web",
        status: "pending_review",
        bungalowId: "bungalow-suite",
        responsibleId: "user-reception-7",
        startDate: "2026-07-10",
        endDate: "2026-07-12",
        updatedAt: "2026-07-01T10:00:00.000Z",
      },
    ]);

    const html = renderToStaticMarkup(await NewReservationPage({}));

    expect(html).toContain("Nueva reserva manual");
    expect(html).toContain("Datos de reserva");
    expect(html).toContain("Crear reserva");
    expect(html).toContain("Volver al monitor");
    expect(html).not.toContain("Responsable");
    expect(html).not.toContain('name="responsibleId"');
    expect(html).not.toContain("responsible-suggestions");
  });

  it("shows an operational empty state when there are no active bungalows yet", async () => {
    listBungalowsMock.mockResolvedValueOnce([]);

    const html = renderToStaticMarkup(await NewReservationPage({}));

    expect(html).toContain("Nueva reserva manual");
    expect(html).toContain("No hay bungalows activos configurados.");
    expect(html).toContain("Carga el inventario real en PostgreSQL antes de abrir reservas manuales.");
    expect(html).not.toContain("Crear reserva");
  });

  it("rejects users without write permission", async () => {
    requireAdminPageAccessMock.mockRejectedValueOnce(
      new Error("NEXT_NOT_FOUND"),
    );

    await expect(NewReservationPage({})).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("prefills bungalow and dates when the creation starts from a free occupancy slot", async () => {
    const html = renderToStaticMarkup(
      await NewReservationPage({
        searchParams: {
          bungalowId: "bungalow-suite",
          startDate: "2026-07-14",
          endDate: "2026-07-16",
          returnTo: "/admin/reservations/occupancy?date=2026-07-14&view=occupancy&week=2026-W29",
        },
      }),
    );

    expect(html).toContain('value="2026-07-14"');
    expect(html).toContain('value="2026-07-16"');
    expect(html).toContain('option value="bungalow-suite" selected=""');
    expect(html).toContain('href="/admin/reservations/occupancy?date=2026-07-14&amp;view=occupancy&amp;week=2026-W29"');
  });
});
