import type { ReservationListItem } from "@/lib/reservations/store";
import styles from "./reservations.module.css";
import { STATUS_LABELS } from "./reservations-monitor-shared";

export function MonitorSelectionSummary({
  activeItem,
}: {
  activeItem: ReservationListItem | null;
}) {
  return (
    <article className={styles.sectionCard}>
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>Contexto seleccionado</h2>
          <p className={styles.cardCopy}>
            La tabla controla qué reserva se inspecciona sin salir de la pantalla.
          </p>
        </div>
      </div>

      {activeItem ? (
        <div className={styles.kvGrid}>
          <div className={styles.kv}>
            <span className={styles.kvLabel}>Reserva activa</span>
            <span className={styles.kvValue}>{activeItem.number}</span>
          </div>
          <div className={styles.kv}>
            <span className={styles.kvLabel}>Estado</span>
            <span className={styles.kvValue}>{STATUS_LABELS[activeItem.status]}</span>
          </div>
          <div className={styles.kv}>
            <span className={styles.kvLabel}>Canal</span>
            <span className={styles.kvValue}>{activeItem.channel.toUpperCase()}</span>
          </div>
          <div className={styles.kv}>
            <span className={styles.kvLabel}>Selección URL</span>
            <span className={styles.kvValue}>selected={activeItem.id}</span>
          </div>
        </div>
      ) : (
        <p className={styles.helper}>Selecciona una reserva de la tabla para abrir su contexto.</p>
      )}
    </article>
  );
}
