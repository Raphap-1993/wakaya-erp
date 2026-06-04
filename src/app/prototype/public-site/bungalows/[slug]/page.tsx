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
};

export function generateStaticParams() {
  return publicBungalows.map((bungalow) => ({ slug: bungalow.slug }));
}

export default async function BungalowDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const room = publicBungalows.find((item) => item.slug === slug);

  if (!room) {
    notFound();
  }

  const roomName = getPublicBungalowLabel(room);

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
              <a className={styles.primaryButton} href="/prototype/public-site/contact">
                Coordinar reserva
              </a>
              <a className={styles.ghostButton} href="/prototype/public-site/bungalows">
                Volver a resultados
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
