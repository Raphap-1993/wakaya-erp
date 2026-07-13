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
