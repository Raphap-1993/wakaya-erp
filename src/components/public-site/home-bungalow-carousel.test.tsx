import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HomeBungalowCarousel } from "./home-bungalow-carousel";

const rooms = ["Familiar", "Matrimonial", "Individual", "Doble", "Triple"].map(
  (name) => ({
    slug: `bungalow-${name.toLowerCase()}`,
    image: `/images/${name.toLowerCase()}.webp`,
    displayName: `Bungalow ${name}`,
    displayPriceFrom: "S/. 250",
    displayTagline: "Wakaya",
    displayDescription: "Descripción",
    displayCapacity: "2 personas",
    displayArea: "28 m2",
  }),
);

describe("HomeBungalowCarousel", () => {
  it("lists all five bungalows in the order supplied by the backoffice view", () => {
    const html = renderToStaticMarkup(
      <HomeBungalowCarousel locale="es" rooms={rooms} detailLabel="Ver detalles" />,
    );

    expect(html.split('data-home-section="room-grid-card"')).toHaveLength(6);
    expect(html.indexOf("Bungalow Familiar")).toBeLessThan(html.indexOf("Bungalow Matrimonial"));
    expect(html.indexOf("Bungalow Matrimonial")).toBeLessThan(html.indexOf("Bungalow Individual"));
    expect(html.indexOf("Bungalow Individual")).toBeLessThan(html.indexOf("Bungalow Doble"));
    expect(html.indexOf("Bungalow Doble")).toBeLessThan(html.indexOf("Bungalow Triple"));
    expect(html).toContain('aria-label="Bungalows anteriores"');
    expect(html).toContain('aria-label="Siguientes bungalows"');
  });
});
