import type { Route } from "next";
import Link from "next/link";

import { PageHero } from "@/components/public-site/page-hero";
import type { PublicSiteLocale } from "@/components/public-site/public-site-locale";
import { getPublicRoute } from "@/components/public-site/public-site-routes";
import styles from "@/components/public-site/public-site-theme.module.css";
import { buildLocalizedPublicMetadata } from "../public-site-metadata";

type PetFriendlyCopy = {
  metaTitle: string;
  metaDescription: string;
  heroEyebrow: string;
  heroTitle: string;
  heroCopy: string;
  sections: Array<{
    title: string;
    copy: string;
    bullets: string[];
  }>;
  ctaTitle: string;
  ctaCopy: string;
  ctaLabel: string;
};

function getPetFriendlyCopy(locale: PublicSiteLocale): PetFriendlyCopy {
  if (locale === "en") {
    return {
      metaTitle: "Pet Friendly | Wakaya Ecolodge",
      metaDescription:
        "Travel to Wakaya Ecolodge with your pet and review the friendly house rules before arrival.",
      heroEyebrow: "Travel together",
      heroTitle: "Pet Friendly",
      heroCopy:
        "Wakaya welcomes small and medium pets when the stay is coordinated in advance.",
      sections: [
        {
          title: "A warm welcome for your companion",
          copy:
            "If your pet is used to travelling calmly, Wakaya can be a beautiful place to share the trip. We only ask for a few simple rules so every guest enjoys the same peaceful atmosphere.",
          bullets: [
            "Confirm your pet before arrival so we can recommend the right bungalow.",
            "Bring a leash, bed, and cleaning essentials for the full stay.",
            "Please keep your pet supervised in shared areas.",
          ],
        },
        {
          title: "What helps the stay go smoothly",
          copy:
            "We may suggest the most practical bungalow based on your pet's size, energy level, and the occupancy of the dates you chose.",
          bullets: [
            "For safety, aggressive behavior or repeated disturbance may require ending the pet stay.",
            "Any unusual cleaning or damage may generate an additional charge.",
            "If you are travelling with more than one pet, please ask us first.",
          ],
        },
      ],
      ctaTitle: "Want to travel with your pet?",
      ctaCopy:
        "Send us your dates and tell us a bit about your companion. We will guide you to the best option for a calm stay.",
      ctaLabel: "Plan my stay",
    };
  }

  return {
    metaTitle: "Pet Friendly | Wakaya Ecolodge",
    metaDescription:
      "Viaja a Wakaya Ecolodge con tu mascota y revisa las reglas de casa antes de llegar.",
    heroEyebrow: "Viajen juntos",
    heroTitle: "Pet Friendly",
    heroCopy:
      "Wakaya recibe mascotas pequeñas y medianas cuando la estadía se coordina con anticipación.",
    sections: [
      {
        title: "Una bienvenida cálida para tu compañero",
        copy:
          "Si tu mascota está acostumbrada a viajar con calma, Wakaya puede ser un gran lugar para compartir el viaje. Solo pedimos algunas reglas simples para cuidar la tranquilidad de todos.",
        bullets: [
          "Confirma tu mascota antes de llegar para recomendarte el bungalow más conveniente.",
          "Trae correa, cama y artículos de limpieza para toda la estadía.",
          "Mantén a tu mascota supervisada en las áreas compartidas.",
        ],
      },
      {
        title: "Lo que ayuda a que todo fluya bien",
        copy:
          "Podemos sugerirte el bungalow más práctico según el tamaño, la energía de tu mascota y la ocupación de las fechas elegidas.",
        bullets: [
          "Por seguridad, una conducta agresiva o molestias repetidas pueden obligarnos a cortar la estadía de la mascota.",
          "Una limpieza extraordinaria o daños pueden generar un cargo adicional.",
          "Si viajas con más de una mascota, consúltanos antes de reservar.",
        ],
      },
    ],
    ctaTitle: "¿Quieres viajar con tu mascota?",
    ctaCopy:
      "Compártenos tus fechas y cuéntanos un poco de tu compañero. Te orientamos para elegir la mejor opción y mantener una estadía tranquila.",
    ctaLabel: "Planificar mi estadía",
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
  const copy = getPetFriendlyCopy(locale);

  return buildLocalizedPublicMetadata({
    locale,
    route: "petFriendly",
    title: copy.metaTitle,
    description: copy.metaDescription,
    keywords:
      locale === "en"
        ? ["pet friendly pucallpa", "wakaya pet friendly", "travel with pets"]
        : ["pet friendly pucallpa", "wakaya mascotas", "viajar con mascotas"],
  });
}

export default async function PublicSitePetFriendlyPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const locale = await readLocale(params);
  const copy = getPetFriendlyCopy(locale);

  return (
    <>
      <PageHero
        eyebrow={copy.heroEyebrow}
        title={copy.heroTitle}
        breadcrumb={`${locale === "en" ? "Home" : "Inicio"} / Pet Friendly`}
        copy={copy.heroCopy}
        image="https://wakayaecolodge.com/es/images/wakaya/gallery/gallery10.jpg"
      />

      <section className={styles.pageSection}>
        <div className={styles.editorialGrid}>
          {copy.sections.map((section) => (
            <article key={section.title} className={styles.pageCopyCard}>
              <h3>{section.title}</h3>
              <p>{section.copy}</p>
              <ul>
                {section.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.pageSection}>
        <div className={styles.newsletterCard}>
          <h2>{copy.ctaTitle}</h2>
          <p>{copy.ctaCopy}</p>
          <div className={styles.actions}>
            <Link className={styles.primaryButton} href={getPublicRoute(locale, "contact") as Route}>
              {copy.ctaLabel}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
