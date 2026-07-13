import type { PublicSiteLocale } from "./public-site-locale";

export const publicCompanyAssets = {
  aboutReception: "/images/wakaya/company/about-recepcion.jpg",
  aboutNature: "/images/wakaya/company/about-naturaleza.jpg",
  reviewMichael: "/images/wakaya/company/review-michael.jpg",
  reviewKetty: "/images/wakaya/company/review-ketty.jpg",
  reviewGuest: "/images/wakaya/company/review-huesped.jpg",
  quoteIcon: "/images/wakaya/company/quote.png",
} as const;

type CompanyAboutValue = {
  title: string;
  copy: string;
};

type CompanyFaqItem = {
  question: string;
  answer: string;
  steps?: string[];
};

type CompanyTestimonial = {
  author: string;
  country: string;
  quote: string;
  image: string;
};

type CompanyPolicySection = {
  id: string;
  title: string;
  copy: string;
};

type CompanyPageHero = {
  eyebrow: string;
  title: string;
  copy: string;
};

type CompanyAboutContent = {
  metaTitle: string;
  metaDescription: string;
  hero: CompanyPageHero;
  storyDate: string;
  storyTitle: string;
  storyLead: string;
  storyParagraphs: string[];
  highlights: string[];
  purposeTitle: string;
  purposeCopy: string;
  meaningTitle: string;
  meaningCopy: string;
  valuesTitle: string;
  valuesLead: string;
  values: CompanyAboutValue[];
  ctaTitle: string;
  ctaCopy: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
};

type CompanyFaqContent = {
  metaTitle: string;
  metaDescription: string;
  hero: CompanyPageHero;
  introTitle: string;
  introCopy: string;
  items: CompanyFaqItem[];
  ctaTitle: string;
  ctaCopy: string;
  ctaLabel: string;
};

type CompanyTestimonialsContent = {
  metaTitle: string;
  metaDescription: string;
  hero: CompanyPageHero;
  introTitle: string;
  introCopy: string;
  items: CompanyTestimonial[];
};

type CompanyPoliciesContent = {
  metaTitle: string;
  metaDescription: string;
  hero: CompanyPageHero;
  introTitle: string;
  introCopy: string;
  termsTitle: string;
  termsCopy: string;
  termsSections: CompanyPolicySection[];
  privacyTitle: string;
  privacyCopy: string;
  privacySections: CompanyPolicySection[];
  ctaTitle: string;
  ctaCopy: string;
  ctaLabel: string;
};

export type PublicCompanyContent = {
  about: CompanyAboutContent;
  faq: CompanyFaqContent;
  testimonials: CompanyTestimonialsContent;
  policies: CompanyPoliciesContent;
};

const CONTENT: Record<PublicSiteLocale, PublicCompanyContent> = {
  es: {
    about: {
      metaTitle: "Nosotros | Wakaya Ecolodge",
      metaDescription:
        "Historia, propósito, significado y valores de Wakaya Ecolodge en Pucallpa.",
      hero: {
        eyebrow: "Empresa · Wakaya Ecolodge",
        title: "Nosotros",
        copy: "La historia, el propósito y la esencia de Wakaya como refugio natural en Pucallpa.",
      },
      storyDate: "23 de junio de 2019",
      storyTitle: "Un paraíso en el corazón de Pucallpa",
      storyLead:
        "Wakaya Ecolodge inició sus actividades en 2019 y se ubica a pocos minutos del aeropuerto, de los principales centros comerciales y de la ciudad.",
      storyParagraphs: [
        "Somos un espacio creado para relajarse y disfrutar de la naturaleza, para compartir en familia, en pareja o con amigos, descansar del ruido de la ciudad y pasar momentos inolvidables en armonía con el entorno.",
        "Integrado en un espacio privilegiado, nuestro lodge invita a vivir una experiencia en contacto con la naturaleza: aromas naturales, canto de aves, paseos alrededor de la laguna y atardeceres que marcan el ritmo de la estadía.",
      ],
      highlights: [
        "Aire puro",
        "Armonía con el medio ambiente",
        "Paisajes espectaculares",
        "Desconexión total",
        "Recargar energía",
        "Amor a la naturaleza",
      ],
      purposeTitle: "Tenemos como propósito",
      purposeCopy:
        "Ser un ecolodge que ofrece experiencias únicas con estándares de calidad y mejoras continuas, para clientes que disfrutan del contacto con la naturaleza, el relax, la hospitalidad y el bienestar en un ambiente mágico y privilegiado.",
      meaningTitle: "¿Qué significa la palabra Wakaya?",
      meaningCopy:
        "Wakaya es una palabra procedente de la Amazonía peruana, de la tribu Kukama Kukamiria, y alude al intercambio: dar algo a cambio de otra cosa, incluidos los conocimientos y saberes que se comparten a través del diálogo.",
      valuesTitle: "Nuestros valores",
      valuesLead:
        "La experiencia Wakaya nace de la hospitalidad, el respeto por el entorno y el trabajo conjunto con quienes hacen posible cada estadía.",
      values: [
        {
          title: "Integridad",
          copy:
            "La honestidad, la ética y el respeto hacia todos los elementos que nos rodean marcan nuestro día a día.",
        },
        {
          title: "Respeto por la naturaleza",
          copy:
            "La preservación del medio ambiente es parte central de nuestro legado y de la manera en que recibimos a cada huésped.",
        },
        {
          title: "Trabajo en equipo",
          copy:
            "Creemos en rodearnos de personas comprometidas para sostener una atención cálida, humana y consistente.",
        },
      ],
      ctaTitle: "Conoce Wakaya",
      ctaCopy: "Consulta nuestras preguntas frecuentes o comunícate con el equipo Wakaya.",
      primaryCtaLabel: "Preguntas frecuentes",
      secondaryCtaLabel: "Hablar con Wakaya",
    },
    faq: {
      metaTitle: "Preguntas frecuentes | Wakaya Ecolodge",
      metaDescription:
        "Respuestas claras sobre reservas, confirmaciones, familias y coordinación de estadías en Wakaya Ecolodge.",
      hero: {
        eyebrow: "Empresa · Ayuda al huésped",
        title: "Preguntas frecuentes",
        copy: "Respuestas cortas para entender cómo reservar, confirmar y preparar tu estadía en Wakaya.",
      },
      introTitle: "Lo esencial antes de escribirnos",
      introCopy: "",
      items: [
        {
          question: "¿Cómo se reserva un hotel?",
          answer:
            "Las reservas se confirman según la disponibilidad de la categoría y las fechas solicitadas.",
        },
        {
          question: "¿El precio mostrado es el precio final?",
          answer:
            "El monto referencial considera noches y personas indicadas. Si tu grupo cambia o necesitas condiciones especiales, el equipo confirma el total final antes del pago.",
        },
        {
          question: "¿Puedo hacer la reserva por teléfono o WhatsApp?",
          answer:
            "Sí. Puedes solicitar una reserva por teléfono, correo, WhatsApp o mediante el formulario web.",
        },
        {
          question: "¿Qué hago si viajo con niños o necesito una cuna?",
          answer:
            "Escríbenos antes de confirmar tu estadía. Así validamos la categoría adecuada, la cantidad de huéspedes y cualquier requerimiento adicional para la habitación.",
        },
        {
          question: "¿Cómo sé si mi reserva quedó confirmada?",
          answer:
            "Wakaya confirma la reserva después de validar disponibilidad, fechas, huéspedes y condiciones de pago.",
        },
        {
          question: "¿Puedo modificar o ampliar mis fechas?",
          answer:
            "Sí, siempre que haya disponibilidad. Comunica el cambio con anticipación para confirmar el bungalow o una alternativa.",
        },
      ],
      ctaTitle: "¿Tu caso no aparece aquí?",
      ctaCopy:
        "Incluye tus fechas, cantidad de viajeros y cualquier requerimiento especial.",
      ctaLabel: "Ir a contacto",
    },
    testimonials: {
      metaTitle: "Testimonios | Wakaya Ecolodge",
      metaDescription:
        "Comentarios de huéspedes sobre la atención, el ambiente natural y la experiencia en Wakaya.",
      hero: {
        eyebrow: "Empresa · Huéspedes",
        title: "Testimonios",
        copy: "Una muestra breve de cómo recuerdan la experiencia quienes ya pasaron por Wakaya.",
      },
      introTitle: "Voces de huéspedes",
      introCopy: "",
      items: [
        {
          author: "Michael C.",
          country: "Perú",
          quote: "Un placentero escape de la ciudad. Excelente atención y amabilidad.",
          image: publicCompanyAssets.reviewMichael,
        },
        {
          author: "Ketty P.",
          country: "Australia",
          quote: "Fantástico. El trato y la cordialidad de las personas que trabajan ahí.",
          image: publicCompanyAssets.reviewKetty,
        },
        {
          author: "Michael C.",
          country: "Alemania",
          quote: "Un lugar muy acogedor y familiar, la comida muy rica y la atención muy buena.",
          image: publicCompanyAssets.reviewGuest,
        },
      ],
    },
    policies: {
      metaTitle: "Políticas del hotel | Wakaya Ecolodge",
      metaDescription:
        "Resumen público de términos, estadía, reservas y tratamiento de datos personales en Wakaya Ecolodge.",
      hero: {
        eyebrow: "Empresa · Términos y privacidad",
        title: "Políticas del hotel",
        copy: "Condiciones de reserva, estadía y tratamiento de datos personales.",
      },
      introTitle: "Términos, estadía y privacidad en una sola lectura",
      introCopy: "",
      termsTitle: "Términos y condiciones",
      termsCopy: "Condiciones aplicables a reservas, pagos, cancelaciones y estadías.",
      termsSections: [
        {
          id: "reservations",
          title: "Política de reservas",
          copy:
            "La reserva se coordina entre Wakaya y el huésped según disponibilidad real. El registro final requiere identificación del huésped y puede pedir adelanto o confirmación previa antes del check-in.",
        },
        {
          id: "payments",
          title: "Pagos y adelantos",
          copy:
            "El pago puede realizarse por efectivo, tarjeta, transferencia u otros medios coordinados por Wakaya. Los importes finales y los plazos se confirman antes del pago.",
        },
        {
          id: "cancellations",
          title: "Cancelaciones y no-show",
          copy:
            "Los cambios y cancelaciones deben comunicarse con anticipación. Si no se presenta el huésped y no hay aviso previo, Wakaya puede aplicar cargos asociados a no-show según la coordinación realizada.",
        },
        {
          id: "stay-rules",
          title: "Reglas de estadía",
          copy:
            "El hotel puede solicitar documento de identidad al ingreso, mantener reglas de convivencia y limitar el acceso de personas no registradas a habitaciones o bungalows.",
        },
        {
          id: "hotel-rights",
          title: "Derechos y obligaciones",
          copy:
            "Wakaya presta el servicio sujeto a disponibilidad, mientras que el huésped se compromete a respetar instalaciones, horarios, capacidad y normas de convivencia durante su permanencia.",
        },
      ],
      privacyTitle: "Tratamiento de datos personales",
      privacyCopy: "Cómo Wakaya solicita, utiliza y protege los datos personales.",
      privacySections: [
        {
          id: "privacy-purpose",
          title: "Objetivo y finalidad",
          copy:
            "Wakaya utiliza los datos personales compartidos por formularios y canales de reserva para responder consultas, coordinar estadías y mantener comunicación relacionada con sus servicios.",
        },
        {
          id: "privacy-legal",
          title: "Base legal y resguardo",
          copy:
            "Wakaya aplica la normativa peruana de protección de datos personales y medidas de seguridad y confidencialidad.",
        },
        {
          id: "privacy-information",
          title: "Información que puede solicitarse",
          copy:
            "Dependiendo del servicio, Wakaya puede pedir nombres, documento de identidad, nacionalidad, datos de contacto, información del viaje y datos mínimos del titular del pago.",
        },
        {
          id: "privacy-consent",
          title: "Tratamiento y consentimiento",
          copy:
            "Los datos se tratan para fines determinados y compatibles con la reserva o consulta del huésped. El acceso a esa información se limita al personal que la necesita para continuar la atención.",
        },
      ],
      ctaTitle: "¿Necesitas aclarar algo antes de reservar?",
      ctaCopy:
        "Consulta cualquier duda sobre pagos, reglas de estadía o datos de tu reserva.",
      ctaLabel: "Hablar con Wakaya",
    },
  },
  en: {
    about: {
      metaTitle: "About | Wakaya Ecolodge",
      metaDescription:
        "History, purpose, meaning, and values behind Wakaya Ecolodge in Pucallpa.",
      hero: {
        eyebrow: "Company · Wakaya Ecolodge",
        title: "About",
        copy: "The story, purpose, and spirit behind Wakaya as a natural retreat in Pucallpa.",
      },
      storyDate: "June 23, 2019",
      storyTitle: "A paradise in the heart of Pucallpa",
      storyLead:
        "Wakaya Ecolodge began operations in 2019 and is located just a few minutes from the airport, main commercial areas, and the city.",
      storyParagraphs: [
        "We created Wakaya as a place to relax and enjoy nature with family, as a couple, or with friends, stepping away from city noise and reconnecting with a calmer rhythm.",
        "Set in a privileged natural environment, the lodge invites guests to experience birdsong, tropical scents, lagoon walks, and sunsets that shape the pace of the stay.",
      ],
      highlights: [
        "Fresh air",
        "Harmony with nature",
        "Scenic landscapes",
        "Complete disconnection",
        "Energy reset",
        "Love for the jungle",
      ],
      purposeTitle: "Our purpose",
      purposeCopy:
        "To be an ecolodge that offers unique experiences with quality standards and continuous improvement for guests who value nature, relaxation, hospitality, and wellbeing.",
      meaningTitle: "What does Wakaya mean?",
      meaningCopy:
        "Wakaya is a word from the Peruvian Amazon and the Kukama Kukamiria tradition. It refers to exchange: giving something in return for something else, including shared knowledge and dialogue.",
      valuesTitle: "Our values",
      valuesLead:
        "The Wakaya experience is built on hospitality, respect for the environment, and teamwork across everyone who makes each stay possible.",
      values: [
        {
          title: "Integrity",
          copy:
            "Honesty, ethics, and respect for everything around us shape the way we work every day.",
        },
        {
          title: "Respect for nature",
          copy:
            "Environmental preservation is part of the legacy we want to leave through every guest experience.",
        },
        {
          title: "Teamwork",
          copy:
            "We believe in working with committed people who can sustain a warm, human, and consistent stay experience.",
        },
      ],
      ctaTitle: "Discover Wakaya",
      ctaCopy: "Review frequently asked questions or contact the Wakaya team.",
      primaryCtaLabel: "Frequently asked questions",
      secondaryCtaLabel: "Talk to Wakaya",
    },
    faq: {
      metaTitle: "Frequently asked questions | Wakaya Ecolodge",
      metaDescription:
        "Clear answers about bookings, confirmations, families, and stay coordination at Wakaya Ecolodge.",
      hero: {
        eyebrow: "Company · Guest help",
        title: "Frequently asked questions",
        copy: "Short answers to understand how booking, confirmation, and stay coordination work at Wakaya.",
      },
      introTitle: "What matters most before you write to us",
      introCopy: "",
      items: [
        {
          question: "How do I book a stay?",
          answer:
            "Reservations are confirmed according to availability for the requested category and dates.",
        },
        {
          question: "Is the displayed price the final price?",
          answer:
            "The reference amount reflects the nights and guests you selected. If your group changes or needs something special, the team confirms the final total before payment.",
        },
        {
          question: "Can I book by phone or WhatsApp?",
          answer:
            "Yes. You can request a booking by phone, email, WhatsApp, or the website form.",
        },
        {
          question: "What if I am travelling with children or need a crib?",
          answer:
            "Write to us before confirming your stay. We will validate the right category, final guest count, and any additional room requirements.",
        },
        {
          question: "How do I know if my reservation is confirmed?",
          answer:
            "Wakaya confirms the reservation after validating availability, dates, guests, and payment conditions.",
        },
        {
          question: "Can I change or extend my dates?",
          answer:
            "Yes, subject to availability. Request the change in advance to confirm the bungalow or an alternative.",
        },
      ],
      ctaTitle: "Do you need something more specific?",
      ctaCopy:
        "Include your dates, number of guests, and any special requirements.",
      ctaLabel: "Go to contact",
    },
    testimonials: {
      metaTitle: "Guest testimonials | Wakaya Ecolodge",
      metaDescription:
        "Short guest comments about Wakaya's service, natural setting, and stay experience.",
      hero: {
        eyebrow: "Company · Guests",
        title: "Guest testimonials",
        copy: "A short sample of how guests remember their time at Wakaya.",
      },
      introTitle: "Guest voices",
      introCopy: "",
      items: [
        {
          author: "Michael C.",
          country: "Peru",
          quote: "A pleasant escape from the city. Excellent service and kindness.",
          image: publicCompanyAssets.reviewMichael,
        },
        {
          author: "Ketty P.",
          country: "Australia",
          quote: "Fantastic. The warmth and cordiality of the people working there stood out.",
          image: publicCompanyAssets.reviewKetty,
        },
        {
          author: "Michael C.",
          country: "Germany",
          quote: "A very welcoming and family-friendly place, with great food and very good service.",
          image: publicCompanyAssets.reviewGuest,
        },
      ],
    },
    policies: {
      metaTitle: "Hotel Policies | Wakaya Ecolodge",
      metaDescription:
        "Public summary of stay terms, bookings, and personal data treatment at Wakaya Ecolodge.",
      hero: {
        eyebrow: "Company · Terms and privacy",
        title: "Hotel Policies",
        copy: "Booking, stay, and personal data conditions.",
      },
      introTitle: "Stay terms, booking flow, and privacy in one place",
      introCopy: "",
      termsTitle: "Terms and conditions",
      termsCopy: "Conditions that apply to bookings, payments, cancellations, and stays.",
      termsSections: [
        {
          id: "reservations",
          title: "Reservation policy",
          copy:
            "Bookings are coordinated between Wakaya and the guest according to real availability. Final registration may require guest identification and prior payment confirmation before check-in.",
        },
        {
          id: "payments",
          title: "Payments and deposits",
          copy:
            "Payment may be completed by cash, card, transfer, or other methods coordinated by Wakaya. Final amounts and payment windows are confirmed before payment.",
        },
        {
          id: "cancellations",
          title: "Cancellations and no-show",
          copy:
            "Changes and cancellations should be communicated as early as possible. If the guest does not arrive and no prior notice was received, Wakaya may apply charges associated with the no-show condition.",
        },
        {
          id: "stay-rules",
          title: "Stay rules",
          copy:
            "The hotel may request identity documents on arrival, maintain house rules, and limit the access of unregistered visitors to rooms or bungalows.",
        },
        {
          id: "hotel-rights",
          title: "Rights and obligations",
          copy:
            "Wakaya provides the stay subject to availability, while guests are expected to respect facilities, schedules, capacity limits, and coexistence rules during their stay.",
        },
      ],
      privacyTitle: "Privacy and personal data",
      privacyCopy: "How Wakaya requests, uses, and protects personal data.",
      privacySections: [
        {
          id: "privacy-purpose",
          title: "Purpose and use",
          copy:
            "Wakaya uses the personal data shared through reservation forms and support channels to answer questions, coordinate stays, and continue communication related to its services.",
        },
        {
          id: "privacy-legal",
          title: "Legal basis and care",
          copy:
            "Wakaya applies Peruvian personal data protection rules and security and confidentiality measures.",
        },
        {
          id: "privacy-information",
          title: "Information that may be requested",
          copy:
            "Depending on the service, Wakaya may request names, identity document data, nationality, contact details, trip information, and minimum payer details.",
        },
        {
          id: "privacy-consent",
          title: "Treatment and consent",
          copy:
            "Data is handled for specific purposes that remain compatible with the guest's reservation or inquiry. Access is limited to the team that needs it to continue the service.",
        },
      ],
      ctaTitle: "Do you need to clarify anything before booking?",
      ctaCopy:
        "Contact Wakaya with questions about payments, stay rules, or booking details.",
      ctaLabel: "Talk to Wakaya",
    },
  },
};

export function getPublicCompanyContent(locale: PublicSiteLocale): PublicCompanyContent {
  return CONTENT[locale];
}
