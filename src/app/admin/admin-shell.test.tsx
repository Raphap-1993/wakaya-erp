import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import AdminShell from "./admin-shell";
import type { AdminNotifications } from "./admin-notifications";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/reservations/occupancy",
}));

const notifications: AdminNotifications = {
  total: 3,
  items: [
    {
      id: "conflicts",
      tone: "critical",
      title: "Conflictos web vs OTA",
      detail: "WR-2026-0002 quedó bloqueada por cruce de fechas.",
      href: "/admin/reservations/requests/request-conflict",
      count: 1,
    },
    {
      id: "proofs",
      tone: "warning",
      title: "Comprobantes por confirmar",
      detail: "2 solicitudes esperan revisión.",
      href: "/admin/reservations/requests",
      count: 2,
    },
  ],
};

describe("AdminShell", () => {
  it("renders the shared admin navigation with the active module highlighted", () => {
    const html = renderToStaticMarkup(
      <AdminShell roles={["admin"]} operatorLabel="reservas@wakayaecolodge.com" notifications={notifications}>
        <div data-testid="content">Body</div>
      </AdminShell>,
    );

    expect(html).toContain("Backoffice");
    expect(html).toContain("Dashboard");
    expect(html).toContain("Contenido público");
    expect(html).toContain("Reservas");
    expect(html).toContain("Solicitudes web");
    expect(html).toContain("Cupos de bungalows");
    expect(html).toContain("Ocupación");
    expect(html).toContain("Flujos");
    expect(html).toContain("Usuarios");
    expect(html).toContain("Cerrar sesión");
    expect(html).toContain("reservas@wakayaecolodge.com");
    expect(html).toContain("Administrador");
    expect(html).toContain("Notificaciones");
    expect(html).toContain("3");
    expect(html).toContain("Body");
    expect(html).toContain('aria-current="page"');
    expect(html).toContain("Colapsar menú lateral");
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('src="/images/wakaya/wakaya-logo-min.png"');
  });

  it("hides modules that the current role cannot open", () => {
    const html = renderToStaticMarkup(
      <AdminShell roles={["viewer"]} operatorLabel="viewer@wakaya.local" notifications={notifications}>
        <div data-testid="content">Body</div>
      </AdminShell>,
    );

    expect(html).toContain("Dashboard");
    expect(html).toContain("Reservas");
    expect(html).toContain("Solo lectura");
    expect(html).not.toContain("Contenido público");
    expect(html).not.toContain("Disponibilidad de bungalows");
    expect(html).not.toContain("Usuarios");
  });
});
