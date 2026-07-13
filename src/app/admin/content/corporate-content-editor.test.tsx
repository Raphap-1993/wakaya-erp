import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DEFAULT_CORPORATE_CONTENT } from "@/lib/corporate-content/default-content";
import { CorporateContentEditor } from "./corporate-content-editor";

describe("CorporateContentEditor", () => {
  it("keeps the page list focused and opens history only on demand", () => {
    const item = {
      revisionVersion: 2,
      document: DEFAULT_CORPORATE_CONTENT,
      updatedAt: "2026-07-10T15:00:00.000Z",
      updatedByUserId: "admin-user-1",
      restoredFromVersion: null,
      source: "published" as const,
    };
    const html = renderToStaticMarkup(
      <CorporateContentEditor initialItem={item} initialRevisions={[item]} />,
    );

    expect(html).toContain("Empresa y políticas");
    expect(html).toContain("Nosotros");
    expect(html).toContain("Preguntas frecuentes");
    expect(html).toContain("Testimonios");
    expect(html).toContain("Términos y estadía");
    expect(html).toContain("Privacidad");
    expect(html).toContain("Contacto y horarios");
    expect(html).toContain("Guardar y publicar");
    expect(html).toContain("Historial");
    expect(html).not.toContain("Revisiones");
    expect(html).not.toContain("Restaurar");
    expect(html).toContain("Versión 2");
    expect(html).toContain("Contenido histórico");
    expect(html).toContain("texto histórico original");
    expect(html).toContain("derecho de retención y prenda");
  });
});
