import Link from "next/link";
import { notFound } from "next/navigation";
import { canPerformAction } from "@/lib/reservations/state-machine";
import { reservationStore } from "@/lib/reservations/store";
import type { ReservationAction, ReservationStatus } from "@/lib/reservations/types";
import styles from "../reservations.module.css";

const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending_review: "Pending review",
  ota_imported_confirmed: "OTA imported confirmed",
  confirmed: "Confirmed",
  assigned: "Assigned",
  checked_in: "Checked in",
  checked_out: "Checked out",
  paid: "Paid",
  cancelled: "Cancelled",
  no_show: "No show",
};

const ACTION_LABELS: Record<ReservationAction, string> = {
  confirm: "Confirmar",
  assign: "Asignar bungalow",
  check_in: "Registrar check-in",
  check_out: "Registrar check-out",
  mark_paid: "Marcar pago",
  cancel: "Cancelar",
  mark_no_show: "Marcar no show",
};

function statusClass(status: ReservationStatus): string {
  switch (status) {
    case "pending_review":
    case "ota_imported_confirmed":
      return `${styles.badge} ${styles.statusPendingReview}`;
    case "confirmed":
    case "assigned":
    case "checked_in":
      return `${styles.badge} ${styles.statusConfirmed}`;
    case "checked_out":
    case "paid":
      return `${styles.badge} ${styles.statusPaid}`;
    case "cancelled":
    case "no_show":
      return `${styles.badge} ${styles.statusCancelled}`;
    default:
      return styles.badge;
  }
}

export default function ReservationDetailPage({ params }: { params: { id: string } }) {
  const detail = reservationStore.get(params.id);
  if (!detail) {
    notFound();
  }

  const auditTrail = reservationStore.getAuditTrail(params.id);
  const bungalows = reservationStore.listBungalows();
  const assignEnabled = canPerformAction(detail.status, "assign");
  const allowedActions = (
    [
      "confirm",
      "assign",
      "check_in",
      "check_out",
      "mark_paid",
      "cancel",
      "mark_no_show",
    ] as ReservationAction[]
  ).filter((action) => canPerformAction(detail.status, action));
  const quickActions = allowedActions.filter((action) => action !== "assign");

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Wakaya · detalle de reserva</p>
            <h1 className={styles.title}>{detail.number}</h1>
            <p className={styles.lead}>
              Estado operativo, asignación de bungalow, transición de estado y auditoría
              en una sola pantalla.
            </p>
          </div>

          <Link className={styles.link} href="/admin/reservations">
            Volver al monitor
          </Link>
        </div>

        <section className={styles.detailGrid}>
          <div className={styles.stack}>
            <article className={styles.sectionCard}>
              <div className={styles.cardHeader}>
                <div>
                  <h2 className={styles.cardTitle}>Resumen</h2>
                  <p className={styles.cardCopy}>
                    La reserva ya existe en el sistema y su disponibilidad está bloqueada
                    por noche.
                  </p>
                </div>
                <span className={statusClass(detail.status)}>{STATUS_LABELS[detail.status]}</span>
              </div>

              <div className={styles.kvGrid}>
                <div className={styles.kv}>
                  <span className={styles.kvLabel}>Canal</span>
                  <span className={styles.kvValue}>{detail.channel.toUpperCase()}</span>
                </div>
                <div className={styles.kv}>
                  <span className={styles.kvLabel}>Bungalow</span>
                  <span className={styles.kvValue}>{detail.bungalow?.name ?? "Sin asignar"}</span>
                </div>
                <div className={styles.kv}>
                  <span className={styles.kvLabel}>Estadía</span>
                  <span className={styles.kvValue}>
                    {detail.startDate} → {detail.endDate}
                  </span>
                </div>
                <div className={styles.kv}>
                  <span className={styles.kvLabel}>Responsable</span>
                  <span className={styles.kvValue}>{detail.responsibleId ?? "system"}</span>
                </div>
              </div>
            </article>

            <article className={styles.sectionCard}>
              <div className={styles.cardHeader}>
                <div>
                  <h2 className={styles.cardTitle}>Auditoría</h2>
                  <p className={styles.cardCopy}>
                    Cada transición relevante deja evidencia operativa y trazabilidad.
                  </p>
                </div>
              </div>

              <ul className={styles.auditList}>
                {auditTrail.map((item) => (
                  <li key={item.id} className={styles.auditItem}>
                    <div className={styles.auditMeta}>
                      <span>{item.createdAt}</span>
                      <span>{item.actorId}</span>
                      <span>{item.action}</span>
                    </div>
                    <div className={styles.rowMain}>
                      {STATUS_LABELS[item.previousStatus]} → {STATUS_LABELS[item.nextStatus]}
                    </div>
                    <p className={styles.helper}>{item.reason}</p>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <aside className={styles.actions}>
            <article className={styles.sectionCard}>
              <div className={styles.cardHeader}>
                <div>
                  <h2 className={styles.cardTitle}>Asignar bungalow</h2>
                  <p className={styles.cardCopy}>
                    Recepción puede reasignar cuando el flujo de negocio lo permite.
                  </p>
                </div>
              </div>

              <form className={styles.form} action={`/api/reservations/${detail.id}/assign`} method="post">
                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor="bungalowId">
                    Bungalow
                  </label>
                  <select
                    className={styles.select}
                    id="bungalowId"
                    name="bungalowId"
                    defaultValue={detail.bungalowId ?? bungalows[0]?.id ?? ""}
                    disabled={!assignEnabled}
                  >
                    {bungalows.map((bungalow) => (
                      <option key={bungalow.id} value={bungalow.id}>
                        {bungalow.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor="assignReason">
                    Motivo
                  </label>
                  <textarea
                    className={styles.textarea}
                    id="assignReason"
                    name="reason"
                    defaultValue="Asignación operativa desde recepción"
                    disabled={!assignEnabled}
                  />
                </div>

                <input type="hidden" name="actorId" value="system" />

                <div className={styles.buttonRow}>
                  <button className={styles.button} type="submit" disabled={!assignEnabled}>
                    Asignar bungalow
                  </button>
                </div>
                {!assignEnabled ? (
                  <p className={styles.helper}>
                    Disponible solo cuando la reserva ya está confirmada o importada desde OTA.
                  </p>
                ) : null}
              </form>
            </article>

            <article className={styles.sectionCard}>
              <div className={styles.cardHeader}>
                <div>
                  <h2 className={styles.cardTitle}>Cambiar estado</h2>
                  <p className={styles.cardCopy}>
                    Solo se muestran las transiciones válidas para este estado.
                  </p>
                </div>
              </div>

              <form className={styles.form} action={`/api/reservations/${detail.id}/status`} method="post">
                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor="action">
                    Acción
                  </label>
                  <select className={styles.select} id="action" name="action" defaultValue={allowedActions[0] ?? ""}>
                    {allowedActions.map((action) => (
                      <option key={action} value={action}>
                        {ACTION_LABELS[action]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor="statusReason">
                    Motivo
                  </label>
                  <textarea
                    className={styles.textarea}
                    id="statusReason"
                    name="reason"
                    defaultValue="Cambio operativo desde el mini monitor"
                  />
                </div>

                <input type="hidden" name="actorId" value="system" />

                <div className={styles.buttonRow}>
                  <button className={styles.button} type="submit" disabled={allowedActions.length === 0}>
                    Aplicar cambio
                  </button>
                </div>
              </form>
            </article>

            <article className={styles.sectionCard}>
              <div className={styles.cardHeader}>
                <div>
                  <h2 className={styles.cardTitle}>Acciones rápidas</h2>
                  <p className={styles.cardCopy}>
                    Accesos directos para las transiciones más comunes de recepción.
                  </p>
                </div>
              </div>

              <div className={styles.quickActionGrid}>
                {quickActions.length > 0 ? (
                  quickActions.map((action) => (
                    <form
                      key={action}
                      className={styles.quickActionForm}
                      action={`/api/reservations/${detail.id}/status`}
                      method="post"
                    >
                      <input type="hidden" name="action" value={action} />
                      <input type="hidden" name="reason" value="Cambio rápido desde recepción" />
                      <input type="hidden" name="actorId" value="system" />
                      <button className={`${styles.button} ${styles.buttonSecondary}`} type="submit">
                        {ACTION_LABELS[action]}
                      </button>
                    </form>
                  ))
                ) : (
                  <p className={styles.helper}>No hay acciones rápidas disponibles para este estado.</p>
                )}
              </div>
            </article>

            <article className={styles.sectionCard}>
              <div className={styles.cardHeader}>
                <div>
                  <h2 className={styles.cardTitle}>Acceso rápido</h2>
                  <p className={styles.cardCopy}>
                    La API está disponible para integraciones o para depurar el estado actual.
                  </p>
                </div>
              </div>

              <div className={styles.buttonRow}>
                <Link className={`${styles.button} ${styles.buttonSecondary}`} href={`/api/reservations/${detail.id}`}>
                  Ver JSON
                </Link>
                <Link className={`${styles.button} ${styles.buttonSecondary}`} href={`/api/reservations/${detail.id}/audit`}>
                  Ver auditoría
                </Link>
              </div>
            </article>
          </aside>
        </section>
      </div>
    </main>
  );
}
