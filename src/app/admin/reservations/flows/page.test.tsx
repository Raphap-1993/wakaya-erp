import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdminPageAccessMock, notFoundMock } = vi.hoisted(() => ({
  requireAdminPageAccessMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

vi.mock("@/app/admin/require-admin-page-access", () => ({
  requireAdminPageAccess: requireAdminPageAccessMock,
}));

import ReservationFlowsPage from "./page";

describe("ReservationFlowsPage", () => {
  beforeEach(() => {
    requireAdminPageAccessMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "dev-admin",
    });
  });

  it("renders the reservations flow roster", async () => {
    const html = renderToStaticMarkup(await ReservationFlowsPage());

    expect(html).toContain("Flujos diarios de reservas");
    expect(html).toContain("Roster de hilos");
    expect(html).toContain("Hilo 1 · Ingreso y edición");
    expect(html).toContain("Hilo 2 · Confirmación y asignación");
    expect(html).toContain("Abrir monitor");
    expect(html).toContain("Nueva reserva");
  });

  it("rejects unauthenticated access", async () => {
    requireAdminPageAccessMock.mockRejectedValueOnce(
      new Error("NEXT_REDIRECT:/login?next=%2Fadmin%2Freservations%2Fflows"),
    );

    await expect(ReservationFlowsPage()).rejects.toThrow("NEXT_REDIRECT:/login?next=%2Fadmin%2Freservations%2Fflows");
  });
});
