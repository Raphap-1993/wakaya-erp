import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { authenticateMock, notFoundMock } = vi.hoisted(() => ({
  authenticateMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/headers", () => ({
  headers: () => new Headers(),
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

vi.mock("@/middleware/authn", () => ({
  authenticate: authenticateMock,
}));

import ReservationsOccupancyPage from "./page";

describe("ReservationsOccupancyPage", () => {
  beforeEach(() => {
    authenticateMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "dev-admin",
    });
  });

  it("renders the occupancy shell with agenda and occupancy links", async () => {
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
    expect(html).toContain("Agenda");
    expect(html).toContain("Ocupación");
    expect(html).toContain("Semana activa");
    expect(html).toContain("2026-W24");
    expect(html).toContain(
      'href="/admin/reservations?date=2026-06-15&amp;week=2026-W24&amp;selected=reservation-demo-2"',
    );
    expect(html).toContain(
      'href="/admin/reservations/occupancy?date=2026-06-15&amp;week=2026-W24&amp;selected=reservation-demo-2"',
    );
  });

  it("rejects unauthenticated requests before rendering occupancy", async () => {
    authenticateMock.mockResolvedValueOnce({
      authenticated: false,
      roles: [],
      reason: "missing_bearer",
    });

    await expect(
      ReservationsOccupancyPage({
        searchParams: {
          week: "2026-W24",
        },
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFoundMock).toHaveBeenCalled();
  });
});
