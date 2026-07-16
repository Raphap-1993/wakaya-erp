import { FigmaPageHero } from "@/components/public-site/figma-page-hero";
import styles from "@/components/public-site/figma-public-pages.module.css";
import type { PublicSiteLocale } from "@/components/public-site/public-site-locale";
import { getPublicBungalowDetailRoute } from "@/components/public-site/public-site-routes";
import { calculateCapacityAvailability } from "@/lib/bungalow-capacity/availability";
import { bungalowCapacityStore } from "@/lib/bungalow-capacity/store";
import { compareDateOnly } from "@/lib/reservations/date-utils";
import { reservationStore } from "@/lib/reservations/store";
import { getPublishedPublicSiteView } from "@/lib/corporate-content/public-view";
import { resolvePublicSiteMedia } from "@/lib/corporate-content/public-site-media";
import { getLocalizedBungalows } from "../public-site-content";
import { buildLocalizedPublicMetadata } from "../public-site-metadata";

type SearchParams = Record<string, string | string[] | undefined>;

type PageProps = {
  params: Promise<{ locale: string }> | { locale: string };
  searchParams?: Promise<SearchParams> | SearchParams;
};

function getSingleValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function parsePositiveInteger(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseCapacityLabel(value: string) {
  const match = value.match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : null;
}

function hasValidStayRange(checkIn: string, checkOut: string) {
  return Boolean(checkIn && checkOut) && compareDateOnly(checkIn, checkOut) <= 0;
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
  const site = await getPublishedPublicSiteView(locale);
  const copy = site.content.bungalows;

  return buildLocalizedPublicMetadata({
    locale,
    route: "bungalows",
    title: copy.metadata.title,
    description: copy.metadata.description,
    keywords:
      locale === "en"
        ? ["wakaya rooms", "amazon bungalows", "pucallpa stay"]
        : ["bungalows wakaya", "habitaciones amazónicas", "estadía pucallpa"],
    image: resolvePublicSiteMedia(site.media.bungalowsHero),
  });
}

export default async function LocalizedBungalowsPage({ params, searchParams }: PageProps) {
  const locale = await readLocale(params);
  const resolvedSearchParams = await resolveSearchParams(searchParams);
  const site = await getPublishedPublicSiteView(locale);
  const copy = site.content.bungalows;
  const category = getSingleValue(resolvedSearchParams.category);
  const checkIn = getSingleValue(resolvedSearchParams.checkIn);
  const checkOut = getSingleValue(resolvedSearchParams.checkOut);
  const guests = getSingleValue(resolvedSearchParams.guests);
  const requestedGuests = parsePositiveInteger(guests);
  const shouldCheckAvailability = hasValidStayRange(checkIn, checkOut);
  const hasInvalidStayRange = Boolean(checkIn && checkOut) && !shouldCheckAvailability;

  const allRooms = await getLocalizedBungalows(locale);
  const [operationalBungalows, overlappingReservations, capacities] =
    requestedGuests || shouldCheckAvailability
      ? await Promise.all([
          reservationStore.listBungalows(),
          shouldCheckAvailability ? reservationStore.list({ startDate: checkIn, endDate: checkOut }) : Promise.resolve([]),
          shouldCheckAvailability ? bungalowCapacityStore.listCapacities() : Promise.resolve([]),
        ])
      : [[], [], []];

  const capacityByOperationalId = new Map(
    operationalBungalows.map((bungalow) => [bungalow.id, bungalow.capacity] as const),
  );
  const rooms = hasInvalidStayRange
    ? []
    : allRooms.filter((room) => {
        if (category && room.slug !== category) {
          return false;
        }

        const capacity =
          (room.bookingRequestBungalowId
            ? capacityByOperationalId.get(room.bookingRequestBungalowId)
            : null) ?? parseCapacityLabel(room.displayCapacity);
        if (requestedGuests && capacity && capacity !== requestedGuests) {
          return false;
        }

        if (
          shouldCheckAvailability &&
          !room.bookingRequestBungalowId
        ) {
          return false;
        }

        if (
          shouldCheckAvailability &&
          room.bookingRequestBungalowId &&
          calculateCapacityAvailability({
            capacity: capacities.find((item) => item.bungalowId === room.bookingRequestBungalowId)!,
            reservations: overlappingReservations.map((reservation) => ({
              id: reservation.id,
              bungalowId: reservation.bungalowId,
              checkIn: reservation.startDate,
              checkOut: reservation.endDate,
              status: reservation.status,
            })),
            checkIn,
            checkOut,
          }).availableUnitsForStay <= 0
        ) {
          return false;
        }

        return true;
      });

  return (
    <>
      <FigmaPageHero
        meta={`${copy.hero.eyebrow} · Wakaya Ecolodge`}
        title={copy.hero.title}
        copy={copy.hero.copy}
        image={resolvePublicSiteMedia(site.media.bungalowsHero)}
      />

      <section className={styles.section}>
        <div className={styles.roomGrid}>
          {rooms.length > 0 ? (
            rooms.map((room) => {
              const search = new URLSearchParams();
              if (category) search.set("category", room.slug);
              if (checkIn) search.set("checkIn", checkIn);
              if (checkOut) search.set("checkOut", checkOut);
              if (guests) search.set("guests", guests);

              return (
                <article key={room.slug} className={styles.roomCard}>
                  <div className={styles.roomMedia}>
                    <img src={room.image} alt={room.displayName} />
                    <div className={styles.roomMediaBadge}>
                      {[room.displayCapacity, room.displayArea].filter(Boolean).join(" · ")}
                    </div>
                  </div>

                  <div className={styles.roomBody}>
                    <div className={styles.roomHeadingRow}>
                      <div className={styles.roomTitleWrap}>
                        <h2>{room.displayName}</h2>
                        <div className={styles.roomTagline}>{room.displayTagline}</div>
                      </div>

                      <div className={styles.priceStack}>
                        <div className={styles.priceValue}>{room.displayPriceFrom}</div>
                        {room.hasNightlyRate ? (
                          <div className={styles.priceLabel}>{copy.perNightLabel}</div>
                        ) : null}
                      </div>
                    </div>

                    <p className={styles.roomDescription}>{room.displayDescription}</p>

                    <div className={styles.chipGrid}>
                      {room.displayAmenities.slice(0, 5).map((amenity) => (
                        <span key={amenity} className={styles.chip}>
                          <span className={styles.chipDot} />
                          {amenity}
                        </span>
                      ))}
                    </div>

                    <a
                      className={styles.buttonLink}
                      href={getPublicBungalowDetailRoute(locale, room.slug, search)}
                    >
                      {copy.viewDetailLabel}
                    </a>
                  </div>
                </article>
              );
            })
          ) : (
            <article className={styles.storyPanel}>
              <h2 className={styles.storyTitle}>{copy.emptyTitle}</h2>
              <p className={styles.storyParagraph}>{copy.emptyCopy}</p>
            </article>
          )}
        </div>
      </section>
    </>
  );
}
