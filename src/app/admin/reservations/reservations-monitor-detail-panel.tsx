"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ReservationListItem } from "@/lib/reservations/store";
import { canPerformAction } from "@/lib/reservations/state-machine";
import type { Bungalow, ReservationAction, ReservationAudit, ReservationStatus } from "@/lib/reservations/types";
import styles from "./reservations.module.css";
import { STATUS_LABELS, statusTone } from "./reservations-monitor-shared";
import type { MonitorPermissions } from "./reservations-monitor-shared";

const ACTION_LABELS: Record<ReservationAction, string> = {
  confirm: "Confirmar",
  assign: "Asignar bungalow",
  check_in: "Registrar check-in",
  check_out: "Registrar check-out",
  mark_paid: "Marcar pago",
  cancel: "Cancelar",
  mark_no_show: "Marcar no show",
};

type FeedbackState =
  | { kind: "success"; message: string }
  | { kind: "blocked"; message: string }
  | { kind: "error"; message: string }
  | null;

function statusClass(status: ReservationStatus): string {
  const tone = statusTone(status);
  return tone ? `${styles.badge} ${styles[tone as keyof typeof styles]}` : styles.badge;
}

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
  activeItem: ReservationListItem | null;
  bungalows: Bungalow[];
  permissions: MonitorPermissions;
}) {
  const router = useRouter();
  const [auditTrail, setAuditTrail] = useState<ReservationAudit[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditReloadKey, setAuditReloadKey] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [assignBungalowId, setAssignBungalowId] = useState<string>(bungalows[0]?.id ?? "");
  const [assignReason, setAssignReason] = useState("Asignación operativa desde recepción");
  const [pendingAction, setPendingAction] = useState<"assign" | ReservationAction | null>(null);
  const [isPending, startTransition] = useTransition();
  const refreshTimerRef = useRef<number | null>(null);
  const activeReservationIdRef = useRef<string | null>(activeItem?.id ?? null);
  activeReservationIdRef.current = activeItem?.id ?? null;

  const assignEligibleByStatus = activeItem ? canPerformAction(activeItem.status, "assign") : false;
  const assignEnabled = assignEligibleByStatus && permissions.canAssign;
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
    setAssignBungalowId(activeItem?.bungalowId ?? bungalows[0]?.id ?? "");
    setAssignReason("Asignación operativa desde recepción");
    setFeedback(null);
    setPendingAction(null);
    if (refreshTimerRef.current !== null) {
      window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, [activeItem?.bungalowId, activeItem?.id, bungalows]);

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

  const submitAssign = async () => {
    if (!activeItem || !assignEnabled || !assignBungalowId || pendingAction) return;

    const reservationId = activeItem.id;
    setFeedback(null);
    setPendingAction("assign");
    try {
      const response = await fetch(`/api/reservations/${reservationId}/assign`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          bungalowId: assignBungalowId,
          reason: assignReason,
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
          <div>
            <h2 className={styles.cardTitle}>Detalle operativo</h2>
            <p className={styles.cardCopy}>
              La selección de la tabla alimenta este panel sin salir del monitor.
            </p>
          </div>
          {activeItem ? (
            <span className={statusClass(activeItem.status)}>{STATUS_LABELS[activeItem.status]}</span>
          ) : null}
        </div>

        {activeItem ? (
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
            <div className={styles.kv}>
              <span className={styles.kvLabel}>Responsable</span>
              <span className={styles.kvValue}>{activeItem.responsibleId ?? "system"}</span>
            </div>
          </div>
        ) : (
          <p className={styles.helper}>Selecciona una reserva para ver su contexto operativo.</p>
        )}
      </article>

      <article className={styles.sectionCard}>
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>Acciones operativas</h2>
            <p className={styles.cardCopy}>
              Las acciones se ejecutan aquí mismo y devuelven feedback sin abandonar la pantalla.
            </p>
          </div>
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
          <p className={styles.helper}>Selecciona una reserva para habilitar las acciones.</p>
        ) : (
          <div className={styles.stack}>
            <div className={styles.form}>
              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="monitor-bungalowId">
                  Bungalow
                </label>
                <select
                  className={styles.select}
                  id="monitor-bungalowId"
                  value={assignBungalowId}
                  onChange={(event) => setAssignBungalowId(event.target.value)}
                  disabled={!assignEnabled || isPending || pendingAction !== null}
                >
                  {bungalows.map((bungalow) => (
                    <option key={bungalow.id} value={bungalow.id}>
                      {bungalow.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="monitor-assignReason">
                  Motivo
                </label>
                <textarea
                  className={styles.textarea}
                  id="monitor-assignReason"
                  value={assignReason}
                  onChange={(event) => setAssignReason(event.target.value)}
                  disabled={!assignEnabled || isPending || pendingAction !== null}
                />
              </div>

              <div className={styles.buttonRow}>
                <button
                  className={styles.button}
                  type="button"
                  onClick={() => void submitAssign()}
                  disabled={!assignEnabled || isPending || pendingAction !== null}
                >
                  {assignEnabled ? "Asignar bungalow" : "Asignación bloqueada"}
                </button>
              </div>

              {!assignEnabled ? (
                <p className={styles.helper}>
                  {!assignEligibleByStatus && !permissions.canAssign
                    ? "Disponible solo cuando la reserva ya está confirmada o importada desde OTA, y además no tienes permisos para asignar bungalows."
                    : !assignEligibleByStatus
                      ? "Disponible solo cuando la reserva ya está confirmada o importada desde OTA."
                      : "No tienes permisos para asignar bungalows."}
                </p>
              ) : null}
            </div>

            <div className={styles.quickActionGrid}>
              {!permissions.canApprove ? (
                <p className={styles.helper}>No tienes permisos para cambiar el estado.</p>
              ) : quickActions.length > 0 ? (
                quickActions.map((action) => (
                  <button
                    key={action}
                    className={`${styles.button} ${styles.buttonSecondary}`}
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
          <div>
            <h2 className={styles.cardTitle}>Auditoría embebida</h2>
            <p className={styles.cardCopy}>
              El timeline ya no depende de la vista profunda para explicar qué pasó.
            </p>
          </div>
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
          <div>
            <h2 className={styles.cardTitle}>Acceso rápido</h2>
            <p className={styles.cardCopy}>
              La vista profunda queda disponible para soporte y depuración.
            </p>
          </div>
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
