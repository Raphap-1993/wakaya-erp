"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ReservationDetail, ReservationListItem } from "@/lib/reservations/store";
import { canPerformAction } from "@/lib/reservations/state-machine";
import type { Bungalow, ReservationAction, ReservationAudit } from "@/lib/reservations/types";
import styles from "./reservations.module.css";
import {
  formatMoneyCents,
  PAYMENT_STATUS_LABELS,
  STATUS_LABELS,
  type MonitorPermissions,
} from "./reservations-monitor-shared";

const ACTION_LABELS: Record<ReservationAction, string> = {
  confirm: "Confirmar",
  assign: "Asignar bungalow",
  check_in: "Registrar check-in",
  check_out: "Registrar check-out",
  mark_paid: "Marcar pago completo",
  cancel: "Cancelar",
  mark_no_show: "Marcar no show",
};

type FeedbackState =
  | { kind: "success"; message: string }
  | { kind: "blocked"; message: string }
  | { kind: "error"; message: string }
  | null;

function describeAudit(item: ReservationAudit): string {
  return `${STATUS_LABELS[item.previousStatus]} → ${STATUS_LABELS[item.nextStatus]}`;
}

async function readResponseBody(response: Response): Promise<{ error?: string; message?: string; reason?: string }> {
  try {
    return (await response.json()) as { error?: string; message?: string; reason?: string };
  } catch {
    return {};
  }
}

function describeApiIssue(error?: string, message?: string, reason?: string): string {
  const code = error ?? reason ?? "";
  switch (code) {
    case "invalid_transition":
      return "La transición no está permitida para este estado.";
    case "occupancy_conflict":
      return "El bungalow ya está ocupado en parte de esta estadía.";
    case "bungalow_inactive":
      return "El bungalow seleccionado no está activo.";
    case "reservation_not_found":
      return "No se encontró la reserva.";
    case "invalid_payload":
      return "Los datos enviados no son válidos.";
    case "unauthorized":
      return "La sesión no tiene permisos para esta acción.";
    case "forbidden":
      return "La sesión no tiene permisos para esta acción.";
    default:
      return message ?? reason ?? error ?? "No se pudo completar la acción";
  }
}

export function MonitorDetailPanel({
  activeItem,
  bungalows,
  permissions,
}: {
  activeItem: ReservationListItem | ReservationDetail | null;
  bungalows: Bungalow[];
  permissions: MonitorPermissions;
}) {
  const router = useRouter();
  const [auditTrail, setAuditTrail] = useState<ReservationAudit[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditReloadKey, setAuditReloadKey] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [pendingAction, setPendingAction] = useState<"assign" | "payment" | ReservationAction | null>(null);
  const [isPending, startTransition] = useTransition();
  const refreshTimerRef = useRef<number | null>(null);
  const activeReservationIdRef = useRef<string | null>(activeItem?.id ?? null);
  activeReservationIdRef.current = activeItem?.id ?? null;

  const assignEligibleByStatus = activeItem ? canPerformAction(activeItem.status, "assign") : false;
  const assignEnabled = assignEligibleByStatus && permissions.canAssign;
  const balanceCents = activeItem ? Math.max((activeItem.amountTotalCents ?? 0) - (activeItem.amountPaidCents ?? 0), 0) : 0;
  const paymentEnabled = Boolean(activeItem && permissions.canApprove && balanceCents > 0);
  const assignableBungalows = useMemo(
    () => bungalows.filter((bungalow) => bungalow.active),
    [bungalows],
  );
  const quickActions = useMemo(
    () =>
      activeItem
        ? ([
            "confirm",
            "check_in",
            "check_out",
            "mark_paid",
            "cancel",
            "mark_no_show",
          ] as ReservationAction[]).filter((action) => canPerformAction(activeItem.status, action))
        : [],
    [activeItem],
  );

  useEffect(() => {
    setFeedback(null);
    setPendingAction(null);
    if (refreshTimerRef.current !== null) {
      window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, [activeItem?.id]);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!activeItem) {
      setAuditTrail([]);
      setAuditError(null);
      setAuditLoading(false);
      return;
    }

    const reservationId = activeItem.id;

    const controller = new AbortController();

    async function loadAudit() {
      setAuditLoading(true);
      setAuditError(null);

      try {
        const response = await fetch(`/api/reservations/${reservationId}/audit`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          const body = await readResponseBody(response);
          throw new Error(body.message ?? body.reason ?? body.error ?? "No se pudo cargar la auditoría");
        }
        const payload = (await response.json()) as { items?: ReservationAudit[] };
        setAuditTrail(payload.items ?? []);
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setAuditTrail([]);
        setAuditError(error instanceof Error ? error.message : "No se pudo cargar la auditoría");
      } finally {
        if (!controller.signal.aborted) {
          setAuditLoading(false);
        }
      }
    }

    void loadAudit();

    return () => controller.abort();
  }, [activeItem?.id, auditReloadKey]);

  const refreshAfterFeedback = () => {
    if (refreshTimerRef.current !== null) {
      window.clearTimeout(refreshTimerRef.current);
    }
    refreshTimerRef.current = window.setTimeout(() => {
      startTransition(() => {
        router.refresh();
      });
      refreshTimerRef.current = null;
    }, 650);
  };

  const reportResult = (response: Response, successMessage: string, reservationId: string) => {
    if (response.ok) {
      if (activeReservationIdRef.current !== reservationId) return;
      setFeedback({ kind: "success", message: successMessage });
      setAuditReloadKey((value) => value + 1);
      refreshAfterFeedback();
      return;
    }

    void readResponseBody(response).then((body) => {
      if (activeReservationIdRef.current !== reservationId) return;
      const rawMessage = describeApiIssue(body.error, body.message, body.reason);
      const kind =
        response.status === 403 || response.status === 409 || response.status === 422
          ? "blocked"
          : "error";
      setFeedback({ kind, message: rawMessage });
    });
  };

  const submitAssign = async (bungalowId: string) => {
    if (!activeItem || !assignEnabled || !bungalowId || pendingAction) return;

    const reservationId = activeItem.id;
    setFeedback(null);
    setPendingAction("assign");
    try {
      const response = await fetch(`/api/reservations/${reservationId}/assign`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          bungalowId,
          reason: "Asignación operativa desde recepción",
          actorId: "system",
        }),
      });

      const stillSelected = activeReservationIdRef.current === reservationId;
      if (!stillSelected && response.ok) {
        router.refresh();
        return;
      }
      if (!stillSelected) return;
      reportResult(response, `Bungalow asignado a ${activeItem.number}.`, reservationId);
    } catch {
      if (activeReservationIdRef.current !== reservationId) return;
      setFeedback({ kind: "error", message: "No se pudo conectar con el servidor." });
    } finally {
      if (activeReservationIdRef.current === reservationId) {
        setPendingAction(null);
      }
    }
  };

  const submitPayment = async () => {
    if (!activeItem || !paymentEnabled || pendingAction) return;

    const reservationId = activeItem.id;
    const amountPaidCents = balanceCents;
    setFeedback(null);
    setPendingAction("payment");
    try {
      const response = await fetch(`/api/reservations/${reservationId}/payments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amountPaidCents,
          reason: "Registro de pago completo desde recepción",
          actorId: "system",
        }),
      });

      const stillSelected = activeReservationIdRef.current === reservationId;
      if (!stillSelected && response.ok) {
        router.refresh();
        return;
      }
      if (!stillSelected) return;
      reportResult(
        response,
        `Pago registrado por ${formatMoneyCents(amountPaidCents)} en ${activeItem.number}.`,
        reservationId,
      );
    } catch {
      if (activeReservationIdRef.current !== reservationId) return;
      setFeedback({ kind: "error", message: "No se pudo conectar con el servidor." });
    } finally {
      if (activeReservationIdRef.current === reservationId) {
        setPendingAction(null);
      }
    }
  };

  const submitStatus = async (action: ReservationAction) => {
    if (!activeItem || !canPerformAction(activeItem.status, action) || pendingAction) return;
    if ((action === "assign" && !permissions.canAssign) || (action !== "assign" && !permissions.canApprove)) return;

    const reservationId = activeItem.id;
    setFeedback(null);
    setPendingAction(action);
    try {
      const response = await fetch(`/api/reservations/${reservationId}/status`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action,
          reason: "Cambio operativo desde el monitor interno",
          actorId: "system",
        }),
      });

      const stillSelected = activeReservationIdRef.current === reservationId;
      if (!stillSelected && response.ok) {
        router.refresh();
        return;
      }
      if (!stillSelected) return;
      reportResult(response, `${ACTION_LABELS[action]} aplicado a ${activeItem.number}.`, reservationId);
    } catch {
      if (activeReservationIdRef.current !== reservationId) return;
      setFeedback({ kind: "error", message: "No se pudo conectar con el servidor." });
    } finally {
      if (activeReservationIdRef.current === reservationId) {
        setPendingAction(null);
      }
    }
  };

  return (
    <>
      <article className={styles.sectionCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Detalle operativo</h2>
        </div>

      {activeItem ? (
          <div className={styles.stack}>
            <div className={styles.kvGrid}>
            <div className={styles.kv}>
              <span className={styles.kvLabel}>Reserva</span>
              <span className={styles.kvValue}>{activeItem.number}</span>
            </div>
            <div className={styles.kv}>
              <span className={styles.kvLabel}>Bungalow</span>
              <span className={styles.kvValue}>{activeItem.bungalow?.name ?? "Sin asignar"}</span>
            </div>
            <div className={styles.kv}>
              <span className={styles.kvLabel}>Estadía</span>
              <span className={styles.kvValue}>
                {activeItem.startDate} → {activeItem.endDate}
              </span>
            </div>
            </div>
          </div>
        ) : (
          <p className={styles.helper}>Selecciona una reserva para ver su contexto operativo.</p>
        )}
      </article>

      <article className={styles.sectionCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Cobro y saldo</h2>
        </div>

        {feedback ? (
          <p
            className={`${styles.feedbackBanner} ${
              feedback.kind === "success"
                ? styles.feedbackSuccess
                : feedback.kind === "blocked"
                  ? styles.feedbackBlocked
                  : styles.feedbackError
            }`}
            role="status"
          >
            {feedback.message}
          </p>
        ) : null}

        {!activeItem ? (
          <p className={styles.helper}>Selecciona una reserva para habilitar el cobro.</p>
        ) : (
          <div className={styles.stack}>
            <div className={styles.kvGrid}>
              <div className={styles.kv}>
                <span className={styles.kvLabel}>Estado de cobro</span>
                <span className={styles.kvValue}>{PAYMENT_STATUS_LABELS[activeItem.paymentStatus ?? "pending"]}</span>
              </div>
              <div className={styles.kv}>
                <span className={styles.kvLabel}>Total</span>
                <span className={styles.kvValue}>{formatMoneyCents(activeItem.amountTotalCents ?? 0)}</span>
              </div>
              <div className={styles.kv}>
                <span className={styles.kvLabel}>Pagado</span>
                <span className={styles.kvValue}>{formatMoneyCents(activeItem.amountPaidCents ?? 0)}</span>
              </div>
              <div className={styles.kv}>
                <span className={styles.kvLabel}>Saldo</span>
                <span className={styles.kvValue}>{formatMoneyCents(balanceCents)}</span>
              </div>
            </div>

            <div className={styles.buttonRow}>
              <button
                className={styles.button}
                type="button"
                onClick={() => void submitPayment()}
                disabled={!paymentEnabled || isPending || pendingAction !== null}
              >
                {permissions.canApprove
                  ? paymentEnabled
                    ? `Registrar ${formatMoneyCents(balanceCents)}`
                    : "Sin saldo pendiente"
                  : "Sin permiso de cobro"}
              </button>
            </div>
          </div>
        )}
      </article>

      <article className={styles.sectionCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Acciones operativas</h2>
        </div>

        {!activeItem ? (
          <p className={styles.helper}>Selecciona una reserva para habilitar las acciones.</p>
        ) : (
          <div className={styles.stack}>
            <div className={styles.detailSummary}>
              <span className={styles.fieldLabel}>Bungalows disponibles</span>
              {assignEnabled ? (
                <div className={styles.detailActionList}>
                  {(assignableBungalows.length > 0 ? assignableBungalows : bungalows).map((bungalow) => (
                    <button
                      key={bungalow.id}
                      className={styles.detailActionPill}
                      type="button"
                      onClick={() => void submitAssign(bungalow.id)}
                      disabled={isPending || pendingAction !== null}
                    >
                      {bungalow.name}
                    </button>
                  ))}
                </div>
              ) : permissions.canAssign ? (
                <p className={styles.helper}>No hay asignación disponible para el estado actual.</p>
              ) : (
                <p className={styles.helper}>No tienes permisos para asignar bungalow.</p>
              )}
            </div>

            <div className={styles.quickActionGrid}>
              {!permissions.canApprove ? (
                <p className={styles.helper}>No tienes permisos para cambiar el estado.</p>
              ) : quickActions.length > 0 ? (
                quickActions.map((action) => (
                  <button
                    key={action}
                    className={styles.detailActionPill}
                    type="button"
                    onClick={() => void submitStatus(action)}
                    disabled={isPending || pendingAction !== null}
                  >
                    {ACTION_LABELS[action]}
                  </button>
                ))
              ) : (
                <p className={styles.helper}>No hay transiciones válidas para este estado.</p>
              )}
            </div>
          </div>
        )}
      </article>

      <article className={styles.sectionCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Auditoría</h2>
        </div>

        {!activeItem ? (
          <p className={styles.helper}>Selecciona una reserva para inspeccionar su historial.</p>
        ) : auditLoading ? (
          <p className={styles.helper}>Cargando auditoría…</p>
        ) : auditError ? (
          <p className={styles.feedbackBanner}>No se pudo cargar la auditoría: {auditError}</p>
        ) : auditTrail.length === 0 ? (
          <p className={styles.helper}>Todavía no hay eventos registrados para esta reserva.</p>
        ) : (
          <ul className={styles.auditList}>
            {auditTrail.map((item) => (
              <li key={item.id} className={styles.auditItem}>
                <div className={styles.auditMeta}>
                  <span>{item.createdAt}</span>
                  <span>{item.actorId}</span>
                  <span>{item.action}</span>
                </div>
                <div className={styles.rowMain}>{describeAudit(item)}</div>
                <p className={styles.helper}>{item.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className={styles.sectionCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Acceso rápido</h2>
        </div>

        <div className={styles.buttonRow}>
          <Link
            className={`${styles.button} ${styles.buttonSecondary}`}
            href={
              (activeItem ? `/admin/reservations/${activeItem.id}` : "/admin/reservations") as never
            }
          >
            Abrir detalle
          </Link>
        </div>
      </article>
    </>
  );
}
