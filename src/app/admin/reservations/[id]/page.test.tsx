import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import ReservationDetailPage from "./page";

describe("ReservationDetailPage", () => {
  it("renders reservation detail and operational actions", () => {
    const html = renderToStaticMarkup(
      <ReservationDetailPage params={{ id: "reservation-demo-1" }} />,
    );

    expect(html).toContain("RESERVATION-2026-0001");
    expect(html).toContain("Asignar bungalow");
    expect(html).toContain("Cambiar estado");
    expect(html).toContain("Acciones rápidas");
    expect(html).toContain("Confirmar");
    expect(html).toContain("Auditoría");
  });
});
