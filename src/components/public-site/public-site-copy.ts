export const publicSiteLocales = ['es', 'en'] as const;

export type PublicSiteLocale = (typeof publicSiteLocales)[number];

export const defaultPublicSiteLocale: PublicSiteLocale = 'es';

export const publicSitePaths = {
  home: '/prototype/public-site',
  about: '/prototype/public-site/about',
  bungalows: '/prototype/public-site/bungalows',
  services: '/prototype/public-site/services',
  events: '/prototype/public-site/events',
  gallery: '/prototype/public-site/gallery',
  publications: '/prototype/public-site/publications',
  contact: '/prototype/public-site/contact',
} as const;

export type PublicSitePathKey = keyof typeof publicSitePaths;

export type PublicSitePageKey =
  | 'home'
  | 'about'
  | 'contact'
  | 'bungalows'
  | 'bungalowDetail';

export type PublicBungalowSlug =
  | 'bungalow-familiar'
  | 'bungalow-matrimonial'
  | 'bungalow-individual'
  | 'bungalow-doble'
  | 'bungalow-triple';

type PublicSiteCopy = {
  locale: PublicSiteLocale;
  brand: {
    siteName: string;
    locationLabel: string;
  };
  navLabels: Record<PublicSitePathKey, string>;
  footerNavKeys: readonly PublicSitePathKey[];
  footerIntro: {
    title: string;
    copy: string;
  };
  footerHeadings: {
    explore: string;
    booking: string;
    contact: string;
  };
  bookingBullets: readonly [string, string, string];
  contact: {
    place: string;
    domain: string;
    note: string;
    inbox: string;
    requestLead: string;
  };
  sharedLabels: {
    reserveNow: string;
    requestStay: string;
    checkAvailability: string;
    viewBungalows: string;
    viewDetails: string;
    readMore: string;
    requestUpdates: string;
    allCategories: string;
  };
  pageLabels: {
    about: {
      heroEyebrow: string;
      title: string;
      breadcrumb: string;
    };
    contact: {
      heroEyebrow: string;
      title: string;
      breadcrumb: string;
    };
    bungalows: {
      sectionTitle: string;
      detailEyebrow: string;
      breadcrumbRoot: string;
      resultsLabel: string;
    };
  };
  seo: {
    homeKeywords: readonly string[];
    aboutKeywords: readonly string[];
    contactKeywords: readonly string[];
    bungalowsKeywords: readonly string[];
    bungalowDetailKeywords: readonly string[];
  };
  homeSlides: readonly {
    eyebrow: string;
    title: string;
    copy: string;
    image: string;
  }[];
  testimonials: readonly {
    name: string;
    quote: string;
  }[];
  publications: readonly {
    slug: string;
    title: string;
  }[];
  bungalows: Record<
    PublicBungalowSlug,
    {
      name: string;
      homeName?: string | undefined;
      eyebrow: string;
      description: string;
      priceFrom: string;
      capacity: string;
    }
  >;
};

export const publicSiteLocaleMetadata = {
  es: {
    htmlLang: 'es-PE',
    ogLocale: 'es_PE',
    alternateLocale: 'en_US',
  },
  en: {
    htmlLang: 'en-US',
    ogLocale: 'en_US',
    alternateLocale: 'es_PE',
  },
} as const satisfies Record<
  PublicSiteLocale,
  {
    htmlLang: string;
    ogLocale: string;
    alternateLocale: string;
  }
>;

const publicSiteCopyByLocale = {
  es: {
    locale: 'es',
    brand: {
      siteName: 'Wakaya Ecolodge',
      locationLabel: 'Pucallpa · Perú',
    },
    navLabels: {
      home: 'Inicio',
      about: 'Nosotros',
      bungalows: 'Bungalows',
      services: 'Servicios',
      events: 'Eventos',
      gallery: 'Galería',
      publications: 'Publicaciones',
      contact: 'Contacto',
    },
    footerNavKeys: ['home', 'about', 'bungalows', 'services'],
    footerIntro: {
      title: 'Wakaya Ecolodge',
      copy: 'Bungalows, naturaleza y servicios en Pucallpa.',
    },
    footerHeadings: {
      explore: 'Explora',
      booking: 'Reserva',
      contact: 'Contacto',
    },
    bookingBullets: [
      'Consulta por fechas',
      'Confirmación por el equipo Wakaya',
      'Atención directa',
    ],
    contact: {
      place: 'Pucallpa · Perú',
      domain: 'wakayaecolodge.com',
      note: 'Atención personalizada del equipo Wakaya',
      inbox: 'reservas@wakayaecolodge.com',
      requestLead: 'Consulta disponibilidad o comunícate directamente con Wakaya.',
    },
    sharedLabels: {
      reserveNow: 'Reservar ahora',
      requestStay: 'Enviar solicitud',
      checkAvailability: 'Consultar disponibilidad',
      viewBungalows: 'Ver bungalows',
      viewDetails: 'Ver detalle',
      readMore: 'Leer más',
      requestUpdates: 'Solicitar novedades',
      allCategories: 'Todas las categorías',
    },
    pageLabels: {
      about: {
        heroEyebrow: 'Nosotros',
        title: 'Acerca de Wakaya',
        breadcrumb: 'Inicio / Nosotros',
      },
      contact: {
        heroEyebrow: 'Contacto',
        title: 'Solicitud de estadía',
        breadcrumb: 'Inicio / Contacto',
      },
      bungalows: {
        sectionTitle: 'Resultados de búsqueda',
        detailEyebrow: 'Bungalow',
        breadcrumbRoot: 'Inicio / Bungalows',
        resultsLabel: 'Categoría',
      },
    },
    seo: {
      homeKeywords: [
        'wakaya ecolodge',
        'ecolodge en pucallpa',
        'hotel amazónico en pucallpa',
        'bungalows en pucallpa',
        'hotel con piscina en pucallpa',
      ],
      aboutKeywords: [
        'nosotros wakaya',
        'historia wakaya ecolodge',
        'hotel amazónico pucallpa',
        'ecolodge pucallpa',
      ],
      contactKeywords: [
        'contacto wakaya',
        'solicitud de estadía wakaya',
        'reservas wakaya',
        'ecolodge pucallpa',
      ],
      bungalowsKeywords: [
        'bungalows wakaya',
        'bungalows en pucallpa',
        'alojamiento amazónico',
        'habitaciones wakaya',
      ],
      bungalowDetailKeywords: [
        'bungalow wakaya',
        'estadía en pucallpa',
        'ecolodge amazónico peru',
      ],
    },
    homeSlides: [
      {
        eyebrow: 'Hotel Wakaya Ecolodge',
        title: 'Encuentra tu refugio perfecto en Wakaya.',
        copy:
          'Laguna, jardines, piscina y bungalows cálidos para una escapada amazónica con descanso, naturaleza y atención cercana.',
        image:
          'https://wakayaecolodge.com/es/images/wakaya/slider/slider_wakaya1.png',
      },
      {
        eyebrow: 'Hospitalidad tropical',
        title: 'Lo mejor de la selva del Peru.',
        copy:
          'Bungalows, jardines y naturaleza para descansar en Pucallpa.',
        image:
          'https://wakayaecolodge.com/es/images/wakaya/slider/slider_wakaya2.png',
      },
      {
        eyebrow: 'Eventos · Celebraciones · Retiro',
        title: 'Un lodge para dormir, celebrar y desconectar.',
        copy:
          'Hospedaje, eventos y servicios en un mismo entorno natural.',
        image:
          'https://wakayaecolodge.com/es/images/wakaya/eventos/evenos_celebraciones_familiar.jpg',
      },
    ],
    testimonials: [
      {
        name: 'Familias',
        quote: 'Un entorno natural para descansar del ruido de la ciudad.',
      },
      {
        name: 'Parejas',
        quote: 'Bungalows cálidos, agua, jardines y mejor sensación de retiro.',
      },
    ],
    publications: [
      {
        slug: 'bodas-en-wakaya',
        title: 'Celebraciones en un entorno natural',
      },
      {
        slug: 'full-day-pucallpa',
        title: 'Cómo vivir un Full Day en Wakaya',
      },
    ],
    bungalows: {
      'bungalow-familiar': {
        name: 'Bungalow Familiar',
        homeName: undefined,
        eyebrow: 'El hogar de la familia en la selva',
        description:
          'Dos habitaciones independientes, vistas a la piscina y amplias áreas verdes para una estadía familiar más cómoda.',
        priceFrom: 'Desde S/ 350',
        capacity: '4 huéspedes',
      },
      'bungalow-matrimonial': {
        name: 'Bungalow Matrimonial',
        homeName: undefined,
        eyebrow: 'El retiro perfecto para una pareja',
        description:
          'Un refugio íntimo en madera nativa para parejas que buscan reconectarse entre sí y con la naturaleza.',
        priceFrom: 'Desde S/ 250',
        capacity: '2 huéspedes',
      },
      'bungalow-individual': {
        name: 'Bungalow Individual',
        homeName: undefined,
        eyebrow: 'Privacidad para una estadía personal',
        description:
          'Una categoría para una persona, con la tranquilidad y el entorno natural de Wakaya.',
        priceFrom: 'Consultar tarifa',
        capacity: '1 huésped',
      },
      'bungalow-doble': {
        name: 'Bungalow Doble',
        homeName: undefined,
        eyebrow: 'Diseño rústico-moderno con vistas al río',
        description:
          'Dos camas individuales, terraza abierta al paisaje tropical y una lectura más fresca para amigos o viajeros en solitario.',
        priceFrom: 'Desde S/ 280',
        capacity: '2 huéspedes',
      },
      'bungalow-triple': {
        name: 'Bungalow Triple',
        homeName: undefined,
        eyebrow: 'Comodidad, espacio y naturaleza',
        description:
          'Una opción amplia con cama doble, cama individual y terraza generosa para grupos pequeños o familias cortas.',
        priceFrom: 'Desde S/ 300',
        capacity: '3 huéspedes',
      },
    },
  },
  en: {
    locale: 'en',
    brand: {
      siteName: 'Wakaya Ecolodge',
      locationLabel: 'Pucallpa · Peru',
    },
    navLabels: {
      home: 'Home',
      about: 'About',
      bungalows: 'Bungalows',
      services: 'Services',
      events: 'Events',
      gallery: 'Gallery',
      publications: 'Journal',
      contact: 'Contact',
    },
    footerNavKeys: ['home', 'about', 'bungalows', 'services'],
    footerIntro: {
      title: 'Wakaya Ecolodge',
      copy: 'Bungalows, nature, and services in Pucallpa.',
    },
    footerHeadings: {
      explore: 'Explore',
      booking: 'Stay Request',
      contact: 'Contact',
    },
    bookingBullets: [
      'Date availability',
      'Confirmation by the Wakaya team',
      'Direct assistance',
    ],
    contact: {
      place: 'Pucallpa · Peru',
      domain: 'wakayaecolodge.com',
      note: 'Personalized support from the Wakaya team',
      inbox: 'reservas@wakayaecolodge.com',
      requestLead: 'Check availability or contact Wakaya directly.',
    },
    sharedLabels: {
      reserveNow: 'Reserve now',
      requestStay: 'Send request',
      checkAvailability: 'Check availability',
      viewBungalows: 'View bungalows',
      viewDetails: 'View details',
      readMore: 'Read more',
      requestUpdates: 'Request updates',
      allCategories: 'All categories',
    },
    pageLabels: {
      about: {
        heroEyebrow: 'About',
        title: 'About Wakaya',
        breadcrumb: 'Home / About',
      },
      contact: {
        heroEyebrow: 'Contact',
        title: 'Stay request',
        breadcrumb: 'Home / Contact',
      },
      bungalows: {
        sectionTitle: 'Search results',
        detailEyebrow: 'Bungalow',
        breadcrumbRoot: 'Home / Bungalows',
        resultsLabel: 'Category',
      },
    },
    seo: {
      homeKeywords: [
        'wakaya ecolodge',
        'pucallpa ecolodge',
        'amazon lodge peru',
        'bungalows in pucallpa',
        'jungle hotel peru',
      ],
      aboutKeywords: [
        'about wakaya ecolodge',
        'pucallpa lodge',
        'amazon hospitality peru',
        'wakaya hotel peru',
      ],
      contactKeywords: [
        'wakaya contact',
        'stay request pucallpa',
        'wakaya reservations',
        'amazon lodge peru',
      ],
      bungalowsKeywords: [
        'wakaya bungalows',
        'bungalows in pucallpa',
        'amazon stay peru',
        'lodge rooms peru',
      ],
      bungalowDetailKeywords: [
        'wakaya bungalow',
        'pucallpa lodging',
        'peru jungle ecolodge',
      ],
    },
    homeSlides: [
      {
        eyebrow: 'Wakaya Ecolodge',
        title: 'Find your perfect refuge in Wakaya.',
        copy:
          'Lagoon, gardens, pool, and bungalows in a tropical setting.',
        image:
          'https://wakayaecolodge.com/es/images/wakaya/slider/slider_wakaya1.png',
      },
      {
        eyebrow: 'Tropical hospitality',
        title: 'The best of the Peruvian jungle.',
        copy:
          'A more emotional, more visual, and clearer arrival for comparing categories and planning the stay.',
        image:
          'https://wakayaecolodge.com/es/images/wakaya/slider/slider_wakaya2.png',
      },
      {
        eyebrow: 'Events · Celebrations · Retreat',
        title: 'A lodge to sleep, celebrate, and disconnect.',
        copy:
          'Accommodation, events, and services in one natural setting.',
        image:
          'https://wakayaecolodge.com/es/images/wakaya/eventos/evenos_celebraciones_familiar.jpg',
      },
    ],
    testimonials: [
      {
        name: 'Families',
        quote: 'A natural setting to rest away from the noise of the city.',
      },
      {
        name: 'Couples',
        quote: 'Warm bungalows, water, gardens and a stronger sense of retreat.',
      },
    ],
    publications: [
      {
        slug: 'bodas-en-wakaya',
        title: 'Celebrations in a natural setting',
      },
      {
        slug: 'full-day-pucallpa',
        title: 'How to enjoy a Full Day at Wakaya',
      },
    ],
    bungalows: {
      'bungalow-familiar': {
        name: 'Family Bungalow',
        homeName: undefined,
        eyebrow: 'The family home in the jungle',
        description:
          'Two separate bedrooms, pool views, and broad green areas for a more comfortable family stay.',
        priceFrom: 'From S/ 350',
        capacity: '4 guests',
      },
      'bungalow-matrimonial': {
        name: 'Matrimonial Bungalow',
        homeName: undefined,
        eyebrow: 'The perfect retreat for two',
        description:
          'An intimate native-wood refuge for couples who want to reconnect with each other and the surrounding nature.',
        priceFrom: 'From S/ 250',
        capacity: '2 guests',
      },
      'bungalow-individual': {
        name: 'Individual Bungalow',
        homeName: undefined,
        eyebrow: 'Privacy for a personal stay',
        description:
          'A one-guest category with the calm and natural setting of Wakaya.',
        priceFrom: 'Ask for the rate',
        capacity: '1 guest',
      },
      'bungalow-doble': {
        name: 'Double Bungalow',
        homeName: undefined,
        eyebrow: 'Rustic-modern design with river views',
        description:
          'Two single beds, a terrace opening to the tropical landscape, and a fresher setup for friends or solo travellers.',
        priceFrom: 'From S/ 280',
        capacity: '2 guests',
      },
      'bungalow-triple': {
        name: 'Triple Bungalow',
        homeName: undefined,
        eyebrow: 'Comfort, space, and nature',
        description:
          'A roomy option with one double bed, one single bed, and a generous terrace for small groups or compact families.',
        priceFrom: 'From S/ 300',
        capacity: '3 guests',
      },
    },
  },
} satisfies Record<PublicSiteLocale, PublicSiteCopy>;

export function resolvePublicSiteLocale(
  locale?: PublicSiteLocale | string | null,
): PublicSiteLocale {
  return locale === 'en' ? 'en' : defaultPublicSiteLocale;
}

export function getPublicSiteCopy(
  locale: PublicSiteLocale | string = defaultPublicSiteLocale,
) {
  return publicSiteCopyByLocale[resolvePublicSiteLocale(locale)];
}
