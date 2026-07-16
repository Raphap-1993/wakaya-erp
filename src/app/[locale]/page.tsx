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
import { listLocalizedPublicExperiences } from "@/lib/content/public-content";
import { buildHomeSectionStyleVars } from "@/lib/home-content/style-resolver";
import { homeContentStore } from "@/lib/home-content/store";
import { getPublishedPublicSiteContent } from "@/lib/corporate-content/public-view";
import { toLocalizedHomeView } from "@/lib/home-content/public-view";
import { getLocalizedBungalows } from "./public-site-content";
import { buildLocalizedPublicMetadata } from "./public-site-metadata";

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
  const content = await getPublishedPublicSiteContent(locale);
  const publishedHome = await homeContentStore.getPublished();
  const home = toLocalizedHomeView(publishedHome.document, locale);

  return buildLocalizedPublicMetadata({
    locale,
    route: "home",
    title: content.home.metadata.title,
    description: content.home.metadata.description,
    keywords: content.home.metadata.keywords,
    image: home.slides[0]?.image,
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
  const publicExperiences = await listLocalizedPublicExperiences(locale);
  const homeExperiences = experiencesSection?.type === "experiences"
    ? publicExperiences
        .filter((experience) => experiencesSection.content.experienceIds.includes(experience.id))
        .slice(0, experiencesSection.content.visibleCount)
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
                      <img src={item.coverImage} alt={item.title} />
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
