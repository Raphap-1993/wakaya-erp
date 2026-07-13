import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import styles from "./public-site-shell.module.css";

let mockedPathname = "/prototype/public-site";

vi.mock("next/navigation", () => ({
  usePathname: () => mockedPathname,
}));

import { PlayHeader } from "./play-header";

describe("PlayHeader", () => {
  beforeEach(() => {
    mockedPathname = "/prototype/public-site";
  });

  it("renders the prototype navigation grammar", () => {
    const html = renderToStaticMarkup(<PlayHeader />);

    expect(html).toContain('src="/images/wakaya/wakaya-logo-min.png"');
    expect(html).toContain('alt="Wakaya Ecolodge"');
    expect(html).toContain("Habitaciones");
    expect(html).toContain("Servicios");
    expect(html).not.toContain("Experiencias");
    expect(html).toContain("Galería");
    expect(html).toContain("Contacto");
    expect(html).toContain("Reservar ahora");
    expect(html).not.toContain("Nosotros");
    expect(html).toContain(styles.prototypeHeaderHome);
    expect(html).toContain(styles.prototypeBarInner);
    expect(html).toContain(styles.prototypeNav);
  });

  it("marks the current route link with aria-current", () => {
    mockedPathname = "/prototype/public-site/services";

    const html = renderToStaticMarkup(<PlayHeader />);

    expect(html).toContain('aria-current="page"');
    expect(html).toContain(`href="/prototype/public-site/services"`);
    expect(html).toContain(styles.prototypeNavLinkActive);
  });

  it("keeps the bungalow nav item active on nested detail routes", () => {
    mockedPathname = "/prototype/public-site/bungalows/bungalow-familiar";

    const html = renderToStaticMarkup(<PlayHeader />);

    expect(html).toContain('aria-current="page"');
    expect(html).toContain(`href="/prototype/public-site/bungalows"`);
    expect(html).toContain(styles.prototypeNavLinkActive);
  });

  it("uses localized routes when the public site is rendered under /es", () => {
    mockedPathname = "/es/bungalows/bungalow-familiar";

    const html = renderToStaticMarkup(<PlayHeader locale="es" />);

    expect(html).toContain('href="/es"');
    expect(html).toContain('href="/es/bungalows"');
    expect(html).toContain('href="/es/services"');
    expect(html).toContain('href="/es/gallery"');
    expect(html).toContain('href="/es/contact"');
    expect(html).not.toContain('href="/es/about"');
    expect(html).toContain(styles.prototypeHeaderInner);
  });

  it("renders a locale switch in the toolbar and preserves the current route when swapping languages", () => {
    mockedPathname = "/es/bungalows/bungalow-familiar";

    const html = renderToStaticMarkup(<PlayHeader locale="es" localeSwitchLabel="Idioma" />);

    expect(html).toContain('role="group"');
    expect(html).toContain('aria-label="Idioma"');
    expect(html).toContain('href="/en/bungalows/bungalow-familiar"');
    expect(html).toContain('href="/es/bungalows/bungalow-familiar"');
    expect(html).toContain(styles.prototypeLocaleSwitch);
    expect(html).toContain(styles.prototypeLocaleLinkActive);
  });

  it("uses runtime navigation items when they are provided by the public shell", () => {
    mockedPathname = "/es";

    const html = renderToStaticMarkup(
      <PlayHeader
        locale="es"
        navItems={[
          { key: "home", label: "Inicio custom", href: "/es" },
          { key: "bungalows", label: "Suites custom", href: "/es/bungalows" },
          { key: "services", label: "Vivencias custom", href: "/es/services" },
          { key: "gallery", label: "Postal custom", href: "/es/gallery" },
          { key: "contact", label: "Hablar custom", href: "/es/contact" },
        ]}
      />,
    );

    expect(html).toContain("Inicio custom");
    expect(html).toContain("Suites custom");
    expect(html).toContain("Vivencias custom");
    expect(html).toContain("Postal custom");
    expect(html).toContain("Hablar custom");
  });
});
