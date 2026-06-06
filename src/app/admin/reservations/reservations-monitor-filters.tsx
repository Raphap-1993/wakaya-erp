import Link from "next/link";
import styles from "./reservations.module.css";
import { CHANNEL_FILTERS, STATUS_FILTERS, type MonitorFilterState } from "./reservations-monitor-shared";

export function MonitorFilters({
  activeId,
  filters,
  onChange,
}: {
  activeId: string | null;
  filters: MonitorFilterState;
  onChange: (next: MonitorFilterState) => void;
}) {
  return (
    <form className={styles.filterBar} method="get" action="/admin/reservations">
      <input type="hidden" name="selected" value={activeId ?? ""} />

      <div className={styles.filterField}>
        <label className={styles.fieldLabel} htmlFor="status">
          Estado
        </label>
        <select
          className={styles.select}
          id="status"
          name="status"
          value={filters.status}
          onChange={(event) => onChange({ ...filters, status: event.target.value })}
        >
          {STATUS_FILTERS.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.filterField}>
        <label className={styles.fieldLabel} htmlFor="channel">
          Canal
        </label>
        <select
          className={styles.select}
          id="channel"
          name="channel"
          value={filters.channel}
          onChange={(event) => onChange({ ...filters, channel: event.target.value })}
        >
          {CHANNEL_FILTERS.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.filterField}>
        <label className={styles.fieldLabel} htmlFor="responsibleId">
          Responsable
        </label>
        <input
          className={styles.input}
          id="responsibleId"
          name="responsibleId"
          value={filters.responsibleId}
          onChange={(event) => onChange({ ...filters, responsibleId: event.target.value })}
          placeholder="user-reception-1"
        />
      </div>

      <div className={styles.filterField}>
        <label className={styles.fieldLabel} htmlFor="date">
          Fecha
        </label>
        <input
          className={styles.input}
          id="date"
          name="date"
          type="date"
          value={filters.date}
          onChange={(event) => onChange({ ...filters, date: event.target.value })}
        />
      </div>

      <div className={styles.filterField}>
        <label className={styles.fieldLabel} htmlFor="startDate">
          Desde
        </label>
        <input
          className={styles.input}
          id="startDate"
          name="startDate"
          type="date"
          value={filters.startDate}
          onChange={(event) => onChange({ ...filters, startDate: event.target.value })}
        />
      </div>

      <div className={styles.filterField}>
        <label className={styles.fieldLabel} htmlFor="endDate">
          Hasta
        </label>
        <input
          className={styles.input}
          id="endDate"
          name="endDate"
          type="date"
          value={filters.endDate}
          onChange={(event) => onChange({ ...filters, endDate: event.target.value })}
        />
      </div>

      <div className={styles.filterActions}>
        <button className={styles.button} type="submit">
          Filtrar
        </button>
        <Link className={styles.link} href="/admin/reservations">
          Limpiar
        </Link>
      </div>
    </form>
  );
}
