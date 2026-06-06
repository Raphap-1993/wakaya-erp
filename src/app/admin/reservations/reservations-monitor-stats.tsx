import styles from "./reservations.module.css";

export function MonitorStats({
  total,
  pending,
  assigned,
}: {
  total: number;
  pending: number;
  assigned: number;
}) {
  return (
    <div className={styles.stats}>
      <div className={styles.statCard}>
        <span className={styles.statLabel}>Reservas visibles</span>
        <span className={styles.statValue}>{total}</span>
      </div>
      <div className={styles.statCard}>
        <span className={styles.statLabel}>Pendientes</span>
        <span className={styles.statValue}>{pending}</span>
      </div>
      <div className={styles.statCard}>
        <span className={styles.statLabel}>Asignadas</span>
        <span className={styles.statValue}>{assigned}</span>
      </div>
    </div>
  );
}
