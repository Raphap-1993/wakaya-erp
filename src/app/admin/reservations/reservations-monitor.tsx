"use client";

import { useEffect, useMemo, useState } from "react";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import type { ReservationListItem } from "@/lib/reservations/store";
import { buildReservationsMonitorHref, type ReservationsMonitorQuery } from "./reservations-query";
import { MonitorDetailPanel } from "./reservations-monitor-detail-panel";
import { MonitorFilters } from "./reservations-monitor-filters";
import { MonitorSelectionSummary } from "./reservations-monitor-selection-summary";
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
  const defaultSelectionSync = useRef(false);
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

  useEffect(() => {
    if (!activeId) return;
    if (query.selected === activeId) {
      defaultSelectionSync.current = false;
      return;
    }
    if (defaultSelectionSync.current) return;
    router.replace(buildReservationsMonitorHref({ ...query, selected: activeId }) as never);
    defaultSelectionSync.current = true;
  }, [activeId, query, router]);

  const activeItem = useMemo(
    () => items.find((item) => item.id === activeId) ?? null,
    [activeId, items],
  );

  const stats = useMemo(
    () => ({
      total: items.length,
      pending: items.filter((item) => item.status === "pending_review").length,
      assigned: items.filter((item) => item.status === "assigned").length,
    }),
    [items],
  );

  const selectReservation = (id: string) => {
    defaultSelectionSync.current = true;
    setActiveId(id);
    router.replace(buildReservationsMonitorHref({ ...query, selected: id }) as never);
  };

  const updateFilters = (next: MonitorFilterState) => {
    setFilters(next);
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Wakaya · operaciones internas</p>
          <h1 className={styles.title}>Mini monitor de reservas</h1>
          <p className={styles.lead}>
            Vista operativa para recepción y administración. La lista, el detalle y la auditoría
            hablan la misma verdad.
          </p>

          <MonitorStats total={stats.total} pending={stats.pending} assigned={stats.assigned} />
        </header>

        <section className={styles.section}>
          <div className={styles.tableCard}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>Reservas registradas</h2>
                <p className={styles.cardCopy}>
                  Una sola fuente de verdad para disponibilidad, asignación y trazabilidad.
                </p>
              </div>
            </div>

            <MonitorFilters activeId={activeId} filters={filters} onChange={updateFilters} />

            <p className={styles.helper}>
              Mostrando {items.length} reservas visibles.
            </p>

            <MonitorTable activeId={activeId} items={items} onSelect={selectReservation} />
          </div>
        </section>

        <section className={styles.detailGrid}>
          <div className={styles.stack}>
            <MonitorSelectionSummary activeItem={activeItem} />
          </div>

          <aside className={styles.actions}>
            <MonitorDetailPanel activeItem={activeItem} />
          </aside>
        </section>
      </div>
    </main>
  );
}
