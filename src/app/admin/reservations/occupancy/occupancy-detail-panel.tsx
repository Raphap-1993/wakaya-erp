"use client";

import Link from "next/link";
import styles from "../reservations.module.css";
import { formatMoneyCents, PAYMENT_STATUS_LABELS, STATUS_LABELS, statusTone } from "../reservations-monitor-shared";
import type { ReservationListItem } from "@/lib/reservations/store";
import type { Bungalow, ReservationAudit } from "@/lib/reservations/types";
import { buildReservationsMonitorHref } from "../reservations-query";
import {
  auditSummary,
  paymentLabel,
  statusLabel,
  validOccupancyActions,
} from "./occupancy-utils";

function statusClass(status: ReservationListItem["status"]): string {
  const tone = statusTone(status);
  return tone ? `${styles.badge} ${styles[tone as keyof typeof styles]}` : styles.badge;
}

export function OccupancyDetailPanel({
  reservation,
  reservationsInCell,
  bungalow,
  audits,
  weekLabel,
  selectedDay,
  selectedCellState,
}: {
  reservation: ReservationListItem | null;
  reservationsInCell: ReservationListItem[];
  bungalow: Bungalow | null;
  audits: ReservationAudit[];
  weekLabel: string;
  selectedDay: string | null;
  selectedCellState: string | null;
}) {
  const balanceCents = reservation ? Math.max((reservation.amountTotalCents ?? 0) - (reservation.amountPaidCents ?? 0), 0) : 0;
  const actions = validOccupancyActions(reservation);
  const alerts = reservation
    ? [
        selectedCellState === "blocked" ? "Conflicto de ocupación en esta celda." : null,
        selectedCellState === "attention-needed" ? "La celda requiere revisión operativa." : null,
        balanceCents > 0 ? "Hay saldo pendiente." : null,
      ].filter((value): value is string => Boolean(value))
    : [
        selectedCellState === "blocked" ? "Conflicto de ocupación en esta celda." : null,
        selectedCellState === "attention-needed" ? "La celda requiere revisión operativa." : null,
        selectedCellState === "free" ? "La celda está libre." : null,
      ].filter((value): value is string => Boolean(value));
  const hasConflict = reservationsInCell.length > 1;
  const agendaHref = buildReservationsMonitorHref({
    view: "agenda",
    selected: reservation?.id,
    date: selectedDay ?? undefined,
  });

  return (
    <aside className={styles.sectionCard}>
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>Detalle diario</h2>
          <p className={styles.cardCopy}>La celda seleccionada resume ocupación, pago, auditoría y acciones válidas.</p>
        </div>
        {reservation ? <span className={statusClass(reservation.status)}>{STATUS_LABELS[reservation.status]}</span> : null}
      </div>

      <div className={styles.stack}>
        <div className={styles.kvGrid}>
          <div className={styles.kv}>
            <span className={styles.kvLabel}>Semana</span>
            <span className={styles.kvValue}>{weekLabel}</span>
          </div>
          <div className={styles.kv}>
            <span className={styles.kvLabel}>Día</span>
            <span className={styles.kvValue}>{selectedDay ?? "Sin selección"}</span>
          </div>
          <div className={styles.kv}>
            <span className={styles.kvLabel}>Reserva</span>
            <span className={styles.kvValue}>{reservation?.number ?? "Sin reserva"}</span>
          </div>
          <div className={styles.kv}>
            <span className={styles.kvLabel}>Bungalow</span>
            <span className={styles.kvValue}>{bungalow?.name ?? "Sin asignar"}</span>
          </div>
          <div className={styles.kv}>
            <span className={styles.kvLabel}>Huésped</span>
            <span className={styles.kvValue}>{reservation?.responsibleId ?? "No disponible"}</span>
          </div>
          <div className={styles.kv}>
            <span className={styles.kvLabel}>Estadía</span>
            <span className={styles.kvValue}>
              {reservation ? `${reservation.startDate} → ${reservation.endDate}` : "Sin estadía activa"}
            </span>
          </div>
        </div>

        <div className={styles.kvGrid}>
          <div className={styles.kv}>
            <span className={styles.kvLabel}>Cobro</span>
            <span className={styles.kvValue}>{PAYMENT_STATUS_LABELS[reservation?.paymentStatus ?? "pending"]}</span>
          </div>
          <div className={styles.kv}>
            <span className={styles.kvLabel}>Saldo</span>
            <span className={styles.kvValue}>{formatMoneyCents(balanceCents)}</span>
          </div>
        </div>

        <div className={styles.detailSummary}>
          <span className={styles.fieldLabel}>Alertas</span>
          <div className={styles.detailActionList}>
            {alerts.map((alert) => (
              <span key={alert} className={`${styles.badge} ${styles.occupancyAttention}`}>
                {alert}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.detailSummary}>
          <p className={styles.helper}>{paymentLabel(reservation?.paymentStatus)}</p>
          <p className={styles.helper}>{auditSummary(audits)}</p>
          <p className={styles.helper}>{reservation ? statusLabel(reservation.status) : "Libre"}</p>
        </div>

        {hasConflict ? (
          <div className={styles.detailSummary}>
            <span className={styles.fieldLabel}>Reservas en conflicto</span>
            <ul className={styles.auditList}>
              {reservationsInCell.map((item) => (
                <li key={item.id} className={styles.auditItem}>
                  <div className={styles.auditMeta}>
                    <span>{item.number}</span>
                    <span>{STATUS_LABELS[item.status]}</span>
                  </div>
                  <p className={styles.helper}>{paymentLabel(item.paymentStatus)}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className={styles.buttonRow}>
          <Link
            className={`${styles.button} ${styles.buttonSecondary}`}
            href={reservation ? (`/admin/reservations/${reservation.id}` as any) : "/admin/reservations"}
          >
            Ver reserva
          </Link>
          <Link className={`${styles.button} ${styles.buttonSecondary}`} href={agendaHref as any}>
            Abrir agenda operativa
          </Link>
        </div>

        <div className={styles.detailActions}>
          <span className={styles.fieldLabel}>Acciones válidas</span>
          <div className={styles.detailActionList}>
            <button className={styles.detailActionPill} type="button" disabled={!reservation || !actions.includes("confirm")}>
              Confirmar reserva
            </button>
            <button className={styles.detailActionPill} type="button" disabled={!reservation || !actions.includes("assign")}>
              Reasignar bungalow
            </button>
            <button className={styles.detailActionPill} type="button" disabled={!reservation || !actions.includes("check_in")}>
              Registrar check-in
            </button>
            <button className={styles.detailActionPill} type="button" disabled={!reservation || !actions.includes("check_out")}>
              Registrar check-out
            </button>
            <button className={styles.detailActionPill} type="button" disabled={!reservation || !actions.includes("mark_paid")}>
              Registrar pago
            </button>
            <button className={styles.detailActionPill} type="button" disabled={!reservation || !actions.includes("mark_no_show")}>
              Marcar no show
            </button>
            <button className={styles.detailActionPill} type="button" disabled={!reservation || !actions.includes("cancel")}>
              Cancelar estadía
            </button>
          </div>
        </div>

        <div className={styles.detailSummary}>
          <span className={styles.fieldLabel}>Estado visible</span>
          <p className={styles.helper}>{reservation ? STATUS_LABELS[reservation.status] : selectedCellState === "blocked" ? "Bloqueado" : selectedCellState === "attention-needed" ? "Atención" : "Libre"}</p>
        </div>

        <div className={styles.detailSummary}>
          <span className={styles.fieldLabel}>Auditoría reciente</span>
          {audits.length > 0 ? (
            <ul className={styles.auditList}>
              {audits.slice(0, 3).map((item) => (
                <li key={item.id} className={styles.auditItem}>
                  <div className={styles.auditMeta}>
                    <span>{item.createdAt}</span>
                    <span>{item.action}</span>
                  </div>
                  <p className={styles.helper}>{item.reason}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.helper}>Sin eventos recientes.</p>
          )}
        </div>
      </div>
    </aside>
  );
}
