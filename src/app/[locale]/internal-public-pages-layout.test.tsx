import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import figmaStyles from "@/components/public-site/figma-public-pages.module.css";
import styles from "@/components/public-site/public-site-theme.module.css";

import AboutPage from "./about/page";
import BungalowDetailPage from "./bungalows/[slug]/page";
import BungalowsPage from "./bungalows/page";
import ContactPage from "./contact/page";
import EventsPage from "./events/page";
import FaqPage from "./faq/page";
import GalleryPage from "./gallery/page";
import HotelPoliciesPage from "./hotel-policies/page";
import PetFriendlyPage from "./pet-friendly/page";
import ComplaintsBookPage from "./complaints-book/page";
import PublicationsPage from "./publications/page";
import ServicesPage from "./services/page";
import TestimonialsPage from "./testimonials/page";

describe("localized internal public pages layout", () => {
  it("renders about under the prototype page-section rhythm", async () => {
    const html = renderToStaticMarkup(
      await AboutPage({
        params: Promise.resolve({ locale: "es" }),
      }),
    );

    expect(html).toContain(styles.pageSection);
    expect(html).toContain(styles.aboutSection);
    expect(html).toContain("23 de junio de 2019");
    expect(html).toContain("¿Qué significa la palabra Wakaya?");
    expect(html).toContain("Tenemos como propósito");
    expect(html).toContain("4,000 m²");
  });

  it("renders contact as a form-led contact grid", async () => {
    const html = renderToStaticMarkup(
      await ContactPage({
        params: Promise.resolve({ locale: "es" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(html).toContain(figmaStyles.section);
    expect(html).toContain(figmaStyles.contactGrid);
    expect(html).toContain(figmaStyles.contactInfoCard);
    expect(html).toContain(figmaStyles.contactFormCard);
    expect(html).toContain('action="/api/public/booking-requests"');
    expect(html).toContain("Carretera Federico Basadre km 7.200");
    expect(html).toContain("Lun–Dom · 7:00 — 20:00");
  });

  it("renders the bungalow catalog with the prototype summary shell", async () => {
    const html = renderToStaticMarkup(
      await BungalowsPage({
        params: Promise.resolve({ locale: "es" }),
        searchParams: Promise.resolve({
          category: "bungalow-familiar",
          checkIn: "2026-07-20",
          checkOut: "2026-07-22",
          guests: "4",
        }),
      }),
    );

    expect(html).toContain(figmaStyles.section);
    expect(html).toContain(figmaStyles.roomGrid);
    expect(html).toContain(figmaStyles.roomCard);
    expect(html).toContain("Ver detalles y reservar");
  });

  it("renders the bungalow detail page with the prototype detail shell", async () => {
    const html = renderToStaticMarkup(
      await BungalowDetailPage({
        params: Promise.resolve({ locale: "es", slug: "bungalow-familiar" }),
        searchParams: Promise.resolve({
          category: "bungalow-familiar",
          checkIn: "2026-07-10",
          checkOut: "2026-07-12",
          guests: "4",
        }),
      }),
    );

    expect(html).toContain(styles.detailShell);
    expect(html).toContain(styles.detailGrid);
    expect(html).toContain(styles.detailMain);
    expect(html).toContain(styles.detailSidebar);
    expect(html).toContain(styles.detailBackButton);
  });

  it("renders services with the Figma experiences system and keeps events on the editorial cards", async () => {
    const servicesHtml = renderToStaticMarkup(
      await ServicesPage({
        params: Promise.resolve({ locale: "es" }),
      }),
    );
    const eventsHtml = renderToStaticMarkup(
      await EventsPage({
        params: Promise.resolve({ locale: "es" }),
      }),
    );

    expect(servicesHtml).toContain(figmaStyles.section);
    expect(servicesHtml).toContain(figmaStyles.experienceGrid);
    expect(servicesHtml).toContain(figmaStyles.experienceCard);
    expect(eventsHtml).toContain(styles.pageSection);
    expect(eventsHtml).toContain(styles.editorialGrid);
    expect(eventsHtml).toContain(styles.pageCopyCard);
  });

  it("renders gallery and publications with the immersive/editorial prototype layouts", async () => {
    const galleryHtml = renderToStaticMarkup(
      await GalleryPage({
        params: Promise.resolve({ locale: "es" }),
      }),
    );
    const publicationsHtml = renderToStaticMarkup(
      await PublicationsPage({
        params: Promise.resolve({ locale: "es" }),
      }),
    );

    expect(galleryHtml).toContain(figmaStyles.section);
    expect(galleryHtml).toContain(figmaStyles.galleryGrid);
    expect(galleryHtml).toContain(figmaStyles.galleryTile);
    expect(publicationsHtml).toContain(styles.pageSection);
    expect(publicationsHtml).toContain(styles.publicationGrid);
    expect(publicationsHtml).toContain(styles.publicationMeta);
  });

  it("renders the trust and company support pages with the shared editorial shell", async () => {
    const faqHtml = renderToStaticMarkup(
      await FaqPage({
        params: Promise.resolve({ locale: "es" }),
      }),
    );
    const policiesHtml = renderToStaticMarkup(
      await HotelPoliciesPage({
        params: Promise.resolve({ locale: "es" }),
      }),
    );
    const petFriendlyHtml = renderToStaticMarkup(
      await PetFriendlyPage({
        params: Promise.resolve({ locale: "es" }),
      }),
    );
    const complaintsHtml = renderToStaticMarkup(
      await ComplaintsBookPage({
        params: Promise.resolve({ locale: "es" }),
      }),
    );
    const testimonialsHtml = renderToStaticMarkup(
      await TestimonialsPage({
        params: Promise.resolve({ locale: "es" }),
      }),
    );

    expect(faqHtml).toContain(styles.pageSection);
    expect(faqHtml).toContain("Preguntas frecuentes");
    expect(faqHtml).toContain("¿Cómo se reserva un hotel?");
    expect(policiesHtml).toContain(styles.pageSection);
    expect(policiesHtml).toContain("Políticas del hotel");
    expect(policiesHtml).toContain("Términos y condiciones");
    expect(policiesHtml).toContain("Tratamiento de datos personales");
    expect(policiesHtml).toContain("24 horas");
    expect(policiesHtml).toContain("48 horas");
    expect(policiesHtml).toContain("Ley N.º 29733");
    expect(policiesHtml).toContain("Decreto Supremo N.º 016-2024-JUS");
    expect(policiesHtml).not.toContain("25 % de early check-in");
    expect(policiesHtml).not.toContain("requiere revisión legal");
    expect(policiesHtml).not.toContain("derecho de retención y prenda");
    expect(petFriendlyHtml).toContain(styles.pageSection);
    expect(petFriendlyHtml).toContain("Pet Friendly");
    expect(complaintsHtml).toContain(styles.pageSection);
    expect(complaintsHtml).toContain("Libro de Reclamaciones");
    expect(complaintsHtml).toContain('action="/api/public/complaints"');
    expect(complaintsHtml).toContain('name="fullName"');
    expect(complaintsHtml).toContain('name="complaintDetail"');
    expect(testimonialsHtml).toContain(styles.pageSection);
    expect(testimonialsHtml).toContain("Testimonios");
    expect(testimonialsHtml).toContain("Michael C.");
  });
});
