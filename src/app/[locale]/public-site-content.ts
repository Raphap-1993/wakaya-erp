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

const publicBungalowCatalogOrder = new Map(
  publicBungalows.map((bungalow, index) => [bungalow.bookingRequestBungalowId, index] as const),
);

export type PublicSitePageLabels = {
  nav: Array<{ key: string; label: string; visible?: boolean }>;
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

export type PublicSiteHomeContent = {
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

export type PublicSitePageSection = {
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

export type PublicSiteContent = {
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
    formTitle: string;
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
    perNightLabel: string;
  };
  bungalowDetail: {
    metadataKeywords: string[];
    breadcrumbLabel: string;
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
    ctaTitle: string;
    ctaCopy: string;
    ctaLabel: string;
    detailLabel: string;
    includesLabel: string;
    recommendationsLabel: string;
    closeLabel: string;
    cards: Array<{ title: string; tag: string; copy: string }>;
  };
  events: PublicSitePageSection & {
    venueBadge: string;
    bodyTitle: string;
    bodyCopy: string;
    checklist: string[];
    imageAlt: string;
    proposalCopy: string;
    proposalCtaLabel: string;
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
    items: Array<{ slug: string; title: string; meta: string; copy: string }>;
  };
  petFriendly: PublicSitePageSection & {
    sections: Array<{ title: string; copy: string; bullets: string[] }>;
    ctaTitle: string;
    ctaCopy: string;
    ctaLabel: string;
  };
  complaints: PublicSitePageSection & {
    formTitle: string;
    formCopy: string;
    cards: Array<{ title: string; copy: string; bullets: string[] }>;
  };
};

export const DEFAULT_PUBLIC_SITE_CONTENT: Record<PublicSiteLocale, PublicSiteContent> = {
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
        { key: "about", label: "Nosotros", visible: false },
        { key: "bungalows", label: "Habitaciones" },
        { key: "services", label: "Servicios" },
        { key: "events", label: "Eventos", visible: false },
        { key: "gallery", label: "Galería" },
        { key: "publications", label: "Publicaciones", visible: false },
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
        description: "Planifica tu estadía con Wakaya con atención directa del equipo de reservas.",
        keywords: ["contacto wakaya", "reservas wakaya", "pucallpa", "ecolodge"],
      },
      hero: {
        eyebrow: "Reservas",
        title: "Contáctanos",
        copy: "Estamos aquí para hacer realidad tu experiencia",
      },
      introTitle: "Hablemos",
      introCopy: "Para reservas, consultas y grupos escríbenos. Respondemos en menos de 24 horas.",
      formTitle: "Planifica tu estadía",
      checklist: [
        "Disponibilidad por fecha y categoría.",
        "Confirmación por el equipo Wakaya.",
        "Pucallpa · Peru",
        "wakayaecolodge.com",
        "Atencion personalizada del equipo Wakaya",
      ],
      form: {
        guestName: "Nombre",
        guestEmail: "Email",
        guestPhone: "Telefono",
        requestedCheckIn: "Check-in",
        requestedCheckOut: "Check-out",
        requestedGuests: "Huéspedes",
        requestedBungalowType: "Categoria preferida",
        notes: "Mensaje",
        notesPlaceholder: "Cuéntanos qué tipo de experiencia buscas...",
        noPreference: "Sin preferencia",
        submitLabel: "Enviar solicitud",
        guestOptions: ["1 persona", "2 personas", "3 personas", "4 personas", "5 personas", "6 personas"],
      },
      visualBadge: "Reservas y consultas",
      visualAlt: "Canales de contacto de Wakaya",
    },
    bungalows: {
      metadata: {
        title: "Bungalows | Wakaya Ecolodge",
        description: "Bungalows de madera nativa dentro del paisaje selvático de Wakaya.",
        keywords: ["bungalows", "wakaya ecolodge", "pucallpa", "habitaciones"],
      },
      hero: {
        eyebrow: "Alojamiento",
        title: "Nuestros Bungalows",
        copy: "Bungalows de madera nativa rodeados de naturaleza tropical",
      },
      resultsMetaPrefix: "Categoria:",
      resultsMetaCategory: "Todas las categorias",
      allCategories: "Todas las categorias",
      noGuests: "Sin huespedes",
      emptyTitle: "No encontramos coincidencias con esos filtros.",
      emptyCopy: "Ajusta fechas o categoria para revisar mas opciones referenciales.",
      viewDetailLabel: "Ver detalles y reservar",
      perNightLabel: "/noche",
    },
    bungalowDetail: {
      metadataKeywords: ["bungalows", "wakaya ecolodge", "pucallpa"],
      breadcrumbLabel: "Bungalows",
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
      ctaTitle: "Contacta a Wakaya",
      ctaCopy: "Indícanos el servicio y la fecha que necesitas.",
      ctaLabel: "Contactar",
      detailLabel: "Ver detalle",
      includesLabel: "Incluye",
      recommendationsLabel: "Recomendaciones",
      closeLabel: "Cerrar",
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
      proposalCopy: "Confirmamos contigo las fechas, la capacidad y cada detalle final antes de cerrar la propuesta del evento.",
      proposalCtaLabel: "Solicitar propuesta",
    },
    gallery: {
      metadata: {
        title: "Galería | Wakaya Ecolodge",
        description: "Un recorrido visual por Wakaya y su paisaje tropical.",
      },
      hero: {
        eyebrow: "Imágenes",
        title: "Galería",
        copy: "La belleza de Wakaya en imágenes",
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
        { slug: "bodas-en-wakaya", title: "Celebraciones en un entorno natural", meta: "Editorial · Eventos", copy: "Como una celebracion mas intima puede mantenerse alineada con la calma y el entorno tropical de Wakaya." },
        { slug: "full-day-pucallpa", title: "Como vivir un Full Day en Wakaya", meta: "Guia · Full day", copy: "Una visita corta para disfrutar del paisaje, las instalaciones y la hospitalidad de Wakaya." },
        { slug: "que-bungalow-encaja", title: "Que bungalow encaja mejor con tu plan", meta: "Comparativa · Bungalows", copy: "Una lectura rapida para entender categoria, atmosfera y elegir mejor antes de enviar tu solicitud." },
      ],
    },
    petFriendly: {
      metadata: { title: "Pet Friendly | Wakaya Ecolodge", description: "Viaja a Wakaya Ecolodge con tu mascota y revisa las reglas de casa antes de llegar." },
      hero: { eyebrow: "Viajen juntos", title: "Pet Friendly", copy: "Wakaya recibe mascotas pequeñas y medianas cuando la estadía se coordina con anticipación." },
      sections: [
        { title: "Una bienvenida cálida para tu compañero", copy: "Si tu mascota está acostumbrada a viajar con calma, Wakaya puede ser un gran lugar para compartir el viaje. Solo pedimos algunas reglas simples para cuidar la tranquilidad de todos.", bullets: ["Confirma tu mascota antes de llegar para recomendarte el bungalow más conveniente.", "Trae correa, cama y artículos de limpieza para toda la estadía.", "Mantén a tu mascota supervisada en las áreas compartidas."] },
        { title: "Lo que ayuda a que todo fluya bien", copy: "Podemos sugerirte el bungalow más práctico según el tamaño, la energía de tu mascota y la ocupación de las fechas elegidas.", bullets: ["Por seguridad, una conducta agresiva o molestias repetidas pueden obligarnos a cortar la estadía de la mascota.", "Una limpieza extraordinaria o daños pueden generar un cargo adicional.", "Si viajas con más de una mascota, consúltanos antes de reservar."] },
      ],
      ctaTitle: "¿Quieres viajar con tu mascota?",
      ctaCopy: "Compártenos tus fechas y cuéntanos un poco de tu compañero. Te orientamos para elegir la mejor opción y mantener una estadía tranquila.",
      ctaLabel: "Planificar mi estadía",
    },
    complaints: {
      metadata: { title: "Libro de Reclamaciones | Wakaya Ecolodge", description: "Ruta pública y clara para compartir un reclamo o queja relacionada con tu experiencia en Wakaya." },
      hero: { eyebrow: "Atención al huésped", title: "Libro de Reclamaciones", copy: "Si necesitas reportar un inconveniente sobre tu estadía o el servicio, estamos listos para recibirlo con respeto y seguimiento." },
      formTitle: "Registra tu caso en línea",
      formCopy: "Completa los datos básicos de tu caso y conserva la constancia que te mostraremos al terminar.",
      cards: [
        { title: "Cómo presentar tu reclamo", copy: "Si quieres dejar tu caso documentado de inmediato, usa el formulario en línea. También puedes escribirnos o pedir orientación por los mismos canales de reserva.", bullets: ["Correo: reservas@wakayaecolodge.com", "WhatsApp: +51 961 508 813 · Teléfono: +51 977 419 468", "Horario: lunes a domingo, de 7:00 a 20:00"] },
        { title: "Respuesta", copy: "Nuestro equipo revisa cada caso de forma directa. Si necesitamos más información, nos comunicaremos contigo.", bullets: ["Recibirás una constancia pública en pantalla.", "Incluye fotos o comprobantes solo si ayudan a explicar el caso.", "Plazo estimado de respuesta: hasta 15 días hábiles."] },
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
        { key: "about", label: "About", visible: false },
        { key: "bungalows", label: "Rooms" },
        { key: "services", label: "Services" },
        { key: "events", label: "Events", visible: false },
        { key: "gallery", label: "Gallery" },
        { key: "publications", label: "Stories", visible: false },
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
        description: "Plan your stay with Wakaya with direct support from the reservations team.",
        keywords: ["wakaya contact", "wakaya reservations", "pucallpa", "ecolodge"],
      },
      hero: {
        eyebrow: "Reservations",
        title: "Contact us",
        copy: "We are here to make your experience happen",
      },
      introTitle: "Let's talk",
      introCopy: "For reservations, questions, and groups write to us. We reply in less than 24 hours.",
      formTitle: "Plan your stay",
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
        requestedCheckIn: "Check-in",
        requestedCheckOut: "Check-out",
        requestedGuests: "Guests",
        requestedBungalowType: "Preferred category",
        notes: "Message",
        notesPlaceholder: "Tell us what kind of experience you are looking for...",
        noPreference: "No preference",
        submitLabel: "Send request",
        guestOptions: ["1 guest", "2 guests", "3 guests", "4 guests", "5 guests", "6 guests"],
      },
      visualBadge: "Bookings and enquiries",
      visualAlt: "Wakaya contact and reservations channels",
    },
    bungalows: {
      metadata: {
        title: "Bungalows | Wakaya Ecolodge",
        description: "Native-wood bungalows within the jungle landscape of Wakaya.",
        keywords: ["bungalows", "wakaya ecolodge", "pucallpa", "room categories"],
      },
      hero: {
        eyebrow: "Accommodation",
        title: "Our Bungalows",
        copy: "Native-wood bungalows surrounded by tropical nature",
      },
      resultsMetaPrefix: "Category:",
      resultsMetaCategory: "All categories",
      allCategories: "All categories",
      noGuests: "No guests",
      emptyTitle: "We could not find a match for those filters.",
      emptyCopy: "Adjust your dates or category to review more reference options.",
      viewDetailLabel: "View details and reserve",
      perNightLabel: "/night",
    },
    bungalowDetail: {
      metadataKeywords: ["bungalows", "wakaya ecolodge", "pucallpa"],
      breadcrumbLabel: "Bungalows",
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
      ctaTitle: "Contact Wakaya",
      ctaCopy: "Tell us the service and date you need.",
      ctaLabel: "Contact us",
      detailLabel: "View details",
      includesLabel: "Includes",
      recommendationsLabel: "Recommendations",
      closeLabel: "Close",
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
      proposalCopy: "We confirm dates, capacity, and every final detail with you before closing the event proposal.",
      proposalCtaLabel: "Request proposal",
    },
    gallery: {
      metadata: {
        title: "Gallery | Wakaya Ecolodge",
        description: "A visual journey through Wakaya and its tropical landscape.",
      },
      hero: {
        eyebrow: "Images",
        title: "Gallery",
        copy: "The beauty of Wakaya in images",
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
        { slug: "bodas-en-wakaya", title: "Celebrations in a natural setting", meta: "Editorial · Events", copy: "How a more intimate celebration can feel aligned with Wakaya's calm and tropical setting." },
        { slug: "full-day-pucallpa", title: "How to enjoy a Wakaya full-day experience", meta: "Guide · Full day", copy: "A shorter visit with access to Wakaya's landscape, facilities, and hospitality." },
        { slug: "que-bungalow-encaja", title: "Which bungalow fits your stay best", meta: "Comparison · Bungalows", copy: "A faster read to understand category, atmosphere, and fit before sending the final request." },
      ],
    },
    petFriendly: {
      metadata: { title: "Pet Friendly | Wakaya Ecolodge", description: "Travel to Wakaya Ecolodge with your pet and review the friendly house rules before arrival." },
      hero: { eyebrow: "Travel together", title: "Pet Friendly", copy: "Wakaya welcomes small and medium pets when the stay is coordinated in advance." },
      sections: [
        { title: "A warm welcome for your companion", copy: "If your pet is used to travelling calmly, Wakaya can be a beautiful place to share the trip. We only ask for a few simple rules so every guest enjoys the same peaceful atmosphere.", bullets: ["Confirm your pet before arrival so we can recommend the right bungalow.", "Bring a leash, bed, and cleaning essentials for the full stay.", "Please keep your pet supervised in shared areas."] },
        { title: "What helps the stay go smoothly", copy: "We may suggest the most practical bungalow based on your pet's size, energy level, and the occupancy of the dates you chose.", bullets: ["For safety, aggressive behavior or repeated disturbance may require ending the pet stay.", "Any unusual cleaning or damage may generate an additional charge.", "If you are travelling with more than one pet, please ask us first."] },
      ],
      ctaTitle: "Want to travel with your pet?",
      ctaCopy: "Send us your dates and tell us a bit about your companion. We will guide you to the best option for a calm stay.",
      ctaLabel: "Plan my stay",
    },
    complaints: {
      metadata: { title: "Complaints Book | Wakaya Ecolodge", description: "A clear public route to share a complaint or service claim related to your Wakaya stay." },
      hero: { eyebrow: "Guest care", title: "Complaints Book", copy: "If you need to report an issue related to your stay or service, we are ready to receive it with respect and follow-up." },
      formTitle: "Submit your case online",
      formCopy: "Complete the basic details of your case and keep the tracking code we will show you right away.",
      cards: [
        { title: "How to submit a claim", copy: "If you want to leave your case documented right away, use the online form. You can also contact us first through the same reservation channels if you need guidance.", bullets: ["Email: reservas@wakayaecolodge.com", "WhatsApp: +51 961 508 813 · Phone: +51 977 419 468", "Hours: Monday to Sunday, 7:00 to 20:00"] },
        { title: "Response", copy: "Our team reviews each case directly. If more information is required, we will contact you.", bullets: ["You will receive a public tracking code on screen.", "Include photos or proof only if they help explain the case.", "Expected response time: up to 15 business days."] },
      ],
    },
  },
};

export function getPublicSiteContent(locale: PublicSiteLocale): PublicSiteContent {
  return DEFAULT_PUBLIC_SITE_CONTENT[locale];
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

export function buildBungalowGallery(
  heroImageUrl: string | null | undefined,
  galleryUrls: string[],
  fallbackImageUrl: string,
) {
  const images = [...new Set([heroImageUrl?.trim() ?? "", ...galleryUrls].filter(Boolean))];
  return images.length > 0 ? images : [fallbackImageUrl];
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
        gallery: buildBungalowGallery(
          publicContent?.heroImageUrl,
          publicContent?.galleryUrls ?? [],
          bungalow.image,
        ),
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

      const leftCatalogOrder = publicBungalowCatalogOrder.get(left.bookingRequestBungalowId) ?? Number.MAX_SAFE_INTEGER;
      const rightCatalogOrder = publicBungalowCatalogOrder.get(right.bookingRequestBungalowId) ?? Number.MAX_SAFE_INTEGER;
      if (leftCatalogOrder !== rightCatalogOrder) {
        return leftCatalogOrder - rightCatalogOrder;
      }

      return left.displayName.localeCompare(right.displayName);
    });
}

export async function getLocalizedBungalow(locale: PublicSiteLocale, slug: string) {
  const bungalows = await getLocalizedBungalows(locale);
  return bungalows.find((bungalow) => bungalow.slug === slug) ?? null;
}
