import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { authenticate } from "@/middleware/authn";
import { hasPermission } from "@/lib/rbac";
import type { ComponentProps } from "react";
import {
  buildReservationsMonitorHref,
  buildReservationsOccupancyHref,
  normalizeReservationsMonitorQuery,
  type ReservationsMonitorSearchParams,
} from "../reservations-query";
import styles from "../reservations.module.css";

function getCurrentWeekAnchor(): string {
  const today = new Date();
  const day = today.getDay() || 7;
  today.setDate(today.getDate() - day + 1);
  return today.toISOString().slice(0, 10);
}

export default async function ReservationsOccupancyPage({
  searchParams,
}: {
  searchParams?: ReservationsMonitorSearchParams | Promise<ReservationsMonitorSearchParams>;
}) {
  const query = normalizeReservationsMonitorQuery((await searchParams) ?? {});
  const requestHeaders = new Headers();
  const currentHeaders = await headers();
  currentHeaders.forEach((value, key) => requestHeaders.set(key, value));
  const auth = await authenticate(new Request("http://localhost/admin/reservations/occupancy", { headers: requestHeaders }));
  if (!auth.authenticated || !hasPermission(auth.roles, "reservation:read")) {
    notFound();
  }

  const selectedWeek = query.week ?? getCurrentWeekAnchor();
  type ReservationsLinkHref = ComponentProps<typeof Link>["href"];

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
              href={buildReservationsMonitorHref({ ...query, view: "agenda" }) as ReservationsLinkHref}
            >
              Agenda
            </Link>
            <Link
              className={`${styles.button} ${styles.buttonSecondary}`}
              href={buildReservationsOccupancyHref({ ...query, view: "occupancy" }) as ReservationsLinkHref}
            >
              Ocupación
            </Link>
          </div>

          <div className={styles.stats}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Semana activa</span>
              <span className={styles.statValue}>{selectedWeek}</span>
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
              Semana: <strong>{selectedWeek}</strong>. Usa la navegación superior para volver a la agenda
              o mantener la misma ocupación.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
