import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { authenticate } from "@/middleware/authn";
import { hasPermission } from "@/lib/rbac";
import { normalizeReservationsMonitorQuery, buildReservationsMonitorHref, buildReservationsOccupancyHref } from "../reservations-query";
import styles from "../reservations.module.css";

type SearchParams = {
  status?: string | string[];
  channel?: string | string[];
  responsibleId?: string | string[];
  date?: string | string[];
  startDate?: string | string[];
  endDate?: string | string[];
  week?: string | string[];
  selected?: string | string[];
};

export default async function ReservationsOccupancyPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const query = normalizeReservationsMonitorQuery((await searchParams) ?? {});
  const requestHeaders = new Headers();
  const currentHeaders = await headers();
  currentHeaders.forEach((value, key) => requestHeaders.set(key, value));
  const auth = await authenticate(new Request("http://localhost/admin/reservations/occupancy", { headers: requestHeaders }));
  if (!auth.authenticated || !hasPermission(auth.roles, "reservation:read")) {
    notFound();
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Wakaya · operaciones internas</p>
          <h1 className={styles.title}>Ocupación semanal</h1>
          <p className={styles.lead}>
            Vista hermana del monitor para revisar inventario por bungalow y semana seleccionada.
          </p>

          <div className={styles.heroActions}>
            <Link
              className={`${styles.button} ${styles.buttonSecondary}`}
              href={buildReservationsMonitorHref(query) as never}
            >
              Agenda
            </Link>
            <Link
              className={`${styles.button} ${styles.buttonSecondary}`}
              href={buildReservationsOccupancyHref(query) as never}
            >
              Ocupación
            </Link>
          </div>

          <div className={styles.stats}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Semana activa</span>
              <span className={styles.statValue}>{query.week ?? "actual"}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Filtro fecha</span>
              <span className={styles.statValue}>{query.date ?? "sin fecha"}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Selección</span>
              <span className={styles.statValue}>{query.selected ?? "ninguna"}</span>
            </div>
          </div>
        </header>

        <section className={styles.section}>
          <div className={styles.tableCard}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>Shell de ocupación</h2>
                <p className={styles.cardCopy}>
                  Esta ruta queda lista para la grilla semanal y conserva el estado de navegación actual.
                </p>
              </div>
            </div>

            <p className={styles.helper}>
              Semana: <strong>{query.week ?? "actual"}</strong>. Usa la navegación superior para volver a la agenda
              o mantener la misma ocupación.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
