import type { Route } from 'next';
import Link from 'next/link';

import { PlaySectionTitle } from '@/components/public-site/play-section-title';
import { BookingBand } from '@/components/public-site/booking-band';
import { publicBungalows } from '@/components/public-site/public-site-data';
import styles from '@/components/public-site/public-site-theme.module.css';

const activities = [
  {
    name: 'Piscina',
    tag: 'Relax',
    text: 'Áreas abiertas para pasar el día, desconectar y sumar valor a la estadía.',
    image: 'https://wakayaecolodge.com/es/images/wakaya/services/servicio_piscina.jpg',
  },
  {
    name: 'Laguna',
    tag: 'Naturaleza',
    text: 'Un paisaje clave del lodge, con lectura más emocional y visual en la home.',
    image: 'https://wakayaecolodge.com/es/images/wakaya/services/servicio_laguna.jpg',
  },
  {
    name: 'Restaurant',
    tag: 'Sabores',
    text: 'La experiencia gastronómica entra como complemento, no como un módulo pesado.',
    image:
      'https://wakayaecolodge.com/es/images/wakaya/services/DSC_5853-PLATO%20COMIDA.jpg',
  },
  {
    name: 'Full Day',
    tag: 'Escapada',
    text: 'Visitas coordinadas manualmente, visibles desde la web sin competir con hospedaje.',
    image:
      'https://wakayaecolodge.com/es/images/wakaya/services/servicio_fullday_laguna.jpg',
  },
];

const heroStats = [
  { title: 'Piscina + laguna', text: 'Dos piezas visuales fuertes del lodge dentro de una misma experiencia.' },
  { title: 'Prereserva guiada', text: 'Disponibilidad referencial y validación humana antes de confirmar.' },
  { title: 'Eventos y full day', text: 'Servicios paralelos visibles desde la home, sin romper el foco principal.' },
];

const featuredRooms = publicBungalows.filter((room) => room.featuredOnHome);

export default function PublicSitePrototypePage() {
  return (
    <>
      <section className={styles.heroPanel} id="home">
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <span className={styles.heroKicker}>
                Pucallpa · agua · madera · descanso
              </span>
              <h1>Respira la naturaleza sin salir del confort.</h1>
              <p className={styles.heroLead}>
                Wakaya reúne bungalows, piscina, laguna y jardines en una escapada
                amazónica más cálida, más clara para reservar y mucho mejor resuelta
                visualmente que el prototipo anterior.
              </p>

              <div className={styles.heroActions}>
                <a className={styles.primaryButton} href="#booking">
                  Consultar disponibilidad
                </a>
                <a className={styles.ghostButton} href="#bungalows">
                  Ver bungalows
                </a>
              </div>

              <div className={styles.heroStats}>
                {heroStats.map((item) => (
                  <div key={item.title} className={styles.heroStat}>
                    <strong>{item.title}</strong>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.heroVisual}>
              <div className={styles.heroMainImage}>
                <img
                  src="https://wakayaecolodge.com/es/images/wakaya/services/servicio_laguna.jpg"
                  alt="Laguna y vegetación de Wakaya"
                />
                <div className={styles.heroMainCaption}>
                  <div>
                    <strong>Una llegada más natural.</strong>
                    <span>
                      Naturaleza, agua y madera con un flujo de consulta mucho más claro
                      desde la primera pantalla.
                    </span>
                  </div>
                  <span className={styles.heroOrb}>▶</span>
                </div>
              </div>

              <div className={styles.heroStack}>
                <div className={styles.heroStackCard}>
                  <img
                    src="https://wakayaecolodge.com/es/images/wakaya/habitaciones/BM_1.jpg"
                    alt="Interior cálido de bungalow matrimonial"
                  />
                </div>

                <div className={styles.heroTallCard}>
                  <img
                    src="https://wakayaecolodge.com/es/images/wakaya/eventos/evenos_celebraciones_familiar.jpg"
                    alt="Evento realizado en Wakaya"
                  />
                  <div className={styles.heroTallCopy}>
                    <strong>Hospedaje, eventos y full day.</strong>
                    <span>
                      Todo en una sola narrativa pública, sin volver la página un catálogo
                      genérico.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </section>

      <BookingBand />

      <section className={styles.aboutSection}>
          <div>
            <PlaySectionTitle
              center={false}
              subtitle="Wakaya Ecolodge"
              title="Un lodge con más atmósfera y menos ruido visual."
              paragraph="La referencia de `play-nextjs` se usa aquí como donor de estructura: navegación clara, secciones respiradas y bloques con jerarquía real, pero reescritos para una experiencia hospitality."
            />
            <p className={styles.aboutLead}>
              Esta home ya no vive encerrada en una sola tarjeta con tarjetas dentro.
              Abre la composición, mejora el ritmo vertical y deja que Wakaya se sienta
              como destino, no como landing SaaS maquillada.
            </p>
          </div>

          <div className={styles.aboutMosaic}>
            <div className={styles.aboutImageLarge}>
              <img
                src="https://wakayaecolodge.com/es/images/wakaya/services/servicio_piscina.jpg"
                alt="Piscina y jardines del ecolodge"
              />
            </div>

            <div className={styles.aboutStack}>
              <div className={styles.aboutImageSmall}>
                <img
                  src="https://wakayaecolodge.com/es/images/wakaya/services/servicio_laguna.jpg"
                  alt="Laguna del ecolodge"
                />
              </div>

              <div className={styles.aboutFactCard}>
                <strong>3 líneas</strong>
                <span>Hospedaje, eventos y full day.</span>
                <p>
                  Módulos separados en negocio, pero una sola identidad pública para el
                  usuario final.
                </p>
              </div>
            </div>
          </div>
      </section>

      <section className={styles.roomSection} id="bungalows">
          <div className={styles.roomSectionHeader}>
            <PlaySectionTitle
              subtitle="Bungalows"
              title="Tres categorías visibles y una lectura rápida de la estadía."
              paragraph="La grilla se apoya en shells del donor repo, pero con foto más dominante, copy más corto y acciones más claras para acercarse a la intención real de consulta."
            />
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
                    {[room.capacity, room.priceFrom].map((chip) => (
                      <span key={chip}>{chip}</span>
                    ))}
                  </div>

                  <div className={styles.actions}>
                    <Link className={styles.primaryButton} href={'/prototype/public-site/bungalows' as Route}>
                      Ver detalle
                    </Link>
                    <Link className={styles.ghostButton} href={'/prototype/public-site/bungalows' as Route}>
                      Más info
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
      </section>

      <section className={styles.activitySection} id="activities">
          <div className={styles.activityHeader}>
            <PlaySectionTitle
              center={false}
              subtitle="Experiencias"
              title="La web también vende lo que pasa fuera del bungalow."
              paragraph="En vez de meter bloques genéricos de features, las experiencias se presentan como tarjetas amplias con imagen, etiqueta y propósito claro."
            />

            <div className={styles.activityHeaderNote}>
              Piscina, laguna, restaurant y full day entran como experiencias
              complementarias, no como ruido paralelo. Eso ayuda a vender Wakaya como
              lugar y no solo como una reserva.
            </div>
          </div>

          <div className={styles.activityGrid}>
            {activities.map((activity) => (
              <article key={activity.name} className={styles.activityCard}>
                <img src={activity.image} alt={activity.name} />
                <div className={styles.activityCopy}>
                  <span className={styles.activityTag}>{activity.tag}</span>
                  <strong>{activity.name}</strong>
                  <span>{activity.text}</span>
                </div>
              </article>
            ))}
          </div>
      </section>

      <section className={styles.eventSection} id="events">
          <div className={styles.eventHeader}>
            <PlaySectionTitle
              subtitle="Eventos y Full Day"
              title="Una segunda línea comercial con su propio peso visual."
              paragraph="El donor repo aporta aquí la lógica de split section. Nosotros la convertimos en una pieza de venue + experiencia natural, sin volverla corporativa ni fría."
            />
          </div>

          <div className={styles.eventGrid}>
            <div className={styles.eventVisualCard}>
              <img
                src="https://wakayaecolodge.com/es/images/wakaya/eventos/evenos_celebraciones_familiar.jpg"
                alt="Evento en Wakaya"
              />
              <span className={styles.eventVisualBadge}>Venue natural</span>
            </div>

            <div className={styles.eventCopyCard}>
              <div>
                <strong>Celebraciones, reuniones y jornadas de día con una sola narrativa de marca.</strong>
                <p>
                  La home debe dejar claro que Wakaya sirve para escapadas cortas y
                  también para encuentros especiales. La consulta sigue siendo manual,
                  pero la percepción sube cuando la propuesta está bien armada.
                </p>
              </div>

              <ul className={styles.eventChecklist}>
                <li>Prereserva separada para hospedaje, eventos y full day.</li>
                <li>Disponibilidad referencial visible desde la web pública.</li>
                <li>Backoffice validará la aprobación y la coordinación de pago.</li>
              </ul>

              <div className={styles.actions}>
                <Link className={styles.primaryButton} href={'/prototype/public-site/events' as Route}>
                  Ver eventos
                </Link>
                <Link className={styles.ghostButton} href={'/prototype/public-site/services' as Route}>
                  Ver full day
                </Link>
              </div>
            </div>
          </div>
      </section>
    </>
  );
}
