import { publicBungalows } from './public-site-data';
import type { PublicSiteLocale } from './public-site-locale';
import { getPublicRoute } from './public-site-routes';
import styles from './public-site-theme.module.css';

type BookingBandBungalow = {
  slug: string;
  bookingRequestBungalowId: string | null;
  displayName?: string;
  homeName?: string;
  name: string;
};

type BookingBandProps = {
  locale?: PublicSiteLocale;
  introTitle?: string;
  introCopy?: string;
  requestedGuestsLabel?: string;
  requestedBungalowLabel?: string;
  allCategoriesLabel?: string;
  submitLabel?: string;
  guestOptions?: string[];
  bungalows?: readonly BookingBandBungalow[];
};

export function BookingBand({
  locale,
  introTitle = 'Disponibilidad referencial',
  introCopy = 'Consulta fechas, huéspedes y categoría de bungalow.',
  requestedGuestsLabel = 'Personas',
  requestedBungalowLabel = 'Habitacion',
  allCategoriesLabel = 'Todas las categorias',
  submitLabel = 'Solicitar disponibilidad',
  guestOptions = ['2 huespedes', '3 huespedes', '4 huespedes', '5 huespedes'],
  bungalows = publicBungalows,
}: BookingBandProps = {}) {
  const action = locale ? getPublicRoute(locale, 'contact') : '/prototype/public-site/contact';

  return (
    <section className={styles.bookingBand} id="booking">
      <div className={styles.bookingIntro}>
        <strong>{introTitle}</strong>
        <p>{introCopy}</p>
      </div>

      <form
        className={styles.bookingForm}
        action={action}
        method="get"
      >
        <div className={styles.field}>
          <label htmlFor="checkIn">Check in</label>
          <input id="checkIn" name="requestedCheckIn" type="date" defaultValue="2026-07-10" />
        </div>

        <div className={styles.field}>
          <label htmlFor="checkOut">Check out</label>
          <input id="checkOut" name="requestedCheckOut" type="date" defaultValue="2026-07-12" />
        </div>

        <div className={styles.field}>
          <label htmlFor="guests">{requestedGuestsLabel}</label>
          <select id="guests" name="requestedGuests" defaultValue="2">
            {guestOptions.map((option, index) => (
              <option key={option} value={String(index + 2)}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="category">{requestedBungalowLabel}</label>
          <select id="category" name="requestedBungalowType" defaultValue="">
            <option value="">{allCategoriesLabel}</option>
            {bungalows.map((bungalow) => (
              <option key={bungalow.slug} value={bungalow.bookingRequestBungalowId ?? ""}>
                {bungalow.displayName ?? bungalow.homeName ?? bungalow.name}
              </option>
            ))}
          </select>
        </div>

        <button className={`${styles.primaryButton} ${styles.bookingSubmit}`} type="submit">
          {submitLabel}
        </button>
      </form>
    </section>
  );
}
