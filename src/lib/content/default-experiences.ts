import type { PublicSiteLocale } from "@/components/public-site/public-site-locale";

type LocalizedList = Record<PublicSiteLocale, string[]>;

export type DefaultExperienceRecord = {
  id: string;
  slug: string;
  visible: boolean;
  featuredOnHome: boolean;
  sortOrder: number;
  icon: string;
  heroImage: string;
  cardImage: string;
  galleryImages: string[];
  localeContent: Record<
    PublicSiteLocale,
    {
      title: string;
      summary: string;
      body: string;
      duration: string;
      priceLabel: string;
      ctaLabel: string;
    }
  >;
  included: LocalizedList;
  recommendations: LocalizedList;
};

export type LocalizedExperienceCard = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  duration: string;
  priceLabel: string;
  ctaLabel: string;
  icon: string;
  image: string;
  included: string[];
  recommendations: string[];
};

function localizedList(es: string[], en: string[]): LocalizedList {
  return { es, en };
}

export const DEFAULT_PUBLIC_EXPERIENCES: DefaultExperienceRecord[] = [
  {
    id: "exp_07",
    slug: "bodas-celebraciones",
    visible: true,
    featuredOnHome: true,
    sortOrder: 1,
    icon: "✺",
    heroImage: "https://wakayaecolodge.com/es/images/wakaya/services/servicios_bodas.jpg",
    cardImage: "https://wakayaecolodge.com/es/images/wakaya/services/servicios_bodas.jpg",
    galleryImages: [
      "https://wakayaecolodge.com/es/images/wakaya/services/servicios_bodas.jpg",
      "https://wakayaecolodge.com/es/images/wakaya/eventos/evenos_celebraciones_familiar.jpg",
    ],
    localeContent: {
      es: {
        title: "Bodas",
        summary: "Celebra tu boda en un entorno natural con coordinación del equipo Wakaya.",
        body: "Wakaya ofrece espacios naturales para bodas y una coordinación personalizada según la fecha, cantidad de invitados y formato del evento.",
        duration: "A medida",
        priceLabel: "Cotizar",
        ctaLabel: "Consultar servicio",
      },
      en: {
        title: "Weddings",
        summary: "Celebrate your wedding in a natural setting with support from the Wakaya team.",
        body: "Wakaya offers natural spaces for weddings and personalized coordination based on the date, guest count, and event format.",
        duration: "Tailored",
        priceLabel: "Request a quote",
        ctaLabel: "Enquire about this service",
      },
    },
    included: localizedList(["Coordinación personalizada"], ["Personalized coordination"]),
    recommendations: localizedList(["Consultar fecha y aforo"], ["Confirm date and capacity"]),
  },
  {
    id: "exp_09",
    slug: "eventos-corporativos",
    visible: true,
    featuredOnHome: true,
    sortOrder: 2,
    icon: "◆",
    heroImage: "https://wakayaecolodge.com/es/images/wakaya/gallery/gallery16.jpg",
    cardImage: "https://wakayaecolodge.com/es/images/wakaya/gallery/gallery16.jpg",
    galleryImages: [
      "https://wakayaecolodge.com/es/images/wakaya/gallery/gallery16.jpg",
      "https://wakayaecolodge.com/es/images/wakaya/eventos/evenos_celebraciones_familiar.jpg",
    ],
    localeContent: {
      es: {
        title: "Eventos Corporativos",
        summary: "Jornadas, reuniones y encuentros de equipo en un entorno natural.",
        body: "Coordinamos eventos corporativos según el número de participantes, los espacios requeridos y los servicios de alimentación necesarios.",
        duration: "A medida",
        priceLabel: "Cotizar",
        ctaLabel: "Consultar servicio",
      },
      en: {
        title: "Corporate Events",
        summary: "Meetings and team gatherings in a natural setting.",
        body: "We coordinate corporate events according to participant count, required spaces, and food service needs.",
        duration: "Tailored",
        priceLabel: "Request a quote",
        ctaLabel: "Enquire about this service",
      },
    },
    included: localizedList(["Coordinación del evento"], ["Event coordination"]),
    recommendations: localizedList(["Consultar aforo y equipamiento"], ["Confirm capacity and equipment"]),
  },
  {
    id: "exp_02",
    slug: "paseo-laguna",
    visible: true,
    featuredOnHome: true,
    sortOrder: 3,
    icon: "◔",
    heroImage: "https://wakayaecolodge.com/es/images/wakaya/services/servicio_laguna.jpg",
    cardImage: "https://wakayaecolodge.com/es/images/wakaya/services/servicio_fullday_laguna.jpg",
    galleryImages: [
      "https://wakayaecolodge.com/es/images/wakaya/services/servicio_fullday_laguna.jpg",
      "https://wakayaecolodge.com/es/images/wakaya/services/servicio_laguna.jpg",
    ],
    localeContent: {
      es: {
        title: "Full Day",
        summary: "Disfruta Wakaya durante el día y coordina las actividades disponibles.",
        body: "El Full Day permite disfrutar los espacios de Wakaya durante una jornada. La disponibilidad, horarios y servicios incluidos se confirman al consultar.",
        duration: "Día completo",
        priceLabel: "Consultar",
        ctaLabel: "Consultar servicio",
      },
      en: {
        title: "Full Day",
        summary: "Enjoy Wakaya for the day and coordinate the available activities.",
        body: "The Full Day service provides daytime access to Wakaya. Availability, schedules, and included services are confirmed when you enquire.",
        duration: "Full day",
        priceLabel: "Enquire",
        ctaLabel: "Enquire about this service",
      },
    },
    included: localizedList([], []),
    recommendations: localizedList(["Consultar disponibilidad"], ["Check availability"]),
  },
  {
    id: "exp_10",
    slug: "cenas-romanticas",
    visible: true,
    featuredOnHome: false,
    sortOrder: 4,
    icon: "♥",
    heroImage: "https://wakayaecolodge.com/es/images/wakaya/gallery/gallery01.jpg",
    cardImage: "https://wakayaecolodge.com/es/images/wakaya/gallery/gallery01.jpg",
    galleryImages: [
      "https://wakayaecolodge.com/es/images/wakaya/gallery/gallery01.jpg",
      "https://wakayaecolodge.com/es/images/wakaya/services/DSC_5853-PLATO%20COMIDA.jpg",
    ],
    localeContent: {
      es: {
        title: "Cenas Románticas",
        summary: "Una cena para dos preparada en el entorno natural de Wakaya.",
        body: "Coordinamos cenas románticas según la fecha, el menú disponible y los detalles que la pareja desee incluir.",
        duration: "Con reserva",
        priceLabel: "Cotizar",
        ctaLabel: "Consultar servicio",
      },
      en: {
        title: "Romantic Dinners",
        summary: "A dinner for two in Wakaya's natural setting.",
        body: "We coordinate romantic dinners according to the date, available menu, and details the couple would like to include.",
        duration: "Reservation required",
        priceLabel: "Request a quote",
        ctaLabel: "Enquire about this service",
      },
    },
    included: localizedList(["Coordinación para dos"], ["Coordination for two"]),
    recommendations: localizedList(["Reservar con anticipación"], ["Book in advance"]),
  },
  {
    id: "exp_04",
    slug: "gastronomia-local",
    visible: true,
    featuredOnHome: false,
    sortOrder: 5,
    icon: "✳",
    heroImage: "https://wakayaecolodge.com/es/images/wakaya/services/DSC_5853-PLATO%20COMIDA.jpg",
    cardImage: "https://wakayaecolodge.com/es/images/wakaya/services/DSC_5853-PLATO%20COMIDA.jpg",
    galleryImages: ["https://wakayaecolodge.com/es/images/wakaya/services/DSC_5853-PLATO%20COMIDA.jpg"],
    localeContent: {
      es: {
        title: "Restaurante",
        summary: "Cocina para huéspedes y visitantes en el entorno de Wakaya.",
        body: "Consulta la atención del restaurante, los horarios y las opciones disponibles para la fecha de tu visita.",
        duration: "Según horario",
        priceLabel: "Ver carta",
        ctaLabel: "Consultar servicio",
      },
      en: {
        title: "Restaurant",
        summary: "Food service for guests and visitors in Wakaya's setting.",
        body: "Check restaurant service, opening hours, and the options available for the date of your visit.",
        duration: "Opening hours",
        priceLabel: "View menu",
        ctaLabel: "Enquire about this service",
      },
    },
    included: localizedList([], []),
    recommendations: localizedList(["Consultar horarios"], ["Check opening hours"]),
  },
];

export function listDefaultPublishedExperiences() {
  return DEFAULT_PUBLIC_EXPERIENCES.filter((item) => item.visible).sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );
}

export function getLocalizedDefaultExperienceCards(locale: PublicSiteLocale): LocalizedExperienceCard[] {
  return listDefaultPublishedExperiences().map((item) => ({
    id: item.id,
    slug: item.slug,
    title: item.localeContent[locale].title,
    summary: item.localeContent[locale].summary,
    body: item.localeContent[locale].body,
    duration: item.localeContent[locale].duration,
    priceLabel: item.localeContent[locale].priceLabel,
    ctaLabel: item.localeContent[locale].ctaLabel,
    icon: item.icon,
    image: item.cardImage,
    included: item.included[locale],
    recommendations: item.recommendations[locale],
  }));
}

export function getLocalizedDefaultHomeExperiences(
  locale: PublicSiteLocale,
  experienceIds: string[],
  visibleCount: number,
): LocalizedExperienceCard[] {
  const byId = new Map(getLocalizedDefaultExperienceCards(locale).map((item) => [item.id, item]));

  return experienceIds
    .map((experienceId) => byId.get(experienceId) ?? null)
    .filter((item): item is LocalizedExperienceCard => Boolean(item))
    .slice(0, visibleCount);
}

export function findDefaultExperienceBySlug(slug: string) {
  return DEFAULT_PUBLIC_EXPERIENCES.find((item) => item.slug === slug) ?? null;
}
