import { FigmaPageHero } from "@/components/public-site/figma-page-hero";
import styles from "@/components/public-site/figma-public-pages.module.css";
import { PublicBookingRequestForm } from "@/components/public-site/public-booking-request-form";
import type { PublicSiteLocale } from "@/components/public-site/public-site-locale";
import { getLocalizedPublicExperienceBySlug } from "@/lib/content/public-content";
import { getPublishedCorporateView } from "@/lib/corporate-content/public-view";
import type { CorporateContact } from "@/lib/corporate-content/types";
import { getLocalizedBungalows } from "../public-site-content";
import { buildLocalizedPublicMetadata } from "../public-site-metadata";

type SearchParams = Record<string, string | string[] | undefined>;

type PageProps = {
  params: Promise<{ locale: string }> | { locale: string };
  searchParams?: Promise<SearchParams> | SearchParams;
};

type ContactCopy = {
  metaTitle: string;
  metaDescription: string;
  heroMeta: string;
  heroTitle: string;
  heroCopy: string;
  infoTitle: string;
  infoCopy: string;
  formTitle: string;
  submitLabel: string;
  labels: {
    name: string;
    email: string;
    checkIn: string;
    checkOut: string;
    guests: string;
    message: string;
  };
  placeholders: {
    name: string;
    email: string;
    message: string;
  };
  guestOptions: string[];
  details: Array<{ icon: string; label: string; value: string }>;
  requestCreated: string;
  requestCreatedCopy: string;
  requestEmailSentCopy: string;
  requestEmailQueuedCopy: string;
  whatsappLabel: string;
  whatsappPrompt: string;
  whatsappButton: string;
  whatsappPrefillTemplate: string;
  closeModal: string;
  requestFailed: string;
  availabilityUnavailableTitle: string;
  availabilityUnavailableCopy: string;
  availabilityAlternativesLabel: string;
  availabilityAlternativeDatesLabel: string;
  availabilityApplyDatesLabel: string;
  selectedExperienceLabel: string;
};

const CONTACT_HERO = "https://wakayaecolodge.com/es/images/wakaya/slider/slider_wakaya1.png";

function getSingleValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function parseCapacity(value: string) {
  const match = value.match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : null;
}

function getContactCopy(locale: PublicSiteLocale, contact: CorporateContact): ContactCopy {
  if (locale === "en") {
    return {
      metaTitle: "Contact and reservations | Wakaya Ecolodge",
      metaDescription: "Plan your stay with Wakaya with direct support from the reservations team.",
      heroMeta: "Reservations · Wakaya Ecolodge",
      heroTitle: "Contact us",
      heroCopy: "We are here to make your experience happen",
      infoTitle: "Let's talk",
      infoCopy: "For reservations, questions, and groups write to us. We reply in less than 24 hours.",
      formTitle: "Plan your stay",
      submitLabel: "Send request",
      labels: {
        name: "Name",
        email: "Email",
        checkIn: "Check-in",
        checkOut: "Check-out",
        guests: "Guests",
        message: "Message",
      },
      placeholders: {
        name: "Your name",
        email: "your@email.com",
        message: "Tell us what kind of experience you are looking for...",
      },
      guestOptions: ["1 guest", "2 guests", "3 guests", "4 guests", "5 guests", "6 guests"],
      details: [
        {
          icon: "⌂",
          label: "Location",
          value: `${contact.address.en} · ${contact.locationNote.en}`,
        },
        {
          icon: "✆",
          label: "Phones · WhatsApp",
          value: contact.phones.join(" / "),
        },
        {
          icon: "✉",
          label: "Email",
          value: contact.reservationsEmail,
        },
        {
          icon: "◷",
          label: "Hours",
          value: contact.hours.en,
        },
      ],
      requestCreated: "Request sent",
      requestCreatedCopy:
        "Your request is already with the Wakaya reservations team.",
      requestEmailSentCopy:
        "Our team is already working on it and will contact you as soon as possible.",
      requestEmailQueuedCopy:
        "Your request was registered. The reservations team will contact you.",
      whatsappLabel: "WhatsApp Wakaya",
      whatsappPrompt: "You can also contact us directly on WhatsApp.",
      whatsappButton: "Open Wakaya WhatsApp",
      whatsappPrefillTemplate:
        "Hello Wakaya, I just sent the booking request {publicRef} from the website and I would like to continue by WhatsApp.",
      closeModal: "Close",
      requestFailed: "We could not send the request. Review the details and try again.",
      availabilityUnavailableTitle: "No availability for those dates",
      availabilityUnavailableCopy: "There are no units left for the selected range.",
      availabilityAlternativesLabel: "Alternative bungalows",
      availabilityAlternativeDatesLabel: "Suggested dates",
      availabilityApplyDatesLabel: "Use these dates",
      selectedExperienceLabel: "Selected experience",
    };
  }

  return {
    metaTitle: "Contacto y reservas | Wakaya Ecolodge",
    metaDescription: "Planifica tu estadía con Wakaya con atención directa del equipo de reservas.",
    heroMeta: "Reservas · Wakaya Ecolodge",
    heroTitle: "Contáctanos",
    heroCopy: "Estamos aquí para hacer realidad tu experiencia",
    infoTitle: "Hablemos",
    infoCopy: "Para reservas, consultas y grupos escríbenos. Respondemos en menos de 24 horas.",
    formTitle: "Planifica tu estadía",
    submitLabel: "Enviar solicitud",
    labels: {
      name: "Nombre",
      email: "Email",
      checkIn: "Check-in",
      checkOut: "Check-out",
      guests: "Huéspedes",
      message: "Mensaje",
    },
    placeholders: {
      name: "Tu nombre",
      email: "tu@email.com",
      message: "Cuéntanos qué tipo de experiencia buscas...",
    },
    guestOptions: ["1 persona", "2 personas", "3 personas", "4 personas", "5 personas", "6 personas"],
    details: [
      {
        icon: "⌂",
        label: "Ubicación",
        value: `${contact.address.es} · ${contact.locationNote.es}`,
      },
      {
        icon: "✆",
        label: "Teléfonos · WhatsApp",
        value: contact.phones.join(" / "),
      },
      {
        icon: "✉",
        label: "Email",
        value: contact.reservationsEmail,
      },
      {
        icon: "◷",
        label: "Atención",
        value: contact.hours.es,
      },
    ],
    requestCreated: "Solicitud enviada",
    requestCreatedCopy:
      "Tu solicitud ya está con el equipo de reservas de Wakaya.",
    requestEmailSentCopy:
      "Nuestro equipo ya está trabajando en ella y te contactará lo antes posible.",
    requestEmailQueuedCopy:
      "Tu solicitud quedó registrada. El equipo de reservas se comunicará contigo.",
    whatsappLabel: "WhatsApp Wakaya",
    whatsappPrompt: "También puedes contactarnos directamente por WhatsApp.",
    whatsappButton: "Abrir WhatsApp Wakaya",
    whatsappPrefillTemplate:
      "Hola Wakaya, acabo de enviar la solicitud {publicRef} desde la web y deseo continuar por WhatsApp.",
    closeModal: "Cerrar",
    requestFailed: "No pudimos enviar la solicitud. Revisa los datos e inténtalo otra vez.",
    availabilityUnavailableTitle: "No disponible para ese rango",
    availabilityUnavailableCopy: "No quedan unidades disponibles para las fechas seleccionadas.",
    availabilityAlternativesLabel: "Bungalows alternativos",
    availabilityAlternativeDatesLabel: "Fechas sugeridas",
    availabilityApplyDatesLabel: "Usar estas fechas",
    selectedExperienceLabel: "Experiencia seleccionada",
  };
}

async function resolveSearchParams(
  searchParams?: Promise<SearchParams> | SearchParams,
): Promise<SearchParams> {
  if (!searchParams) {
    return {};
  }

  return await searchParams;
}

async function readLocale(
  params: Promise<{ locale: string }> | { locale: string },
): Promise<PublicSiteLocale> {
  const resolvedParams = await params;
  return resolvedParams.locale as PublicSiteLocale;
}

export async function generateMetadata({ params }: Pick<PageProps, "params">) {
  const locale = await readLocale(params);
  const copy = getContactCopy(locale, (await getPublishedCorporateView(locale)).contact);

  return buildLocalizedPublicMetadata({
    locale,
    route: "contact",
    title: copy.metaTitle,
    description: copy.metaDescription,
    keywords:
      locale === "en"
        ? ["wakaya reservations", "contact wakaya", "amazon lodge booking request"]
        : ["reservas wakaya", "contacto wakaya", "solicitud de reserva"],
    image: CONTACT_HERO,
  });
}

export default async function PublicSiteContactLocalePage({ params, searchParams }: PageProps) {
  const locale = await readLocale(params);
  const corporate = await getPublishedCorporateView(locale);
  const copy = getContactCopy(locale, corporate.contact);
  const resolvedSearchParams = await resolveSearchParams(searchParams);
  const localizedBungalows = await getLocalizedBungalows(locale);
  const requestedBungalowType = getSingleValue(resolvedSearchParams.requestedBungalowType);
  const requestedExperienceSlug = getSingleValue(resolvedSearchParams.experience);
  const requestedCheckIn = getSingleValue(resolvedSearchParams.requestedCheckIn);
  const requestedCheckOut = getSingleValue(resolvedSearchParams.requestedCheckOut);
  const selectedExperience = requestedExperienceSlug
    ? await getLocalizedPublicExperienceBySlug(locale, requestedExperienceSlug)
    : null;
  const preferredBungalow = requestedBungalowType
    ? localizedBungalows.find(
        (bungalow) => bungalow.bookingRequestBungalowId === requestedBungalowType,
      ) ?? null
    : null;
  const preferredCapacity = preferredBungalow
    ? parseCapacity(preferredBungalow.displayCapacity)
    : null;
  const minGuests = preferredCapacity ?? 1;
  const maxGuests = preferredCapacity ?? copy.guestOptions.length;
  const requestedGuestsQuery = getSingleValue(resolvedSearchParams.requestedGuests);
  const parsedRequestedGuests = requestedGuestsQuery
    ? Number.parseInt(requestedGuestsQuery, 10)
    : Number.NaN;
  const requestedGuests = Number.isFinite(parsedRequestedGuests)
    ? String(Math.min(Math.max(parsedRequestedGuests, minGuests), maxGuests))
    : String(preferredCapacity ?? 2);
  const guestOptions = copy.guestOptions
    .map((option, index) => ({ label: option, value: index + 1 }))
    .filter((option) => option.value >= minGuests && option.value <= maxGuests);

  return (
    <>
      <FigmaPageHero
        meta={copy.heroMeta}
        title={copy.heroTitle}
        copy={copy.heroCopy}
        image={CONTACT_HERO}
      />

      <section className={styles.section}>
        <div className={styles.contactGrid}>
          <article className={styles.contactInfoCard}>
            <h2 className={styles.contactCardTitle}>{copy.infoTitle}</h2>
            <p className={styles.contactCardLead}>{copy.infoCopy}</p>

            <div className={styles.contactDetailList}>
              {copy.details.map((detail) => (
                <div key={detail.label} className={styles.contactDetailRow}>
                  <div className={styles.contactDetailIcon}>{detail.icon}</div>
                  <div>
                    <span className={styles.contactDetailLabel}>{detail.label}</span>
                    <div className={styles.contactDetailValue}>{detail.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className={styles.contactFormCard}>
            <h2 className={styles.contactCardTitle}>{copy.formTitle}</h2>
            {selectedExperience ? (
              <div className={styles.selectionBanner}>
                <span className={styles.selectionBannerLabel}>{copy.selectedExperienceLabel}</span>
                <strong className={styles.selectionBannerTitle}>{selectedExperience.title}</strong>
                <p className={styles.selectionBannerCopy}>{selectedExperience.summary}</p>
              </div>
            ) : null}
            <PublicBookingRequestForm
              requestedBungalowType={requestedBungalowType || undefined}
              requestedExperienceId={selectedExperience?.id}
              requestedCheckIn={requestedCheckIn}
              requestedCheckOut={requestedCheckOut}
              requestedGuests={requestedGuests}
              guestOptions={guestOptions}
              whatsappPhoneDisplay={corporate.contact.whatsapp}
              whatsappPhoneE164={corporate.contact.whatsapp.replace(/\D/g, "")}
              labels={{
                name: copy.labels.name,
                email: copy.labels.email,
                checkIn: copy.labels.checkIn,
                checkOut: copy.labels.checkOut,
                guests: copy.labels.guests,
                message: copy.labels.message,
                submit: copy.submitLabel,
                requestCreated: copy.requestCreated,
                requestCreatedCopy: copy.requestCreatedCopy,
                requestEmailSentCopy: copy.requestEmailSentCopy,
                requestEmailQueuedCopy: copy.requestEmailQueuedCopy,
                whatsappLabel: copy.whatsappLabel,
                whatsappPrompt: copy.whatsappPrompt,
                whatsappButton: copy.whatsappButton,
                whatsappPrefillTemplate: copy.whatsappPrefillTemplate,
                closeModal: copy.closeModal,
                requestFailed: copy.requestFailed,
                availabilityUnavailableTitle: copy.availabilityUnavailableTitle,
                availabilityUnavailableCopy: copy.availabilityUnavailableCopy,
                availabilityAlternativesLabel: copy.availabilityAlternativesLabel,
                availabilityAlternativeDatesLabel: copy.availabilityAlternativeDatesLabel,
                availabilityApplyDatesLabel: copy.availabilityApplyDatesLabel,
              }}
              placeholders={copy.placeholders}
            />
          </article>
        </div>
      </section>
    </>
  );
}
