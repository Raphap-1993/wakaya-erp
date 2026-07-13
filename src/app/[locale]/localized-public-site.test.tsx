import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getHomeSlides, getPublicBungalows } from "@/components/public-site/public-site-data";

let mockedPathname = "/en";
let mockedSearchParams = new URLSearchParams();
const mockedRouter = {
  push: vi.fn(),
  replace: vi.fn(),
};

vi.mock("next/navigation", () => ({
  usePathname: () => mockedPathname,
  useRouter: () => mockedRouter,
  useSearchParams: () => mockedSearchParams,
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

import LocalizedPublicSiteLayout from "./layout";
import LocalizedPublicHomePage, * as localizedHomeModule from "./page";
import LocalizedAboutPage from "./about/page";
import LocalizedBungalowsPage from "./bungalows/page";
import LocalizedContactPage from "./contact/page";
import LocalizedBungalowDetailPage, * as localizedBungalowDetailModule from "./bungalows/[slug]/page";
import LocalizedEventsPage from "./events/page";
import LocalizedGalleryPage from "./gallery/page";
import LocalizedServicesPage from "./services/page";
import LocalizedFaqPage from "./faq/page";
import LocalizedHotelPoliciesPage from "./hotel-policies/page";
import LocalizedPetFriendlyPage from "./pet-friendly/page";
import LocalizedComplaintsBookPage from "./complaints-book/page";
import LocalizedTestimonialsPage from "./testimonials/page";
import { getPublicSiteContent } from "./public-site-content";
import PrototypeAboutPage from "@/app/prototype/public-site/about/page";
import PrototypeBungalowsPage from "@/app/prototype/public-site/bungalows/page";
import PrototypeContactPage from "@/app/prototype/public-site/contact/page";
import PrototypeEventsPage from "@/app/prototype/public-site/events/page";
import PrototypeGalleryPage from "@/app/prototype/public-site/gallery/page";
import PrototypeServicesPage from "@/app/prototype/public-site/services/page";
import PrototypePublicSitePage from "@/app/prototype/public-site/page";

function normalizeMarkup(source: string) {
  return source.replace(/\s+/g, " ").trim();
}

function createThenable<T>(value: T): PromiseLike<T> {
  return {
    then<TResult1 = T, TResult2 = never>(
      onFulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
      _onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ): PromiseLike<TResult1 | TResult2> {
      return Promise.resolve(onFulfilled ? onFulfilled(value) : (value as unknown as TResult1));
    },
  };
}

describe("localized public site routes", () => {
  beforeEach(() => {
    mockedPathname = "/en";
    mockedSearchParams = new URLSearchParams();
    mockedRouter.push.mockReset();
    mockedRouter.replace.mockReset();
  });

  it("exposes the five approved bungalow categories without physical unit counts", () => {
    expect(getPublicBungalows("es").map((bungalow) => bungalow.name)).toEqual([
      "Bungalow Familiar",
      "Bungalow Matrimonial",
      "Bungalow Individual",
      "Bungalow Doble",
      "Bungalow Triple",
    ]);
    expect(JSON.stringify(getPublicBungalows("es"))).not.toContain("unitCount");
  });

  it("renders the Individual category without invented rate or placeholder facts", async () => {
    const html = renderToStaticMarkup(
      await LocalizedBungalowDetailPage({
        params: Promise.resolve({ locale: "es", slug: "bungalow-individual" }),
        searchParams: Promise.resolve({}),
      }),
    );
    const staticParams = localizedBungalowDetailModule.generateStaticParams();

    expect(html).toContain("Bungalow Individual");
    expect(html).toContain("Consultar tarifa");
    expect(html).not.toContain("Pendiente");
    expect(html).not.toContain("S/. 0");
    expect(staticParams).toContainEqual({ locale: "es", slug: "bungalow-individual" });
    expect(staticParams).toContainEqual({ locale: "en", slug: "bungalow-individual" });
  });

  it("exports bilingual metadata alternates for the public home", async () => {
    const metadata = await localizedHomeModule.generateMetadata({
      params: Promise.resolve({ locale: "en" }),
    });

    expect(metadata).toMatchObject({
      alternates: {
        canonical: "/en",
        languages: {
          es: "/es",
          en: "/en",
        },
      },
      openGraph: {
        locale: "en_US",
        url: "/en",
      },
    });
  });

  it("resolves thenable locale params without depending on Promise instanceof checks", async () => {
    const metadata = await localizedHomeModule.generateMetadata({
      params: createThenable({ locale: "es" }) as unknown as Promise<{ locale: string }>,
    });

    expect(metadata).toMatchObject({
      title: "Wakaya Ecolodge | Estadia amazonica en Pucallpa",
      alternates: {
        canonical: "/es",
      },
    });
  });

  it("renders the english public shell and home CTAs", async () => {
    const html = renderToStaticMarkup(
      await LocalizedPublicSiteLayout({
        params: Promise.resolve({ locale: "en" }),
        children: await LocalizedPublicHomePage({
          params: Promise.resolve({ locale: "en" }),
        }),
      }),
    );

    expect(html).toContain("Home");
    expect(html).toContain("About");
    expect(html).toContain("Book now");
    expect(html).toContain("Rooms");
    expect(html).toContain("Wakaya Ecolodge");
    expect(html).toContain("An encounter with the magical");
    expect(html).toContain("Our Bungalows");
    expect(html).toContain("Unique experiences");
    expect(html).toContain("What our guests remember most");
    expect(html).toContain("Request reservation");
    expect(html).not.toContain("Manual reservation request");
    expect(html).not.toContain("Share your ideal dates and the Wakaya team will coordinate everything with you.");
    expect(html).toContain('href="/en/bungalows"');
    expect(html).toContain('href="/en/publications"');
    expect(html).toContain('href="/en/contact"');
    expect(html).toContain("Gallery");
  });

  it("preserves the approved spanish home structure now aligned to the published prototype", async () => {
    mockedPathname = "/es";

    const html = renderToStaticMarkup(
      await LocalizedPublicSiteLayout({
        params: Promise.resolve({ locale: "es" }),
        children: await LocalizedPublicHomePage({
          params: Promise.resolve({ locale: "es" }),
        }),
      }),
    );

    expect(html).toContain("Wakaya Ecolodge");
    expect(html).toContain("Un encuentro con lo Magico");
    expect(html).toContain("Nuestros Bungalows");
    expect(html).toContain("Experiencias unicas");
    expect(html).toContain("Lo que dicen nuestros huespedes");
    expect(html).toContain("Tu retiro en la selva te espera");
    expect(html).toContain('href="/es/contact"');
    expect(html).toContain("Habitaciones");
    expect(html).toContain('src="/images/wakaya/wakaya-logo-min.png"');
    expect(html).not.toContain("Solicitud manual de reserva");
    expect(html).not.toContain("Comparte tu fecha ideal y el equipo Wakaya coordina contigo antes de confirmar.");
  });

  it("renders editable typography variables for the public menu and home sections", async () => {
    mockedPathname = "/es";

    const html = renderToStaticMarkup(
      await LocalizedPublicSiteLayout({
        params: Promise.resolve({ locale: "es" }),
        children: await LocalizedPublicHomePage({
          params: Promise.resolve({ locale: "es" }),
        }),
      }),
    );

    expect(html).toContain("--nav-link-size");
    expect(html).toContain("--nav-link-weight");
    expect(html).toContain("--home-heading-size");
    expect(html).toContain("--home-cta-weight");
  });

  it("keeps events out of the footer navigation", async () => {
    mockedPathname = "/es";

    const html = renderToStaticMarkup(
      await LocalizedPublicSiteLayout({
        params: Promise.resolve({ locale: "es" }),
        children: await LocalizedPublicHomePage({
          params: Promise.resolve({ locale: "es" }),
        }),
      }),
    );

    const footerMarkup = html.slice(html.indexOf("<footer"));

    expect(footerMarkup).not.toContain('href="/es/events"');
    expect(footerMarkup).toContain('href="/es/about"');
    expect(footerMarkup).toContain('href="/es/faq"');
    expect(footerMarkup).toContain('href="/es/testimonials"');
    expect(footerMarkup).toContain('href="/es/gallery"');
    expect(footerMarkup).toContain('href="/es/publications"');
    expect(footerMarkup).toContain('href="/es/contact"');
    expect(footerMarkup).toContain('href="/es/hotel-policies"');
    expect(footerMarkup).toContain('href="/es/pet-friendly"');
    expect(footerMarkup).toContain('href="/es/complaints-book"');
    expect(footerMarkup).toContain("Preguntas frecuentes");
    expect(footerMarkup).toContain("Testimonios");
    expect(footerMarkup).toContain("Libro de Reclamaciones");
    expect(footerMarkup).toContain("Pet Friendly");
  });

  it("keeps localized content sources aligned with the approved home now served in runtime", () => {
    const esContent = getPublicSiteContent("es");
    const enContent = getPublicSiteContent("en");
    const esSlides = getHomeSlides("es");
    const enSlides = getHomeSlides("en");

    expect(esContent.home.hero.title).toBe("Encuentra tu refugio perfecto en Wakaya.");
    expect(esContent.home.rooms.title).toBe("Bungalows para descansar en Wakaya.");
    expect(esContent.home.bookingBand.submitLabel).toBe(
      "Consultar disponibilidad",
    );
    expect(esSlides.map((slide) => slide.title)).toEqual([
      "Encuentra tu refugio perfecto en Wakaya.",
      "Lo mejor de la selva del Peru.",
      "Un lodge para dormir, celebrar y desconectar.",
    ]);

    expect(enContent.home.hero.title).toBe(
      "Find your perfect refuge in Wakaya.",
    );
    expect(enContent.home.rooms.title).toBe("Bungalows for a stay at Wakaya.");
    expect(enContent.home.bookingBand.submitLabel).toBe("Check availability");
    expect(enSlides.map((slide) => slide.title)).toEqual([
      "Find your perfect refuge in Wakaya.",
      "The best of the Peruvian jungle.",
      "A lodge to sleep, celebrate, and disconnect.",
    ]);
  });

  it("renders the english contact form with the booking-request contract", async () => {
    const html = renderToStaticMarkup(
      await LocalizedContactPage({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve({
          requestedBungalowType: "bungalow-family",
          requestedCheckIn: "2026-07-10",
          requestedCheckOut: "2026-07-12",
          requestedGuests: "4",
          experience: "paseo-laguna",
        }),
      }),
    );

    expect(html).toContain('action="/api/public/booking-requests"');
    expect(html).toContain("Contact us");
    expect(html).toContain("Plan your stay");
    expect(html).toContain('name="requestedBungalowType"');
    expect(html).toContain('name="requestedExperienceId" value="exp_02"');
    expect(html).toContain("Selected experience");
    expect(html).toContain("Full Day");
    expect(html).toContain("Send request");
  });

  it("renders the services listing from the unified experience source and opens the selected experience in a dialog", async () => {
    mockedPathname = "/es/services";
    mockedSearchParams = new URLSearchParams("experience=paseo-laguna");

    const html = renderToStaticMarkup(
      await LocalizedServicesPage({
        params: Promise.resolve({ locale: "es" }),
      }),
    );

    expect(html).toContain("Servicios");
    expect(html).toContain("Full Day");
    expect(html).toContain('role="dialog"');
    expect(html).toContain("Consultar servicio");
    expect(html).toContain('href="/es/contact?experience=paseo-laguna"');
  });

  it("ignores unknown experience slugs and keeps the services page in its base state", async () => {
    mockedPathname = "/es/services";
    mockedSearchParams = new URLSearchParams("experience=no-existe");

    const html = renderToStaticMarkup(
      await LocalizedServicesPage({
        params: Promise.resolve({ locale: "es" }),
      }),
    );

    expect(html).toContain("Servicios");
    expect(html).not.toContain('role="dialog"');
  });

  it("renders the new public trust pages in english with guest-facing copy", async () => {
    const faqHtml = renderToStaticMarkup(
      await LocalizedFaqPage({
        params: Promise.resolve({ locale: "en" }),
      }),
    );
    const policiesHtml = renderToStaticMarkup(
      await LocalizedHotelPoliciesPage({
        params: Promise.resolve({ locale: "en" }),
      }),
    );
    const petFriendlyHtml = renderToStaticMarkup(
      await LocalizedPetFriendlyPage({
        params: Promise.resolve({ locale: "en" }),
      }),
    );
    const complaintsHtml = renderToStaticMarkup(
      await LocalizedComplaintsBookPage({
        params: Promise.resolve({ locale: "en" }),
      }),
    );
    const testimonialsHtml = renderToStaticMarkup(
      await LocalizedTestimonialsPage({
        params: Promise.resolve({ locale: "en" }),
      }),
    );

    expect(faqHtml).toContain("Frequently asked questions");
    expect(faqHtml).toContain("How do I book a stay?");
    expect(faqHtml).toContain("Reservations are confirmed according to availability");
    expect(faqHtml).not.toContain("Select the bungalow category");
    expect(policiesHtml).toContain("Hotel Policies");
    expect(policiesHtml).toContain("Terms and conditions");
    expect(policiesHtml).toContain("Privacy and personal data");
    expect(policiesHtml).not.toContain("back office");
    expect(petFriendlyHtml).toContain("Pet Friendly");
    expect(petFriendlyHtml).toContain("small and medium pets");
    expect(complaintsHtml).toContain("Complaints Book");
    expect(complaintsHtml).toContain("reservas@wakayaecolodge.com");
    expect(complaintsHtml).toContain('action="/api/public/complaints"');
    expect(complaintsHtml).toContain('name="consumerRequest"');
    expect(testimonialsHtml).toContain("Guest testimonials");
    expect(testimonialsHtml).toContain("Michael C.");
    expect(testimonialsHtml).toContain("Australia");
  });

  it("defaults the bungalow detail reservation flow to the room capacity when guests were not preselected", async () => {
    const html = renderToStaticMarkup(
      await LocalizedBungalowDetailPage({
        params: Promise.resolve({ locale: "en", slug: "bungalow-familiar" }),
        searchParams: Promise.resolve({
          checkIn: "2026-07-10",
          checkOut: "2026-07-12",
        }),
      }),
    );

    expect(html).toContain("Family Bungalow");
    expect(html).toContain("4 guests");
    expect(html).toContain("Capacity: 4 guests.");
    expect(html).not.toContain("This bungalow is managed for");
    expect(html).toContain('action="/api/public/booking-requests"');
    expect(html).toContain('name="guestName"');
    expect(html).toContain('name="guestEmail"');
    expect(html).not.toContain('href="/en/contact?requestedBungalowType=bungalow-family&amp;requestedCheckIn=2026-07-10&amp;requestedCheckOut=2026-07-12&amp;requestedGuests=4"');
  });

  it("limits the contact guest selector to the preferred bungalow capacity and preselects it", async () => {
    const html = renderToStaticMarkup(
      await LocalizedContactPage({
        params: Promise.resolve({ locale: "es" }),
        searchParams: Promise.resolve({
          requestedBungalowType: "bungalow-family",
        }),
      }),
    );

    expect(html).toContain('name="requestedBungalowType"');
    expect(html).toContain('<option value="4" selected="">4 personas</option>');
    expect(html).not.toContain(">1 persona<");
    expect(html).not.toContain(">2 personas<");
    expect(html).not.toContain(">3 personas<");
    expect(html).not.toContain(">5 personas<");
    expect(html).not.toContain(">6 personas<");
    expect(html).toContain("+51 961 508 813");
    expect(html).toContain("+51 977 419 468");
    expect(html).not.toContain("+51 963 847 291");
  });

  it("keeps the locale on bungalow detail follow-up links", async () => {
    const html = renderToStaticMarkup(
      await LocalizedBungalowDetailPage({
        params: Promise.resolve({ locale: "en", slug: "bungalow-familiar" }),
        searchParams: Promise.resolve({
          category: "bungalow-familiar",
          checkIn: "2026-07-10",
          checkOut: "2026-07-12",
          guests: "4",
        }),
      }),
    );

    expect(html).toContain("Family Bungalow");
    expect(html).toContain('action="/api/public/booking-requests"');
    expect(html).toContain('name="requestedBungalowType" value="bungalow-family"');
    expect(html).toContain('name="requestedGuests" value="4"');
    expect(html).toContain('href="/en/bungalows?category=bungalow-familiar&amp;checkIn=2026-07-10&amp;checkOut=2026-07-12&amp;guests=4"');
  });

  it("removes legacy Apullay mentions from the public localized runtime pages", async () => {
    const pages = [
      await LocalizedPublicSiteLayout({
        children: <main>Contenido</main>,
        params: Promise.resolve({ locale: "es" }),
      }),
      await LocalizedPublicHomePage({
        params: Promise.resolve({ locale: "es" }),
      }),
      await LocalizedAboutPage({
        params: Promise.resolve({ locale: "es" }),
      }),
      await LocalizedBungalowsPage({
        params: Promise.resolve({ locale: "es" }),
      }),
      await LocalizedBungalowDetailPage({
        params: Promise.resolve({ locale: "es", slug: "bungalow-doble" }),
        searchParams: Promise.resolve({}),
      }),
      await LocalizedGalleryPage({
        params: Promise.resolve({ locale: "es" }),
      }),
    ];

    const html = pages.map((page) => renderToStaticMarkup(page)).join(" ");

    expect(html).not.toContain("Apullay");
    expect(html).not.toContain("apullay");
  });

  it("keeps public pages free of developer commentary, migration narration, and empty support panels", async () => {
    const pages = [
      await LocalizedPublicHomePage({ params: Promise.resolve({ locale: "es" }) }),
      await LocalizedAboutPage({ params: Promise.resolve({ locale: "es" }) }),
      await LocalizedFaqPage({ params: Promise.resolve({ locale: "es" }) }),
      await LocalizedTestimonialsPage({ params: Promise.resolve({ locale: "es" }) }),
      await LocalizedHotelPoliciesPage({ params: Promise.resolve({ locale: "es" }) }),
      await LocalizedServicesPage({ params: Promise.resolve({ locale: "es" }) }),
      await LocalizedContactPage({ params: Promise.resolve({ locale: "es" }), searchParams: Promise.resolve({}) }),
      await LocalizedPublicHomePage({ params: Promise.resolve({ locale: "en" }) }),
      await LocalizedPublicSiteLayout({
        children: <main>Content</main>,
        params: Promise.resolve({ locale: "en" }),
      }),
      await LocalizedFaqPage({ params: Promise.resolve({ locale: "en" }) }),
      await LocalizedTestimonialsPage({ params: Promise.resolve({ locale: "en" }) }),
      await LocalizedHotelPoliciesPage({ params: Promise.resolve({ locale: "en" }) }),
    ];
    const html = pages.map((page) => renderToStaticMarkup(page)).join(" ");
    const forbiddenPhrases = [
      "Capa pública multipágina",
      "sitio anterior",
      "sitio legacy",
      "contenido legacy",
      "contenido original",
      "testimonios rescatados",
      "flujo empieza desde la web",
      "seguir el flujo completo",
      "Multi-page public experience",
      "legacy site",
      "legacy content",
      "rescued from the legacy",
      "coordinacion manual",
      "solicitud manual",
      "mismo hilo",
      "manual coordination",
      "same thread",
      "La web te ayuda a ordenar",
      "El equipo te responde por el mismo canal",
      "A clear route",
      "Una ruta clara",
    ];

    for (const phrase of forbiddenPhrases) {
      expect(html, `public output must not include ${phrase}`).not.toContain(phrase);
    }
    expect(html).not.toMatch(/>Incluye<\/h3><ul[^>]*><\/ul>/);
    expect(html).not.toMatch(/>Includes<\/h3><ul[^>]*><\/ul>/);
  });

  it("preserves broad search params on the detail back link when the user did not lock a category", async () => {
    const html = renderToStaticMarkup(
      await LocalizedBungalowDetailPage({
        params: Promise.resolve({ locale: "en", slug: "bungalow-familiar" }),
        searchParams: Promise.resolve({
          checkIn: "2026-07-10",
          checkOut: "2026-07-12",
          guests: "4",
        }),
      }),
    );

    expect(html).toContain('href="/en/bungalows?checkIn=2026-07-10&amp;checkOut=2026-07-12&amp;guests=4"');
    expect(html).not.toContain('href="/en/bungalows?category=bungalow-familiar&amp;checkIn=2026-07-10&amp;checkOut=2026-07-12&amp;guests=4"');
  });

  it("keeps every approved spanish public surface 1:1 with the prototype alias routes", async () => {
    const bungalowSearchParams = {
      category: "bungalow-familiar",
      checkIn: "2026-07-20",
      checkOut: "2026-07-22",
      guests: "4",
    };

    const parityCases = [
      {
        label: "home",
        localized: async () =>
          LocalizedPublicHomePage({
            params: Promise.resolve({ locale: "es" }),
          }),
        prototype: async () => PrototypePublicSitePage(),
        fragments: [
          "Wakaya Ecolodge",
          'href="/es/contact">Reservar ahora</a>',
        ],
      },
      {
        label: "about",
        localized: async () =>
          LocalizedAboutPage({
            params: Promise.resolve({ locale: "es" }),
          }),
        prototype: async () => PrototypeAboutPage(),
        fragments: [
          "Un paraíso en el corazón de Pucallpa",
          "Tenemos como propósito",
        ],
      },
      {
        label: "contact",
        localized: async () =>
          LocalizedContactPage({
            params: Promise.resolve({ locale: "es" }),
            searchParams: Promise.resolve({}),
          }),
        prototype: async () =>
          PrototypeContactPage({
            searchParams: Promise.resolve({}),
          }),
        fragments: [
          "Contáctanos",
          'action="/api/public/booking-requests"',
        ],
      },
      {
        label: "bungalows",
        localized: async () =>
          LocalizedBungalowsPage({
            params: Promise.resolve({ locale: "es" }),
            searchParams: Promise.resolve(bungalowSearchParams),
          }),
        prototype: async () =>
          PrototypeBungalowsPage({
            searchParams: Promise.resolve(bungalowSearchParams),
          }),
        fragments: [
          "Nuestros Bungalows",
          'href="/es/bungalows/bungalow-familiar?category=bungalow-familiar&amp;checkIn=2026-07-20&amp;checkOut=2026-07-22&amp;guests=4"',
        ],
      },
      {
        label: "services",
        localized: async () =>
          LocalizedServicesPage({
            params: Promise.resolve({ locale: "es" }),
          }),
        prototype: async () => PrototypeServicesPage(),
        fragments: [
          "Servicios",
          "Full Day",
        ],
      },
      {
        label: "gallery",
        localized: async () =>
          LocalizedGalleryPage({
            params: Promise.resolve({ locale: "es" }),
          }),
        prototype: async () => PrototypeGalleryPage(),
        fragments: [
          "Galería",
          "Wakaya · 18",
        ],
      },
      {
        label: "events",
        localized: async () =>
          LocalizedEventsPage({
            params: Promise.resolve({ locale: "es" }),
          }),
        prototype: async () => PrototypeEventsPage(),
        fragments: [
          "Eventos",
          "Wakaya como venue natural",
          'href="/es/contact"',
        ],
      },
    ] as const;

    for (const parityCase of parityCases) {
      const localizedHtml = normalizeMarkup(
        renderToStaticMarkup(await parityCase.localized()),
      );
      const prototypeHtml = normalizeMarkup(
        renderToStaticMarkup(await parityCase.prototype()),
      );

      expect(
        localizedHtml,
        `${parityCase.label} should stay byte-aligned between /es and /prototype/public-site`,
      ).toBe(prototypeHtml);

      for (const fragment of parityCase.fragments) {
        expect(
          localizedHtml,
          `${parityCase.label} should keep stable parity fragment ${fragment}`,
        ).toContain(fragment);
      }
    }
  });
});
