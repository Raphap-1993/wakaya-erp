import { notFound } from "next/navigation";

import { FigmaRoomGallery } from "@/components/public-site/figma-room-gallery";
import { FigmaRoomRequestCard } from "@/components/public-site/figma-room-request-card";
import type { PublicSiteLocale } from "@/components/public-site/public-site-locale";
import { getPublicRoute } from "@/components/public-site/public-site-routes";
import figmaStyles from "@/components/public-site/room-detail-figma.module.css";
import styles from "@/components/public-site/public-site-theme.module.css";
import { listSoldOutCapacityRanges } from "@/lib/bungalow-capacity/public-availability";
import { bungalowCapacityStore } from "@/lib/bungalow-capacity/store";
import { getPublishedCorporateView } from "@/lib/corporate-content/public-view";
import { getPublishedPublicSiteContent } from "@/lib/corporate-content/public-view";
import { reservationStore } from "@/lib/reservations/store";
import { getLocalizedBungalow } from "../../public-site-content";
import { buildLocalizedBungalowMetadata } from "../../public-site-metadata";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string; slug: string }> | { locale: string; slug: string };
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

function getSingleValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

async function resolveSearchParams(
  searchParams: PageProps["searchParams"],
): Promise<Record<string, string | string[] | undefined>> {
  if (!searchParams) {
    return {};
  }

  return await searchParams;
}

async function readParams(
  params: Promise<{ locale: string; slug: string }> | { locale: string; slug: string },
): Promise<{ locale: PublicSiteLocale; slug: string }> {
  const resolvedParams = await params;
  return {
    locale: resolvedParams.locale as PublicSiteLocale,
    slug: resolvedParams.slug,
  };
}

function parseFirstNumber(value: string, fallback: number) {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : fallback;
}

export function getBungalowReviewKey(
  review: { name: string; origin: string },
  index: number,
) {
  return `${review.name}-${review.origin}-${index}`;
}

function iconForAmenity(label: string) {
  const normalized = label.toLowerCase();

  if (normalized.includes("wifi")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 20h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M2 8.82a15 15 0 0 1 20 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M5 12.86a10 10 0 0 1 14 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M8.5 16.43a5 5 0 0 1 7 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }

  if (
    normalized.includes("aire") ||
    normalized.includes("ventilador") ||
    normalized.includes("ventilation")
  ) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12.8 19.6A2 2 0 1 0 14 16H2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M17.5 8a2.5 2.5 0 1 1 2 4H2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M9.8 4.4A2 2 0 1 1 11 8H2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }

  if (normalized.includes("ducha") || normalized.includes("baño") || normalized.includes("bath")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M6 10h11a3 3 0 0 1 0 6H7a5 5 0 0 1-5-5V5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M8 10V7a4 4 0 0 1 8 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }

  if (normalized.includes("desayuno") || normalized.includes("breakfast")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M18 8h1a3 3 0 1 1 0 6h-1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M2 8h14v5a7 7 0 0 1-14 0V8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M6 2v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M10 2v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }

  if (normalized.includes("tv")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
        <path d="M9 19v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M15 19v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }

  if (normalized.includes("piscina") || normalized.includes("pool")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M2 12c1 0 1.5-1 2.5-1s1.5 1 2.5 1 1.5-1 2.5-1 1.5 1 2.5 1 1.5-1 2.5-1 1.5 1 2.5 1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M2 17c1 0 1.5-1 2.5-1s1.5 1 2.5 1 1.5-1 2.5-1 1.5 1 2.5 1 1.5-1 2.5-1 1.5 1 2.5 1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }

  if (normalized.includes("estacionamiento") || normalized.includes("parking")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M7 16h10l1.5-4.5A2 2 0 0 0 16.6 9H7.4a2 2 0 0 0-1.9 1.5L4 16Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <circle cx="7.5" cy="16.5" r="1.5" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="16.5" cy="16.5" r="1.5" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    );
  }

  if (normalized.includes("seguridad") || normalized.includes("security")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (normalized.includes("terraza") || normalized.includes("terrace")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 12h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M7 12V7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M17 12V7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M6 17h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 6v12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M6 12h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function iconForDetail(kind: "capacity" | "area" | "rate" | "checkin" | "checkout" | "policy") {
  switch (kind) {
    case "capacity":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.7" />
          <circle cx="17" cy="10" r="2" stroke="currentColor" strokeWidth="1.7" />
          <path d="M4 20a5 5 0 0 1 10 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M15 20a4 4 0 0 1 6 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "area":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 5h14v14H5z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M9 9h6v6H9z" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case "rate":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 2v20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path
            d="M17 6.5c0-1.4-2.2-2.5-5-2.5S7 5.1 7 6.5 9.2 9 12 9s5 1.1 5 2.5S14.8 14 12 14s-5 1.1-5 2.5S9.2 19 12 19s5-1.1 5-2.5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      );
    case "checkin":
    case "checkout":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.7" />
          <path d="M8 3v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M16 3v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M3 10h18" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case "policy":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

export async function generateMetadata({ params }: Pick<PageProps, "params">) {
  const { locale, slug } = await readParams(params);
  const room = await getLocalizedBungalow(locale, slug);
  const content = await getPublishedPublicSiteContent(locale);

  if (!room) {
    return buildLocalizedBungalowMetadata({
      locale,
      slug,
      title: content.bungalows.metadata.title,
      description: content.bungalows.metadata.description,
    });
  }

  return buildLocalizedBungalowMetadata({
    locale,
    slug: room.slug,
    title: `${room.displayName} | Wakaya Ecolodge`,
    description: `${room.displayDescription} ${room.displayCapacity}. ${room.displayPriceFrom}.`,
    keywords: [...content.bungalowDetail.metadataKeywords, room.displayName],
    image: room.image,
  });
}

export function generateStaticParams() {
  return [
    { locale: "es", slug: "bungalow-familiar" },
    { locale: "es", slug: "bungalow-matrimonial" },
    { locale: "es", slug: "bungalow-individual" },
    { locale: "es", slug: "bungalow-doble" },
    { locale: "es", slug: "bungalow-triple" },
    { locale: "en", slug: "bungalow-familiar" },
    { locale: "en", slug: "bungalow-matrimonial" },
    { locale: "en", slug: "bungalow-individual" },
    { locale: "en", slug: "bungalow-doble" },
    { locale: "en", slug: "bungalow-triple" },
  ];
}

export default async function LocalizedBungalowDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { locale, slug } = await readParams(params);
  const corporate = await getPublishedCorporateView(locale);
  const content = corporate.siteContent;
  const resolvedSearchParams = await resolveSearchParams(searchParams);
  const room = await getLocalizedBungalow(locale, slug);

  if (!room) {
    notFound();
  }
  let blockedDateRanges: Array<{ startDate: string; endDate: string }> = [];
  if (room.bookingRequestBungalowId) {
    const bungalowId = room.bookingRequestBungalowId;
    const [capacity, reservations] = await Promise.all([
      bungalowCapacityStore.getCapacity(bungalowId),
      reservationStore.list(),
    ]);
    if (capacity) {
      blockedDateRanges = listSoldOutCapacityRanges({
        capacity,
        reservations: reservations.map((reservation) => ({
          id: reservation.id,
          bungalowId: reservation.bungalowId,
          checkIn: reservation.startDate,
          checkOut: reservation.endDate,
          status: reservation.status,
        })),
      });
    }
  }

  const category = getSingleValue(resolvedSearchParams.category);
  const checkIn = getSingleValue(resolvedSearchParams.checkIn);
  const checkOut = getSingleValue(resolvedSearchParams.checkOut);
  const guests = getSingleValue(resolvedSearchParams.guests);
  const backSearchParams = new URLSearchParams();
  if (category) backSearchParams.set("category", category);
  if (checkIn) backSearchParams.set("checkIn", checkIn);
  if (checkOut) backSearchParams.set("checkOut", checkOut);
  if (guests) backSearchParams.set("guests", guests);

  const ratingLabel = locale === "en" ? "4.9 · 48 reviews" : "4.9 · 48 reseñas";
  const reviewTitle = locale === "en" ? "Guest reviews" : "Reseñas de huéspedes";
  const aboutTitle = locale === "en" ? "About this bungalow" : "Sobre este bungalow";
  const capacityLabel = locale === "en" ? "Capacity" : "Capacidad";
  const areaLabel = locale === "en" ? "Area" : "Superficie";
  const priceLabel = locale === "en" ? "Price/night" : "Precio/noche";
  const checkInLabel = locale === "en" ? "Check-in" : "Check-in";
  const checkOutLabel = locale === "en" ? "Check-out" : "Check-out";
  const cancellationLabel = locale === "en" ? "Cancellation" : "Cancelación";
  const cancellationValue = locale === "en" ? "Free within 48h" : "48h libre";
  const personSingular = locale === "en" ? "guest" : "persona";
  const personPlural = locale === "en" ? "guests" : "personas";
  const selectDatesLabel = locale === "en" ? "Select dates" : "Selecciona las fechas";
  const pricePerNight = parseFirstNumber(room.displayPriceFrom, 0);
  const maxGuests = parseFirstNumber(room.displayCapacity, 1);
  const minGuests = maxGuests;
  const parsedGuests = guests ? Number(guests) : Number.NaN;
  const initialGuests = Number.isFinite(parsedGuests)
    ? Math.min(Math.max(parsedGuests, minGuests), maxGuests)
    : minGuests;
  const reviews = corporate.content.testimonials.items.map((review) => ({
    name: review.author,
    origin: review.country,
    rating: 5,
    text: review.quote,
    avatar: review.author
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? "")
      .join("")
      .toUpperCase(),
  }));

  return (
    <section className={`${styles.pageSection} ${styles.detailShell} ${figmaStyles.surface}`}>
      <div className={`${styles.detailGrid} ${figmaStyles.surface}`}>
        <div className={styles.detailMain}>
          <div className={figmaStyles.breadcrumbRow}>
            <a href={getPublicRoute(locale, "home")}>{content.labels.breadcrumbHome}</a>
            <span>/</span>
            <a href={getPublicRoute(locale, "bungalows")}>{content.bungalowDetail.breadcrumbLabel}</a>
            <span>/</span>
            <span>{room.displayName}</span>
          </div>

          <header className={figmaStyles.storyHeader}>
            <span className={figmaStyles.storyKicker}>{room.displayEyebrow}</span>
            <h1 className={figmaStyles.storyTitle}>{room.displayName}</h1>

            <div className={figmaStyles.ratingRow}>
              <span className={figmaStyles.starRow}>★★★★★</span>
              <span>{ratingLabel}</span>
              <span>·</span>
              <span className={figmaStyles.locationBadge}>
                <span className={figmaStyles.locationDot} />
                <span>Pucallpa, Perú</span>
              </span>
            </div>
          </header>

          <FigmaRoomGallery images={room.gallery} roomName={room.displayName} />

          <div className={figmaStyles.highlightRow}>
            {room.displayHighlights.map((highlight) => (
              <span key={highlight} className={figmaStyles.highlightChip}>
                <span className={figmaStyles.highlightChipIcon} />
                {highlight}
              </span>
            ))}
          </div>

          <section className={figmaStyles.section}>
            <h2 className={figmaStyles.sectionTitle}>{aboutTitle}</h2>
            <p className={figmaStyles.sectionBody}>{room.displayLongDescription}</p>
          </section>

          {room.displayAmenities.length > 0 ? (
            <section className={figmaStyles.section}>
              <h2 className={figmaStyles.sectionTitle}>{content.bungalowDetail.amenitiesTitle}</h2>
              <div className={figmaStyles.amenityGrid}>
                {room.displayAmenities.map((amenity) => (
                  <article key={amenity} className={figmaStyles.amenityCard}>
                    <div className={figmaStyles.amenityIconWrap}>{iconForAmenity(amenity)}</div>
                    <span className={figmaStyles.amenityLabel}>{amenity}</span>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {room.displayIncluded.length > 0 ? (
            <section className={figmaStyles.section}>
              <h2 className={figmaStyles.sectionTitle}>{content.bungalowDetail.includedTitle}</h2>
              <div className={figmaStyles.includedGrid}>
                {room.displayIncluded.map((item) => (
                  <div key={item} className={figmaStyles.includedItem}>
                    <div className={figmaStyles.includedItemCheck}>
                      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                          d="M5 12.5 9.2 16.5 19 7.5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className={figmaStyles.section}>
            <h2 className={figmaStyles.sectionTitle}>{content.bungalowDetail.detailsTitle}</h2>
            <div className={figmaStyles.detailGridExact}>
              {[
                {
                  label: capacityLabel,
                  value: `${maxGuests} ${maxGuests === 1 ? personSingular : personPlural}`,
                  icon: iconForDetail("capacity"),
                },
                room.displayArea ? { label: areaLabel, value: room.displayArea, icon: iconForDetail("area") } : null,
                { label: priceLabel, value: room.displayPriceFrom, icon: iconForDetail("rate") },
                { label: checkInLabel, value: "14:00 h", icon: iconForDetail("checkin") },
                { label: checkOutLabel, value: "12:00 h", icon: iconForDetail("checkout") },
                { label: cancellationLabel, value: cancellationValue, icon: iconForDetail("policy") },
              ].filter((detail): detail is NonNullable<typeof detail> => Boolean(detail)).map((detail) => (
                <article key={detail.label} className={figmaStyles.detailCard}>
                  <div className={figmaStyles.detailCardIcon}>{detail.icon}</div>
                  <div className={figmaStyles.detailCardValue}>{detail.value}</div>
                  <div className={figmaStyles.detailCardLabel}>{detail.label}</div>
                </article>
              ))}
            </div>
          </section>

          <section className={figmaStyles.section}>
            <h2 className={figmaStyles.sectionTitle}>{reviewTitle}</h2>
            <div className={figmaStyles.reviewList}>
              {reviews.map((review, index) => (
                <article key={getBungalowReviewKey(review, index)} className={figmaStyles.reviewCard}>
                  <div className={figmaStyles.reviewHeader}>
                    <div className={figmaStyles.reviewIdentity}>
                      <div className={figmaStyles.reviewAvatar}>{review.avatar}</div>
                      <div>
                        <div className={figmaStyles.reviewName}>{review.name}</div>
                        <div className={figmaStyles.reviewOrigin}>{review.origin}</div>
                      </div>
                    </div>
                    <span className={figmaStyles.starRow}>
                      {"★".repeat(review.rating)}
                    </span>
                  </div>
                  <p className={figmaStyles.reviewQuote}>“{review.text}”</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className={styles.detailSidebar}>
          <div className={styles.detailSidebarCard}>
            <FigmaRoomRequestCard
              initialCheckIn={checkIn}
              initialCheckOut={checkOut}
              initialGuests={initialGuests}
              minGuests={minGuests}
              maxGuests={maxGuests}
              pricePerNight={pricePerNight}
              priceDisplayLabel={room.displayPriceFrom}
              requestBungalowType={room.bookingRequestBungalowId}
              blockedDateRanges={blockedDateRanges}
              requestLabel={content.bungalowDetail.requestLabel}
              selectDatesLabel={selectDatesLabel}
              proofNote={content.bungalowDetail.proofNote}
              whatsappPhoneDisplay={corporate.contact.whatsapp}
              whatsappPhoneE164={corporate.contact.whatsapp.replace(/\D/g, "")}
              labels={{
                arrival: locale === "en" ? "Arrival" : "Llegada",
                departure: locale === "en" ? "Departure" : "Salida",
                guests: locale === "en" ? "Guests" : "Huéspedes",
                person: locale === "en" ? "person" : "persona",
                people: locale === "en" ? "people" : "personas",
                night: locale === "en" ? "night" : "noche",
                nights: locale === "en" ? "nights" : "noches",
                total: locale === "en" ? "Total" : "Total",
                taxesIncluded: locale === "en" ? "Taxes and fees" : "Tasas e impuestos",
                included: locale === "en" ? "included" : "incluidos",
                perNight: locale === "en" ? "/night" : "/noche",
                preferCall: locale === "en" ? "Prefer to call?" : "¿Prefieres llamar?",
                phone: corporate.contact.phones[0] ?? corporate.contact.whatsapp,
                hours: corporate.contact.hours[locale],
                guestName: locale === "en" ? "Name" : "Nombre",
                guestEmail: locale === "en" ? "Email" : "Email",
                guestPhone: locale === "en" ? "Phone or WhatsApp" : "Teléfono o WhatsApp",
                requestCreated: locale === "en" ? "Request sent" : "Solicitud enviada",
                requestCreatedCopy:
                  locale === "en"
                    ? "Your request is already with the Wakaya reservations team."
                    : "Tu solicitud ya está con el equipo de reservas de Wakaya.",
                requestEmailSentCopy:
                  locale === "en"
                    ? "Our team is already working on it and will contact you as soon as possible."
                    : "Nuestro equipo ya está trabajando en ella y te contactará lo antes posible.",
                requestEmailQueuedCopy:
                  locale === "en"
                    ? "Your request was registered. The Wakaya team will contact you."
                    : "Tu solicitud quedó registrada. El equipo Wakaya se comunicará contigo.",
                whatsappLabel: locale === "en" ? "Wakaya WhatsApp" : "WhatsApp Wakaya",
                whatsappPrompt:
                  locale === "en"
                    ? "If our team takes a bit longer to reply, message us on WhatsApp and share this request code."
                    : "Si nuestro equipo tarda un poco en escribirte, contáctanos por WhatsApp y comparte este código de solicitud.",
                whatsappButton: locale === "en" ? "Open Wakaya WhatsApp" : "Abrir WhatsApp Wakaya",
                whatsappPrefillTemplate:
                  locale === "en"
                    ? "Hello Wakaya, I just sent the booking request {publicRef} from the website and I would like to continue by WhatsApp."
                    : "Hola Wakaya, acabo de enviar la solicitud {publicRef} desde la web y deseo continuar por WhatsApp.",
                closeModal: locale === "en" ? "Close" : "Cerrar",
                requestFailed:
                  locale === "en"
                    ? "We could not send the request. Try again in a moment."
                    : "No pudimos enviar la solicitud. Inténtalo nuevamente en un momento.",
                fixedGuestsCopy:
                  locale === "en"
                    ? `Capacity: ${minGuests} ${minGuests === 1 ? "guest" : "guests"}.`
                    : `Capacidad: ${minGuests} ${minGuests === 1 ? "huésped" : "huéspedes"}.`,
                blockedDatesLabel: locale === "en" ? "Unavailable dates" : "Fechas ocupadas",
                blockedDatesConflictCopy:
                  locale === "en"
                    ? "Those dates are no longer available for this bungalow. Please choose another range."
                    : "Estas fechas ya están ocupadas para este bungalow. Elige otro rango.",
              }}
            />

            <a className={styles.detailBackButton} href={`${getPublicRoute(locale, "bungalows")}${backSearchParams.size ? `?${backSearchParams.toString()}` : ""}`}>
              {content.bungalowDetail.backLabel}
            </a>
          </div>
        </aside>
      </div>
    </section>
  );
}
