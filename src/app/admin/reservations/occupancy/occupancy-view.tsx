"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReservationListItem } from "@/lib/reservations/store";
import type { Bungalow } from "@/lib/reservations/types";
import type { ReservationAudit } from "@/lib/reservations/types";
import { buildReservationsMonitorHref, buildReservationsOccupancyHref, type ReservationsMonitorQuery } from "../reservations-query";
import styles from "../reservations.module.css";
import { OccupancyDetailPanel } from "./occupancy-detail-panel";
import { OccupancyGrid } from "./occupancy-grid";
import { OccupancyStateLegend } from "../occupancy-state-badge";
import { ReservationMetricCards } from "../reservation-metric-cards";
import {
  buildOccupancyModel,
  getDefaultOccupancyCell,
  getOccupancySelectionValue,
  type OccupancyCell,
} from "./occupancy-utils";

type Props = {
  items: ReservationListItem[];
  bungalows: Bungalow[];
  query: ReservationsMonitorQuery;
  auditsByReservationId: Record<string, ReservationAudit[]>;
};

export default function OccupancyView({ items, bungalows, query, auditsByReservationId }: Props) {
  const router = useRouter();
  const model = useMemo(() => buildOccupancyModel(items, bungalows, query), [items, bungalows, query]);
  const firstSelectable = useMemo(() => getDefaultOccupancyCell(model.rows), [model.rows]);
  const [selectedKey, setSelectedKey] = useState<string | null>(
    model.selected ? `${model.selected.bungalowId}:${model.selected.date}` : firstSelectable?.key ?? null,
  );

  useEffect(() => {
    setSelectedKey(model.selected ? `${model.selected.bungalowId}:${model.selected.date}` : firstSelectable?.key ?? null);
  }, [firstSelectable?.key, model.selected]);

  const selectedCell =
    model.rows.flatMap((row) => row.cells).find((cell) => cell.key === selectedKey) ?? null;
  const selectedReservations = selectedCell?.reservations ?? [];
  const selectedReservation = selectedReservations.length === 1 ? selectedReservations[0] : null;
  const selectedBungalow = selectedCell
    ? bungalows.find((bungalow) => bungalow.id === selectedCell.bungalowId) ?? null
    : null;
  const selectedAudits = selectedReservation ? auditsByReservationId[selectedReservation.id] ?? [] : [];

  const handleSelect = (cell: OccupancyCell) => {
    setSelectedKey(cell.key);
    const nextQuery = {
      ...query,
      date: cell.date,
      selected: getOccupancySelectionValue(cell),
      view: "occupancy" as const,
    };
    router.replace(buildReservationsOccupancyHref(nextQuery) as never);
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Wakaya · operaciones internas</p>
          <h1 className={styles.title}>Ocupación semanal</h1>

          <ReservationMetricCards
            items={[
              { key: "week", label: "Semana activa", value: model.weekLabel },
              { key: "anchor", label: "Fecha ancla", value: model.anchorDate },
              {
                key: "selected",
                label: "Reserva seleccionada",
                value: selectedReservation?.number ?? "ninguna",
              },
            ]}
          />

          <div className={styles.heroActions}>
            <a
              className={`${styles.button} ${styles.buttonSecondary}`}
              href={buildReservationsOccupancyHref({ ...query, view: "occupancy" })}
            >
              Ocupación
            </a>
            <a className={`${styles.button} ${styles.buttonSecondary}`} href="/admin/reservations/flows">
              Roster de flujos
            </a>
            <a
              className={`${styles.button} ${styles.buttonSecondary}`}
              href={buildReservationsMonitorHref({ ...query, view: "agenda" })}
            >
              Abrir agenda operativa
            </a>
          </div>
        </header>

        <section className={styles.section}>
          <div className={styles.tableCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Grilla semanal</h2>
            </div>

            <OccupancyGrid days={model.days} rows={model.rows} selectedKey={selectedKey} onSelect={handleSelect} />
          </div>
        </section>

        <section className={styles.detailGrid}>
          <OccupancyDetailPanel
            reservation={selectedReservation}
            reservationsInCell={selectedReservations}
            bungalow={selectedBungalow}
            audits={selectedAudits}
            weekLabel={model.weekLabel}
            selectedDay={selectedCell?.date ?? null}
            selectedCellState={selectedCell?.state ?? null}
          />
          <div className={styles.sectionCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Leyenda</h2>
            </div>

            <OccupancyStateLegend />
          </div>
        </section>
      </div>
    </main>
  );
}
