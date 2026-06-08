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

function hrefParamsByText(html: string, linkText: string): URLSearchParams {
  const anchorIndex = html.indexOf(`>${linkText}</a>`);
  expect(anchorIndex).toBeGreaterThanOrEqual(0);
  const hrefStart = html.lastIndexOf('href="', anchorIndex);
  expect(hrefStart).toBeGreaterThanOrEqual(0);
  const hrefValue = html.slice(hrefStart + 6, html.indexOf('"', hrefStart + 6)).replaceAll("&amp;", "&");
  return new URLSearchParams(hrefValue.split("?")[1] ?? "");
}

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
    const agendaHref = hrefParamsByText(html, "Agenda");
    const occupancyHref = hrefParamsByText(html, "Ocupación");
    expect(agendaHref.get("date")).toBe("2026-06-15");
    expect(agendaHref.get("view")).toBe("agenda");
    expect(agendaHref.get("week")).toBe("2026-W24");
    expect(agendaHref.get("selected")).toBe("reservation-demo-2");
    expect(occupancyHref.get("date")).toBe("2026-06-15");
    expect(occupancyHref.get("view")).toBe("occupancy");
    expect(occupancyHref.get("week")).toBe("2026-W24");
    expect(occupancyHref.get("selected")).toBe("reservation-demo-2");
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
