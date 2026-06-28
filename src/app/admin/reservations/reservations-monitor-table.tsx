import type { ReservationListItem } from "@/lib/reservations/store";
import styles from "./reservations.module.css";
import { ReservationStatusBadge } from "./reservation-status-badge";

export function MonitorTable({
  activeId,
  items,
  onSelect,
}: {
  activeId: string | null;
  items: ReservationListItem[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Reserva</th>
            <th>Canal</th>
            <th>Estado</th>
            <th>Bungalow</th>
            <th>Estadía</th>
            <th>Responsable</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={7}>
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
                <tr
                  key={item.id}
                  className={isActive ? styles.selectedRow : undefined}
                  onClick={() => onSelect(item.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(item.id);
                    }
                  }}
                  tabIndex={0}
                  aria-selected={isActive}
                >
                  <td>
                    <div className={styles.rowMain}>{item.number}</div>
                    <div className={styles.muted}>{item.id}</div>
                  </td>
                  <td>{item.channel.toUpperCase()}</td>
                  <td>
                    <ReservationStatusBadge status={item.status} />
                    <div className={styles.muted}>{item.status}</div>
                  </td>
                  <td>{item.bungalow?.name ?? "Sin asignar"}</td>
                  <td>
                    {item.startDate} → {item.endDate}
                  </td>
                  <td>{item.responsibleId ?? "system"}</td>
                  <td>
                    <button
                      className={styles.button}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelect(item.id);
                      }}
                    >
                      Abrir detalle
                    </button>
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
