import type { ReactNode } from "react";
import styles from "./reservations.module.css";

export interface ReservationMetricCard {
  key: string;
  label: string;
  value: ReactNode;
}

export function ReservationMetricCards({
  items,
}: {
  items: ReservationMetricCard[];
}) {
  return (
    <div className={styles.stats}>
      {items.map((item) => (
        <div key={item.key} className={styles.statCard}>
          <span className={styles.statLabel}>{item.label}</span>
          <span className={styles.statValue}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}
