import { notFound } from 'next/navigation';

import { PageHero } from '@/components/public-site/page-hero';
import {
  footerContact,
  getPublicBungalowLabel,
  publicBungalows,
} from '@/components/public-site/public-site-data';
import styles from '@/components/public-site/public-site-theme.module.css';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

function getSingleValue(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : '';
}

async function resolveSearchParams(
  searchParams: PageProps['searchParams'],
): Promise<Record<string, string | string[] | undefined>> {
  if (!searchParams) {
    return {};
  }

  return searchParams instanceof Promise ? await searchParams : searchParams;
}

export function generateStaticParams() {
  return publicBungalows.map((bungalow) => ({ slug: bungalow.slug }));
}

export default async function BungalowDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await resolveSearchParams(searchParams);
  const room = publicBungalows.find((item) => item.slug === slug);

  if (!room) {
    notFound();
  }

  const roomName = getPublicBungalowLabel(room);
  const backSearchParams = new URLSearchParams();
  const category = getSingleValue(resolvedSearchParams.category) || room.slug;
  const checkIn = getSingleValue(resolvedSearchParams.checkIn);
  const checkOut = getSingleValue(resolvedSearchParams.checkOut);
  const guests = getSingleValue(resolvedSearchParams.guests);

  backSearchParams.set('category', category);

  if (checkIn) {
    backSearchParams.set('checkIn', checkIn);
  }

  if (checkOut) {
    backSearchParams.set('checkOut', checkOut);
  }

  if (guests) {
    backSearchParams.set('guests', guests);
  }

  const backHref = `/prototype/public-site/bungalows?${backSearchParams.toString()}`;
  const bookingRequestSearchParams = new URLSearchParams();
  bookingRequestSearchParams.set('requestedBungalowType', room.bookingRequestBungalowId ?? '');
  if (checkIn) {
    bookingRequestSearchParams.set('requestedCheckIn', checkIn);
  }
  if (checkOut) {
    bookingRequestSearchParams.set('requestedCheckOut', checkOut);
  }
  if (guests) {
    bookingRequestSearchParams.set('requestedGuests', guests);
  }
  const contactHref = `/prototype/public-site/contact?${bookingRequestSearchParams.toString()}`;

  return (
    <>
      <PageHero
        eyebrow="Bungalow"
        title={roomName}
        breadcrumb={`Inicio / Bungalows / ${roomName}`}
        copy={`${room.capacity} · ${room.priceFrom}`}
      />

      <section className={styles.eventSection}>
        <div className={styles.eventGrid}>
          <div className={styles.eventVisualCard}>
            <span className={styles.eventVisualBadge}>{room.eyebrow}</span>
            <img src={room.image} alt={roomName} />
          </div>

          <div className={styles.eventCopyCard}>
            <div>
              <strong>Experiencia de la categoría</strong>
              <p>{room.description}</p>
            </div>

            <div className={styles.roomMeta}>
              <span>{room.capacity}</span>
              <span>{room.priceFrom}</span>
              <span>{footerContact.place}</span>
            </div>

            <ul className={styles.eventChecklist}>
              <li>Disponibilidad referencial con validación manual del equipo Wakaya.</li>
              <li>Coordinación directa para check-in, check-out y forma de pago.</li>
              <li>Continuidad clara desde la búsqueda hasta el detalle de la categoría.</li>
            </ul>

            <div className={styles.actions}>
              <a className={styles.primaryButton} href={contactHref}>
                Enviar solicitud
              </a>
              <a className={styles.ghostButton} href={backHref}>
                Volver a resultados
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
