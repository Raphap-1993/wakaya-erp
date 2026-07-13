import { ReservationMetricCards } from "../reservation-metric-cards";
import styles from "../reservations.module.css";
import type { BookingRequest } from "@/lib/reservations/types";

type Props = {
  items: BookingRequest[];
  selectedId: string | null;
};

function requestStatusMeta(status: BookingRequest["status"]) {
  switch (status) {
    case "proof_received":
      return { label: "Comprobante recibido", tone: styles.statusConfirmed };
    case "converted_to_reservation":
      return { label: "Convertida", tone: styles.statusPaid };
    case "needs_attention":
    case "cancelled":
      return { label: status === "cancelled" ? "Cancelada" : "Requiere atención", tone: styles.statusCancelled };
    case "awaiting_transfer":
      return { label: "Esperando transferencia", tone: styles.paymentPartial };
    case "awaiting_initial_email":
      return { label: "Pendiente de correo", tone: styles.paymentPending };
    case "request_received":
    default:
      return { label: "Solicitud recibida", tone: styles.statusPendingReview };
  }
}

function syncStatusMeta(status: BookingRequest["syncStatus"]) {
  switch (status) {
    case "synced":
      return { label: "Sync OK", tone: styles.statusConfirmed };
    case "degraded":
      return { label: "Sync degradado", tone: styles.statusCancelled };
    case "pending":
    default:
      return { label: "Sync pendiente", tone: styles.paymentPending };
  }
}

function conflictMeta(item: BookingRequest) {
  if (item.syncStatus === "degraded" || item.status === "needs_attention") {
    return { label: "Revisar", tone: styles.paymentPartial };
  }
  if (item.status === "converted_to_reservation") {
    return { label: "Cerrado", tone: styles.statusPaid };
  }
  return { label: "Sin alerta", tone: styles.statusConfirmed };
}

export function BookingRequestsMonitor({ items }: Props) {
  const degradedCount = items.filter((item) => item.syncStatus === "degraded").length;
  const pendingCount = items.filter((item) => item.status !== "converted_to_reservation").length;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Wakaya · solicitudes</p>
          <h1 className={styles.title}>Solicitudes web</h1>
          <p className={styles.lead}>
            Cola operativa compacta para revisar solicitudes, priorizar semáforos y abrir la gestión completa en una página separada.
          </p>

          <ReservationMetricCards
            items={[
              {
                key: "visible",
                label: "Solicitudes visibles",
                value: items.length,
                tone: "info",
                meta: "Inbox web",
              },
              {
                key: "pending",
                label: "Pendientes",
                value: pendingCount,
                tone: pendingCount > 0 ? "warning" : "success",
                meta: pendingCount > 0 ? "Seguimiento" : "Bandeja limpia",
              },
              {
                key: "sync",
                label: "Sync degradado",
                value: degradedCount,
                tone: degradedCount > 0 ? "critical" : "success",
                meta: degradedCount > 0 ? "Atención inmediata" : "Estable",
              },
            ]}
          />
        </header>

        <section className={styles.section}>
          <div className={styles.tableCard}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>Inbox operativo</h2>
                <p className={styles.cardCopy}>
                  La tabla expone estado, sync y alertas. La gestión profunda vive fuera de esta superficie para no contaminar la lectura del tablero.
                </p>
              </div>
            </div>

            {items.length === 0 ? (
              <div className={styles.emptyStateInline}>
                <strong>No hay solicitudes web visibles.</strong>
                <span>Cuando el backend publique datos, este inbox mostrará la cola operativa.</span>
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Solicitud</th>
                      <th>Estado</th>
                      <th>Sync</th>
                      <th>Fechas</th>
                      <th>Conflictos</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const status = requestStatusMeta(item.status);
                      const sync = syncStatusMeta(item.syncStatus);
                      const conflict = conflictMeta(item);

                      return (
                        <tr key={item.id}>
                          <td>
                            <div className={styles.rowMain}>{item.publicRef}</div>
                            <div className={styles.muted}>{item.guestName}</div>
                          </td>
                          <td>
                            <span className={`${styles.badge} ${status.tone}`}>{status.label}</span>
                          </td>
                          <td>
                            <span className={`${styles.badge} ${sync.tone}`}>{sync.label}</span>
                          </td>
                          <td>
                            <div className={styles.rowMain}>
                              {item.requestedCheckIn} → {item.requestedCheckOut}
                            </div>
                            <div className={styles.muted}>{item.requestedGuests} huésped(es)</div>
                          </td>
                          <td>
                            <span className={`${styles.badge} ${conflict.tone}`}>{conflict.label}</span>
                          </td>
                          <td>
                            <a className={styles.button} href={`/admin/reservations/requests/${item.id}`}>
                              Abrir gestión
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
