import type { ReactNode } from "react";
import styles from "./reservations.module.css";

export interface ReservationMetricCard {
  key: string;
  label: string;
  value: ReactNode;
  tone?: "critical" | "warning" | "success" | "info" | "neutral";
  meta?: ReactNode;
}

export function ReservationMetricCards({
  items,
}: {
  items: ReservationMetricCard[];
}) {
  return (
    <div className={styles.stats}>
      {items.map((item) => (
        <div
          key={item.key}
          className={`${styles.statCard} ${
            item.tone ? styles[`statCard${item.tone[0].toUpperCase()}${item.tone.slice(1)}` as keyof typeof styles] : ""
          }`.trim()}
        >
          <span className={styles.statLabel}>{item.label}</span>
          <span className={styles.statValue}>{item.value}</span>
          {item.meta ? (
            <div className={styles.statMetaRow}>
              <span
                className={`${styles.badge} ${
                  item.tone
                    ? styles[`statMeta${item.tone[0].toUpperCase()}${item.tone.slice(1)}` as keyof typeof styles]
                    : styles.statMetaNeutral
                }`.trim()}
              >
                {item.meta}
              </span>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
