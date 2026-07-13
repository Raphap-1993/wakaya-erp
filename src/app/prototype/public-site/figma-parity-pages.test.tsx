import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import PublicSiteAboutPage from "./about/page";
import PublicSiteBungalowsPage from "./bungalows/page";
import PublicSiteContactPage from "./contact/page";
import PublicSiteGalleryPage from "./gallery/page";
import PublicSiteServicesPage from "./services/page";

describe("prototype public-site figma parity", () => {
  it("renders the rooms listing with the Figma hierarchy and room CTAs", async () => {
    const html = renderToStaticMarkup(await PublicSiteBungalowsPage({}));

    expect(html).toContain("Nuestros Bungalows");
    expect(html).toContain("Bungalows de madera nativa rodeados de naturaleza tropical");
    expect(html).toContain("Bungalow Matrimonial");
    expect(html).toContain("Bungalow Doble");
    expect(html).toContain("Bungalow Triple");
    expect(html).toContain("Bungalow Familiar");
    expect(html).toContain("Ver detalles y reservar");
  });

  it("renders the approved services catalog", async () => {
    const html = renderToStaticMarkup(await PublicSiteServicesPage());

    expect(html).toContain("Servicios");
    expect(html).toContain("Bodas");
    expect(html).toContain("Eventos Corporativos");
    expect(html).toContain("Full Day");
    expect(html).toContain("Cenas Románticas");
    expect(html).toContain("Restaurante");
    expect(html).not.toContain("Kayak en el Río");
  });

  it("renders the gallery page with the Figma gallery density and labels", async () => {
    const html = renderToStaticMarkup(await PublicSiteGalleryPage());

    expect(html).toContain("Galería");
    expect(html).toContain("La belleza de Wakaya en imágenes");
    expect(html).toContain("Wakaya · 1");
    expect(html).toContain("Wakaya · 9");
    expect(html).toContain("Wakaya · 18");
  });

  it("renders the about page with the Figma story and value blocks", async () => {
    const html = renderToStaticMarkup(await PublicSiteAboutPage());

    expect(html).toContain("Nosotros");
    expect(html).toContain("Un paraíso en el corazón de Pucallpa");
    expect(html).toContain("Tenemos como propósito");
    expect(html).toContain("Integridad");
    expect(html).toContain("Respeto por la naturaleza");
    expect(html).toContain("Trabajo en equipo");
  });

  it("renders the contact page with the Figma copy while keeping the booking-request contract", async () => {
    const html = renderToStaticMarkup(await PublicSiteContactPage({}));

    expect(html).toContain("Contáctanos");
    expect(html).toContain("Hablemos");
    expect(html).toContain("Planifica tu estadía");
    expect(html).toContain("Para reservas, consultas y grupos escríbenos. Respondemos en menos de 24 horas.");
    expect(html).toContain("WhatsApp");
    expect(html).toContain("Atención");
    expect(html).toContain("Enviar solicitud");
    expect(html).toContain('action="/api/public/booking-requests"');
  });
});
