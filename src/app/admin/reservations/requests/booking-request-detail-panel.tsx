import styles from "../reservations.module.css";
import type { BookingRequest } from "@/lib/reservations/types";

type Props = {
  request: BookingRequest | null;
};

export function BookingRequestDetailPanel({ request }: Props) {
  if (!request) {
    return (
      <aside className={styles.sectionCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Detalle de solicitud</h2>
        </div>
        <p className={styles.helper}>No hay solicitudes disponibles.</p>
      </aside>
    );
  }

  return (
    <aside className={styles.sectionCard}>
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>{request.publicRef}</h2>
          <p className={styles.cardCopy}>Hilo del cliente y conversión operativa.</p>
        </div>
      </div>

      <div className={styles.stack}>
        <div className={styles.kvGrid}>
          <div className={styles.kv}>
            <span className={styles.kvLabel}>Estado</span>
            <span className={styles.kvValue}>{request.status}</span>
          </div>
          <div className={styles.kv}>
            <span className={styles.kvLabel}>Correo</span>
            <span className={styles.kvValue}>{request.guestEmail}</span>
          </div>
          <div className={styles.kv}>
            <span className={styles.kvLabel}>Fechas</span>
            <span className={styles.kvValue}>
              {request.requestedCheckIn} → {request.requestedCheckOut}
            </span>
          </div>
          <div className={styles.kv}>
            <span className={styles.kvLabel}>Huéspedes</span>
            <span className={styles.kvValue}>{request.requestedGuests}</span>
          </div>
        </div>

        <div className={styles.detailSummary}>
          <span className={styles.fieldLabel}>Hilo del cliente</span>
          <p className={styles.helper}>
            El seguimiento humano continúa desde <strong>reservas@wakayaecolodge.com</strong> y el
            cliente debe responder con su comprobante de transferencia en ese mismo hilo.
          </p>
        </div>

        <form
          className={styles.form}
          action={`/api/booking-requests/${request.id}/confirm-transfer`}
          method="post"
        >
          <input type="hidden" name="actorId" value="backoffice-ui" />
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor={`reason-${request.id}`}>
              Motivo de confirmación
            </label>
            <input
              className={styles.input}
              id={`reason-${request.id}`}
              name="reason"
              defaultValue="Transferencia validada en back office"
            />
          </div>
          <div className={styles.buttonRow}>
            <button className={styles.button} type="submit" disabled={request.status !== "proof_received"}>
              Confirmar transferencia
            </button>
          </div>
        </form>
      </div>
    </aside>
  );
}
