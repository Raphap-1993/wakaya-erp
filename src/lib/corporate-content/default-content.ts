import { getPublicCompanyContent } from "@/components/public-site/public-company-content";
import legacyAbout from "./legacy-sources/aboutus.json";
import legacyFaq from "./legacy-sources/faq.json";
import legacyTerms from "./legacy-sources/terms.json";
import legacyTestimonials from "./legacy-sources/testimonial.json";

import type { CorporateContentDocument } from "./types";

const es = structuredClone(getPublicCompanyContent("es"));
const en = structuredClone(getPublicCompanyContent("en"));

function legacyPage(page: {
  slug: string;
  title: string;
  url: string;
  headings: string[];
  paragraphs: string[];
}) {
  return {
    slug: page.slug,
    title: page.title,
    url: page.url,
    headings: [...page.headings],
    paragraphs: [...page.paragraphs],
  };
}

es.about.storyLead =
  "Wakaya Ecolodge inició sus actividades el 23 de junio de 2019. Está ubicado a pocos minutos del aeropuerto, de los principales centros comerciales y de la ciudad de Pucallpa.";
es.about.storyParagraphs = [
  "Wakaya es un espacio creado para relajarse y disfrutar de la naturaleza, compartir en familia, en pareja o con amigos, descansar del ruido de la ciudad y vivir momentos inolvidables en armonía con el entorno.",
  "Integrado en un entorno natural privilegiado, el ecolodge invita a disfrutar aromas naturales, el canto de las aves y paseos alrededor de una laguna natural de aproximadamente 4,000 m², bordeada por palmeras de aguaje y habitada por peces y tortugas de la zona.",
  "El malecón y los atardeceres completan una experiencia pensada para bajar el ritmo, recargar energía y reconectar con la Amazonía.",
];

en.about.storyLead =
  "Wakaya Ecolodge began operations on June 23, 2019. It is located just a few minutes from the airport, Pucallpa's main shopping areas, and the city.";
en.about.storyParagraphs = [
  "Wakaya was created as a place to relax and enjoy nature with family, a partner, or friends, step away from city noise, and share memorable moments in harmony with the environment.",
  "Set in a privileged natural landscape, the ecolodge invites guests to enjoy tropical scents, birdsong, and walks around a natural lagoon of approximately 4,000 m², framed by aguaje palms and home to local fish and turtles.",
  "The waterfront promenade and sunsets complete an experience designed to slow down, restore energy, and reconnect with the Amazon.",
];

es.policies.metaDescription =
  "Políticas detalladas de reservas, pagos, cancelaciones, estadía y tratamiento de datos personales de Wakaya Ecolodge.";
es.policies.termsCopy =
  "Condiciones aplicables a la reserva, el pago, el ingreso, la estadía y el uso de las instalaciones.";
es.policies.termsSections = [
  {
    id: "definitions",
    title: "Definiciones y alcance",
    copy: "Wakaya Ecolodge es el proveedor del servicio de hospedaje. El huésped es la persona mayor de edad que contrata o utiliza el servicio. El check-in es el registro de entrada; el check-out, el registro de salida; el no-show, la no presentación sin comunicación previa; y la reserva, el acuerdo para separar uno o más bungalows en fechas determinadas. Las tarifas y servicios se sujetan a disponibilidad, horarios y capacidad.",
  },
  {
    id: "hotel-obligations",
    title: "Obligaciones de Wakaya",
    copy: "Wakaya proporciona el alojamiento y los servicios contratados conforme a la tarifa y condiciones confirmadas. Las tarifas, horarios de ingreso y salida y condiciones aplicables deben estar disponibles para el huésped. Si una reserva prepagada y aceptada no pudiera atenderse, Wakaya coordinará una alternativa de categoría y tarifa equivalente o gestionará la solución correspondiente con el huésped.",
  },
  {
    id: "guest-obligations",
    title: "Obligaciones del huésped",
    copy: "El huésped debe pagar los consumos y servicios contratados, respetar los horarios, aforo y normas del establecimiento y responder por los daños atribuibles a él o a sus acompañantes. Los muebles, equipos, llaves y controles deben conservarse y devolverse en el estado recibido. Toda persona que utilice el alojamiento debe estar registrada.",
  },
  {
    id: "registration-admission",
    title: "Registro, identificación y admisión",
    copy: "Es obligatorio presentar DNI, carnet de extranjería o pasaporte durante el check-in. La reserva no puede cederse a una persona distinta sin coordinación previa. Los menores de edad deben ingresar acompañados por sus padres o tutores debidamente acreditados. Wakaya puede negar el ingreso o interrumpir el servicio ante estado de ebriedad, violencia o conductas que comprometan la tranquilidad o seguridad de huéspedes y trabajadores.",
  },
  {
    id: "check-in-out",
    title: "Check-in, check-out y extensiones horarias",
    copy: "El check-in comienza a las 14:00 y el check-out termina a las 12:00. El early check-in desde las 06:00 tiene un recargo de 50% sobre la tarifa y está sujeto a disponibilidad. Un ingreso anterior a las 06:00 se considera una noche adicional. El late checkout hasta las 18:00 tiene un recargo de 50%; después de las 18:00 se considera una noche adicional. Toda extensión debe coordinarse anticipadamente.",
  },
  {
    id: "payments",
    title: "Tarifas y medios de pago",
    copy: "Las tarifas corresponden al bungalow y a la noche reservada, con la capacidad máxima indicada para cada categoría. Pueden variar por temporada, demanda o promoción. Los pagos pueden realizarse en efectivo, con tarjeta, transferencia bancaria o interbancaria, enlace de pago u otro medio confirmado por Wakaya. Los cargos y condiciones finales se informan antes de completar el pago.",
  },
  {
    id: "reservations",
    title: "Confirmación de reservas",
    copy: "Toda reserva debe pagarse por adelantado dentro de las 24 horas posteriores a la confirmación de disponibilidad. Si luego del pago no se recibe la confirmación correspondiente, el huésped debe comunicarse con reservas@wakayaecolodge.com. Al solicitar la reserva se debe informar la cantidad de acompañantes y de menores de edad.",
  },
  {
    id: "cancellations",
    title: "Cancelaciones, modificaciones y no-show",
    copy: "Las cancelaciones o modificaciones deben solicitarse al menos 48 horas antes del check-in, salvo promociones con condiciones diferentes. Si una persona con reserva pagada no se presenta en la fecha programada y no avisa previamente, se cobra la primera noche reservada sin reembolso. La ampliación de una estadía debe solicitarse con un mínimo de 6 horas y queda sujeta a disponibilidad.",
  },
  {
    id: "children-visitors",
    title: "Niños, acompañantes y visitas",
    copy: "No se cobra alojamiento a niños de hasta 5 años cuando comparten la capacidad autorizada del bungalow; deben declararse al solicitar la reserva. Solo las personas registradas pueden ingresar a los bungalows. Las visitas se reciben fuera de las habitaciones y deben respetar las indicaciones del establecimiento.",
  },
  {
    id: "coexistence",
    title: "Convivencia y uso de instalaciones",
    copy: "Se debe mantener una conducta respetuosa y evitar ruidos, escándalos o acciones que alteren el descanso de otras personas. El incumplimiento grave puede ocasionar el término de la estadía sin reembolso. Las actividades acuáticas, deportivas o de aventura deben realizarse siguiendo las instrucciones del personal y asumiendo los riesgos propios de la actividad.",
  },
  {
    id: "safety-prohibitions",
    title: "Seguridad y prohibiciones",
    copy: "Está prohibido ingresar armas, explosivos, materiales inflamables o sustancias ilícitas o peligrosas. No está permitido fumar en las áreas donde lo prohíbe la normativa ni utilizar artefactos eléctricos no autorizados dentro de los bungalows. Las llaves deben entregarse en recepción cuando corresponda. Wakaya puede intervenir razonablemente ante una emergencia o un riesgo para las personas o instalaciones.",
  },
  {
    id: "parking-services",
    title: "Estacionamiento y servicios de terceros",
    copy: "Wakaya ofrece estacionamiento gratuito para huéspedes. Cada persona debe asegurar su vehículo y evitar dejar objetos de valor en su interior. La calidad o continuidad de televisión por cable, internet y otros servicios suministrados por terceros depende también de sus proveedores y de las condiciones técnicas o climáticas de la zona.",
  },
  {
    id: "belongings",
    title: "Objetos personales y artículos olvidados",
    copy: "El huésped es responsable de sus pertenencias y debe reportar de inmediato cualquier incidencia. Los objetos no perecibles olvidados se conservan hasta 30 días; después pueden ser retirados de las instalaciones. Los objetos perecibles se desechan de inmediato por razones sanitarias. El equipaje y los objetos de valor no se reciben en custodia salvo coordinación expresa.",
  },
  {
    id: "food-beverages",
    title: "Alimentos, bebidas y atención de incidencias",
    copy: "El consumo de bebidas alcohólicas adquiridas fuera del establecimiento puede estar sujeto a derecho de descorche. Cualquier observación sobre limpieza, mantenimiento o servicio debe informarse durante la estadía para que el equipo pueda atenderla oportunamente.",
  },
];

es.policies.privacyCopy =
  "Cómo Wakaya recopila, utiliza, conserva y protege la información personal.";
es.policies.privacySections = [
  {
    id: "privacy-introduction",
    title: "Introducción",
    copy: "Wakaya Ecolodge protege la reserva y confidencialidad de los datos personales que huéspedes, visitantes y usuarios proporcionan mediante la web, formularios, canales de atención o contratación de servicios. Esta política explica cómo se recopila, utiliza, conserva y protege esa información.",
  },
  {
    id: "privacy-purpose",
    title: "Objetivo y finalidad",
    copy: "El objetivo es informar de manera clara el tratamiento aplicado a los datos personales. La web permite conocer los servicios de Wakaya, solicitar disponibilidad, enviar consultas y mantener comunicación relacionada con reservas, hospedaje, restaurante, eventos y actividades conexas.",
  },
  {
    id: "privacy-legal",
    title: "Marco legal aplicable",
    copy: "El tratamiento se realiza de acuerdo con la Constitución Política del Perú, la Ley N.º 29733 — Ley de Protección de Datos Personales, su Reglamento aprobado por Decreto Supremo N.º 016-2024-JUS y las demás normas peruanas aplicables.",
  },
  {
    id: "privacy-principles",
    title: "Principios del tratamiento",
    copy: "Wakaya aplica los principios de legalidad, consentimiento, finalidad, proporcionalidad, calidad, seguridad y disposición de recurso. No recopila datos mediante medios fraudulentos, desleales o ilícitos y los utiliza para fines determinados, explícitos y compatibles con el motivo de su entrega.",
  },
  {
    id: "privacy-information",
    title: "Información que puede recopilarse",
    copy: "Según el servicio solicitado, se pueden recopilar nombres y apellidos, tipo y número de identificación, nacionalidad, residencia, fecha de nacimiento, género, parentesco o información de acompañantes menores, teléfonos, correos, dirección, profesión, empresa y cargo, procedencia, destino, motivo de viaje y datos mínimos necesarios del titular del pago. Wakaya no solicita por la web claves ni códigos de seguridad de tarjetas.",
  },
  {
    id: "privacy-truthfulness",
    title: "Veracidad y actualización",
    copy: "La persona que entrega información declara que es veraz, suficiente y vigente y debe comunicar las correcciones necesarias. Wakaya puede solicitar elementos razonables para acreditar identidad cuando sean necesarios para la reserva, la atención o el ejercicio de derechos.",
  },
  {
    id: "privacy-use",
    title: "Finalidades del uso de datos",
    copy: "Los datos se utilizan para responder consultas, verificar disponibilidad, procesar solicitudes, confirmar y operar reservas, atender pagos e incidencias, prestar servicios hoteleros, turísticos, gastronómicos y de eventos, cumplir obligaciones legales y mantener la comunicación necesaria antes, durante y después de la estadía.",
  },
  {
    id: "privacy-marketing",
    title: "Comunicaciones comerciales",
    copy: "Wakaya solo enviará promociones o información publicitaria cuando exista una base legal o autorización válida. La persona puede retirar su consentimiento u oponerse a estas comunicaciones mediante los canales indicados, sin afectar la atención de su reserva vigente.",
  },
  {
    id: "privacy-storage",
    title: "Almacenamiento y confidencialidad",
    copy: "Los datos se almacenan en los sistemas y bancos de datos utilizados por Wakaya durante el tiempo necesario para cumplir la finalidad informada y las obligaciones legales. Solo accede el personal o proveedor autorizado que requiere la información para prestar el servicio, bajo deberes de confidencialidad.",
  },
  {
    id: "privacy-communication",
    title: "Comunicación de datos",
    copy: "Los datos no se comunican a terceros para fines incompatibles sin autorización. Pueden compartirse con proveedores que apoyan la reserva, pagos, comunicaciones o infraestructura tecnológica bajo obligaciones de protección, y con autoridades administrativas, judiciales o policiales cuando una norma lo exija.",
  },
  {
    id: "privacy-security",
    title: "Seguridad de la información",
    copy: "Wakaya adopta medidas técnicas, organizativas y legales razonables para evitar alteración, pérdida, tratamiento o acceso no autorizado. Ninguna transmisión por internet es completamente infalible; por ello se revisan los controles y se limita el acceso según la necesidad operativa.",
  },
  {
    id: "privacy-rights",
    title: "Ejercicio de derechos",
    copy: "La persona titular puede solicitar información, acceso, actualización, inclusión, rectificación, cancelación o supresión, oposición e impedir el suministro de sus datos en los términos de la normativa. La solicitud se envía a administracion@wakayaecolodge.com con el asunto “Protección de Datos Personales”, identificando al solicitante y el derecho que desea ejercer.",
  },
  {
    id: "privacy-consent",
    title: "Consentimiento",
    copy: "Cuando el consentimiento sea necesario, la entrega o aceptación correspondiente autoriza únicamente los tratamientos informados. El consentimiento puede revocarse conforme a ley. Wakaya puede tratar datos provenientes de fuentes accesibles al público o de fuentes autorizadas cuando la normativa lo permita.",
  },
  {
    id: "privacy-validity",
    title: "Vigencia y modificaciones",
    copy: "La política puede actualizarse por cambios legales, operativos o de los servicios. La versión vigente se publica en esta página y aplica desde la fecha indicada. Se recomienda revisarla cuando se realice una nueva reserva o se utilicen los canales digitales de Wakaya.",
  },
];

en.policies.metaDescription =
  "Detailed booking, payment, cancellation, stay, and personal data policies for Wakaya Ecolodge.";
en.policies.termsCopy =
  "Conditions that apply to booking, payment, arrival, the stay, and use of the property.";
en.policies.termsSections = [
  { id: "definitions", title: "Definitions and scope", copy: "Wakaya Ecolodge provides the accommodation service. A guest is the adult who purchases or uses it. Check-in is the arrival registration; check-out is the departure registration; no-show means failing to arrive without prior notice; and a booking is the agreement to hold one or more bungalows for specified dates. Rates and services remain subject to availability, schedules, and capacity." },
  { id: "hotel-obligations", title: "Wakaya's obligations", copy: "Wakaya provides the accommodation and services confirmed with the guest under the agreed rate and conditions. Applicable rates, arrival and departure times, and conditions must be available to the guest. If an accepted prepaid booking cannot be accommodated, Wakaya will coordinate a comparable alternative or an appropriate solution with the guest." },
  { id: "guest-obligations", title: "Guest obligations", copy: "Guests must pay for purchased services, respect schedules, capacity, and property rules, and answer for damage attributable to them or their companions. Furniture, equipment, keys, and controls must be kept and returned in the condition received. Every person using the accommodation must be registered." },
  { id: "registration-admission", title: "Registration, identification, and admission", copy: "A DNI, foreign resident card, or passport must be presented at check-in. A booking may not be transferred to someone else without prior coordination. Minors must arrive with an accredited parent or guardian. Wakaya may deny entry or end service in cases of intoxication, violence, or conduct that risks the safety or rest of guests and staff." },
  { id: "check-in-out", title: "Check-in, check-out, and time extensions", copy: "Check-in begins at 14:00 and check-out ends at 12:00. Early check-in from 06:00 carries a 50% surcharge and is subject to availability. Arrival before 06:00 is considered an additional night. Late checkout until 18:00 carries a 50% surcharge; after 18:00 an additional night applies. Every extension must be arranged in advance." },
  { id: "payments", title: "Rates and payment methods", copy: "Rates apply per bungalow and reserved night, within the stated maximum capacity. They may change by season, demand, or promotion. Payment may be made by cash, card, bank transfer, payment link, or another method confirmed by Wakaya. Final charges and conditions are communicated before payment." },
  { id: "reservations", title: "Booking confirmation", copy: "Bookings must be prepaid within 24 hours after availability is confirmed. If no confirmation is received after payment, the guest should contact reservas@wakayaecolodge.com. The booking request must state the number of companions and minors." },
  { id: "cancellations", title: "Cancellations, changes, and no-show", copy: "Cancellations or changes must be requested at least 48 hours before check-in, except promotions with different conditions. If a guest with a paid booking does not arrive as scheduled and gives no prior notice, the first reserved night is charged without refund. A stay extension must be requested at least 6 hours in advance and remains subject to availability." },
  { id: "children-visitors", title: "Children, companions, and visitors", copy: "There is no accommodation charge for children up to 5 years old when they share the bungalow's authorized capacity; they must be declared in the request. Only registered guests may enter bungalows. Visitors are received outside guest rooms and must follow property instructions." },
  { id: "coexistence", title: "Coexistence and use of facilities", copy: "Guests must behave respectfully and avoid noise or conduct that disrupts others. Serious violations may result in the end of the stay without refund. Water, sports, and adventure activities must follow staff instructions and involve the risks inherent to each activity." },
  { id: "safety-prohibitions", title: "Safety and prohibited items", copy: "Weapons, explosives, flammable materials, and illegal or dangerous substances are prohibited. Smoking is not allowed where prohibited by law, and unauthorized electrical appliances may not be used in bungalows. Keys must be returned to reception when required. Wakaya may reasonably intervene during an emergency or risk to people or property." },
  { id: "parking-services", title: "Parking and third-party services", copy: "Wakaya offers free guest parking. Each person must secure their vehicle and avoid leaving valuables inside. Cable television, internet, and other third-party services also depend on provider, technical, and local weather conditions." },
  { id: "belongings", title: "Personal belongings and lost property", copy: "Guests are responsible for their belongings and should report incidents immediately. Non-perishable forgotten items are held for up to 30 days and may then be removed. Perishable items are discarded immediately for sanitation reasons. Luggage and valuables are not accepted for safekeeping unless expressly arranged." },
  { id: "food-beverages", title: "Food, beverages, and service incidents", copy: "Alcohol purchased outside the property may be subject to a corkage fee. Any issue with housekeeping, maintenance, or service should be reported during the stay so the team can respond promptly." },
];

en.policies.privacyCopy = "How Wakaya collects, uses, retains, and protects personal information.";
en.policies.privacySections = [
  { id: "privacy-introduction", title: "Introduction", copy: "Wakaya Ecolodge protects the confidentiality of personal data supplied by guests, visitors, and users through the website, forms, support channels, or service arrangements. This policy explains how that information is collected, used, retained, and protected." },
  { id: "privacy-purpose", title: "Purpose", copy: "This policy clearly explains the processing applied to personal data. The website lets people learn about Wakaya's services, request availability, send inquiries, and communicate about bookings, accommodation, the restaurant, events, and related activities." },
  { id: "privacy-legal", title: "Applicable legal framework", copy: "Processing follows the Political Constitution of Peru, Law No. 29733 — Personal Data Protection Law, its Regulation approved by Supreme Decree No. 016-2024-JUS, and other applicable Peruvian rules." },
  { id: "privacy-principles", title: "Processing principles", copy: "Wakaya applies the principles of legality, consent, purpose limitation, proportionality, quality, security, and access to remedies. It does not collect information through fraudulent, unfair, or illegal means and uses data for specified, explicit purposes compatible with the reason it was provided." },
  { id: "privacy-information", title: "Information that may be collected", copy: "Depending on the service, data may include names, identification type and number, nationality, residence, date of birth, gender, relationship or details of accompanying minors, phone numbers, email and postal addresses, profession, employer and role, origin, destination, reason for travel, and the minimum payer details required. Wakaya does not request card passwords or security codes through the website." },
  { id: "privacy-truthfulness", title: "Accuracy and updates", copy: "Anyone providing information declares that it is accurate, sufficient, and current and should communicate corrections. Wakaya may request reasonable identity evidence when needed for a booking, service, or rights request." },
  { id: "privacy-use", title: "Uses of personal data", copy: "Data is used to answer inquiries, verify availability, process requests, confirm and operate bookings, address payments and incidents, provide hospitality, tourism, food, and event services, comply with legal duties, and maintain necessary communication before, during, and after a stay." },
  { id: "privacy-marketing", title: "Marketing communications", copy: "Wakaya sends promotions or advertising only when it has a valid legal basis or authorization. A person may withdraw consent or object through the stated channels without affecting an active booking." },
  { id: "privacy-storage", title: "Storage and confidentiality", copy: "Data is stored in systems and databases used by Wakaya for the time needed to meet the stated purpose and legal obligations. Access is limited to authorized personnel or providers who need the information to deliver the service and are bound by confidentiality duties." },
  { id: "privacy-communication", title: "Data sharing", copy: "Data is not shared for incompatible purposes without authorization. It may be shared with providers supporting booking, payments, communications, or technology under protection duties, and with administrative, judicial, or police authorities when required by law." },
  { id: "privacy-security", title: "Information security", copy: "Wakaya uses reasonable technical, organizational, and legal safeguards against alteration, loss, unauthorized access, or processing. No internet transmission is completely infallible, so controls are reviewed and access is limited to operational need." },
  { id: "privacy-rights", title: "Exercise of data rights", copy: "The data subject may request information, access, updating, inclusion, rectification, cancellation or deletion, objection, and restriction of disclosure under applicable law. Requests should be sent to administracion@wakayaecolodge.com with the subject “Personal Data Protection,” identifying the requester and the right being exercised." },
  { id: "privacy-consent", title: "Consent", copy: "When consent is required, the corresponding submission or acceptance authorizes only the stated processing. Consent may be withdrawn according to law. Wakaya may process information from publicly accessible or otherwise authorized sources when permitted by applicable rules." },
  { id: "privacy-validity", title: "Validity and amendments", copy: "This policy may be updated for legal, operational, or service changes. The current version is published on this page and applies from its stated date. Guests should review it when making a new booking or using Wakaya's digital channels." },
];

export const DEFAULT_CORPORATE_CONTENT: CorporateContentDocument = {
  schemaVersion: 1,
  locales: { es, en },
  contact: {
    address: {
      es: "Carretera Federico Basadre km 7.200, Pucallpa, Ucayali, Perú",
      en: "Federico Basadre Highway km 7.200, Pucallpa, Ucayali, Peru",
    },
    locationNote: {
      es: "A pocos minutos del aeropuerto y de los principales centros comerciales",
      en: "A few minutes from the airport and the city's main shopping areas",
    },
    phones: ["+51 961 508 813", "+51 977 419 468"],
    whatsapp: "+51 961 508 813",
    reservationsEmail: "reservas@wakayaecolodge.com",
    privacyEmail: "administracion@wakayaecolodge.com",
    hours: {
      es: "Lun–Dom · 7:00 — 20:00",
      en: "Mon–Sun · 7:00 — 20:00",
    },
  },
  internal: {
    sourceLabel: "Web histórica Wakaya, extracción 2026-07",
    sourceUrls: [
      "https://wakayaecolodge.com/es/aboutus.php",
      "https://wakayaecolodge.com/es/terms.php",
      "https://wakayaecolodge.com/es/faq.php",
      "https://wakayaecolodge.com/es/testimonial.php",
    ],
    notes: [
      "El texto histórico indicaba 25 % de early check-in en reglas de estadía y 50 % en políticas de reserva. La publicación inicial usa 50 %.",
      "El respaldo no contiene horario verificable de recepción. Se mantiene el horario público vigente 07:00–20:00 hasta confirmación del negocio.",
      "La referencia histórica a la Ley N.º 27086 fue descartada. La política publicada usa la Ley N.º 29733 y el Decreto Supremo N.º 016-2024-JUS.",
      "El contenido contractual y de privacidad requiere revisión legal periódica; esta nota es interna.",
    ],
    legacyPages: [
      legacyPage(legacyAbout),
      legacyPage(legacyTerms),
      legacyPage(legacyFaq),
      legacyPage(legacyTestimonials),
    ],
  },
};
