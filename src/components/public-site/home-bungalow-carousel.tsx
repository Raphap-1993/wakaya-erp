"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRef } from "react";

import type { PublicSiteLocale } from "./public-site-locale";
import { getPublicBungalowDetailRoute } from "./public-site-routes";
import styles from "./home-prototype.module.css";

export type HomeBungalowCarouselItem = {
  slug: string;
  image: string;
  displayName: string;
  displayPriceFrom: string;
  displayTagline: string;
  displayDescription: string;
  displayCapacity: string;
  displayArea: string;
};

export function HomeBungalowCarousel({
  locale,
  rooms,
  detailLabel,
}: {
  locale: PublicSiteLocale;
  rooms: HomeBungalowCarouselItem[];
  detailLabel: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const labels = locale === "en"
    ? { region: "Wakaya bungalows", previous: "Previous bungalows", next: "Next bungalows" }
    : { region: "Bungalows de Wakaya", previous: "Bungalows anteriores", next: "Siguientes bungalows" };

  function move(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.86, behavior: "smooth" });
  }

  return (
    <div className={styles.roomCarousel} role="region" aria-label={labels.region}>
      <div className={styles.roomCarouselControls}>
        <button type="button" onClick={() => move(-1)} aria-label={labels.previous}>
          <span aria-hidden="true">←</span>
        </button>
        <button type="button" onClick={() => move(1)} aria-label={labels.next}>
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <div className={styles.roomCarouselTrack} ref={trackRef}>
        {rooms.map((room) => (
          <article
            key={room.slug}
            className={styles.roomGridCard}
            data-home-section="room-grid-card"
          >
            <div className={styles.roomGridMedia}>
              <img src={room.image} alt={room.displayName} />
              <div className={styles.roomGridShade} />
              <div className={styles.roomGridPriceBadge}>
                <span>{room.displayPriceFrom}</span>
              </div>
            </div>

            <div className={styles.roomGridBody}>
              <p className={styles.roomGridEyebrow}>{room.displayTagline}</p>
              <h3>{room.displayName}</h3>
              <p>{room.displayDescription}</p>
              <div className={styles.roomGridFacts}>
                <span>{room.displayCapacity}</span>
                <span>{room.displayArea}</span>
              </div>
              <Link
                className={styles.roomGridLink}
                href={getPublicBungalowDetailRoute(locale, room.slug) as Route}
              >
                {detailLabel}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
