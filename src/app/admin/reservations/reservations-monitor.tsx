"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReservationListItem } from "@/lib/reservations/store";
import {
  buildReservationsFinancialReportHref,
  type ReservationsMonitorQuery,
} from "./reservations-query";
import { MonitorFilters } from "./reservations-monitor-filters";
import { MonitorStats } from "./reservations-monitor-stats";
import { MonitorTable } from "./reservations-monitor-table";
import type { MonitorFilterState } from "./reservations-monitor-shared";
import styles from "./reservations.module.css";

type Props = {
  items: ReservationListItem[];
  selectedId: string | null;
  query: ReservationsMonitorQuery;
};

export default function ReservationsMonitor({ items, selectedId, query }: Props) {
  const router = useRouter();
  const [activeId, setActiveId] = useState(selectedId ?? items[0]?.id ?? null);
  const [filters, setFilters] = useState<MonitorFilterState>({
    status: query.status ?? "",
    channel: query.channel ?? "",
    responsibleId: query.responsibleId ?? "",
    date: query.date ?? "",
    startDate: query.startDate ?? "",
    endDate: query.endDate ?? "",
  });

  useEffect(() => {
    setActiveId(selectedId ?? items[0]?.id ?? null);
  }, [items, selectedId]);

  useEffect(() => {
    setFilters({
      status: query.status ?? "",
      channel: query.channel ?? "",
      responsibleId: query.responsibleId ?? "",
      date: query.date ?? "",
      startDate: query.startDate ?? "",
      endDate: query.endDate ?? "",
    });
  }, [query.channel, query.date, query.endDate, query.responsibleId, query.startDate, query.status]);

  const stats = useMemo(
    () => ({
      total: items.length,
      pending: items.filter((item) => item.status === "pending_review").length,
      withBalance: items.filter((item) => (item.amountTotalCents ?? 0) > (item.amountPaidCents ?? 0)).length,
      paid: items.filter(
        (item) =>
          item.paymentStatus === "paid" ||
          ((item.amountTotalCents ?? 0) > 0 && (item.amountPaidCents ?? 0) >= (item.amountTotalCents ?? 0)),
      ).length,
      balanceDueCents: items.reduce(
        (sum, item) => sum + Math.max((item.amountTotalCents ?? 0) - (item.amountPaidCents ?? 0), 0),
        0,
      ),
    }),
    [items],
  );

  const selectReservation = (id: string) => {
    setActiveId(id);
    router.push(`/admin/reservations/${id}` as never);
  };

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
            <a className={styles.button} href="/admin/reservations/new">
              Nueva reserva manual
            </a>
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

          <MonitorStats
            total={stats.total}
            pending={stats.pending}
            withBalance={stats.withBalance}
            paid={stats.paid}
            balanceDueCents={stats.balanceDueCents}
          />
        </header>

        <section className={styles.section}>
          <div className={styles.tableCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Agenda operativa</h2>
            </div>

            <MonitorFilters activeId={activeId} filters={filters} onChange={updateFilters} />

            <p className={styles.helper}>
              Mostrando {items.length} reservas visibles.
            </p>

            <MonitorTable activeId={activeId} items={items} onSelect={selectReservation} />
          </div>
        </section>
      </div>
    </main>
  );
}
