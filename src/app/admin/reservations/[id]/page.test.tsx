import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const { useRouterMock } = vi.hoisted(() => ({
  useRouterMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  useRouter: useRouterMock,
}));

import ReservationDetailPage from "./page";

describe("ReservationDetailPage", () => {
  useRouterMock.mockReturnValue({
    refresh: vi.fn(),
    replace: vi.fn(),
    push: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    reload: vi.fn(),
  });

  it("renders reservation detail and operational actions", async () => {
    const html = renderToStaticMarkup(
      await ReservationDetailPage({ params: { id: "reservation-demo-1" } }),
    );

    expect(html).toContain("RESERVATION-2026-0001");
    expect(html).toContain("Detalle operativo");
    expect(html).toContain("Cobro");
    expect(html).toContain("Bungalows disponibles");
    expect(html).toContain("Confirmar");
    expect(html).toContain("Auditoría");
    expect(html).toContain("Pendiente");
    expect(html).toContain("Editar reserva");
  });

  it("renders no_show as a valid quick action for an OTA confirmed reservation", async () => {
    const html = renderToStaticMarkup(
      await ReservationDetailPage({ params: { id: "reservation-demo-2" } }),
    );

    expect(html).toContain("Marcar no show");
    expect(html).toContain("OTA imported confirmed");
  });

  it("renders administrative cancelation for checked_in reservations", async () => {
    const html = renderToStaticMarkup(
      await ReservationDetailPage({ params: { id: "reservation-demo-3" } }),
    );

    expect(html).toContain("Registrar check-out");
    expect(html).toContain("Checked in");
  });
});
