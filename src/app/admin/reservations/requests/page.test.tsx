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

import RequestsAdminPage from "./page";

describe("booking requests admin page", () => {
  beforeEach(() => {
    authenticateMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "dev-admin",
    });
  });

  it("renders the request inbox with thread and confirm-transfer actions", async () => {
    const html = renderToStaticMarkup(await RequestsAdminPage({ searchParams: {} }));

    expect(html).toContain("Solicitudes web");
    expect(html).toContain("Confirmar transferencia");
    expect(html).toContain("Hilo del cliente");
  });
});
