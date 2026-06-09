import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { useRouterMock, authenticateMock, notFoundMock, redirectMock } = vi.hoisted(() => ({
  useRouterMock: vi.fn(),
  authenticateMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirectMock: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

vi.mock("next/headers", () => ({
  headers: () => new Headers(),
}));

vi.mock("next/navigation", () => ({
  useRouter: useRouterMock,
  notFound: notFoundMock,
  redirect: redirectMock,
}));

vi.mock("@/middleware/authn", () => ({
  authenticate: authenticateMock,
}));

import ReservationsOccupancyPage from "./page";

describe("ReservationsOccupancyPage", () => {
  beforeEach(() => {
    useRouterMock.mockReturnValue({
      replace: vi.fn(),
    });
    redirectMock.mockReset();
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
    expect(html).toContain("Grilla semanal de bungalows");
    expect(html).toContain("2026-W24");
    expect(html).not.toContain('href="/admin/reservations?view=agenda"');
    expect(html).not.toContain('href="/admin/reservations/occupancy?view=occupancy"');
    expect(html).toContain("Libre");
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
