import { use } from 'react';

import {
  getPublicBungalowLabel,
  publicBungalows,
} from '@/components/public-site/public-site-data';
import styles from '@/components/public-site/public-site-theme.module.css';

type SearchParams = Record<string, string | string[] | undefined>;

type PageProps = {
  searchParams?: Promise<SearchParams> | SearchParams;
};

function getSingleValue(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : '';
}

function formatGuests(guests: string) {
  if (!guests) {
    return 'Sin huéspedes';
  }

  return guests.includes('huésped') ? guests : `${guests} huéspedes`;
}

function isPromiseSearchParams(
  value: Promise<SearchParams> | SearchParams,
): value is Promise<SearchParams> {
  return typeof (value as Promise<SearchParams>).then === 'function';
}

function resolveSearchParams(
  searchParams?: Promise<SearchParams> | SearchParams,
): SearchParams {
  if (!searchParams) {
    return {};
  }

  if (isPromiseSearchParams(searchParams)) {
    return use(searchParams as Promise<SearchParams>);
  }

  return searchParams;
}

export default function BungalowsPage({ searchParams }: PageProps) {
  const params = resolveSearchParams(searchParams);
  const category = getSingleValue(params.category);
  const checkIn = getSingleValue(params.checkIn);
  const checkOut = getSingleValue(params.checkOut);
  const guests = getSingleValue(params.guests);

  const rooms = category
    ? publicBungalows.filter((bungalow) => bungalow.slug === category)
    : publicBungalows;
  const selectedCategory = publicBungalows.find((bungalow) => bungalow.slug === category);

  return (
    <section className={styles.roomSection}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionSubtitle}>Bungalows</span>
        <h1>Resultados de búsqueda</h1>
        <p>
          Revisa categorías referenciales para tu próxima estadía y entra al detalle
          de la opción que mejor encaje con tu viaje.
        </p>
      </div>

      <div className={styles.resultsMeta}>
        <strong>
          {checkIn || 'Sin fecha'} · {checkOut || 'Sin fecha'} · {formatGuests(guests)}
        </strong>
        <span>
          Categoría: {selectedCategory ? getPublicBungalowLabel(selectedCategory) : category || 'Todas las categorías'}
        </span>
      </div>

      <div className={styles.roomGrid}>
        {rooms.length > 0 ? (
          rooms.map((room) => (
            <article key={room.slug} className={styles.roomCard}>
              <div className={styles.roomImage}>
                <img src={room.image} alt={getPublicBungalowLabel(room)} />
              </div>
              <div className={styles.roomBody}>
                <span className={styles.roomEyebrow}>{room.eyebrow}</span>
                <h3>{getPublicBungalowLabel(room)}</h3>
                <p>{room.description}</p>
                <div className={styles.roomMeta}>
                  <span>{room.capacity}</span>
                  <span>{room.priceFrom}</span>
                </div>
                <a
                  className={styles.primaryButton}
                  href={`/prototype/public-site/bungalows/${room.slug}`}
                >
                  Ver detalle
                </a>
              </div>
            </article>
          ))
        ) : (
          <div className={styles.emptyCard}>
            <strong>No encontramos coincidencias con esos filtros.</strong>
            <p>Ajusta fechas o categoría para revisar más opciones referenciales.</p>
          </div>
        )}
      </div>
    </section>
  );
}
