import type { ReservationStatus } from "@/lib/reservations/types";
import styles from "./reservations.module.css";
import { STATUS_LABELS, statusTone } from "./reservations-monitor-shared";

export function ReservationStatusBadge({
  status,
  className,
  prefix,
}: {
  status: ReservationStatus;
  className?: string;
  prefix?: string;
}) {
  const tone = statusTone(status);
  const badgeClass = tone ? `${styles.badge} ${styles[tone as keyof typeof styles]}` : styles.badge;
  const label = prefix ? `${prefix} ${STATUS_LABELS[status]}` : STATUS_LABELS[status];

  return (
    <span className={`${badgeClass}${className ? ` ${className}` : ""}`.trim()} title={label}>
      {label}
    </span>
  );
}
