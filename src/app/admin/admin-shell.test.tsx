import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import AdminShell from "./admin-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/reservations/occupancy",
}));

describe("AdminShell", () => {
  it("renders the shared admin navigation with the active module highlighted", () => {
    const html = renderToStaticMarkup(
      <AdminShell>
        <div data-testid="content">Body</div>
      </AdminShell>,
    );

    expect(html).toContain("Backoffice");
    expect(html).toContain("Administración");
    expect(html).toContain("Reservas");
    expect(html).toContain("Ocupación");
    expect(html).toContain("Pagos");
    expect(html).toContain("Reportes");
    expect(html).toContain("Configuración");
    expect(html).toContain("Body");
    expect(html).toContain('aria-current="page"');
  });
});
