import type { Route } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

import { HomeHeroSlider } from "@/components/public-site/home-hero-slider";
import homeStyles from "@/components/public-site/home-prototype.module.css";
import type { PublicSiteLocale } from "@/components/public-site/public-site-locale";
import {
  getPublicBungalowDetailRoute,
  getPublicRoute,
} from "@/components/public-site/public-site-routes";
import { getLocalizedDefaultHomeExperiences } from "@/lib/content/default-experiences";
import { buildHomeSectionStyleVars } from "@/lib/home-content/style-resolver";
import { homeContentStore } from "@/lib/home-content/store";
import { toLocalizedHomeView } from "@/lib/home-content/public-view";
import { getLocalizedBungalows, getPublicSiteContent } from "./public-site-content";
import { buildLocalizedPublicMetadata } from "./public-site-metadata";

type HomeRouteKey = "about" | "bungalows" | "contact" | "services";

type HomeHero = {
  eyebrow: string;
  title: string;
  subtitle: string;
  copy?: string;
  primaryCtaLabel: string;
  primaryRoute: HomeRouteKey;
  secondaryCtaLabel: string;
  secondaryRoute: HomeRouteKey;
  image: string;
  scrollLabel: string;
};

type ManualRequest = {
  title: string;
  helper: string;
  checkIn: string;
  checkOut: string;
  guests: string;
  room: string;
  allCategories: string;
  guestOptions: string[];
  submitLabel: string;
  submitHint: string;
};

type HomeStat = {
  value: string;
  label: string;
};

type StorySection = {
  eyebrow: string;
  title: string;
  paragraphs: string[];
  ctaLabel: string;
  route: HomeRouteKey;
  quote: string;
  quoteSource: string;
  image: string;
};

type ExperienceCard = {
  eyebrow: string;
  title: string;
  copy: string;
  price: string;
  duration: string;
  image: string;
};

type Testimonial = {
  name: string;
  origin: string;
  quote: string;
};

type ClosingSection = {
  eyebrow: string;
  title: string;
  ctaLabel: string;
  route: HomeRouteKey;
  image: string;
};

type HomeExperience = {
  hero: HomeHero;
  request: ManualRequest;
  stats: HomeStat[];
  story: StorySection;
  rooms: {
    eyebrow: string;
    title: string;
    ctaLabel: string;
    detailLabel: string;
  };
  quoteBand: {
    quote: string;
    source: string;
    image: string;
  };
  experiences: {
    eyebrow: string;
    title: string;
    ctaLabel: string;
    items: ExperienceCard[];
  };
  testimonials: {
    eyebrow: string;
    title: string;
    items: Testimonial[];
  };
  closing: ClosingSection;
};

function buildHeroSlides(locale: PublicSiteLocale, home: HomeExperience) {
  return [
    {
      eyebrow: home.hero.eyebrow,
      title: home.hero.title,
      subtitle: home.hero.subtitle,
      copy: home.hero.copy,
      ctaLabel: home.hero.primaryCtaLabel,
      href: getPublicRoute(locale, home.hero.primaryRoute),
      secondaryCtaLabel: home.hero.secondaryCtaLabel,
      secondaryHref: getPublicRoute(locale, home.hero.secondaryRoute),
      image: home.hero.image,
      scrollLabel: home.hero.scrollLabel,
    },
    {
      eyebrow: home.rooms.eyebrow,
      title: home.rooms.title,
      subtitle: home.experiences.title,
      copy: home.story.paragraphs[0],
      ctaLabel: home.rooms.ctaLabel,
      href: getPublicRoute(locale, "bungalows"),
      secondaryCtaLabel: home.story.ctaLabel,
      secondaryHref: getPublicRoute(locale, home.story.route),
      image: home.quoteBand.image,
      scrollLabel: home.hero.scrollLabel,
    },
    {
      eyebrow: home.closing.eyebrow,
      title: home.closing.title,
      subtitle: home.testimonials.title,
      copy: home.story.paragraphs[1],
      ctaLabel: home.closing.ctaLabel,
      href: getPublicRoute(locale, home.closing.route),
      secondaryCtaLabel: home.experiences.ctaLabel,
      secondaryHref: getPublicRoute(locale, "services"),
      image: home.closing.image,
      scrollLabel: home.hero.scrollLabel,
    },
  ];
}

function buildHomeExperience(locale: PublicSiteLocale): HomeExperience {
  if (locale === "en") {
    return {
      hero: {
        eyebrow: "Pucallpa · Peruvian Amazon",
        title: "Wakaya Ecolodge",
        subtitle: "An encounter with the magical",
        primaryCtaLabel: "Reserve now",
        primaryRoute: "contact",
        secondaryCtaLabel: "Explore experiences",
        secondaryRoute: "services",
        image: "https://wakayaecolodge.com/es/images/wakaya/gallery/gallery01.jpg",
        scrollLabel: "Explore",
      },
      request: {
        title: "Plan your jungle stay",
        helper:
          "Choose your dates, preferred bungalow, and group size. We will guide you toward the best fit for your trip.",
        checkIn: "Check in",
        checkOut: "Check out",
        guests: "Guests",
        room: "Room",
        allCategories: "All categories",
        guestOptions: ["2 guests", "3 guests", "4 guests", "5 guests"],
        submitLabel: "View options",
        submitHint: "Next step: review matching bungalows and send your request.",
      },
      stats: [
        { value: "50+", label: "Hectares of jungle" },
        { value: "8", label: "Bungalows" },
        { value: "200+", label: "Bird species" },
        { value: "15+", label: "Years of history" },
      ],
      story: {
        eyebrow: "Our story",
        title: "Where the jungle transforms you",
        paragraphs: [
          "Wakaya was born from the dream of protecting a tropical retreat near Pucallpa. Every bungalow was built with certified native wood and low environmental impact.",
          "We are a refuge for guests who want to disconnect from noise and reconnect with what matters: the river, the birds, and a slower tropical rhythm.",
        ],
        ctaLabel: "Discover our story",
        route: "about",
        quote: "Nature is not a place to visit. It is home.",
        quoteSource: "Gary Snyder",
        image: "https://wakayaecolodge.com/es/images/wakaya/aboutus/collage01.jpg",
      },
      rooms: {
        eyebrow: "Accommodation",
        title: "Our Bungalows",
        ctaLabel: "See all",
        detailLabel: "View details",
      },
      quoteBand: {
        quote: "Drive stress away. Wake up the soul.",
        source: "Pucallpa · Peruvian Amazon",
        image: "https://wakayaecolodge.com/es/images/wakaya/gallery/gallery09.jpg",
      },
      experiences: {
        eyebrow: "Experiences",
        title: "Unique experiences",
        ctaLabel: "See all",
        items: [
          {
            eyebrow: "2-3 h",
            title: "Kayak on the river",
            copy: "Follow Wakaya's tropical routes between birds, jungle edges, and a slower rhythm than a generic activity catalog.",
            price: "S/. 45",
            duration: "Kayak",
            image: "https://wakayaecolodge.com/es/images/wakaya/services/servicio_laguna.jpg",
          },
          {
            eyebrow: "4 h",
            title: "Jungle photography",
            copy: "A guided visual route through textures, light, and vegetation inside the central jungle atmosphere around Wakaya.",
            price: "S/. 90",
            duration: "Editorial walk",
            image: "https://wakayaecolodge.com/es/images/wakaya/gallery/gallery17.jpg",
          },
          {
            eyebrow: "Custom",
            title: "Weddings and celebrations",
            copy: "Celebrate surrounded by jungle with direct support from the Wakaya team.",
            price: "Quote",
            duration: "Tailored planning",
            image: "https://wakayaecolodge.com/es/images/wakaya/services/servicios_bodas.jpg",
          },
        ],
      },
      testimonials: {
        eyebrow: "Voices",
        title: "What our guests remember most",
        items: [
          {
            name: "Camila Vargas",
            origin: "Lima, Peru",
            quote: "The bungalows feel warm and real, and the team makes the whole arrival feel carefully hosted rather than transactional.",
          },
          {
            name: "Thomas & Sophie",
            origin: "Lyon, France",
            quote: "The calm, the trees, and the silence at night made Wakaya feel more memorable than any standard retreat we had tried.",
          },
          {
            name: "Mariela Paredes",
            origin: "Cusco, Peru",
            quote: "The Wakaya team answered clearly and made every detail of the stay easy to coordinate.",
          },
        ],
      },
      closing: {
        eyebrow: "Ready to escape",
        title: "Your jungle retreat is waiting",
        ctaLabel: "Request reservation",
        route: "contact",
        image: "https://wakayaecolodge.com/es/images/wakaya/gallery/gallery18.jpg",
      },
    };
  }

  return {
    hero: {
      eyebrow: "Pucallpa · Amazonía peruana",
      title: "Wakaya Ecolodge",
      subtitle: "Un encuentro con lo Magico",
      primaryCtaLabel: "Reservar ahora",
      primaryRoute: "contact",
      secondaryCtaLabel: "Explorar experiencias",
      secondaryRoute: "services",
      image: "https://wakayaecolodge.com/es/images/wakaya/gallery/gallery01.jpg",
      scrollLabel: "Explorar",
    },
    request: {
      title: "Planifica tu escape a la selva",
      helper: "Consulta disponibilidad por fecha, tipo de bungalow y cantidad de huéspedes.",
      checkIn: "Check in",
      checkOut: "Check out",
      guests: "Personas",
      room: "Habitacion",
      allCategories: "Todas las categorias",
      guestOptions: ["2 huespedes", "3 huespedes", "4 huespedes", "5 huespedes"],
      submitLabel: "Ver opciones",
      submitHint: "",
    },
    stats: [
      { value: "Pucallpa", label: "Amazonía peruana" },
      { value: "2019", label: "Desde" },
    ],
    story: {
      eyebrow: "Nuestra historia",
      title: "Donde la selva te transforma",
      paragraphs: [
        "Wakaya nació del sueño de conservar un refugio tropical cerca de Pucallpa. Cada bungalow fue construido con madera nativa certificada y mínimo impacto ambiental.",
        "Somos un refugio para quienes buscan desconectarse del ruido y reconectarse con lo esencial: el sonido del rio, el canto de las aves y un ritmo tropical mas humano.",
      ],
      ctaLabel: "Conoce nuestra historia",
      route: "about",
      quote: "La naturaleza no es un lugar a visitar. Es el hogar.",
      quoteSource: "Gary Snyder",
      image: "https://wakayaecolodge.com/es/images/wakaya/aboutus/collage01.jpg",
    },
    rooms: {
      eyebrow: "Alojamiento",
      title: "Nuestros Bungalows",
      ctaLabel: "Ver todos",
      detailLabel: "Ver detalles",
    },
    quoteBand: {
      quote: "Ahuyentar el estres. Despertar el alma.",
      source: "Pucallpa · Amazonía peruana",
      image: "https://wakayaecolodge.com/es/images/wakaya/gallery/gallery09.jpg",
    },
    experiences: {
      eyebrow: "Vivencias",
      title: "Experiencias unicas",
      ctaLabel: "Ver todas",
      items: [
        {
          eyebrow: "2-3 h",
          title: "Kayak en el rio",
          copy: "Recorre el entorno tropical de Wakaya entre aves y selva virgen con una puesta en escena más editorial que un listado turístico genérico.",
          price: "S/. 45",
          duration: "Kayak",
          image: "https://wakayaecolodge.com/es/images/wakaya/services/servicio_laguna.jpg",
        },
        {
          eyebrow: "4 h",
          title: "Fotografia en la selva",
          copy: "Una ruta visual para trabajar luz, texturas y vegetacion dentro del paisaje que define a Wakaya.",
          price: "S/. 90",
          duration: "Recorrido guiado",
          image: "https://wakayaecolodge.com/es/images/wakaya/gallery/gallery17.jpg",
        },
        {
          eyebrow: "A medida",
          title: "Bodas y celebraciones",
          copy: "Eventos rodeados de selva con acompañamiento directo del equipo Wakaya.",
          price: "Cotizar",
          duration: "Planeamiento humano",
          image: "https://wakayaecolodge.com/es/images/wakaya/services/servicios_bodas.jpg",
        },
      ],
    },
    testimonials: {
      eyebrow: "Voces",
      title: "Lo que dicen nuestros huespedes",
      items: [
        {
          name: "Camila Vargas",
          origin: "Lima, Peru",
          quote: "Los bungalows se sienten calidos y reales, y la llegada fue mucho mas cuidada porque todo se coordino con personas.",
        },
        {
          name: "Thomas & Sophie",
          origin: "Lyon, Francia",
          quote: "La calma, la vegetacion y el silencio nocturno hicieron que Wakaya se sintiera mas memorable que un retiro estandar.",
        },
        {
          name: "Mariela Paredes",
          origin: "Cusco, Peru",
          quote: "El equipo Wakaya respondió con claridad y facilitó cada detalle de la estadía.",
        },
      ],
    },
    closing: {
      eyebrow: "Listo para escapar",
      title: "Tu retiro en la selva te espera",
      ctaLabel: "Solicitar reserva",
      route: "contact",
      image: "https://wakayaecolodge.com/es/images/wakaya/gallery/gallery18.jpg",
    },
  };
}

async function readLocale(
  params: Promise<{ locale: string }> | { locale: string },
): Promise<PublicSiteLocale> {
  const resolvedParams = await params;
  return resolvedParams.locale as PublicSiteLocale;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const locale = await readLocale(params);
  const content = getPublicSiteContent(locale);
  const publishedHome = await homeContentStore.getPublished();
  const home = toLocalizedHomeView(publishedHome.document, locale);

  return buildLocalizedPublicMetadata({
    locale,
    route: "home",
    title: content.home.metadata.title,
    description: content.home.metadata.description,
    keywords: content.home.metadata.keywords,
    image: home.slides[0]?.image ?? "https://wakayaecolodge.com/es/images/wakaya/gallery/gallery01.jpg",
  });
}

export default async function LocalizedPublicHomePage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const locale = await readLocale(params);
  const publishedHome = await homeContentStore.getPublished();
  const home = toLocalizedHomeView(publishedHome.document, locale);
  const heroSlides = home.slides.map((slide) => ({
    eyebrow: slide.eyebrow,
    title: slide.title,
    subtitle: slide.subtitle,
    copy: slide.copy,
    ctaLabel: slide.primaryCta.label,
    href: slide.primaryCta.href,
    secondaryCtaLabel: slide.secondaryCta?.label,
    secondaryHref: slide.secondaryCta?.href,
    image: slide.image,
    scrollLabel: slide.scrollLabel,
    style: slide.style,
  }));
  const bungalowsSection = home.sections.find((section) => section.type === "bungalows");
  const rooms = (await getLocalizedBungalows(locale)).slice(0, bungalowsSection?.content.visibleCount ?? 4);
  const experiencesSection = home.sections.find((section) => section.type === "experiences");
  const homeExperiences =
    experiencesSection?.type === "experiences"
      ? getLocalizedDefaultHomeExperiences(
          locale,
          experiencesSection.content.experienceIds,
          experiencesSection.content.visibleCount,
        )
      : [];

  function renderSection(section: (typeof home.sections)[number]) {
    switch (section.type) {
      case "booking-band":
        return (
          <div
            key={section.id}
            className={homeStyles.requestBandWrap}
            style={buildHomeSectionStyleVars(section.style) as CSSProperties}
          >
            <div className={homeStyles.requestBandShell}>
              <div className={homeStyles.requestBandIntro}>
                <strong>{section.content.title}</strong>
                <p>{section.content.helper}</p>
              </div>
              <form className={homeStyles.requestForm} action={section.ctas[0]?.href ?? getPublicRoute(locale, "bungalows")} method="get">
                <div className={homeStyles.requestField}>
                  <label htmlFor="checkIn">{section.content.checkInLabel}</label>
                  <input id="checkIn" name="checkIn" type="date" defaultValue="2026-07-20" required />
                </div>

                <div className={homeStyles.requestField}>
                  <label htmlFor="checkOut">{section.content.checkOutLabel}</label>
                  <input id="checkOut" name="checkOut" type="date" defaultValue="2026-07-22" required />
                </div>

                <div className={homeStyles.requestField}>
                  <label htmlFor="guests">{section.content.guestsLabel}</label>
                  <select id="guests" name="guests" defaultValue="2">
                    {section.content.guestOptions.map((option, index) => (
                      <option key={option} value={String(index + 2)}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={homeStyles.requestField}>
                  <label htmlFor="category">{section.content.roomLabel}</label>
                  <select id="category" name="category" defaultValue="">
                    <option value="">{section.content.allCategoriesLabel}</option>
                    {rooms.map((room) => (
                      <option key={room.slug} value={room.slug}>
                        {room.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={homeStyles.requestActions}>
                  <button className={homeStyles.requestSubmit} type="submit">
                    {section.ctas[0]?.label ?? (locale === "en" ? "View options" : "Ver opciones")}
                  </button>
                  {section.content.submitHint ? (
                    <p className={homeStyles.requestSubmitHint}>{section.content.submitHint}</p>
                  ) : null}
                </div>
              </form>
            </div>
          </div>
        );
      case "stats":
        return (
          <section
            key={section.id}
            className={homeStyles.statsSection}
            aria-label={locale === "en" ? "Key figures" : "Cifras clave"}
            style={buildHomeSectionStyleVars(section.style) as CSSProperties}
          >
            <div className={homeStyles.statsStrip}>
              {section.content.items.map((item) => (
                <article key={item.label} className={homeStyles.statsItem}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </article>
              ))}
            </div>
          </section>
        );
      case "story":
        return (
          <section
            key={section.id}
            className={homeStyles.storySection}
            aria-label={locale === "en" ? "Our story" : "Nuestra historia"}
            style={buildHomeSectionStyleVars(section.style) as CSSProperties}
          >
            <div className={homeStyles.sectionShell}>
              <div className={homeStyles.storyGrid}>
                <article className={homeStyles.storyCopy}>
                  <p className={homeStyles.sectionEyebrow}>{section.content.eyebrow}</p>
                  <h2>{section.content.title}</h2>
                  {section.content.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {section.ctas[0] ? (
                    <Link className={homeStyles.inlineLink} href={section.ctas[0].href as Route}>
                      {section.ctas[0].label}
                    </Link>
                  ) : null}
                </article>

                <div className={homeStyles.storyMedia}>
                  <img src={section.content.image} alt={section.content.title} />
                  <aside className={homeStyles.storyQuoteCard}>
                    <span className={homeStyles.storyQuoteMark}>“</span>
                    <p>{section.content.quote}</p>
                    <span>{section.content.quoteSource}</span>
                  </aside>
                </div>
              </div>
            </div>
          </section>
        );
      case "bungalows":
        return (
          <section
            key={section.id}
            className={homeStyles.roomSection}
            aria-label={locale === "en" ? "Main bungalows" : "Bungalows principales"}
            style={buildHomeSectionStyleVars(section.style) as CSSProperties}
          >
            <div className={homeStyles.sectionShell}>
              <div className={homeStyles.sectionHead}>
                <div>
                  <p className={homeStyles.sectionEyebrowOnDark}>{section.content.eyebrow}</p>
                  <h2>{section.content.title}</h2>
                </div>
                {section.ctas[0] ? (
                  <Link className={homeStyles.inlineLinkOnDark} href={section.ctas[0].href as Route}>
                    {section.ctas[0].label}
                  </Link>
                ) : null}
              </div>

              <div className={homeStyles.roomGrid}>
                {rooms.map((room) => (
                  <article
                    key={room.slug}
                    className={homeStyles.roomGridCard}
                    data-home-section="room-grid-card"
                  >
                    <div className={homeStyles.roomGridMedia}>
                      <img src={room.image} alt={room.displayName} />
                      <div className={homeStyles.roomGridShade} />
                      <div className={homeStyles.roomGridPriceBadge}>
                        <span>{room.displayPriceFrom}</span>
                      </div>
                    </div>

                    <div className={homeStyles.roomGridBody}>
                      <p className={homeStyles.roomGridEyebrow}>{room.displayTagline}</p>
                      <h3>{room.displayName}</h3>
                      <p>{room.displayDescription}</p>
                      <div className={homeStyles.roomGridFacts}>
                        <span>{room.displayCapacity}</span>
                        <span>{room.displayArea}</span>
                      </div>
                      <Link
                        className={homeStyles.roomGridLink}
                        href={getPublicBungalowDetailRoute(locale, room.slug) as Route}
                      >
                        {section.content.detailLabel}
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        );
      case "quote-band":
        return (
          <section
            key={section.id}
            className={homeStyles.quoteBand}
            aria-label={locale === "en" ? "Brand quote" : "Cita de marca"}
            style={buildHomeSectionStyleVars(section.style) as CSSProperties}
          >
            <img src={section.content.image} alt="" aria-hidden="true" />
            <div className={homeStyles.quoteBandOverlay} />
            <div className={homeStyles.quoteBandCopy}>
              <p>{section.content.quote}</p>
              <span>{section.content.source}</span>
            </div>
          </section>
        );
      case "experiences":
        return (
          <section
            key={section.id}
            className={homeStyles.experienceSection}
            aria-label={locale === "en" ? "Experiences" : "Experiencias"}
            style={buildHomeSectionStyleVars(section.style) as CSSProperties}
          >
            <div className={homeStyles.sectionShell}>
              <div className={homeStyles.sectionHead}>
                <div>
                  <p className={homeStyles.sectionEyebrow}>{section.content.eyebrow}</p>
                  <h2>{section.content.title}</h2>
                </div>
                {section.ctas[0] ? (
                  <Link className={homeStyles.inlineLink} href={section.ctas[0].href as Route}>
                    {section.ctas[0].label}
                  </Link>
                ) : null}
              </div>

              <div className={homeStyles.experienceGrid}>
                {homeExperiences.map((item) => (
                  <article
                    key={item.id}
                    className={homeStyles.experienceCard}
                    data-home-section="experience-card"
                  >
                    <div className={homeStyles.experienceMedia}>
                      <img src={item.image} alt={item.title} />
                      <span className={homeStyles.experiencePrice}>{item.priceLabel}</span>
                    </div>
                    <div className={homeStyles.experienceBody}>
                      <div className={homeStyles.experienceMeta}>
                        <span>{item.icon}</span>
                        <span>{item.duration}</span>
                      </div>
                      <h3>{item.title}</h3>
                      <p>{item.summary}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        );
      case "testimonials":
        return (
          <section
            key={section.id}
            className={homeStyles.testimonialSection}
            aria-label={locale === "en" ? "Testimonials" : "Testimonios"}
            style={buildHomeSectionStyleVars(section.style) as CSSProperties}
          >
            <div className={homeStyles.sectionShell}>
              <div className={homeStyles.sectionHeadCenter}>
                <p className={homeStyles.sectionEyebrowOnDark}>{section.content.eyebrow}</p>
                <h2>{section.content.title}</h2>
              </div>

              <div className={homeStyles.testimonialGrid}>
                {section.content.items.map((item) => (
                  <article
                    key={item.name}
                    className={homeStyles.testimonialCard}
                    data-home-section="testimonial-card"
                  >
                    <div className={homeStyles.testimonialStars}>★★★★★</div>
                    <p>{item.quote}</p>
                    <div className={homeStyles.testimonialAuthor}>
                      <strong>{item.name}</strong>
                      <span>{item.origin}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        );
      case "closing-cta":
        return (
          <section
            key={section.id}
            className={homeStyles.closingSection}
            aria-label={locale === "en" ? "Closing call to action" : "Cierre"}
            style={buildHomeSectionStyleVars(section.style) as CSSProperties}
          >
            <img src={section.content.image} alt="" aria-hidden="true" />
            <div className={homeStyles.closingOverlay} />
            <div className={homeStyles.closingContent}>
              <p className={homeStyles.sectionEyebrowOnDark}>{section.content.eyebrow}</p>
              <h2>{section.content.title}</h2>
              {section.ctas[0] ? (
                <Link className={homeStyles.primaryButton} href={section.ctas[0].href as Route}>
                  {section.ctas[0].label}
                </Link>
              ) : null}
            </div>
          </section>
        );
    }
  }

  return (
    <div className={homeStyles.homeSurface}>
      <HomeHeroSlider slides={heroSlides} />
      {home.sections.map((section) => renderSection(section))}
    </div>
  );
}
