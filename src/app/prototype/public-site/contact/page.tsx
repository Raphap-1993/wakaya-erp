import { PageHero } from '@/components/public-site/page-hero';
import { footerContact } from '@/components/public-site/public-site-data';
import styles from '@/components/public-site/public-site-theme.module.css';

export default function PublicSiteContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contacto"
        title="Contacto"
        breadcrumb="Inicio / Contacto"
        copy="Canales directos para consulta, coordinación y seguimiento manual."
      />

      <section className={styles.eventSection}>
        <div className={styles.eventGrid}>
          <div className={styles.eventCopyCard}>
            <div>
              <strong>Hablemos de tu próxima estadía</strong>
              <p>
                Wakaya confirma disponibilidad, pagos y requerimientos especiales
                mediante atención personalizada.
              </p>
            </div>

            <ul className={styles.eventChecklist}>
              <li>{footerContact.place}</li>
              <li>{footerContact.domain}</li>
              <li>{footerContact.note}</li>
            </ul>
          </div>

          <div className={styles.eventVisualCard}>
            <span className={styles.eventVisualBadge}>Atención directa</span>
            <img
              src="https://wakayaecolodge.com/es/images/wakaya/slider/slider_wakaya1.png"
              alt="Canales de contacto de Wakaya"
            />
          </div>
        </div>
      </section>
    </>
  );
}
