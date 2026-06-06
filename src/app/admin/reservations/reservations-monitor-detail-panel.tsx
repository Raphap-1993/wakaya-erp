import Link from "next/link";
import type { ReservationListItem } from "@/lib/reservations/store";
import styles from "./reservations.module.css";
import { STATUS_LABELS, statusTone } from "./reservations-monitor-shared";

function statusClass(status: ReservationListItem["status"]): string {
  const tone = statusTone(status);
  return tone ? `${styles.badge} ${styles[tone as keyof typeof styles]}` : styles.badge;
}

export function MonitorDetailPanel({ activeItem }: { activeItem: ReservationListItem | null }) {
  return (
    <>
      <article className={styles.sectionCard}>
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>Detalle operativo</h2>
            <p className={styles.cardCopy}>
              La selección de la tabla alimenta este panel sin salir del monitor.
            </p>
          </div>
          {activeItem ? (
            <span className={statusClass(activeItem.status)}>{STATUS_LABELS[activeItem.status]}</span>
          ) : null}
        </div>

        {activeItem ? (
          <div className={styles.kvGrid}>
            <div className={styles.kv}>
              <span className={styles.kvLabel}>Reserva</span>
              <span className={styles.kvValue}>{activeItem.number}</span>
            </div>
            <div className={styles.kv}>
              <span className={styles.kvLabel}>Bungalow</span>
              <span className={styles.kvValue}>{activeItem.bungalow?.name ?? "Sin asignar"}</span>
            </div>
            <div className={styles.kv}>
              <span className={styles.kvLabel}>Estadía</span>
              <span className={styles.kvValue}>
                {activeItem.startDate} → {activeItem.endDate}
              </span>
            </div>
            <div className={styles.kv}>
              <span className={styles.kvLabel}>Responsable</span>
              <span className={styles.kvValue}>{activeItem.responsibleId ?? "system"}</span>
            </div>
          </div>
        ) : (
          <p className={styles.helper}>Selecciona una reserva para ver su contexto operativo.</p>
        )}
      </article>

      <article className={styles.sectionCard}>
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>Auditoría resumida</h2>
            <p className={styles.cardCopy}>
              El timeline completo se mantiene en la vista profunda por ahora.
            </p>
          </div>
        </div>

        <p className={styles.helper}>
          Esta tarea deja lista la selección y el contexto del monitor. La siguiente
          iteración conectará acciones inline y el panel completo de auditoría.
        </p>
      </article>

      <article className={styles.sectionCard}>
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>Acceso rápido</h2>
            <p className={styles.cardCopy}>
              La vista profunda queda disponible para soporte y depuración.
            </p>
          </div>
        </div>

        <div className={styles.buttonRow}>
          <Link
            className={`${styles.button} ${styles.buttonSecondary}`}
            href={
              (activeItem ? `/admin/reservations/${activeItem.id}` : "/admin/reservations") as never
            }
          >
            Abrir detalle
          </Link>
        </div>
      </article>
    </>
  );
}
