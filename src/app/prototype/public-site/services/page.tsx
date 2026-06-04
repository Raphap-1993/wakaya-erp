import { PageHero } from '@/components/public-site/page-hero';
import styles from '@/components/public-site/public-site-theme.module.css';

const serviceCards = [
  {
    title: 'Piscina y jardines',
    tag: 'Relajo',
    copy: 'Espacios abiertos para descanso, lectura y pausa durante la estadía.',
    image: 'https://wakayaecolodge.com/es/images/wakaya/slider/slider_wakaya1.png',
  },
  {
    title: 'Laguna y entorno natural',
    tag: 'Naturaleza',
    copy: 'Un paisaje tropical que sostiene la atmósfera del ecolodge durante todo el recorrido.',
    image: 'https://wakayaecolodge.com/es/images/wakaya/slider/slider_wakaya2.png',
  },
  {
    title: 'Restaurante y atención',
    tag: 'Hospitalidad',
    copy: 'Coordinación directa con el equipo Wakaya para comidas, horarios y soporte.',
    image: 'https://wakayaecolodge.com/es/images/wakaya/habitaciones/BM_1.jpg',
  },
  {
    title: 'Escapadas y full day',
    tag: 'Experiencias',
    copy: 'Opciones flexibles para visitas cortas, celebraciones y fines de semana.',
    image: 'https://wakayaecolodge.com/es/images/wakaya/habitaciones/0BT_1.jpg',
  },
] as const;

export default function PublicSiteServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Servicios"
        title="Servicios"
        breadcrumb="Inicio / Servicios"
        copy="Experiencias y amenities reales de Wakaya para una estadía más clara."
      />

      <section className={styles.activitySection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionSubtitle}>Experiencia</span>
          <h2>Laguna, piscina, restaurante y más</h2>
          <p>
            Los servicios públicos priorizan una lectura rápida de lo esencial:
            entorno, descanso, coordinación y momentos especiales.
          </p>
        </div>

        <div className={styles.activityGrid}>
          {serviceCards.map((service) => (
            <article key={service.title} className={styles.activityCard}>
              <img src={service.image} alt={service.title} />
              <div className={styles.activityCopy}>
                <span className={styles.activityTag}>{service.tag}</span>
                <strong>{service.title}</strong>
                <span>{service.copy}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
