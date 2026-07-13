import type { PublicSiteLocale } from "@/components/public-site/public-site-locale";
import { getPublicBungalowLabel, publicBungalows } from "@/components/public-site/public-site-data";
import { reservationStore } from "@/lib/reservations/store";

type LocalizedBungalow = (typeof publicBungalows)[number] & {
  displayName: string;
  displayEyebrow: string;
  displayDescription: string;
  displayCapacity: string;
  displayPriceFrom: string;
  hasNightlyRate: boolean;
  displayTagline: string;
  displayLongDescription: string;
  displayArea: string;
  displayHighlights: string[];
  displayAmenities: string[];
  displayIncluded: string[];
  gallery: string[];
};

type PublicSitePageLabels = {
  nav: Array<{ key: string; label: string }>;
  footerIntro: string;
  footerExplore: string;
  footerReserve: string;
  footerContact: string;
  reserveChecklist: string[];
  contactItems: string[];
  reserveNow: string;
  languageSwitchLabel: string;
  breadcrumbHome: string;
};

type PublicSiteHomeContent = {
  metadata: {
    title: string;
    description: string;
    keywords: string[];
  };
  hero: {
    eyebrow: string;
    title: string;
    copy: string;
    primaryCta: string;
    secondaryCta: string;
  };
  deck: Array<{ title: string; copy: string }>;
  bookingBand: {
    title: string;
    copy: string;
    guestsLabel: string;
    roomLabel: string;
    allCategories: string;
    submitLabel: string;
  };
  rooms: {
    eyebrow: string;
    title: string;
    copy: string;
    detailLabel: string;
  };
  testimonials: {
    eyebrow: string;
    title: string;
    items: Array<{ name: string; quote: string }>;
  };
  publications: {
    eyebrow: string;
    title: string;
    ctaLabel: string;
  };
  newsletter: {
    eyebrow: string;
    title: string;
    copy: string;
    ctaLabel: string;
  };
};

type PublicSitePageSection = {
  metadata: {
    title: string;
    description: string;
    keywords?: string[];
  };
  hero: {
    eyebrow: string;
    title: string;
    copy: string;
  };
};

type PublicSiteContent = {
  site: {
    brandSmall: string;
    brandName: string;
    place: string;
    domain: string;
    note: string;
  };
  labels: PublicSitePageLabels;
  home: PublicSiteHomeContent;
  about: PublicSitePageSection & {
    sectionEyebrow: string;
    sectionTitle: string;
    sectionLead: string;
    factValue: string;
    factTitle: string;
    factCopy: string;
    storyEyebrow: string;
    storyTitle: string;
    storyCopy: string;
    storyCards: Array<{ title: string; copy: string }>;
    ctaEyebrow: string;
    ctaTitle: string;
    ctaCopy: string;
    ctaLabel: string;
  };
  contact: PublicSitePageSection & {
    introTitle: string;
    introCopy: string;
    checklist: string[];
    form: {
      guestName: string;
      guestEmail: string;
      guestPhone: string;
      requestedCheckIn: string;
      requestedCheckOut: string;
      requestedGuests: string;
      requestedBungalowType: string;
      notes: string;
      notesPlaceholder: string;
      noPreference: string;
      submitLabel: string;
      guestOptions: string[];
    };
    visualBadge: string;
    visualAlt: string;
  };
  bungalows: PublicSitePageSection & {
    resultsMetaPrefix: string;
    resultsMetaCategory: string;
    allCategories: string;
    noGuests: string;
    emptyTitle: string;
    emptyCopy: string;
    viewDetailLabel: string;
  };
  bungalowDetail: {
    metadataKeywords: string[];
    amenitiesTitle: string;
    includedTitle: string;
    detailsTitle: string;
    highlightsTitle: string;
    howItWorksTitle: string;
    checklist: string[];
    requestLabel: string;
    backLabel: string;
    venueLabel: string;
    requestPanelTitle: string;
    requestPanelCopy: string;
    proofNote: string;
    referenceRateLabel: string;
    availabilityLabel: string;
  };
  services: PublicSitePageSection & {
    sectionEyebrow: string;
    sectionTitle: string;
    sectionCopy: string;
    cards: Array<{ title: string; tag: string; copy: string }>;
  };
  events: PublicSitePageSection & {
    venueBadge: string;
    bodyTitle: string;
    bodyCopy: string;
    checklist: string[];
    imageAlt: string;
  };
  gallery: PublicSitePageSection & {
    sectionEyebrow: string;
    sectionTitle: string;
    sectionCopy: string;
    cards: Array<{ title: string; tag: string }>;
  };
  publications: PublicSitePageSection & {
    sectionEyebrow: string;
    sectionTitle: string;
    sectionCopy: string;
    ctaLabel: string;
    ctaEyebrow: string;
    ctaTitle: string;
    ctaCopy: string;
    ctaButton: string;
    items: Array<{ slug: string; title: string }>;
  };
};

const CONTENT: Record<PublicSiteLocale, PublicSiteContent> = {
  es: {
    site: {
      brandSmall: "Pucallpa · Peru",
      brandName: "Wakaya Ecolodge",
      place: "Pucallpa · Peru",
      domain: "wakayaecolodge.com",
      note: "Atencion personalizada del equipo Wakaya",
    },
    labels: {
      nav: [
        { key: "home", label: "Inicio" },
        { key: "about", label: "Nosotros" },
        { key: "bungalows", label: "Bungalows" },
        { key: "services", label: "Servicios" },
        { key: "events", label: "Eventos" },
        { key: "gallery", label: "Galeria" },
        { key: "publications", label: "Publicaciones" },
        { key: "contact", label: "Contacto" },
      ],
      footerIntro:
        "Bungalows, naturaleza y servicios en Pucallpa.",
      footerExplore: "Explora",
      footerReserve: "Reserva",
      footerContact: "Contacto",
      reserveChecklist: [
        "Consulta por fechas",
        "Confirmación por el equipo Wakaya",
        "Atención directa",
      ],
      contactItems: ["Pucallpa · Peru", "wakayaecolodge.com", "Atencion personalizada del equipo Wakaya"],
      reserveNow: "Reservar ahora",
      languageSwitchLabel: "Idioma",
      breadcrumbHome: "Inicio",
    },
    home: {
      metadata: {
        title: "Wakaya Ecolodge | Estadia amazonica en Pucallpa",
        description:
          "Descubre Wakaya Ecolodge en Pucallpa con bungalows, piscina, jardines y una solicitud de estadia acompanada por el equipo de reservas.",
        keywords: ["wakaya ecolodge", "pucallpa", "bungalows", "reservas", "ecolodge"],
      },
      hero: {
        eyebrow: "Hotel Wakaya Ecolodge",
        title: "Encuentra tu refugio perfecto en Wakaya.",
        copy:
          "Laguna, jardines, piscina y bungalows cálidos para una escapada amazónica con descanso, naturaleza y atención cercana.",
        primaryCta: "Consultar disponibilidad",
        secondaryCta: "Conocer Wakaya",
      },
      deck: [
        {
          title: "Hospitalidad tropical",
          copy: "Una llegada mas emocional, mas visual y mas clara para reservar en Wakaya.",
        },
        {
          title: "Contacto directo",
          copy: "Atención por teléfono, WhatsApp y correo.",
        },
      ],
      bookingBand: {
        title: "Consulta disponibilidad",
        copy: "Selecciona las fechas, la categoría y la cantidad de huéspedes.",
        guestsLabel: "Personas",
        roomLabel: "Habitacion",
        allCategories: "Todas las categorias",
        submitLabel: "Consultar disponibilidad",
      },
      rooms: {
        eyebrow: "Bungalows",
        title: "Bungalows para descansar en Wakaya.",
        copy: "Compara las categorías y consulta disponibilidad por fechas.",
        detailLabel: "Ver disponibilidad",
      },
      testimonials: {
        eyebrow: "Testimonios",
        title: "Una experiencia que se recuerda por calma, entorno y retiro.",
        items: [
          { name: "Familias", quote: "Un entorno natural para descansar del ruido de la ciudad." },
          { name: "Parejas", quote: "Bungalows calidos, agua, jardines y mejor sensacion de retiro." },
        ],
      },
      publications: {
        eyebrow: "Publicaciones",
        title: "Historias y guias para seguir descubriendo Wakaya.",
        ctaLabel: "Leer mas",
      },
      newsletter: {
        eyebrow: "Newsletter",
        title: "Recibe novedades, experiencias y temporadas destacadas de Wakaya.",
        copy:
          "Una suscripcion ligera para enterarte de escapadas, celebraciones y momentos especiales alrededor del lodge.",
        ctaLabel: "Solicitar novedades",
      },
    },
    about: {
      metadata: {
        title: "Nosotros | Wakaya Ecolodge",
        description: "Conoce la historia, el ritmo de hospitalidad y la propuesta natural de Wakaya Ecolodge en Pucallpa.",
        keywords: ["nosotros", "wakaya ecolodge", "pucallpa", "hotel amazonico"],
      },
      hero: {
        eyebrow: "Nosotros",
        title: "Acerca de Wakaya",
        copy: "Historia, naturaleza, proposito y hospitalidad real en el ecolodge.",
      },
      sectionEyebrow: "Ecolodge amazonico",
      sectionTitle: "Un paraiso en el corazon de Pucallpa",
      sectionLead:
        "Wakaya reune jardines, laguna, piscina y descanso tropical en una experiencia pensada para familias, parejas y escapadas cortas.",
      factValue: "365",
      factTitle: "dias de clima calido y atencion personalizada",
      factCopy:
        "Una llegada simple, natural y coherente con la hospitalidad que Wakaya quiere compartir desde el primer contacto.",
      storyEyebrow: "Nuestra forma de recibir",
      storyTitle: "Naturaleza, hospitalidad y celebraciones",
      storyCopy:
        "Wakaya equilibra descanso, atencion humana y momentos compartidos para que cada visita se sienta clara desde la primera consulta.",
      storyCards: [
        {
          title: "Hospitalidad con criterio humano",
          copy:
            "La reserva no termina en un formulario: el equipo acompana cada solicitud, confirma fechas y coordina detalles antes de convertirla en estadia real.",
        },
        {
          title: "Experiencias con ritmo tropical",
          copy:
            "Jardines, piscina, laguna y bungalows calidos sostienen una narrativa visual consistente entre escapadas, celebraciones y descanso corto.",
        },
      ],
      ctaEyebrow: "Reservas",
      ctaTitle: "Consulta tus fechas",
      ctaCopy: "Indica la categoría y las fechas que necesitas.",
      ctaLabel: "Enviar solicitud",
    },
    contact: {
      metadata: {
        title: "Contacto y reservas | Wakaya Ecolodge",
        description: "Consulta disponibilidad y contacta a Wakaya Ecolodge.",
        keywords: ["contacto wakaya", "reservas wakaya", "pucallpa", "ecolodge"],
      },
      hero: {
        eyebrow: "Contacto",
        title: "Solicitud de estadia",
        copy: "Consulta fechas, categorías y servicios disponibles.",
      },
      introTitle: "Contacto Wakaya",
      introCopy: "Teléfono, WhatsApp y correo para reservas y consultas.",
      checklist: [
        "Disponibilidad por fecha y categoría.",
        "Confirmación por el equipo Wakaya.",
        "Pucallpa · Peru",
        "wakayaecolodge.com",
        "Atencion personalizada del equipo Wakaya",
      ],
      form: {
        guestName: "Nombre",
        guestEmail: "Correo",
        guestPhone: "Telefono",
        requestedCheckIn: "Check in",
        requestedCheckOut: "Check out",
        requestedGuests: "Personas",
        requestedBungalowType: "Categoria preferida",
        notes: "Notas",
        notesPlaceholder: "Requerimientos especiales, horarios o comentarios.",
        noPreference: "Sin preferencia",
        submitLabel: "Enviar solicitud",
        guestOptions: ["2 huespedes", "3 huespedes", "4 huespedes", "5 huespedes"],
      },
      visualBadge: "Reservas y consultas",
      visualAlt: "Canales de contacto de Wakaya",
    },
    bungalows: {
      metadata: {
        title: "Bungalows | Wakaya Ecolodge",
        description: "Explora las categorías de bungalows de Wakaya Ecolodge en Pucallpa.",
        keywords: ["bungalows", "wakaya ecolodge", "pucallpa", "habitaciones"],
      },
      hero: {
        eyebrow: "Bungalows",
        title: "Resultados de busqueda",
        copy: "Compara categorías y consulta disponibilidad por fechas.",
      },
      resultsMetaPrefix: "Categoria:",
      resultsMetaCategory: "Todas las categorias",
      allCategories: "Todas las categorias",
      noGuests: "Sin huespedes",
      emptyTitle: "No encontramos coincidencias con esos filtros.",
      emptyCopy: "Ajusta fechas o categoria para revisar mas opciones referenciales.",
      viewDetailLabel: "Ver detalle",
    },
    bungalowDetail: {
      metadataKeywords: ["bungalows", "wakaya ecolodge", "pucallpa"],
      amenitiesTitle: "Lo que incluye",
      includedTitle: "Servicios incluidos",
      detailsTitle: "Detalles del bungalow",
      highlightsTitle: "Puntos destacados",
      howItWorksTitle: "Información de reserva",
      checklist: [
        "Disponibilidad por fecha y categoría.",
        "Confirmación por el equipo Wakaya.",
        "Coordinación directa para check-in y forma de pago.",
      ],
      requestLabel: "Enviar solicitud",
      backLabel: "Volver a resultados",
      venueLabel: "Bungalow",
      requestPanelTitle: "Consulta de disponibilidad",
      requestPanelCopy: "Selecciona las fechas y envía tus datos de contacto.",
      proofNote: "",
      referenceRateLabel: "Tarifa referencial",
      availabilityLabel: "Disponibilidad referencial",
    },
    services: {
      metadata: {
        title: "Servicios | Wakaya Ecolodge",
        description: "Conoce piscina, jardines, laguna, restaurante y experiencias de Wakaya Ecolodge.",
      },
      hero: {
        eyebrow: "Servicios",
        title: "Servicios",
        copy: "Experiencias y amenities reales de Wakaya para una estadia mas clara.",
      },
      sectionEyebrow: "Experiencia",
      sectionTitle: "Laguna, piscina, restaurante y mas",
      sectionCopy:
        "Los servicios publicos priorizan una lectura rapida de lo esencial: entorno, descanso, coordinacion y momentos especiales.",
      cards: [
        { title: "Piscina y jardines", tag: "Relajo", copy: "Espacios abiertos para descanso, lectura y pausa durante la estadia." },
        { title: "Laguna y entorno natural", tag: "Naturaleza", copy: "Un paisaje tropical que sostiene la atmosfera del ecolodge durante todo el recorrido." },
        { title: "Restaurante y atencion", tag: "Hospitalidad", copy: "Coordinacion directa con el equipo Wakaya para comidas, horarios y soporte." },
        { title: "Escapadas y full day", tag: "Experiencias", copy: "Opciones flexibles para visitas cortas, celebraciones y fines de semana." },
      ],
    },
    events: {
      metadata: {
        title: "Eventos | Wakaya Ecolodge",
        description: "Celebraciones, corporativo y encuentros especiales en un entorno natural de Wakaya.",
      },
      hero: {
        eyebrow: "Eventos",
        title: "Eventos",
        copy: "Celebraciones, corporativo y encuentros especiales en entorno natural.",
      },
      venueBadge: "Venue natural",
      bodyTitle: "Wakaya como venue natural",
      bodyCopy:
        "Wakaya ofrece un espacio flexible para reuniones, celebraciones íntimas y encuentros corporativos en un entorno natural.",
      checklist: [
        "Coordinacion previa con el equipo Wakaya.",
        "Capacidad adaptable segun formato del encuentro.",
        "Integracion con bungalows y servicios del lodge.",
      ],
      imageAlt: "Espacio natural para eventos en Wakaya",
    },
    gallery: {
      metadata: {
        title: "Galeria | Wakaya Ecolodge",
        description: "Explora la atmosfera visual de Wakaya entre agua, vegetacion, arquitectura y descanso tropical.",
      },
      hero: {
        eyebrow: "Galeria",
        title: "Galeria",
        copy: "Agua, vegetacion, arquitectura y uso humano del lugar.",
      },
      sectionEyebrow: "Imagenes",
      sectionTitle: "Atmosfera del ecolodge",
      sectionCopy:
        "Un recorrido visual breve para sostener la promesa del sitio sin romper la continuidad con el resto del recorrido publico.",
      cards: [
        { title: "Arquitectura tropical", tag: "Espacio" },
        { title: "Jardines y vegetacion", tag: "Entorno" },
        { title: "Bungalows calidos", tag: "Hospedaje" },
        { title: "Rincones de descanso", tag: "Atmosfera" },
      ],
    },
    publications: {
      metadata: {
        title: "Publicaciones | Wakaya Ecolodge",
        description: "Historias, temporadas y experiencias compartidas desde Wakaya para seguir el recorrido del ecolodge.",
      },
      hero: {
        eyebrow: "Publicaciones",
        title: "Publicaciones",
        copy: "Historias, temporadas y experiencias compartidas desde Wakaya.",
      },
      sectionEyebrow: "Lecturas",
      sectionTitle: "Novedades de Wakaya",
      sectionCopy:
        "Una capa editorial simple para sostener descubrimiento, contexto y continuidad con el resto de las paginas publicas.",
      ctaLabel: "Solicitar mas informacion",
      ctaEyebrow: "Explora mas",
      ctaTitle: "Continua el recorrido por la experiencia publica de Wakaya.",
      ctaCopy:
        "Desde aqui puedes volver a los bungalows, revisar servicios o pasar directo a contacto sin salir del mismo lenguaje visual.",
      ctaButton: "Ver bungalows",
      items: [
        { slug: "bodas-en-wakaya", title: "Celebraciones en un entorno natural" },
        { slug: "full-day-pucallpa", title: "Como vivir un Full Day en Wakaya" },
      ],
    },
  },
  en: {
    site: {
      brandSmall: "Pucallpa · Peru",
      brandName: "Wakaya Ecolodge",
      place: "Pucallpa · Peru",
      domain: "wakayaecolodge.com",
      note: "Personal support from the Wakaya reservations team",
    },
    labels: {
      nav: [
        { key: "home", label: "Home" },
        { key: "about", label: "About" },
        { key: "bungalows", label: "Bungalows" },
        { key: "services", label: "Services" },
        { key: "events", label: "Events" },
        { key: "gallery", label: "Gallery" },
        { key: "publications", label: "Stories" },
        { key: "contact", label: "Contact" },
      ],
      footerIntro:
        "Bungalows, nature, and services in Pucallpa.",
      footerExplore: "Explore",
      footerReserve: "Reservations",
      footerContact: "Contact",
      reserveChecklist: [
        "Date availability",
        "Confirmation by the Wakaya team",
        "Direct assistance",
      ],
      contactItems: ["Pucallpa · Peru", "wakayaecolodge.com", "Personal support from the Wakaya reservations team"],
      reserveNow: "Book now",
      languageSwitchLabel: "Language",
      breadcrumbHome: "Home",
    },
    home: {
      metadata: {
        title: "Wakaya Ecolodge | Amazon stay in Pucallpa",
        description:
          "Discover Wakaya Ecolodge in Pucallpa with bungalows, gardens, pool, and a guided booking request supported by the reservations team.",
        keywords: ["wakaya ecolodge", "pucallpa", "bungalows", "amazon lodge", "booking request"],
      },
      hero: {
        eyebrow: "Wakaya Ecolodge",
        title: "Find your perfect refuge in Wakaya.",
        copy:
          "Lagoon, gardens, pool and warm bungalows in a premium tropical hospitality rhythm.",
        primaryCta: "Check availability",
        secondaryCta: "Discover Wakaya",
      },
      deck: [
        {
          title: "Tropical hospitality",
          copy: "A more emotional, visual, and clearer arrival path for discovering Wakaya.",
        },
        {
          title: "Direct contact",
          copy: "Assistance by phone, WhatsApp, and email.",
        },
      ],
      bookingBand: {
        title: "Check availability",
        copy: "Select dates, bungalow category, and number of guests.",
        guestsLabel: "Guests",
        roomLabel: "Room type",
        allCategories: "All categories",
        submitLabel: "Check availability",
      },
      rooms: {
        eyebrow: "Bungalows",
        title: "Bungalows for a stay at Wakaya.",
        copy: "Compare categories and check availability by date.",
        detailLabel: "View availability",
      },
      testimonials: {
        eyebrow: "Testimonials",
        title: "An experience remembered for calm, nature, and retreat.",
        items: [
          { name: "Families", quote: "A natural environment to disconnect from the pace of the city." },
          { name: "Couples", quote: "Warm bungalows, water, gardens, and a deeper feeling of retreat." },
        ],
      },
      publications: {
        eyebrow: "Stories",
        title: "Guides and moments to keep discovering Wakaya.",
        ctaLabel: "Read more",
      },
      newsletter: {
        eyebrow: "News",
        title: "Receive seasonal highlights, experiences, and updates from Wakaya.",
        copy:
          "A light subscription to hear about escapes, celebrations, and moments worth planning around the lodge.",
        ctaLabel: "Request updates",
      },
    },
    about: {
      metadata: {
        title: "About | Wakaya Ecolodge",
        description: "Discover Wakaya's hospitality rhythm, natural setting, and tropical stay proposal in Pucallpa.",
        keywords: ["about wakaya", "wakaya ecolodge", "pucallpa", "amazon lodge"],
      },
      hero: {
        eyebrow: "About",
        title: "About Wakaya",
        copy: "Story, nature, purpose, and real hospitality at the ecolodge.",
      },
      sectionEyebrow: "Amazon ecolodge",
      sectionTitle: "A tropical retreat in the heart of Pucallpa",
      sectionLead:
        "Wakaya brings together gardens, lagoon, pool, and warm rest into a stay designed for couples, families, and short escapes.",
      factValue: "365",
      factTitle: "days of warm weather and tailored hospitality",
      factCopy:
        "A clear, natural arrival path aligned with the hospitality Wakaya wants every public page to communicate.",
      storyEyebrow: "How we welcome guests",
      storyTitle: "Nature, hospitality, and shared moments",
      storyCopy:
        "Wakaya balances relaxation, human attention, and special occasions so every visit feels clear from the first inquiry.",
      storyCards: [
        {
          title: "Human hospitality with clear judgment",
          copy:
            "The reservation does not stop at a form: the team follows each request, confirms dates, and coordinates details before turning it into a real stay.",
        },
        {
          title: "Experiences with tropical rhythm",
          copy:
            "Gardens, pool, lagoon, and warm bungalows sustain one visual language across escapes, celebrations, and short stays.",
        },
      ],
      ctaEyebrow: "Reservations",
      ctaTitle: "Check your dates",
      ctaCopy: "Tell us the category and dates you need.",
      ctaLabel: "Send request",
    },
    contact: {
      metadata: {
        title: "Contact and reservations | Wakaya Ecolodge",
        description: "Check availability and contact Wakaya Ecolodge.",
        keywords: ["wakaya contact", "wakaya reservations", "pucallpa", "ecolodge"],
      },
      hero: {
        eyebrow: "Contact",
        title: "Stay request",
        copy: "Check available dates, categories, and services.",
      },
      introTitle: "Contact Wakaya",
      introCopy: "Phone, WhatsApp, and email for bookings and enquiries.",
      checklist: [
        "Availability by date and category.",
        "Confirmation by the Wakaya team.",
        "Pucallpa · Peru",
        "wakayaecolodge.com",
        "Personal support from the Wakaya reservations team",
      ],
      form: {
        guestName: "Name",
        guestEmail: "Email",
        guestPhone: "Phone",
        requestedCheckIn: "Check in",
        requestedCheckOut: "Check out",
        requestedGuests: "Guests",
        requestedBungalowType: "Preferred category",
        notes: "Notes",
        notesPlaceholder: "Special requirements, schedule, or comments.",
        noPreference: "No preference",
        submitLabel: "Send request",
        guestOptions: ["2 guests", "3 guests", "4 guests", "5 guests"],
      },
      visualBadge: "Bookings and enquiries",
      visualAlt: "Wakaya contact and reservations channels",
    },
    bungalows: {
      metadata: {
        title: "Bungalows | Wakaya Ecolodge",
        description: "Explore Wakaya's bungalow categories in Pucallpa.",
        keywords: ["bungalows", "wakaya ecolodge", "pucallpa", "room categories"],
      },
      hero: {
        eyebrow: "Bungalows",
        title: "Search results",
        copy: "Compare categories and check availability by date.",
      },
      resultsMetaPrefix: "Category:",
      resultsMetaCategory: "All categories",
      allCategories: "All categories",
      noGuests: "No guests",
      emptyTitle: "We could not find a match for those filters.",
      emptyCopy: "Adjust your dates or category to review more reference options.",
      viewDetailLabel: "View details",
    },
    bungalowDetail: {
      metadataKeywords: ["bungalows", "wakaya ecolodge", "pucallpa"],
      amenitiesTitle: "What is included",
      includedTitle: "Included services",
      detailsTitle: "Bungalow details",
      highlightsTitle: "Highlights",
      howItWorksTitle: "Booking information",
      checklist: [
        "Availability by date and category.",
        "Confirmation by the Wakaya team.",
        "Direct coordination for check-in and payment method.",
      ],
      requestLabel: "Send request",
      backLabel: "Back to results",
      venueLabel: "Bungalow",
      requestPanelTitle: "Availability enquiry",
      requestPanelCopy: "Select dates and send your contact details.",
      proofNote: "",
      referenceRateLabel: "Reference rate",
      availabilityLabel: "Reference availability",
    },
    services: {
      metadata: {
        title: "Services | Wakaya Ecolodge",
        description: "Discover Wakaya's pool, gardens, lagoon, restaurant, and tropical experiences.",
      },
      hero: {
        eyebrow: "Services",
        title: "Services",
        copy: "Real experiences and amenities for a clearer tropical stay.",
      },
      sectionEyebrow: "Experience",
      sectionTitle: "Lagoon, pool, restaurant, and more",
      sectionCopy:
        "Services for stays, visits, celebrations, and dining.",
      cards: [
        { title: "Pool and gardens", tag: "Relax", copy: "Open spaces for rest, reading, and calm throughout the stay." },
        { title: "Lagoon and tropical setting", tag: "Nature", copy: "A lush natural frame that sustains the atmosphere of the ecolodge." },
        { title: "Restaurant and support", tag: "Hospitality", copy: "Direct coordination with the Wakaya team for meals, timing, and stay support." },
        { title: "Escapes and full day", tag: "Experiences", copy: "Flexible options for short visits, celebrations, and weekends away." },
      ],
    },
    events: {
      metadata: {
        title: "Events | Wakaya Ecolodge",
        description: "Celebrations, corporate encounters, and special gatherings in a natural Wakaya setting.",
      },
      hero: {
        eyebrow: "Events",
        title: "Events",
        copy: "Celebrations, corporate moments, and special gatherings in a natural venue.",
      },
      venueBadge: "Natural venue",
      bodyTitle: "Wakaya as a tropical venue",
      bodyCopy:
        "A natural setting for meetings, intimate celebrations, and corporate activities.",
      checklist: [
        "Advance coordination with the Wakaya team.",
        "Capacity adapted to the format of the gathering.",
        "Connection with bungalows and lodge services.",
      ],
      imageAlt: "Natural event setting at Wakaya",
    },
    gallery: {
      metadata: {
        title: "Gallery | Wakaya Ecolodge",
        description: "Explore Wakaya's visual atmosphere through water, greenery, architecture, and tropical rest.",
      },
      hero: {
        eyebrow: "Gallery",
        title: "Gallery",
        copy: "Water, vegetation, architecture, and the lived rhythm of the place.",
      },
      sectionEyebrow: "Images",
      sectionTitle: "The atmosphere of the ecolodge",
      sectionCopy:
        "A short visual tour that reinforces the promise of the site without breaking the continuity of the broader public journey.",
      cards: [
        { title: "Tropical architecture", tag: "Space" },
        { title: "Gardens and greenery", tag: "Setting" },
        { title: "Warm bungalows", tag: "Stay" },
        { title: "Quiet corners", tag: "Atmosphere" },
      ],
    },
    publications: {
      metadata: {
        title: "Stories | Wakaya Ecolodge",
        description: "Stories, seasons, and shared experiences from Wakaya to continue discovering the lodge.",
      },
      hero: {
        eyebrow: "Stories",
        title: "Stories",
        copy: "Stories, seasons, and experiences shared from Wakaya.",
      },
      sectionEyebrow: "Reading",
      sectionTitle: "Wakaya highlights",
      sectionCopy:
        "A simple editorial layer to support discovery, context, and continuity across the public site.",
      ctaLabel: "Request more information",
      ctaEyebrow: "Explore more",
      ctaTitle: "Continue the public Wakaya journey.",
      ctaCopy:
        "From here you can return to bungalow categories, review services, or move directly into the contact flow without leaving the same visual system.",
      ctaButton: "View bungalows",
      items: [
        { slug: "bodas-en-wakaya", title: "Celebrations in a natural setting" },
        { slug: "full-day-pucallpa", title: "How to enjoy a Wakaya full-day experience" },
      ],
    },
  },
};

export function getPublicSiteContent(locale: PublicSiteLocale): PublicSiteContent {
  return CONTENT[locale];
}

function readFirstNumber(value: string, fallback: number) {
  const match = value.match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : fallback;
}

function formatCapacity(capacity: number, locale: PublicSiteLocale) {
  if (capacity === 1) {
    return locale === "en" ? "1 guest" : "1 persona";
  }
  return locale === "en" ? `${capacity} guests` : `${capacity} personas`;
}

function formatRate(nightlyRatePen: number, locale: PublicSiteLocale) {
  return locale === "en" ? `PEN ${nightlyRatePen}` : `S/. ${nightlyRatePen}`;
}

function formatArea(areaSqm: number, locale: PublicSiteLocale) {
  return locale === "en" ? `${areaSqm} sqm` : `${areaSqm} m2`;
}

export async function getLocalizedBungalows(locale: PublicSiteLocale): Promise<LocalizedBungalow[]> {
  const [operationalBungalows, publicContentItems] = await Promise.all([
    reservationStore.listBungalows(),
    reservationStore.listBungalowPublicContent(),
  ]);

  const operationalById = new Map(operationalBungalows.map((item) => [item.id, item] as const));
  const publicContentById = new Map(publicContentItems.map((item) => [item.bungalowId, item] as const));

  return publicBungalows
    .map((bungalow) => {
      const bungalowId = bungalow.bookingRequestBungalowId;
      const operational = bungalowId ? operationalById.get(bungalowId) : null;
      const publicContent = bungalowId ? publicContentById.get(bungalowId) : null;
      const localizedContent = publicContent?.localeContent[locale];
      const capacity = operational?.capacity ?? readFirstNumber(String(bungalow.capacity), 0);
      const nightlyRatePen = publicContent?.nightlyRatePen ?? readFirstNumber(String(bungalow.priceFrom), 0);
      const areaSqm = publicContent?.areaSqm ?? readFirstNumber("0", 0);

      return {
        ...bungalow,
        featuredOnHome: publicContent?.featuredOnHome ?? bungalow.featuredOnHome,
        image: publicContent?.heroImageUrl || bungalow.image,
        displayName: localizedContent?.displayName ?? getPublicBungalowLabel(bungalow),
        displayEyebrow: localizedContent?.displayEyebrow ?? bungalow.eyebrow,
        displayDescription: localizedContent?.displayDescription ?? bungalow.description,
        displayCapacity: capacity > 0 ? formatCapacity(capacity, locale) : bungalow.capacity,
        displayPriceFrom: nightlyRatePen > 0 ? formatRate(nightlyRatePen, locale) : bungalow.priceFrom,
        hasNightlyRate: nightlyRatePen > 0,
        displayTagline: localizedContent?.displayTagline ?? bungalow.eyebrow,
        displayLongDescription: localizedContent?.displayLongDescription ?? bungalow.description,
        displayArea: areaSqm > 0 ? formatArea(areaSqm, locale) : "",
        displayHighlights: localizedContent?.displayHighlights ?? [],
        displayAmenities: localizedContent?.displayAmenities ?? [],
        displayIncluded: localizedContent?.displayIncluded ?? [],
        gallery:
          publicContent && publicContent.galleryUrls.length > 0
            ? publicContent.galleryUrls
            : [publicContent?.heroImageUrl || bungalow.image],
      };
    })
    .sort((left, right) => {
      const leftSort = left.bookingRequestBungalowId
        ? publicContentById.get(left.bookingRequestBungalowId)?.sortOrder ?? 99
        : 99;
      const rightSort = right.bookingRequestBungalowId
        ? publicContentById.get(right.bookingRequestBungalowId)?.sortOrder ?? 99
        : 99;
      if (leftSort !== rightSort) {
        return leftSort - rightSort;
      }
      return left.displayName.localeCompare(right.displayName);
    });
}

export async function getLocalizedBungalow(locale: PublicSiteLocale, slug: string) {
  const bungalows = await getLocalizedBungalows(locale);
  return bungalows.find((bungalow) => bungalow.slug === slug) ?? null;
}
