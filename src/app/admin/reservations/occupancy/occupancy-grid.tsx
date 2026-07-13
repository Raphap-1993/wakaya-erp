"use client";

import styles from "../reservations.module.css";
import type { OccupancyCell, OccupancyDay, OccupancyRow } from "./occupancy-utils";

function cellLabel(cell: OccupancyCell): string {
  switch (cell.state) {
    case "free":
      return "Libre";
    case "occupied":
      return "Ocupado";
    case "blocked":
      return "Conflicto";
    case "attention-needed":
      return "Atención";
    default:
      return "Libre";
  }
}

function cellMeta(cell: OccupancyCell): string {
  if (cell.state === "free") {
    return "Asignar o crear";
  }

  if (cell.state === "blocked") {
    return `${cell.reservations.length} reservas`;
  }

  return cell.primaryReservation?.number ?? "Reserva activa";
}

function cellClass(state: OccupancyCell["state"], selected: boolean): string {
  const stateClass =
    state === "free"
      ? styles.occupancyFree
      : state === "occupied"
        ? styles.occupancyOccupied
        : state === "blocked"
          ? styles.occupancyBlocked
          : styles.occupancyAttention;

  return selected ? `${styles.occupancyCell} ${stateClass} ${styles.occupancySelected}` : `${styles.occupancyCell} ${stateClass}`;
}

export function OccupancyGrid({
  days,
  rows,
  selectedKey,
  onSelect,
}: {
  days: OccupancyDay[];
  rows: OccupancyRow[];
  selectedKey: string | null;
  onSelect: (cell: OccupancyCell) => void;
}) {
  return (
    <div className={styles.occupancyGridWrap}>
      <div className={styles.occupancyGridHeader}>
        <div className={styles.occupancyStickyCorner}>Bungalow</div>
        {days.map((day) => (
          <div key={day.date} className={styles.occupancyDayHeader}>
            <span className={styles.occupancyDayLabel}>{day.weekday}</span>
            <span className={styles.occupancyDayValue}>{day.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.occupancyGridBody}>
        {rows.map((row) => (
          <div key={row.bungalow.id} className={styles.occupancyRow}>
            <div className={styles.occupancyBungalowCell}>
              <span className={styles.rowMain}>{row.bungalow.name}</span>
              <span className={styles.muted}>{row.bungalow.code}</span>
            </div>
            {row.cells.map((cell) => {
              const selected = selectedKey === cell.key;
              return (
                <button
                  key={cell.key}
                  type="button"
                  className={cellClass(cell.state, selected)}
                  onClick={() => onSelect(cell)}
                >
                  <span className={styles.occupancyCellDate}>{cellLabel(cell)}</span>
                  <span className={styles.occupancyCellMeta}>{cellMeta(cell)}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
