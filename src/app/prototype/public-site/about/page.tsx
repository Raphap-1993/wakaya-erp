import Link from 'next/link';

import { PageHero } from '@/components/public-site/page-hero';
import { buildPublicMetadata } from '@/components/public-site/public-site-metadata';
import styles from '@/components/public-site/public-site-theme.module.css';

export const metadata = buildPublicMetadata({
  title: 'Nosotros | Wakaya Ecolodge',
  description:
    'Conoce la historia, el ritmo de hospitalidad y la propuesta natural de Wakaya Ecolodge en Pucallpa.',
  path: '/prototype/public-site/about',
  keywords: ['nosotros', 'wakaya ecolodge', 'pucallpa', 'hotel amazónico'],
});

export default function PublicSiteAboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Nosotros"
        title="Acerca de Wakaya"
        breadcrumb="Inicio / Nosotros"
        copy="Historia, naturaleza, propósito y hospitalidad real en el ecolodge."
      />

      <section className={styles.aboutSection}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionSubtitle}>Ecolodge amazónico</span>
          <h2>Un paraíso en el corazón de Pucallpa</h2>
          <p className={styles.aboutLead}>
            Wakaya reúne jardines, laguna, piscina y descanso tropical en una
            experiencia pensada para familias, parejas y escapadas cortas.
          </p>
        </div>

        <div className={styles.aboutMosaic}>
          <div className={styles.aboutImageLarge}>
            <img
              src="https://wakayaecolodge.com/es/images/wakaya/slider/slider_wakaya1.png"
              alt="Vista principal de Wakaya Ecolodge"
            />
          </div>

          <div className={styles.aboutStack}>
            <div className={styles.aboutImageSmall}>
              <img
                src="https://wakayaecolodge.com/es/images/wakaya/slider/slider_wakaya2.png"
                alt="Jardines tropicales de Wakaya"
              />
            </div>

            <div className={styles.aboutFactCard}>
              <strong>365</strong>
              <span>días de clima cálido y atención personalizada</span>
              <p>
                Una llegada simple, natural y coherente con la hospitalidad que
                Wakaya busca mostrar en toda su capa pública.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.testimonialSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionSubtitle}>Nuestra forma de recibir</span>
          <h2>Naturaleza, hospitalidad y celebraciones</h2>
          <p>
            Wakaya equilibra descanso, atención humana y momentos compartidos para
            que cada visita se sienta clara desde la primera consulta.
          </p>
        </div>

        <div className={styles.testimonialGrid}>
          <article className={styles.quoteCard}>
            <strong>Hospitalidad con criterio humano</strong>
            <p>
              La reserva no termina en un formulario: el equipo acompaña cada
              solicitud, confirma fechas y coordina detalles antes de convertirla
              en estadía real.
            </p>
          </article>

          <article className={styles.quoteCard}>
            <strong>Experiencias con ritmo tropical</strong>
            <p>
              Jardines, piscina, laguna y bungalows cálidos sostienen una narrativa
              visual consistente entre escapadas, celebraciones y descanso corto.
            </p>
          </article>
        </div>
      </section>

      <section className={styles.newsletterSection}>
        <div className={styles.newsletterCard}>
          <span className={styles.sectionSubtitle}>Reservas con acompañamiento</span>
          <h2>Planifica tu llegada con el equipo de reservas</h2>
          <p>
            Si ya tienes fechas tentativas o una categoría en mente, envía tu
            solicitud y Wakaya continuará el hilo desde
            <strong> reservas@wakayaecolodge.com</strong>.
          </p>
          <Link className={styles.primaryButton} href="/prototype/public-site/contact">
            Enviar solicitud
          </Link>
        </div>
      </section>
    </>
  );
}
