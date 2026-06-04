import { publicBungalows } from './public-site-data';
import styles from './public-site-theme.module.css';

export function BookingBand() {
  return (
    <section className={styles.bookingBand} id="booking">
      <div className={styles.bookingIntro}>
        <strong>Disponibilidad referencial</strong>
        <p>
          La disponibilidad es orientativa. La validación final y el pago se coordinan
          manualmente con Wakaya.
        </p>
      </div>

      <form
        className={styles.bookingForm}
        action="/prototype/public-site/bungalows"
        method="get"
      >
        <div className={styles.field}>
          <label htmlFor="checkIn">Check in</label>
          <input id="checkIn" name="checkIn" type="date" defaultValue="2026-07-10" />
        </div>

        <div className={styles.field}>
          <label htmlFor="checkOut">Check out</label>
          <input id="checkOut" name="checkOut" type="date" defaultValue="2026-07-12" />
        </div>

        <div className={styles.field}>
          <label htmlFor="guests">Personas</label>
          <select id="guests" name="guests" defaultValue="2">
            <option value="2">2 huéspedes</option>
            <option value="3">3 huéspedes</option>
            <option value="4">4 huéspedes</option>
            <option value="5">5 huéspedes</option>
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="category">Habitación</label>
          <select id="category" name="category" defaultValue="">
            <option value="">Todas las categorías</option>
            {publicBungalows.map((bungalow) => (
              <option key={bungalow.slug} value={bungalow.slug}>
                {bungalow.homeName ?? bungalow.name}
              </option>
            ))}
          </select>
        </div>

        <button className={styles.primaryButton} type="submit">
          Consultar disponibilidad
        </button>
      </form>
    </section>
  );
}
