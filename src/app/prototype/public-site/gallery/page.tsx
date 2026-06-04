import { PageHero } from '@/components/public-site/page-hero';
import styles from '@/components/public-site/public-site-theme.module.css';

const galleryCards = [
  {
    title: 'Arquitectura tropical',
    tag: 'Espacio',
    image: 'https://wakayaecolodge.com/es/images/wakaya/slider/slider_wakaya1.png',
  },
  {
    title: 'Jardines y vegetación',
    tag: 'Entorno',
    image: 'https://wakayaecolodge.com/es/images/wakaya/slider/slider_wakaya2.png',
  },
  {
    title: 'Bungalows cálidos',
    tag: 'Hospedaje',
    image: 'https://wakayaecolodge.com/es/images/wakaya/habitaciones/BF_1.jpg',
  },
  {
    title: 'Rincones de descanso',
    tag: 'Atmósfera',
    image: 'https://wakayaecolodge.com/es/images/wakaya/habitaciones/0BT_1.jpg',
  },
] as const;

export default function PublicSiteGalleryPage() {
  return (
    <>
      <PageHero
        eyebrow="Galería"
        title="Galería"
        breadcrumb="Inicio / Galería"
        copy="Agua, vegetación, arquitectura y uso humano del lugar."
      />

      <section className={styles.activitySection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionSubtitle}>Imágenes</span>
          <h2>Atmósfera del ecolodge</h2>
          <p>
            Un recorrido visual breve para sostener la promesa del sitio sin romper
            la continuidad con el resto del prototipo público.
          </p>
        </div>

        <div className={styles.activityGrid}>
          {galleryCards.map((item) => (
            <article key={item.title} className={styles.activityCard}>
              <img src={item.image} alt={item.title} />
              <div className={styles.activityCopy}>
                <span className={styles.activityTag}>{item.tag}</span>
                <strong>{item.title}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
