import type {
  BungalowPublicContent,
  BungalowPublicContentUpdateInput,
} from "@/lib/reservations/types";

type WakayaBungalowPublicContentSeed = {
  bungalowId: string;
} & BungalowPublicContentUpdateInput;

const DEFAULT_PUBLIC_CONTENT_UPDATED_AT = "2026-07-02T00:00:00.000Z";

export const WAKAYA_BUNGALOW_PUBLIC_CONTENT = [
  {
    bungalowId: "bungalow-family",
    featuredOnHome: true,
    sortOrder: 1,
    heroImageUrl: "https://wakayaecolodge.com/es/images/wakaya/habitaciones/BF_1.jpg",
    galleryUrls: [
      "https://wakayaecolodge.com/es/images/wakaya/habitaciones/BF_1.jpg",
      "https://wakayaecolodge.com/es/images/wakaya/gallery/gallery06.jpg",
      "https://wakayaecolodge.com/es/images/wakaya/gallery/gallery12.jpg",
      "https://wakayaecolodge.com/es/images/wakaya/gallery/gallery15.jpg",
    ],
    nightlyRatePen: 350,
    areaSqm: 55,
    localeContent: {
      es: {
        displayName: "Bungalow Familiar",
        displayEyebrow: "Wakaya Ecolodge · Pucallpa",
        displayDescription:
          "Dos habitaciones independientes, vistas a la piscina y amplias áreas verdes para una estadía familiar más cómoda.",
        displayTagline: "El hogar de la familia en la selva",
        displayLongDescription:
          "El Bungalow Familiar es nuestra opción más espaciosa con 55 m2 pensados para el confort de toda la familia. Cuenta con dos habitaciones independientes, baño completo, sala de estar y una terraza amplia con vistas a la piscina y los jardines. Es una categoría práctica para viajar con niños o para estadías que necesitan más espacio y descanso.",
        displayHighlights: [
          "2 habitaciones independientes",
          "Vista directa a la piscina",
          "Terraza familiar amplia",
          "Ideal para familias con niños",
        ],
        displayAmenities: [
          "WiFi gratuito",
          "Aire acondicionado",
          "Baño completo",
          "Desayuno incluido",
          "TV LED 50\"",
          "Terraza familiar",
          "Vista a la piscina",
          "Estacionamiento doble",
        ],
        displayIncluded: [
          "Desayuno amazónico (4 personas)",
          "Acceso a senderos",
          "WiFi satelital",
          "Agua purificada",
          "Toallas y amenities",
        ],
      },
      en: {
        displayName: "Family Bungalow",
        displayEyebrow: "Wakaya Ecolodge · Pucallpa",
        displayDescription:
          "Two separate bedrooms, pool views, and broad green areas for a more comfortable family stay.",
        displayTagline: "The family home in the jungle",
        displayLongDescription:
          "The Family Bungalow is our most spacious option with 55 sqm designed for the comfort of the whole family. It includes two separate bedrooms, a full bathroom, a sitting area, and a wide terrace overlooking the pool and gardens. It is a practical category for travelling with children or for stays that need more room and rest.",
        displayHighlights: [
          "2 separate bedrooms",
          "Direct pool view",
          "Wide family terrace",
          "Ideal for families with children",
        ],
        displayAmenities: [
          "Free Wi-Fi",
          "Air conditioning",
          "Full bathroom",
          "Breakfast included",
          "50\" LED TV",
          "Family terrace",
          "Pool view",
          "Double parking",
        ],
        displayIncluded: [
          "Amazon breakfast (4 guests)",
          "Trail access",
          "Satellite Wi-Fi",
          "Purified water",
          "Towels and amenities",
        ],
      },
    },
  },
  {
    bungalowId: "bungalow-matrimonial",
    featuredOnHome: true,
    sortOrder: 2,
    heroImageUrl: "https://wakayaecolodge.com/es/images/wakaya/habitaciones/BM_1.jpg",
    galleryUrls: [
      "https://wakayaecolodge.com/es/images/wakaya/habitaciones/BM_1.jpg",
      "https://wakayaecolodge.com/es/images/wakaya/gallery/gallery01.jpg",
      "https://wakayaecolodge.com/es/images/wakaya/gallery/gallery03.jpg",
      "https://wakayaecolodge.com/es/images/wakaya/gallery/gallery07.jpg",
    ],
    nightlyRatePen: 250,
    areaSqm: 28,
    localeContent: {
      es: {
        displayName: "Bungalow Matrimonial",
        displayEyebrow: "Wakaya Ecolodge · Pucallpa",
        displayDescription:
          "Un refugio íntimo de madera nativa para parejas que buscan descanso, privacidad y naturaleza.",
        displayTagline: "El retiro perfecto para una pareja",
        displayLongDescription:
          "El Bungalow Matrimonial es la categoría más íntima de Wakaya. Con 28 m2 de diseño rústico-moderno, ofrece cama matrimonial, baño privado con agua caliente y una terraza privada con hamaca frente al jardín tropical. Es una opción pensada para aniversarios, escapadas cortas y viajes de pareja con una lectura más cálida y tranquila.",
        displayHighlights: [
          "Vista directa al jardín tropical",
          "Terraza privada con hamaca",
          "Máxima privacidad y silencio",
        ],
        displayAmenities: [
          "WiFi gratuito",
          "Ventilador de techo",
          "Ducha con agua caliente",
          "Desayuno incluido",
          "Terraza + hamaca",
          "Piscina natural",
          "Estacionamiento",
          "Seguridad 24/7",
        ],
        displayIncluded: [
          "Desayuno amazónico",
          "Acceso a senderos",
          "WiFi satelital",
          "Agua purificada",
          "Toallas y amenities",
        ],
      },
      en: {
        displayName: "Matrimonial Bungalow",
        displayEyebrow: "Wakaya Ecolodge · Pucallpa",
        displayDescription:
          "An intimate native-wood refuge for couples seeking rest, privacy, and a closer connection with nature.",
        displayTagline: "The perfect retreat for two",
        displayLongDescription:
          "The Matrimonial Bungalow is Wakaya's most intimate category. With 28 sqm of rustic-modern design, it offers a double bed, a private bathroom with hot water, and a private terrace with a hammock facing the tropical garden. It is designed for anniversaries, short escapes, and couple stays that need a warmer and quieter setting.",
        displayHighlights: [
          "Direct tropical garden view",
          "Private terrace with hammock",
          "Maximum privacy and quiet",
        ],
        displayAmenities: [
          "Free Wi-Fi",
          "Ceiling fan",
          "Hot-water shower",
          "Breakfast included",
          "Terrace + hammock",
          "Natural pool",
          "Parking",
          "24/7 security",
        ],
        displayIncluded: [
          "Amazon breakfast",
          "Trail access",
          "Satellite Wi-Fi",
          "Purified water",
          "Towels and amenities",
        ],
      },
    },
  },
  {
    bungalowId: "bungalow-individual",
    featuredOnHome: false,
    sortOrder: 3,
    heroImageUrl: "https://wakayaecolodge.com/es/images/wakaya/gallery/gallery10.jpg",
    galleryUrls: [
      "https://wakayaecolodge.com/es/images/wakaya/gallery/gallery10.jpg",
    ],
    nightlyRatePen: 0,
    areaSqm: 0,
    localeContent: {
      es: {
        displayName: "Bungalow Individual",
        displayEyebrow: "Wakaya Ecolodge · Pucallpa",
        displayDescription:
          "Una categoría para una persona, con privacidad y acceso al entorno natural de Wakaya.",
        displayTagline: "Una estadía personal y tranquila",
        displayLongDescription:
          "El Bungalow Individual está destinado a una persona. La tarifa, dimensiones, distribución y servicios específicos se confirman directamente con el equipo Wakaya.",
        displayHighlights: ["Capacidad para 1 huésped", "Atención personalizada"],
        displayAmenities: [],
        displayIncluded: [],
      },
      en: {
        displayName: "Individual Bungalow",
        displayEyebrow: "Wakaya Ecolodge · Pucallpa",
        displayDescription:
          "A one-guest category with privacy and access to Wakaya's natural setting.",
        displayTagline: "A quiet personal stay",
        displayLongDescription:
          "The Individual Bungalow is intended for one guest. The rate, dimensions, layout, and specific services are confirmed directly with the Wakaya team.",
        displayHighlights: ["Capacity for 1 guest", "Personal attention"],
        displayAmenities: [],
        displayIncluded: [],
      },
    },
  },
  {
    bungalowId: "bungalow-suite",
    featuredOnHome: true,
    sortOrder: 4,
    heroImageUrl: "https://wakayaecolodge.com/es/images/wakaya/habitaciones/0BD_1.jpg",
    galleryUrls: [
      "https://wakayaecolodge.com/es/images/wakaya/habitaciones/0BD_1.jpg",
      "https://wakayaecolodge.com/es/images/wakaya/gallery/gallery02.jpg",
      "https://wakayaecolodge.com/es/images/wakaya/gallery/gallery05.jpg",
      "https://wakayaecolodge.com/es/images/wakaya/gallery/gallery09.jpg",
    ],
    nightlyRatePen: 280,
    areaSqm: 32,
    localeContent: {
      es: {
        displayName: "Bungalow Doble",
        displayEyebrow: "Wakaya Ecolodge · Pucallpa",
        displayDescription:
          "Dos camas individuales, diseño rústico-moderno y una terraza abierta al paisaje tropical de Wakaya.",
        displayTagline: "Diseño rústico-moderno con vista abierta",
        displayLongDescription:
          "El Bungalow Doble combina la calidez de la madera nativa con comodidades modernas. Con 32 m2, ofrece dos camas individuales, aire acondicionado, baño privado y una terraza amplia con vistas abiertas al entorno tropical. Es una opción clara para amigos que viajan juntos o para quien prefiere una configuración de camas separadas.",
        displayHighlights: [
          "Terraza con vista abierta",
          "Diseño rústico-moderno",
          "Ventilación natural",
        ],
        displayAmenities: [
          "WiFi gratuito",
          "Aire acondicionado",
          "Ducha con agua caliente",
          "Desayuno incluido",
          "TV LED 32\"",
          "Piscina natural",
          "Estacionamiento",
          "Seguridad 24/7",
        ],
        displayIncluded: [
          "Desayuno amazónico",
          "Acceso a senderos",
          "WiFi satelital",
          "Agua purificada",
          "Toallas y amenities",
        ],
      },
      en: {
        displayName: "Double Bungalow",
        displayEyebrow: "Wakaya Ecolodge · Pucallpa",
        displayDescription:
          "Two single beds, rustic-modern design, and a terrace opening to Wakaya's tropical landscape.",
        displayTagline: "Rustic-modern design with an open view",
        displayLongDescription:
          "The Double Bungalow combines the warmth of native wood with modern comforts. With 32 sqm, it offers two single beds, air conditioning, a private bathroom, and a wide terrace with open views of the tropical setting. It is a clear option for friends travelling together or for anyone who prefers separate beds.",
        displayHighlights: [
          "Terrace with open views",
          "Rustic-modern design",
          "Natural ventilation",
        ],
        displayAmenities: [
          "Free Wi-Fi",
          "Air conditioning",
          "Hot-water shower",
          "Breakfast included",
          "32\" LED TV",
          "Natural pool",
          "Parking",
          "24/7 security",
        ],
        displayIncluded: [
          "Amazon breakfast",
          "Trail access",
          "Satellite Wi-Fi",
          "Purified water",
          "Towels and amenities",
        ],
      },
    },
  },
  {
    bungalowId: "bungalow-triple",
    featuredOnHome: false,
    sortOrder: 5,
    heroImageUrl: "https://wakayaecolodge.com/es/images/wakaya/habitaciones/0BT_1.jpg",
    galleryUrls: [
      "https://wakayaecolodge.com/es/images/wakaya/habitaciones/0BT_1.jpg",
      "https://wakayaecolodge.com/es/images/wakaya/gallery/gallery04.jpg",
      "https://wakayaecolodge.com/es/images/wakaya/gallery/gallery08.jpg",
      "https://wakayaecolodge.com/es/images/wakaya/gallery/gallery11.jpg",
    ],
    nightlyRatePen: 300,
    areaSqm: 40,
    localeContent: {
      es: {
        displayName: "Bungalow Triple",
        displayEyebrow: "Wakaya Ecolodge · Pucallpa",
        displayDescription:
          "Amplio y cómodo, ideal para grupos pequeños o familias que necesitan espacio sin perder confort.",
        displayTagline: "Comodidad, espacio y naturaleza",
        displayLongDescription:
          "El Bungalow Triple ofrece 40 m2 bien aprovechados con una cama doble y una individual. Incluye aire acondicionado, baño privado completo, un espacio de descanso pequeño y una terraza generosa rodeada de vegetación. Es una categoría práctica para viajes de tres personas con una lectura más funcional y espaciosa.",
        displayHighlights: [
          "Para grupos de hasta 3 personas",
          "Espacio de descanso privado",
          "Terraza rodeada de vegetación",
        ],
        displayAmenities: [
          "WiFi gratuito",
          "Aire acondicionado",
          "Baño privado completo",
          "Desayuno incluido",
          "TV LED 40\"",
          "Terraza amplia",
          "Piscina natural",
          "Estacionamiento",
        ],
        displayIncluded: [
          "Desayuno amazónico",
          "Acceso a senderos",
          "WiFi satelital",
          "Agua purificada",
          "Toallas y amenities",
        ],
      },
      en: {
        displayName: "Triple Bungalow",
        displayEyebrow: "Wakaya Ecolodge · Pucallpa",
        displayDescription:
          "Spacious and comfortable, ideal for small groups or families who need more room without losing comfort.",
        displayTagline: "Comfort, space, and nature",
        displayLongDescription:
          "The Triple Bungalow offers 40 sqm of well-used space with one double bed and one single bed. It includes air conditioning, a full private bathroom, a small lounge area, and a generous terrace surrounded by greenery. It is a practical category for three-person trips with a more functional and spacious layout.",
        displayHighlights: [
          "For groups of up to 3 guests",
          "Private lounge area",
          "Terrace surrounded by greenery",
        ],
        displayAmenities: [
          "Free Wi-Fi",
          "Air conditioning",
          "Full private bathroom",
          "Breakfast included",
          "40\" LED TV",
          "Wide terrace",
          "Natural pool",
          "Parking",
        ],
        displayIncluded: [
          "Amazon breakfast",
          "Trail access",
          "Satellite Wi-Fi",
          "Purified water",
          "Towels and amenities",
        ],
      },
    },
  },
] as const satisfies readonly WakayaBungalowPublicContentSeed[];

function cloneLocaleContent(localeContent: WakayaBungalowPublicContentSeed["localeContent"]) {
  return {
    es: {
      ...localeContent.es,
      displayHighlights: [...localeContent.es.displayHighlights],
      displayAmenities: [...localeContent.es.displayAmenities],
      displayIncluded: [...localeContent.es.displayIncluded],
    },
    en: {
      ...localeContent.en,
      displayHighlights: [...localeContent.en.displayHighlights],
      displayAmenities: [...localeContent.en.displayAmenities],
      displayIncluded: [...localeContent.en.displayIncluded],
    },
  };
}

export function buildDefaultBungalowPublicContent(
  seed: WakayaBungalowPublicContentSeed,
): BungalowPublicContent {
  return {
    bungalowId: seed.bungalowId,
    featuredOnHome: seed.featuredOnHome,
    sortOrder: seed.sortOrder,
    heroImageUrl: seed.heroImageUrl,
    galleryUrls: [...seed.galleryUrls],
    nightlyRatePen: seed.nightlyRatePen,
    areaSqm: seed.areaSqm,
    localeContent: cloneLocaleContent(seed.localeContent),
    updatedAt: DEFAULT_PUBLIC_CONTENT_UPDATED_AT,
  };
}

export function listDefaultBungalowPublicContent(): BungalowPublicContent[] {
  return WAKAYA_BUNGALOW_PUBLIC_CONTENT.map((seed) => buildDefaultBungalowPublicContent(seed));
}

export function getDefaultBungalowPublicContent(
  bungalowId: string,
): BungalowPublicContent | null {
  const seed = WAKAYA_BUNGALOW_PUBLIC_CONTENT.find((item) => item.bungalowId === bungalowId);
  return seed ? buildDefaultBungalowPublicContent(seed) : null;
}

export function createBlankBungalowPublicContent(
  bungalowId: string,
  displayName: string,
): BungalowPublicContent {
  return {
    bungalowId,
    featuredOnHome: false,
    sortOrder: 99,
    heroImageUrl: "",
    galleryUrls: [],
    nightlyRatePen: 100,
    areaSqm: 20,
    localeContent: {
      es: {
        displayName,
        displayEyebrow: "Wakaya Ecolodge · Pucallpa",
        displayDescription: "",
        displayTagline: "",
        displayLongDescription: "",
        displayHighlights: [],
        displayAmenities: [],
        displayIncluded: [],
      },
      en: {
        displayName,
        displayEyebrow: "Wakaya Ecolodge · Pucallpa",
        displayDescription: "",
        displayTagline: "",
        displayLongDescription: "",
        displayHighlights: [],
        displayAmenities: [],
        displayIncluded: [],
      },
    },
    updatedAt: DEFAULT_PUBLIC_CONTENT_UPDATED_AT,
  };
}
