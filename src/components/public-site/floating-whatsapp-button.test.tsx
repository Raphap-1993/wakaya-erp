import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  buildFloatingWhatsAppHref,
  FloatingWhatsAppButton,
} from "./floating-whatsapp-button";

describe("FloatingWhatsAppButton", () => {
  it("builds the destination from the phone managed in the backoffice", () => {
    const href = buildFloatingWhatsAppHref("+51 999 888 777", "es");

    expect(href).toContain("https://wa.me/51999888777");
    expect(decodeURIComponent(href ?? "")).toContain("Hola Wakaya");
  });

  it("renders an accessible WhatsApp action for every public page", () => {
    const html = renderToStaticMarkup(
      <FloatingWhatsAppButton phone="+51 961 508 813" locale="en" />,
    );

    expect(html).toContain('data-public-whatsapp="floating-button"');
    expect(html).toContain('aria-label="Contact Wakaya on WhatsApp"');
    expect(html).toContain("https://wa.me/51961508813");
  });

  it("does not render a broken action when the configured value is invalid", () => {
    expect(
      renderToStaticMarkup(<FloatingWhatsAppButton phone="---" locale="es" />),
    ).toBe("");
  });
});
