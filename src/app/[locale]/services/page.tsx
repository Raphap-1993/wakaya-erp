import type { Route } from "next";
import Link from "next/link";

import { FigmaPageHero } from "@/components/public-site/figma-page-hero";
import { ServicesExperienceBrowser } from "@/components/public-site/services-experience-browser";
import styles from "@/components/public-site/figma-public-pages.module.css";
import type { PublicSiteLocale } from "@/components/public-site/public-site-locale";
import { getPublicRoute } from "@/components/public-site/public-site-routes";
import { listLocalizedPublicExperiences } from "@/lib/content/public-content";
import { buildLocalizedPublicMetadata } from "../public-site-metadata";

type ExperienceCopy = {
  metaTitle: string;
  metaDescription: string;
  heroMeta: string;
  heroTitle: string;
  heroCopy: string;
  ctaTitle: string;
  ctaCopy: string;
  ctaLabel: string;
  detailLabel: string;
  includesLabel: string;
  recommendationsLabel: string;
  closeLabel: string;
};

const EXPERIENCES_HERO =
  "https://wakayaecolodge.com/es/images/wakaya/services/servicio_laguna.jpg";

function getExperienceCopy(locale: PublicSiteLocale): ExperienceCopy {
  if (locale === "en") {
    return {
      metaTitle: "Services | Wakaya Ecolodge",
      metaDescription: "Weddings, corporate events, Full Day, romantic dinners, and restaurant at Wakaya.",
      heroMeta: "Services · Wakaya Ecolodge",
      heroTitle: "Services",
      heroCopy: "Hospitality for stays, celebrations, gatherings, and dining.",
      ctaTitle: "Contact Wakaya",
      ctaCopy: "Tell us the service and date you need.",
      ctaLabel: "Contact us",
      detailLabel: "View details",
      includesLabel: "Includes",
      recommendationsLabel: "Recommendations",
      closeLabel: "Close",
    };
  }

  return {
    metaTitle: "Servicios | Wakaya Ecolodge",
    metaDescription: "Bodas, eventos corporativos, Full Day, cenas románticas y restaurante en Wakaya.",
    heroMeta: "Servicios · Wakaya Ecolodge",
    heroTitle: "Servicios",
    heroCopy: "Hospitalidad para estadías, celebraciones, reuniones y gastronomía.",
    ctaTitle: "Contacta a Wakaya",
    ctaCopy: "Indícanos el servicio y la fecha que necesitas.",
    ctaLabel: "Contactar",
    detailLabel: "Ver detalle",
    includesLabel: "Incluye",
    recommendationsLabel: "Recomendaciones",
    closeLabel: "Cerrar",
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
  const copy = getExperienceCopy(locale);

  return buildLocalizedPublicMetadata({
    locale,
    route: "services",
    title: copy.metaTitle,
    description: copy.metaDescription,
    keywords:
      locale === "en"
        ? ["wakaya services", "weddings", "corporate events", "restaurant", "pucallpa"]
        : ["servicios wakaya", "bodas", "eventos corporativos", "restaurante", "pucallpa"],
    image: EXPERIENCES_HERO,
  });
}

export default async function PublicSiteServicesLocalePage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const locale = await readLocale(params);
  const copy = getExperienceCopy(locale);
  const experiences = await listLocalizedPublicExperiences(locale);

  return (
    <>
      <FigmaPageHero
        meta={copy.heroMeta}
        title={copy.heroTitle}
        copy={copy.heroCopy}
        image={EXPERIENCES_HERO}
      />

      <section className={styles.section}>
        <ServicesExperienceBrowser
          locale={locale}
          experiences={experiences}
          detailLabel={copy.detailLabel}
          includesLabel={copy.includesLabel}
          recommendationsLabel={copy.recommendationsLabel}
          closeLabel={copy.closeLabel}
        />
      </section>

      <section className={styles.section}>
        <div className={styles.ctaBand}>
          <div>
            <h2 className={styles.ctaTitle}>{copy.ctaTitle}</h2>
            <p className={styles.ctaCopy}>{copy.ctaCopy}</p>
          </div>

          <Link className={styles.buttonLink} href={getPublicRoute(locale, "contact") as Route}>
            {copy.ctaLabel}
          </Link>
        </div>
      </section>
    </>
  );
}
