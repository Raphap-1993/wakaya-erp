import { PageHero } from '@/components/public-site/page-hero';
import styles from '@/components/public-site/public-site-theme.module.css';

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
    </>
  );
}
