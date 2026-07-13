import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import styles from "./public-site-shell.module.css";
import { PlayFooter } from "./play-footer";

describe("PlayFooter", () => {
  it("renders the prototype footer structure and public contact paths", () => {
    const html = renderToStaticMarkup(<PlayFooter />);

    expect(html).toContain('src="/images/wakaya/wakaya-logo-min.png"');
    expect(html).toContain('alt="Wakaya Ecolodge"');
    expect(html).toContain("Facebook");
    expect(html).toContain("Instagram");
    expect(html).toContain("reservas@wakayaecolodge.com");
    expect(html).toContain("+51 961 508 813");
    expect(html).toContain("+51 977 419 468");
    expect(html).not.toContain("+51 963 847 291");
    expect(html).toContain("Bungalows");
    expect(html).toContain("Servicios");
    expect(html).toContain("Empresa");
    expect(html).toContain("Nosotros");
    expect(html).toContain("Preguntas frecuentes");
    expect(html).toContain("Testimonios");
    expect(html).toContain("Libro de Reclamaciones");
    expect(html).toContain("Pet Friendly");
    expect(html).toContain("Políticas del hotel");
    expect(html).toContain("Política de reservas");
    expect(html).toContain("Política pet friendly");
    expect(html).toContain('href="/es/about"');
    expect(html).toContain('href="/es/faq"');
    expect(html).toContain('href="/es/testimonials"');
    expect(html).toContain('href="/es/complaints-book"');
    expect(html).toContain('href="/es/pet-friendly"');
    expect(html).toContain('href="/es/hotel-policies"');
    expect(html).toContain(styles.prototypeFooterGrid);
    expect(html).toContain(styles.prototypeFooterBottom);
  });
});
