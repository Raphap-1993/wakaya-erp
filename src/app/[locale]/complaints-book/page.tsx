import figmaStyles from "@/components/public-site/figma-public-pages.module.css";
import { PageHero } from "@/components/public-site/page-hero";
import { PublicComplaintForm } from "@/components/public-site/public-complaint-form";
import { WAKAYA_PRIMARY_PHONE_DISPLAY, WAKAYA_SECONDARY_PHONE_DISPLAY } from "@/lib/wakaya-contact";
import type { PublicSiteLocale } from "@/components/public-site/public-site-locale";
import styles from "@/components/public-site/public-site-theme.module.css";
import { buildLocalizedPublicMetadata } from "../public-site-metadata";

type PublicComplaintFormProps = Parameters<typeof PublicComplaintForm>[0];

type ComplaintsCopy = {
  metaTitle: string;
  metaDescription: string;
  heroEyebrow: string;
  heroTitle: string;
  heroCopy: string;
  formTitle: string;
  formCopy: string;
  labels: PublicComplaintFormProps["labels"];
  options: PublicComplaintFormProps["options"];
  placeholders: PublicComplaintFormProps["placeholders"];
  cards: Array<{
    title: string;
    copy: string;
    bullets: string[];
  }>;
};

function getComplaintsCopy(locale: PublicSiteLocale): ComplaintsCopy {
  if (locale === "en") {
    return {
      metaTitle: "Complaints Book | Wakaya Ecolodge",
      metaDescription:
        "A clear public route to share a complaint or service claim related to your Wakaya stay.",
      heroEyebrow: "Guest care",
      heroTitle: "Complaints Book",
      heroCopy:
        "If you need to report an issue related to your stay or service, we are ready to receive it with respect and follow-up.",
      formTitle: "Submit your case online",
      formCopy:
        "Complete the basic details of your case and keep the tracking code we will show you right away.",
      labels: {
        formTitle: "Submit your case online",
        formCopy:
          "Complete the basic details of your case and keep the tracking code we will show you right away.",
        type: "Case type",
        fullName: "Full name",
        documentType: "Document type",
        documentNumber: "Document number",
        email: "Email",
        phone: "Phone",
        address: "Address",
        serviceType: "Service category",
        contractedService: "Contracted service",
        complaintDetail: "What happened",
        consumerRequest: "What solution do you expect",
        acceptedDeclaration:
          "I confirm that the information provided is true and I want Wakaya to process this case.",
        acceptedHelp:
          "You will receive a public tracking code on screen. Wakaya should answer within 15 business days.",
        submit: "Send case",
        submitting: "Sending case",
        error: "We could not register your case. Please review the information and try again.",
        successTitle: "Case received",
        successCopy:
          "Keep this tracking code. If we need more information, we will contact you through the email you provided.",
        successResponse: "Public response window: up to 15 business days.",
      },
      options: {
        claim: "Claim",
        complaint: "Complaint",
        documentTypes: [
          { value: "dni", label: "DNI" },
          { value: "ce", label: "Foreigner ID" },
          { value: "passport", label: "Passport" },
          { value: "ruc", label: "RUC" },
          { value: "other", label: "Other" },
        ],
        serviceTypes: [
          { value: "lodging", label: "Lodging" },
          { value: "food", label: "Food and beverage" },
          { value: "event", label: "Events" },
          { value: "transport", label: "Transport" },
          { value: "other", label: "Other" },
        ],
      },
      placeholders: {
        fullName: "Guest or consumer full name",
        documentNumber: "Document number",
        email: "name@email.com",
        phone: "+51 999 999 999",
        address: "City or home address",
        contractedService: "Example: Family bungalow stay",
        complaintDetail: "Describe clearly what happened, when, and how it affected your experience.",
        consumerRequest: "Tell us the response or action you expect from Wakaya.",
      },
      cards: [
        {
          title: "How to submit a claim",
          copy:
            "If you want to leave your case documented right away, use the online form. You can also contact us first through the same reservation channels if you need guidance.",
          bullets: [
            "Email: reservas@wakayaecolodge.com",
            `WhatsApp: ${WAKAYA_PRIMARY_PHONE_DISPLAY} · Phone: ${WAKAYA_SECONDARY_PHONE_DISPLAY}`,
            "Hours: Monday to Sunday, 7:00 to 20:00",
          ],
        },
        {
          title: "Response",
          copy:
            "Our team reviews each case directly. If more information is required, we will contact you.",
          bullets: [
            "You will receive a public tracking code on screen.",
            "Include photos or proof only if they help explain the case.",
            "Expected response time: up to 15 business days.",
          ],
        },
      ],
    };
  }

  return {
    metaTitle: "Libro de Reclamaciones | Wakaya Ecolodge",
    metaDescription:
      "Ruta pública y clara para compartir un reclamo o queja relacionada con tu experiencia en Wakaya.",
    heroEyebrow: "Atención al huésped",
    heroTitle: "Libro de Reclamaciones",
    heroCopy:
      "Si necesitas reportar un inconveniente sobre tu estadía o el servicio, estamos listos para recibirlo con respeto y seguimiento.",
    formTitle: "Registra tu caso en línea",
    formCopy:
      "Completa los datos básicos de tu caso y conserva la constancia que te mostraremos al terminar.",
    labels: {
      formTitle: "Registra tu caso en línea",
      formCopy:
        "Completa los datos básicos de tu caso y conserva la constancia que te mostraremos al terminar.",
      type: "Tipo de caso",
      fullName: "Nombre completo",
      documentType: "Tipo de documento",
      documentNumber: "Número de documento",
      email: "Correo electrónico",
      phone: "Teléfono",
      address: "Dirección",
      serviceType: "Categoría del servicio",
      contractedService: "Servicio contratado",
      complaintDetail: "¿Qué ocurrió?",
      consumerRequest: "¿Qué solución esperas?",
      acceptedDeclaration:
        "Declaro que la información brindada es verdadera y deseo que Wakaya procese este caso.",
      acceptedHelp:
        "Recibirás una constancia en pantalla. Wakaya debe responder en un plazo máximo de 15 días hábiles.",
      submit: "Enviar caso",
      submitting: "Enviando caso",
      error: "No pudimos registrar tu caso. Revisa la información e inténtalo nuevamente.",
      successTitle: "Caso recibido",
      successCopy:
        "Guarda este código de seguimiento. Si necesitamos más información, te contactaremos al correo registrado.",
      successResponse: "Plazo público de respuesta: hasta 15 días hábiles.",
    },
    options: {
      claim: "Reclamo",
      complaint: "Queja",
      documentTypes: [
        { value: "dni", label: "DNI" },
        { value: "ce", label: "Carné de extranjería" },
        { value: "passport", label: "Pasaporte" },
        { value: "ruc", label: "RUC" },
        { value: "other", label: "Otro" },
      ],
      serviceTypes: [
        { value: "lodging", label: "Hospedaje" },
        { value: "food", label: "Alimentos y bebidas" },
        { value: "event", label: "Eventos" },
        { value: "transport", label: "Transporte" },
        { value: "other", label: "Otro" },
      ],
    },
    placeholders: {
      fullName: "Nombre del huésped o consumidor",
      documentNumber: "Número de documento",
      email: "nombre@email.com",
      phone: "+51 999 999 999",
      address: "Ciudad o dirección de contacto",
      contractedService: "Ejemplo: estadía en bungalow familiar",
      complaintDetail: "Describe con claridad lo ocurrido, cuándo pasó y cómo afectó tu experiencia.",
      consumerRequest: "Cuéntanos qué respuesta o acción esperas por parte de Wakaya.",
    },
    cards: [
      {
        title: "Cómo presentar tu reclamo",
        copy:
          "Si quieres dejar tu caso documentado de inmediato, usa el formulario en línea. También puedes escribirnos o pedir orientación por los mismos canales de reserva.",
        bullets: [
          "Correo: reservas@wakayaecolodge.com",
          `WhatsApp: ${WAKAYA_PRIMARY_PHONE_DISPLAY} · Teléfono: ${WAKAYA_SECONDARY_PHONE_DISPLAY}`,
          "Horario: lunes a domingo, de 7:00 a 20:00",
        ],
      },
      {
        title: "Respuesta",
        copy:
          "Nuestro equipo revisa cada caso de forma directa. Si necesitamos más información, nos comunicaremos contigo.",
        bullets: [
          "Recibirás una constancia pública en pantalla.",
          "Incluye fotos o comprobantes solo si ayudan a explicar el caso.",
          "Plazo estimado de respuesta: hasta 15 días hábiles.",
        ],
      },
    ],
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
  const copy = getComplaintsCopy(locale);

  return buildLocalizedPublicMetadata({
    locale,
    route: "complaintsBook",
    title: copy.metaTitle,
    description: copy.metaDescription,
    keywords:
      locale === "en"
        ? ["wakaya complaints", "complaints book", "guest support"]
        : ["libro de reclamaciones wakaya", "reclamos wakaya", "atencion huesped"],
  });
}

export default async function PublicSiteComplaintsBookPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const locale = await readLocale(params);
  const copy = getComplaintsCopy(locale);

  return (
    <>
      <PageHero
        eyebrow={copy.heroEyebrow}
        title={copy.heroTitle}
        breadcrumb={`${locale === "en" ? "Home" : "Inicio"} / ${copy.heroTitle}`}
        copy={copy.heroCopy}
        image="https://wakayaecolodge.com/es/images/wakaya/gallery/gallery04.jpg"
      />

      <section className={styles.pageSection}>
        <div className={styles.editorialGrid}>
          {copy.cards.map((card) => (
            <article key={card.title} className={styles.pageCopyCard}>
              <h3>{card.title}</h3>
              <p>{card.copy}</p>
              <ul className={styles.eventChecklist}>
                {card.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.pageSection}>
        <div className={figmaStyles.contactGrid}>
          <article className={styles.pageCopyCard}>
            <h3>{copy.formTitle}</h3>
            <p>{copy.formCopy}</p>
            <ul className={styles.eventChecklist}>
              <li>
                {locale === "en"
                  ? "Required consumer identity and contact details."
                  : "Datos de identidad y contacto del consumidor."}
              </li>
              <li>
                {locale === "en"
                  ? "Service reference and a clear description of the incident."
                  : "Referencia del servicio y descripción clara de la incidencia."}
              </li>
              <li>
                {locale === "en"
                  ? "Immediate tracking code visible at the end of the submission."
                  : "Constancia visible al finalizar el envío."}
              </li>
            </ul>
          </article>

          <PublicComplaintForm
            labels={copy.labels}
            options={copy.options}
            placeholders={copy.placeholders}
          />
        </div>
      </section>
    </>
  );
}
