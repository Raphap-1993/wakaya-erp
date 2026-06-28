import type { ReservationListItem } from "@/lib/reservations/store";
import styles from "./reservations.module.css";
import { formatMoneyCents, PAYMENT_STATUS_LABELS, STATUS_LABELS } from "./reservations-monitor-shared";
import { ReservationInfoChipsView } from "./reservation-info-chips-view";

function money(value: number | undefined): string {
  return formatMoneyCents(value ?? 0);
}

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
        <div className={styles.stack}>
          <ReservationInfoChipsView
            status={activeItem.status}
            paymentStatus={activeItem.paymentStatus ?? "pending"}
            channel={activeItem.channel}
            amountTotalCents={activeItem.amountTotalCents}
            amountPaidCents={activeItem.amountPaidCents}
          />

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
              <span className={styles.kvLabel}>Cobro</span>
              <span className={styles.kvValue}>
                {PAYMENT_STATUS_LABELS[activeItem.paymentStatus ?? "pending"]}
              </span>
            </div>
            <div className={styles.kv}>
              <span className={styles.kvLabel}>Total</span>
              <span className={styles.kvValue}>{money(activeItem.amountTotalCents)}</span>
            </div>
            <div className={styles.kv}>
              <span className={styles.kvLabel}>Pagado / saldo</span>
              <span className={styles.kvValue}>
                {money(activeItem.amountPaidCents)} /{" "}
                {money(
                  Math.max(
                    (activeItem.amountTotalCents ?? 0) - (activeItem.amountPaidCents ?? 0),
                    0,
                  ),
                )}
              </span>
            </div>
            <div className={styles.kv}>
              <span className={styles.kvLabel}>Selección URL</span>
              <span className={styles.kvValue}>selected={activeItem.id}</span>
            </div>
          </div>
        </div>
      ) : (
        <p className={styles.helper}>Selecciona una reserva de la tabla para abrir su contexto.</p>
      )}
    </article>
  );
}
