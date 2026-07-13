"use client";

import { useEffect, useState } from "react";
import type { ReservationListItem } from "@/lib/reservations/store";
import {
  buildReservationsFinancialReportHref,
  type ReservationsMonitorQuery,
} from "./reservations-query";
import { MonitorFilters } from "./reservations-monitor-filters";
import { MonitorTable } from "./reservations-monitor-table";
import type { MonitorFilterState, MonitorPermissions } from "./reservations-monitor-shared";
import styles from "./reservations.module.css";

type Props = {
  items: ReservationListItem[];
  selectedId: string | null;
  query: ReservationsMonitorQuery;
  permissions: MonitorPermissions;
};

export default function ReservationsMonitor({ items, selectedId, query, permissions }: Props) {
  const activeId = selectedId ?? items[0]?.id ?? null;
  const [filters, setFilters] = useState<MonitorFilterState>({
    status: query.status ?? "",
    channel: query.channel ?? "",
  });

  useEffect(() => {
    setFilters({
      status: query.status ?? "",
      channel: query.channel ?? "",
    });
  }, [query.channel, query.status]);

  const updateFilters = (next: MonitorFilterState) => {
    setFilters(next);
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Wakaya · operaciones internas</p>
          <h1 className={styles.title}>Agenda operativa de reservas</h1>

          <div className={styles.heroActions}>
            {permissions.canWrite ? (
              <a className={styles.button} href="/admin/reservations/new">
                Nueva reserva manual
              </a>
            ) : null}
            <a className={`${styles.button} ${styles.buttonSecondary}`} href="/admin/reservations/flows">
              Roster de flujos
            </a>
            <a
              className={`${styles.button} ${styles.buttonSecondary}`}
              href={buildReservationsFinancialReportHref(query)}
              target="_blank"
              rel="noreferrer"
            >
              Ver reporte financiero
            </a>
            <a
              className={`${styles.button} ${styles.buttonSecondary}`}
              href={buildReservationsFinancialReportHref(query, "csv")}
              target="_blank"
              rel="noreferrer"
            >
              Exportar CSV
            </a>
          </div>
        </header>

        <section className={styles.section}>
          <div className={styles.tableCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Agenda operativa</h2>
            </div>

            <MonitorFilters
              activeId={activeId}
              filters={filters}
              onChange={updateFilters}
            />

            <p className={styles.helper}>
              Mostrando {items.length} reservas visibles.
            </p>

            <MonitorTable activeId={activeId} items={items} permissions={permissions} />
          </div>
        </section>
      </div>
    </main>
  );
}
