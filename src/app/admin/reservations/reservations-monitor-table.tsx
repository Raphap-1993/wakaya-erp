import Link from "next/link";

import type { ReservationListItem } from "@/lib/reservations/store";

import { ReservationInfoChipsView } from "./reservation-info-chips-view";
import { buildReservationsOccupancyHref } from "./reservations-query";
import type { MonitorPermissions } from "./reservations-monitor-shared";
import styles from "./reservations.module.css";

function OpenIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M2.5 10s2.7-4.5 7.5-4.5 7.5 4.5 7.5 4.5-2.7 4.5-7.5 4.5S2.5 10 2.5 10Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M11.7 4.1 15.9 8.3M4.2 15.8l2.7-.5 8.1-8.1a1.5 1.5 0 0 0 0-2.1l-.1-.1a1.5 1.5 0 0 0-2.1 0l-8.1 8.1-.5 2.7Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function OccupancyIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2.5" y="3" width="15" height="14" rx="2.4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6 1.9v2.3M14 1.9v2.3M2.5 7.2h15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M6.3 10.6h2.3v2.3H6.3z" fill="currentColor" opacity=".26" />
    </svg>
  );
}

export function MonitorTable({
  activeId,
  items,
  permissions,
}: {
  activeId: string | null;
  items: ReservationListItem[];
  permissions: MonitorPermissions;
}) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Reserva</th>
            <th>Estadía</th>
            <th>Semáforos</th>
            <th>Responsable</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={5}>
                <div className={styles.emptyStateInline}>
                  <strong>No hay reservas con estos filtros.</strong>
                  <span>Prueba limpiar la búsqueda o ampliar el rango de fechas.</span>
                </div>
              </td>
            </tr>
          ) : (
            items.map((item) => {
              const isActive = item.id === activeId;
              return (
                <tr key={item.id} className={isActive ? styles.selectedRow : undefined} aria-selected={isActive}>
                  <td>
                    <div className={styles.rowMain}>{item.number}</div>
                    <div className={styles.muted}>
                      {item.channel.toUpperCase()} · {item.id}
                    </div>
                  </td>
                  <td>
                    <div className={styles.rowMain}>
                      {item.startDate} → {item.endDate}
                    </div>
                    <div className={styles.muted}>{item.bungalow?.name ?? "Sin bungalow asignado"}</div>
                  </td>
                  <td>
                    <ReservationInfoChipsView
                      status={item.status}
                      paymentStatus={item.paymentStatus ?? "pending"}
                      channel={item.channel}
                      amountTotalCents={item.amountTotalCents}
                      amountPaidCents={item.amountPaidCents}
                      bungalowName={item.bungalow?.name}
                    />
                  </td>
                  <td>{item.responsibleId ?? "system"}</td>
                  <td className={styles.actionCell}>
                    <div className={styles.inlineActionRow}>
                      <Link
                        className={`${styles.iconActionButton} ${styles.iconActionButtonPrimary}`}
                        href={`/admin/reservations/${item.id}` as never}
                        aria-label={`Abrir ficha de ${item.number}`}
                        title="Abrir ficha"
                      >
                        <OpenIcon />
                      </Link>
                      {permissions.canWrite ? (
                        <Link
                          className={styles.iconActionButton}
                          href={`/admin/reservations/${item.id}/edit` as never}
                          aria-label={`Editar ${item.number}`}
                          title="Editar"
                        >
                          <EditIcon />
                        </Link>
                      ) : null}
                      <Link
                        className={styles.iconActionButton}
                        href={buildReservationsOccupancyHref({
                          selected: item.id,
                          date: item.startDate,
                          view: "occupancy",
                        }) as never}
                        aria-label={`Abrir ocupación de ${item.number}`}
                        title="Ocupación"
                      >
                        <OccupancyIcon />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
