import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { authenticateMock, notFoundMock, useRouterMock } = vi.hoisted(() => ({
  authenticateMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  useRouterMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: () => new Headers(),
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
  useRouter: useRouterMock,
}));

vi.mock("@/middleware/authn", () => ({
  authenticate: authenticateMock,
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
    authenticateMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "dev-admin",
    });
  });

  it("renders the manual reservation form", async () => {
    const html = renderToStaticMarkup(await NewReservationPage());

    expect(html).toContain("Nueva reserva manual");
    expect(html).toContain("Datos de reserva");
    expect(html).toContain("Crear reserva");
    expect(html).toContain("Volver al monitor");
  });

  it("rejects users without write permission", async () => {
    authenticateMock.mockResolvedValueOnce({
      authenticated: true,
      roles: ["viewer"],
      subject: "viewer-user",
    });

    await expect(NewReservationPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalled();
  });
});
