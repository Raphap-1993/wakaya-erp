import type { OccupancyCellState } from "./occupancy/occupancy-utils";
import styles from "./reservations.module.css";

const OCCUPANCY_STATE_META: Record<OccupancyCellState, { label: string; className: string }> = {
  free: { label: "Libre", className: "occupancyFree" },
  occupied: { label: "Ocupado", className: "occupancyOccupied" },
  blocked: { label: "Bloqueado", className: "occupancyBlocked" },
  "attention-needed": { label: "Atención", className: "occupancyAttention" },
};

export function OccupancyStateBadge({
  state,
  label,
  className,
}: {
  state: OccupancyCellState;
  label?: string;
  className?: string;
}) {
  const meta = OCCUPANCY_STATE_META[state];
  const value = label ?? meta.label;

  return (
    <span
      className={`${styles.badge} ${styles[meta.className as keyof typeof styles]}${className ? ` ${className}` : ""}`.trim()}
      title={value}
    >
      {value}
    </span>
  );
}

export function OccupancyStateLegend() {
  return (
    <div className={styles.legendGrid}>
      {(["free", "occupied", "blocked", "attention-needed"] as OccupancyCellState[]).map((state) => (
        <OccupancyStateBadge key={state} state={state} />
      ))}
    </div>
  );
}
