import { PageHero } from '@/components/public-site/page-hero';
import { footerContact, publicBungalows } from '@/components/public-site/public-site-data';
import styles from '@/components/public-site/public-site-theme.module.css';

export default function PublicSiteContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contacto"
        title="Solicitud de estadía"
        breadcrumb="Inicio / Contacto"
        copy="Envía tu solicitud y Wakaya continuará por correo con instrucciones de transferencia y seguimiento personalizado."
      />

      <section className={styles.eventSection}>
        <div className={styles.eventGrid}>
          <div className={styles.eventCopyCard}>
            <div>
              <strong>Tu solicitud continúa por atención humana</strong>
              <p>
                Wakaya revisa tu solicitud, valida disponibilidad final y te escribe desde
                <strong> reservas@wakayaecolodge.com </strong>
                con las instrucciones de transferencia para continuar la reserva.
              </p>
            </div>

            <ul className={styles.eventChecklist}>
              <li>Completa una solicitud, no un pago automático.</li>
              <li>La confirmación final depende de la validación de la transferencia.</li>
              <li>{footerContact.place}</li>
              <li>{footerContact.domain}</li>
              <li>{footerContact.note}</li>
            </ul>

            <form className={styles.bookingForm} action="/api/public/booking-requests" method="post">
              <div className={styles.field}>
                <label htmlFor="guestName">Nombre</label>
                <input id="guestName" name="guestName" type="text" required />
              </div>
              <div className={styles.field}>
                <label htmlFor="guestEmail">Correo</label>
                <input id="guestEmail" name="guestEmail" type="email" required />
              </div>
              <div className={styles.field}>
                <label htmlFor="guestPhone">Teléfono</label>
                <input id="guestPhone" name="guestPhone" type="tel" />
              </div>
              <div className={styles.field}>
                <label htmlFor="requestedCheckIn">Check in</label>
                <input id="requestedCheckIn" name="requestedCheckIn" type="date" defaultValue="2026-07-10" required />
              </div>
              <div className={styles.field}>
                <label htmlFor="requestedCheckOut">Check out</label>
                <input id="requestedCheckOut" name="requestedCheckOut" type="date" defaultValue="2026-07-12" required />
              </div>
              <div className={styles.field}>
                <label htmlFor="requestedGuests">Personas</label>
                <select id="requestedGuests" name="requestedGuests" defaultValue="2">
                  <option value="2">2 huéspedes</option>
                  <option value="3">3 huéspedes</option>
                  <option value="4">4 huéspedes</option>
                  <option value="5">5 huéspedes</option>
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="requestedBungalowType">Categoría preferida</label>
                <select id="requestedBungalowType" name="requestedBungalowType" defaultValue="">
                  <option value="">Sin preferencia</option>
                  {publicBungalows.map((bungalow) => (
                    <option key={bungalow.slug} value={bungalow.bookingRequestBungalowId ?? ""}>
                      {bungalow.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="notes">Notas</label>
                <textarea id="notes" name="notes" rows={4} placeholder="Requerimientos especiales, horarios o comentarios." />
              </div>

              <button className={styles.primaryButton} type="submit">
                Enviar solicitud
              </button>
            </form>
          </div>

          <div className={styles.eventVisualCard}>
            <span className={styles.eventVisualBadge}>Solicitud y transferencia</span>
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
