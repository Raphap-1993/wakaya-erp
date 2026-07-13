import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdminPageAccessMock, notFoundMock, useRouterMock } = vi.hoisted(() => ({
  requireAdminPageAccessMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  useRouterMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
  useRouter: useRouterMock,
}));

vi.mock("@/app/admin/require-admin-page-access", () => ({
  requireAdminPageAccess: requireAdminPageAccessMock,
}));

import EditReservationPage from "./page";

describe("EditReservationPage", () => {
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
  });

  it("renders the reusable edit form", async () => {
    const html = renderToStaticMarkup(await EditReservationPage({ params: { id: "reservation-demo-1" } }));

    expect(html).toContain("Editar reserva");
    expect(html).toContain("Datos de reserva");
    expect(html).toContain("Guardar cambios");
    expect(html).toContain("RESERVATION-2026-0001");
    expect(html).toContain("Código fijo después de crear la reserva.");
    expect(html).toContain('name="number"');
    expect(html).toContain('readOnly=""');
    expect(html).not.toContain("Responsable");
    expect(html).not.toContain('name="responsibleId"');
    expect(html).toContain("Vista previa");
  });

  it("rejects missing reservations", async () => {
    await expect(EditReservationPage({ params: { id: "reservation-missing" } })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalled();
  });
});
