import { PageHero } from '@/components/public-site/page-hero';
import styles from '@/components/public-site/public-site-theme.module.css';

export default function PublicSiteEventsPage() {
  return (
    <>
      <PageHero
        eyebrow="Eventos"
        title="Eventos"
        breadcrumb="Inicio / Eventos"
        copy="Celebraciones, corporativo y encuentros especiales en entorno natural."
      />

      <section className={styles.eventSection}>
        <div className={styles.eventGrid}>
          <div className={styles.eventVisualCard}>
            <span className={styles.eventVisualBadge}>Venue natural</span>
            <img
              src="https://wakayaecolodge.com/es/images/wakaya/slider/slider_wakaya2.png"
              alt="Espacio natural para eventos en Wakaya"
            />
          </div>

          <div className={styles.eventCopyCard}>
            <div>
              <strong>Wakaya como venue natural</strong>
              <p>
                La capa pública describe con claridad un espacio flexible para
                reuniones, celebraciones íntimas y actividades corporativas.
              </p>
            </div>

            <ul className={styles.eventChecklist}>
              <li>Coordinación previa con el equipo Wakaya.</li>
              <li>Capacidad adaptable según formato del encuentro.</li>
              <li>Integración con bungalows y servicios del lodge.</li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
