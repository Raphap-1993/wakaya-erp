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

import ReservationFlowsPage from "./page";

describe("ReservationFlowsPage", () => {
  beforeEach(() => {
    authenticateMock.mockResolvedValue({
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
    authenticateMock.mockResolvedValueOnce({
      authenticated: false,
      roles: [],
      reason: "missing_bearer",
    });

    await expect(ReservationFlowsPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalled();
  });
});
