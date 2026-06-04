import type { Route } from 'next';
import Link from 'next/link';

import { PageHero } from '@/components/public-site/page-hero';
import {
  publications,
  publicNav,
} from '@/components/public-site/public-site-data';
import styles from '@/components/public-site/public-site-theme.module.css';

export default function PublicSitePublicationsPage() {
  return (
    <>
      <PageHero
        eyebrow="Publicaciones"
        title="Publicaciones"
        breadcrumb="Inicio / Publicaciones"
        copy="Historias, temporadas y experiencias compartidas desde Wakaya."
      />

      <section className={styles.publicationSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionSubtitle}>Lecturas</span>
          <h2>Novedades de Wakaya</h2>
          <p>
            Una capa editorial simple para sostener descubrimiento, contexto y
            continuidad con el resto de las páginas públicas.
          </p>
        </div>

        <div className={styles.publicationGrid}>
          {publications.map((publication) => (
            <article key={publication.slug} className={styles.publicationCard}>
              <strong>{publication.title}</strong>
              <Link href={'/prototype/public-site/contact' as Route}>
                Solicitar más información
              </Link>
            </article>
          ))}
        </div>

        <div className={styles.newsletterSection}>
          <div className={styles.newsletterCard}>
            <span className={styles.sectionSubtitle}>Explora más</span>
            <h2>Continúa el recorrido por la experiencia pública de Wakaya.</h2>
            <p>
              Desde aquí puedes volver a los bungalows, revisar servicios o pasar
              directo a contacto sin salir del mismo lenguaje visual.
            </p>
            <Link
              className={styles.primaryButton}
              href={publicNav[2].href as Route}
            >
              Ver bungalows
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
