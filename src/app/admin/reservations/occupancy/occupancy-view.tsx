"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { InfoTooltip } from "@/app/admin/info-tooltip";
import type { ReservationListItem } from "@/lib/reservations/store";
import type { Bungalow } from "@/lib/reservations/types";
import type { ReservationAudit } from "@/lib/reservations/types";
import { addDays, compareDateOnly } from "@/lib/reservations/date-utils";
import { canPerformAction } from "@/lib/reservations/state-machine";
import type { BookingRequestMonitorItem } from "../requests/booking-request-monitor-presentation";
import { buildReservationsOccupancyHref, type ReservationsMonitorQuery } from "../reservations-query";
import styles from "../reservations.module.css";
import type { MonitorPermissions } from "../reservations-monitor-shared";
import { OccupancyGrid } from "./occupancy-grid";
import { OccupancyStateLegend } from "../occupancy-state-badge";
import { OccupancySelectionDialog } from "./occupancy-selection-dialog";
import {
  buildOccupancyModel,
  formatIsoWeekLabel,
  getCurrentWeekAnchor,
  getDefaultOccupancyCell,
  getOccupancySelectionValue,
  type OccupancyCell,
} from "./occupancy-utils";

type Props = {
  items: ReservationListItem[];
  bungalows: Bungalow[];
  query: ReservationsMonitorQuery;
  auditsByReservationId: Record<string, ReservationAudit[]>;
  linkedRequestsByReservationId: Record<string, BookingRequestMonitorItem>;
  weeklyRequestConflicts: BookingRequestMonitorItem[];
  permissions: MonitorPermissions;
};

function buildTemporalQuery(query: ReservationsMonitorQuery, anchorDate: string): ReservationsMonitorQuery {
  return {
    ...query,
    date: anchorDate,
    week: formatIsoWeekLabel(anchorDate),
    selected: undefined,
    view: "occupancy",
  };
}

export default function OccupancyView({
  items,
  bungalows,
  query,
  auditsByReservationId: _auditsByReservationId,
  linkedRequestsByReservationId,
  weeklyRequestConflicts,
  permissions,
}: Props) {
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
  const candidateReservations = useMemo(() => {
    if (!selectedCell) {
      return [];
    }

    return items
      .filter((item) => item.id !== selectedReservation?.id)
      .filter((item) => canPerformAction(item.status, "assign"))
      .filter(
        (item) =>
          compareDateOnly(item.startDate, selectedCell.date) <= 0 &&
          compareDateOnly(item.endDate, selectedCell.date) >= 0,
      )
      .sort((left, right) => {
        const leftWeight = left.bungalowId ? 1 : 0;
        const rightWeight = right.bungalowId ? 1 : 0;
        return leftWeight - rightWeight || left.startDate.localeCompare(right.startDate) || left.number.localeCompare(right.number);
      });
  }, [items, selectedCell, selectedReservation?.id]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const conflictCells = useMemo(
    () =>
      model.rows.flatMap((row) =>
        row.cells
          .filter((cell) => cell.state === "blocked")
          .map((cell) => {
            const linkedRequests = cell.reservations
              .flatMap((reservation) => {
                const request = linkedRequestsByReservationId[reservation.id];
                return request ? [request] : [];
              })
              .filter(
                (request, index, collection) =>
                  collection.findIndex((candidate) => candidate.id === request.id) === index,
              );

            return {
              cell,
              bungalowName: row.bungalow.name,
              summary:
                linkedRequests.length > 0
                  ? linkedRequests.map((request) => request.publicRef).join(" · ")
                  : cell.reservations
                      .map((reservation) => reservation.number)
                      .slice(0, 2)
                      .join(" · "),
            };
          }),
      ),
    [linkedRequestsByReservationId, model.rows],
  );
  const requestConflictEntries = useMemo(
    () =>
      weeklyRequestConflicts.map((request) => ({
        id: request.id,
        href: `/admin/reservations/requests/${request.id}`,
        label: `${request.requestedCheckIn} · ${request.publicRef}`,
        meta: `Solicitud web · ${request.guestName} · ${request.conflicts.length} alerta${
          request.conflicts.length === 1 ? "" : "s"
        }`,
      })),
    [weeklyRequestConflicts],
  );
  const hasUrgentConflicts = requestConflictEntries.length + conflictCells.length > 0;
  const temporalNavigation = useMemo(() => {
    const previousWeekAnchor = addDays(model.anchorDate, -7);
    const nextWeekAnchor = addDays(model.anchorDate, 7);
    const currentWeekAnchor = getCurrentWeekAnchor();

    return {
      previousWeek: buildReservationsOccupancyHref(buildTemporalQuery(query, previousWeekAnchor)),
      currentWeek: buildReservationsOccupancyHref(buildTemporalQuery(query, currentWeekAnchor)),
      nextWeek: buildReservationsOccupancyHref(buildTemporalQuery(query, nextWeekAnchor)),
      currentWeekIsActive: currentWeekAnchor === model.anchorDate,
    };
  }, [model.anchorDate, query]);

  const handleSelect = (cell: OccupancyCell) => {
    setSelectedKey(cell.key);
    setIsDialogOpen(true);
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
        <section className={styles.section}>
          <div className={styles.tableCard}>
            <div className={styles.occupancyToolbar}>
              <h1 className={styles.occupancyToolbarTitle}>Ocupación semanal</h1>
              <div className={styles.occupancyToolbarButtons} aria-label="Navegación semanal">
                <Link className={`${styles.button} ${styles.buttonSecondary} ${styles.buttonCompact}`} href={temporalNavigation.previousWeek as never}>
                  Semana anterior
                </Link>
                <Link
                  className={`${styles.button} ${temporalNavigation.currentWeekIsActive ? "" : styles.buttonSecondary} ${styles.buttonCompact}`.trim()}
                  href={temporalNavigation.currentWeek as never}
                  aria-current={temporalNavigation.currentWeekIsActive ? "page" : undefined}
                >
                  Semana actual
                </Link>
                <Link className={`${styles.button} ${styles.buttonSecondary} ${styles.buttonCompact}`} href={temporalNavigation.nextWeek as never}>
                  Semana siguiente
                </Link>
              </div>
            </div>

            <div className={styles.occupancyConflictRail}>
              <div className={styles.occupancyConflictHeader}>
                <div className={styles.occupancyConflictLead}>
                  {hasUrgentConflicts ? <span className={styles.occupancyConflictEyebrow}>Atención inmediata</span> : null}
                  <div className={styles.occupancyConflictTitle}>
                    <strong>Conflictos activos</strong>
                    <InfoTooltip label="Aquí se concentran dos frentes: solicitudes web con choque de fechas y celdas bloqueadas de la grilla. Desde esta franja entras directo al hilo del cliente o al modal exacto de reprogramación." />
                  </div>
                  {hasUrgentConflicts ? (
                    <p className={styles.occupancyConflictHint}>
                      Revisa primero si debes hablar con un cliente web o corregir una celda roja de la grilla.
                    </p>
                  ) : null}
                </div>
                <span
                  className={`${styles.badge} ${
                    hasUrgentConflicts ? styles.statusCancelled : styles.statusConfirmed
                  }`}
                >
                  {requestConflictEntries.length + conflictCells.length}
                </span>
              </div>

              {hasUrgentConflicts ? (
                <div className={styles.occupancyConflictGroups}>
                  {requestConflictEntries.length > 0 ? (
                    <div className={styles.occupancyConflictGroup}>
                      <span className={styles.occupancyConflictGroupTitle}>Web con cliente</span>
                      <div className={styles.occupancyConflictList}>
                        {requestConflictEntries.map((entry) => (
                          <Link key={entry.id} className={styles.occupancyConflictLink} href={entry.href as never}>
                            <strong className={styles.occupancyConflictLabel}>{entry.label}</strong>
                            <span className={styles.occupancyConflictMeta}>{entry.meta}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {conflictCells.length > 0 ? (
                    <div className={styles.occupancyConflictGroup}>
                      <span className={styles.occupancyConflictGroupTitle}>Choques de ocupación</span>
                      <div className={styles.occupancyConflictList}>
                        {conflictCells.map((entry) => (
                          <button
                            key={entry.cell.key}
                            className={styles.occupancyConflictButton}
                            type="button"
                            onClick={() => handleSelect(entry.cell)}
                          >
                            <strong className={styles.occupancyConflictLabel}>
                              {entry.cell.date} · {entry.bungalowName}
                            </strong>
                            <span className={styles.occupancyConflictMeta}>
                              {entry.cell.reservations.length} reservas · {entry.summary}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className={styles.helper}>Sin conflictos abiertos en esta semana.</p>
              )}
            </div>

            <OccupancyGrid days={model.days} rows={model.rows} selectedKey={selectedKey} onSelect={handleSelect} />
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Leyenda operativa</h2>
            </div>

            <OccupancyStateLegend />
          </div>
        </section>

        {selectedCell && isDialogOpen ? (
          <OccupancySelectionDialog
            reservation={selectedReservation}
            reservationsInCell={selectedReservations}
            bungalow={selectedBungalow}
            bungalows={bungalows}
            permissions={permissions}
            candidateReservations={candidateReservations}
            weekLabel={model.weekLabel}
            selectedDay={selectedCell.date}
            selectedCellState={selectedCell.state}
            linkedRequestsByReservationId={linkedRequestsByReservationId}
            onClose={() => setIsDialogOpen(false)}
          />
        ) : null}
      </div>
    </main>
  );
}
