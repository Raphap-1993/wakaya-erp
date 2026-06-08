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
          <p className={styles.lead}>
            Mapa semanal por bungalow. Cada celda muestra el estado operativo del día y enlaza con el detalle diario.
          </p>

          <div className={styles.stats}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Semana activa</span>
              <span className={styles.statValue}>{model.weekLabel}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Fecha ancla</span>
              <span className={styles.statValue}>{model.anchorDate}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Reserva seleccionada</span>
              <span className={styles.statValue}>{selectedReservation?.number ?? "ninguna"}</span>
            </div>
          </div>

          <div className={styles.heroActions}>
            <a
              className={`${styles.button} ${styles.buttonSecondary}`}
              href={buildReservationsOccupancyHref({ ...query, view: "occupancy" })}
            >
              Ocupación
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
              <div>
                <h2 className={styles.cardTitle}>Grilla semanal de bungalows</h2>
                <p className={styles.cardCopy}>
                  Libre, ocupado, conflicto y atención se diferencian por color y contenido. La celda seleccionada
                  abre el detalle a la derecha.
                </p>
              </div>
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
              <div>
                <h2 className={styles.cardTitle}>Leyenda</h2>
                <p className={styles.cardCopy}>Estados explícitos de ocupación para lectura rápida del inventario.</p>
              </div>
            </div>

            <div className={styles.legendGrid}>
              <span className={`${styles.badge} ${styles.occupancyFree}`}>Libre</span>
              <span className={`${styles.badge} ${styles.occupancyOccupied}`}>Ocupado</span>
              <span className={`${styles.badge} ${styles.occupancyBlocked}`}>Bloqueado</span>
              <span className={`${styles.badge} ${styles.occupancyAttention}`}>Atención</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
