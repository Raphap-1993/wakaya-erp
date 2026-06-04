import type { Route } from 'next';
import Link from 'next/link';

import { BookingBand } from '@/components/public-site/booking-band';
import {
  homeSlides,
  publications,
  publicBungalows,
  testimonials,
} from '@/components/public-site/public-site-data';
import styles from '@/components/public-site/public-site-theme.module.css';

const featuredRooms = publicBungalows.filter((room) => room.featuredOnHome).slice(0, 3);

export default function PublicSitePrototypePage() {
  const hero = homeSlides[0];

  return (
    <>
      <section className={styles.homeHero} id="home">
        <div
          className={styles.homeHeroSlide}
          style={{
            backgroundImage: `linear-gradient(rgba(17, 25, 22, 0.38), rgba(17, 25, 22, 0.46)), url(${hero.image})`,
          }}
        >
          <div className={styles.homeHeroCopy}>
            <span className={styles.heroKicker}>{hero.eyebrow}</span>
            <h1>{hero.title}</h1>
            <p>{hero.copy}</p>

            <div className={styles.heroActions}>
              <Link
                className={styles.primaryButton}
                href={'/prototype/public-site/bungalows' as Route}
              >
                Consultar disponibilidad
              </Link>
              <Link
                className={styles.ghostButton}
                href={'/prototype/public-site/bungalows' as Route}
              >
                Ver bungalows
              </Link>
            </div>

            <div className={styles.homeHeroDeck}>
              {homeSlides.map((slide) => (
                <article key={slide.title} className={styles.homeHeroDeckCard}>
                  <strong>{slide.title}</strong>
                  <span>{slide.copy}</span>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <BookingBand />

      <section className={styles.roomSection} id="bungalows">
        <div className={styles.sectionHeader}>
          <span className={styles.sectionSubtitle}>Bungalows</span>
          <h2>Refugios cálidos para una llegada más clara y directa.</h2>
          <p>
            Wakaya presenta las categorías principales con lectura rápida de
            capacidad, tarifa base y acceso inmediato a la consulta.
          </p>
        </div>

        <div className={styles.roomGrid}>
          {featuredRooms.map((room) => (
            <article key={room.slug} className={styles.roomCard}>
              <div className={styles.roomImage}>
                <img src={room.image} alt={room.homeName ?? room.name} />
              </div>

              <div className={styles.roomBody}>
                <span className={styles.roomEyebrow}>{room.eyebrow}</span>
                <h3>{room.homeName ?? room.name}</h3>
                <p>{room.description}</p>

                <div className={styles.roomMeta}>
                  <span>{room.capacity}</span>
                  <span>{room.priceFrom}</span>
                </div>

                <Link
                  className={styles.primaryButton}
                  href={'/prototype/public-site/bungalows' as Route}
                >
                  Ver detalle
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.testimonialSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionSubtitle}>Testimonios</span>
          <h2>Una experiencia que se recuerda por calma, entorno y retiro.</h2>
        </div>

        <div className={styles.testimonialGrid}>
          {testimonials.map((item) => (
            <article key={item.name} className={styles.quoteCard}>
              <strong>{item.name}</strong>
              <p>{item.quote}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.publicationSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionSubtitle}>Publicaciones</span>
          <h2>Historias y guías para seguir descubriendo Wakaya.</h2>
        </div>

        <div className={styles.publicationGrid}>
          {publications.map((item) => (
            <article key={item.slug} className={styles.publicationCard}>
              <strong>{item.title}</strong>
              <Link href={'/prototype/public-site/publications' as Route}>Leer más</Link>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.newsletterSection}>
        <div className={styles.newsletterCard}>
          <span className={styles.sectionSubtitle}>Newsletter</span>
          <h2>Recibe novedades, experiencias y temporadas destacadas de Wakaya.</h2>
          <p>
            Una suscripción ligera para enterarte de escapadas, celebraciones y
            momentos especiales alrededor del lodge.
          </p>
          <Link
            className={styles.primaryButton}
            href={'/prototype/public-site/contact' as Route}
          >
            Solicitar novedades
          </Link>
        </div>
      </section>
    </>
  );
}
