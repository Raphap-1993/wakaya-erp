import type { HomeContentDocument } from "./types";

export const DEFAULT_HOME_CONTENT: HomeContentDocument = {
  schemaVersion: 2,
  slider: {
    autoplayMs: 4800,
    slides: [
      {
        id: "slide-hero",
        visible: true,
        order: 1,
        image: "https://wakayaecolodge.com/es/images/wakaya/gallery/gallery01.jpg",
        content: {
          en: {
            eyebrow: "Pucallpa · Peruvian Amazon",
            title: "Wakaya Ecolodge",
            subtitle: "An encounter with the magical",
            scrollLabel: "Explore",
          },
          es: {
            eyebrow: "Pucallpa · Amazonía peruana",
            title: "Wakaya Ecolodge",
            subtitle: "Un encuentro con lo Magico",
            scrollLabel: "Explorar",
          },
        },
        primaryCta: {
          id: "slide-hero-primary",
          label: {
            en: "Reserve now",
            es: "Reservar ahora",
          },
          destination: {
            kind: "internal",
            value: "contact",
          },
          style: "primary",
        },
        secondaryCta: {
          id: "slide-hero-secondary",
          label: {
            en: "Explore experiences",
            es: "Explorar experiencias",
          },
          destination: {
            kind: "internal",
            value: "services",
          },
          style: "secondary",
        },
        style: {
          headingSize: "display",
          bodySize: "large",
        },
      },
      {
        id: "slide-bungalows",
        visible: true,
        order: 2,
        image: "https://wakayaecolodge.com/es/images/wakaya/gallery/gallery09.jpg",
        content: {
          en: {
            eyebrow: "Accommodation",
            title: "Our Bungalows",
            subtitle: "Unique experiences",
            copy: "Wakaya was born from the dream of protecting a tropical retreat near Pucallpa. Every bungalow was built with certified native wood and low environmental impact.",
            scrollLabel: "Explore",
          },
          es: {
            eyebrow: "Alojamiento",
            title: "Nuestros Bungalows",
            subtitle: "Experiencias unicas",
            copy: "Wakaya nació del sueño de conservar un refugio tropical cerca de Pucallpa. Cada bungalow fue construido con madera nativa certificada y mínimo impacto ambiental.",
            scrollLabel: "Explorar",
          },
        },
        primaryCta: {
          id: "slide-bungalows-primary",
          label: {
            en: "See all",
            es: "Ver todos",
          },
          destination: {
            kind: "internal",
            value: "bungalows",
          },
          style: "primary",
        },
        secondaryCta: {
          id: "slide-bungalows-secondary",
          label: {
            en: "Discover our story",
            es: "Conoce nuestra historia",
          },
          destination: {
            kind: "internal",
            value: "about",
          },
          style: "secondary",
        },
        style: {
          headingSize: "display",
          bodySize: "regular",
        },
      },
      {
        id: "slide-closing",
        visible: true,
        order: 3,
        image: "https://wakayaecolodge.com/es/images/wakaya/gallery/gallery18.jpg",
        content: {
          en: {
            eyebrow: "Ready to escape",
            title: "Your jungle retreat is waiting",
            subtitle: "What our guests remember most",
            copy: "We are a refuge for guests who want to disconnect from noise and reconnect with what matters: the river, the birds, and a slower tropical rhythm.",
            scrollLabel: "Explore",
          },
          es: {
            eyebrow: "Listo para escapar",
            title: "Tu retiro en la selva te espera",
            subtitle: "Lo que dicen nuestros huespedes",
            copy: "Somos un refugio para quienes buscan desconectarse del ruido y reconectarse con lo esencial: el sonido del rio, el canto de las aves y un ritmo tropical mas humano.",
            scrollLabel: "Explorar",
          },
        },
        primaryCta: {
          id: "slide-closing-primary",
          label: {
            en: "Request reservation",
            es: "Solicitar reserva",
          },
          destination: {
            kind: "internal",
            value: "contact",
          },
          style: "primary",
        },
        secondaryCta: {
          id: "slide-closing-secondary",
          label: {
            en: "See all",
            es: "Ver todas",
          },
          destination: {
            kind: "internal",
            value: "services",
          },
          style: "secondary",
        },
        style: {
          headingSize: "display",
          bodySize: "regular",
        },
      },
    ],
  },
  sections: [
    {
      id: "section-booking-band",
      type: "booking-band",
      visible: true,
      order: 1,
      style: {
        headingSize: "large",
        bodySize: "regular",
      },
      content: {
        title: {
          en: "Plan your jungle stay",
          es: "Planifica tu escape a la selva",
        },
        helper: {
          en: "Check availability by date, bungalow category, and group size.",
          es: "Consulta disponibilidad por fecha, tipo de bungalow y cantidad de huéspedes.",
        },
        checkInLabel: {
          en: "Check in",
          es: "Check in",
        },
        checkOutLabel: {
          en: "Check out",
          es: "Check out",
        },
        guestsLabel: {
          en: "Guests",
          es: "Personas",
        },
        roomLabel: {
          en: "Room",
          es: "Habitacion",
        },
        allCategoriesLabel: {
          en: "All categories",
          es: "Todas las categorias",
        },
        guestOptions: {
          en: ["2 guests", "3 guests", "4 guests", "5 guests"],
          es: ["2 huespedes", "3 huespedes", "4 huespedes", "5 huespedes"],
        },
        submitHint: {
          en: "",
          es: "",
        },
      },
      ctas: [
        {
          id: "booking-band-primary",
          label: {
            en: "View options",
            es: "Ver opciones",
          },
          destination: {
            kind: "internal",
            value: "bungalows",
          },
          style: "primary",
        },
      ],
    },
    {
      id: "section-stats",
      type: "stats",
      visible: false,
      order: 2,
      style: {
        headingSize: "large",
        bodySize: "small",
      },
      content: {
        items: [
          {
            value: "50+",
            label: {
              en: "Hectares of jungle",
              es: "Hectareas de selva",
            },
          },
          {
            value: "8",
            label: {
              en: "Bungalows",
              es: "Bungalows",
            },
          },
          {
            value: "200+",
            label: {
              en: "Bird species",
              es: "Especies de aves",
            },
          },
          {
            value: "15+",
            label: {
              en: "Years of history",
              es: "Anos de historia",
            },
          },
        ],
      },
      ctas: [],
    },
    {
      id: "section-story",
      type: "story",
      visible: true,
      order: 3,
      style: {
        headingSize: "large",
        bodySize: "regular",
      },
      content: {
        eyebrow: {
          en: "Our story",
          es: "Nuestra historia",
        },
        title: {
          en: "Where the jungle transforms you",
          es: "Donde la selva te transforma",
        },
        paragraphs: {
          en: [
            "Wakaya was born from the dream of protecting a tropical retreat near Pucallpa. Every bungalow was built with certified native wood and low environmental impact.",
            "We are a refuge for guests who want to disconnect from noise and reconnect with what matters: the river, the birds, and a slower tropical rhythm.",
          ],
          es: [
            "Wakaya nació del sueño de conservar un refugio tropical cerca de Pucallpa. Cada bungalow fue construido con madera nativa certificada y mínimo impacto ambiental.",
            "Somos un refugio para quienes buscan desconectarse del ruido y reconectarse con lo esencial: el sonido del rio, el canto de las aves y un ritmo tropical mas humano.",
          ],
        },
        quote: {
          en: "Nature is not a place to visit. It is home.",
          es: "La naturaleza no es un lugar a visitar. Es el hogar.",
        },
        quoteSource: {
          en: "Gary Snyder",
          es: "Gary Snyder",
        },
        image: "https://wakayaecolodge.com/es/images/wakaya/aboutus/collage01.jpg",
      },
      ctas: [
        {
          id: "story-primary",
          label: {
            en: "Discover our story",
            es: "Conoce nuestra historia",
          },
          destination: {
            kind: "internal",
            value: "about",
          },
          style: "link",
        },
      ],
    },
    {
      id: "section-bungalows",
      type: "bungalows",
      visible: true,
      order: 4,
      style: {
        headingSize: "large",
        bodySize: "regular",
      },
      content: {
        eyebrow: {
          en: "Accommodation",
          es: "Alojamiento",
        },
        title: {
          en: "Our Bungalows",
          es: "Nuestros Bungalows",
        },
        detailLabel: {
          en: "View details",
          es: "Ver detalles",
        },
        visibleCount: 4,
      },
      ctas: [
        {
          id: "bungalows-primary",
          label: {
            en: "See all",
            es: "Ver todos",
          },
          destination: {
            kind: "internal",
            value: "bungalows",
          },
          style: "link",
        },
      ],
    },
    {
      id: "section-quote-band",
      type: "quote-band",
      visible: true,
      order: 5,
      style: {
        headingSize: "display",
        bodySize: "regular",
      },
      content: {
        quote: {
          en: "Drive stress away. Wake up the soul.",
          es: "Ahuyentar el estres. Despertar el alma.",
        },
        source: {
          en: "Pucallpa · Peruvian Amazon",
          es: "Pucallpa · Amazonía peruana",
        },
        image: "https://wakayaecolodge.com/es/images/wakaya/gallery/gallery09.jpg",
      },
      ctas: [],
    },
    {
      id: "section-experiences",
      type: "experiences",
      visible: true,
      order: 6,
      style: {
        headingSize: "large",
        bodySize: "regular",
      },
      content: {
        eyebrow: {
          en: "Experiences",
          es: "Vivencias",
        },
        title: {
          en: "Unique experiences",
          es: "Experiencias unicas",
        },
        visibleCount: 3,
      },
      experienceIds: ["exp_07", "exp_09", "exp_02"],
      ctas: [
        {
          id: "experiences-primary",
          label: {
            en: "See all",
            es: "Ver todas",
          },
          destination: {
            kind: "internal",
            value: "services",
          },
          style: "link",
        },
      ],
    },
    {
      id: "section-testimonials",
      type: "testimonials",
      visible: true,
      order: 7,
      style: {
        headingSize: "large",
        bodySize: "regular",
      },
      content: {
        eyebrow: {
          en: "Voices",
          es: "Voces",
        },
        title: {
          en: "What our guests remember most",
          es: "Lo que dicen nuestros huespedes",
        },
        items: [
          {
            name: "Camila Vargas",
            origin: {
              en: "Lima, Peru",
              es: "Lima, Peru",
            },
            quote: {
              en: "The bungalows feel warm and real, and the team makes the whole arrival feel carefully hosted rather than transactional.",
              es: "Los bungalows se sienten calidos y reales, y la llegada fue mucho mas cuidada porque todo se coordino con personas.",
            },
          },
          {
            name: "Thomas & Sophie",
            origin: {
              en: "Lyon, France",
              es: "Lyon, Francia",
            },
            quote: {
              en: "The calm, the trees, and the silence at night made Wakaya feel more memorable than any standard retreat we had tried.",
              es: "La calma, la vegetacion y el silencio nocturno hicieron que Wakaya se sintiera mas memorable que un retiro estandar.",
            },
          },
          {
            name: "Mariela Paredes",
            origin: {
              en: "Cusco, Peru",
              es: "Cusco, Peru",
            },
            quote: {
              en: "The Wakaya team answered clearly and made every detail of the stay easy to coordinate.",
              es: "El equipo Wakaya respondió con claridad y facilitó cada detalle de la estadía.",
            },
          },
        ],
      },
      ctas: [],
    },
    {
      id: "section-closing",
      type: "closing-cta",
      visible: true,
      order: 8,
      style: {
        headingSize: "display",
        bodySize: "regular",
      },
      content: {
        eyebrow: {
          en: "Ready to escape",
          es: "Listo para escapar",
        },
        title: {
          en: "Your jungle retreat is waiting",
          es: "Tu retiro en la selva te espera",
        },
        image: "https://wakayaecolodge.com/es/images/wakaya/gallery/gallery18.jpg",
      },
      ctas: [
        {
          id: "closing-primary",
          label: {
            en: "Request reservation",
            es: "Solicitar reserva",
          },
          destination: {
            kind: "internal",
            value: "contact",
          },
          style: "primary",
        },
      ],
    },
  ],
};
