"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { InfoTooltip } from "@/app/admin/info-tooltip";
import type { ReservationListItem } from "@/lib/reservations/store";
import {
  buildOccupancyConflictResolutionPlan,
  buildReservationConflictRecommendations,
  type ReservationConflictRecommendation,
} from "@/lib/reservations/conflicts";
import { canPerformAction } from "@/lib/reservations/state-machine";
import type { Bungalow } from "@/lib/reservations/types";
import type { BookingRequestMonitorItem } from "../requests/booking-request-monitor-presentation";
import styles from "../reservations.module.css";
import { OccupancyStateBadge } from "../occupancy-state-badge";
import {
  PAYMENT_STATUS_LABELS,
  STATUS_LABELS,
  formatMoneyCents,
  paymentTone,
  type MonitorPermissions,
} from "../reservations-monitor-shared";
import { buildReservationsMonitorHref, buildReservationsOccupancyHref } from "../reservations-query";
import { ReservationStatusBadge } from "../reservation-status-badge";
import type { OccupancyCellState } from "./occupancy-utils";

type FeedbackState =
  | { kind: "success"; message: string }
  | { kind: "blocked"; message: string }
  | { kind: "error"; message: string }
  | null;

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
      return "La reserva ya no admite reasignación rápida en este estado.";
    case "occupancy_conflict":
      return "El bungalow destino ya tiene un cruce en parte de la estadía.";
    case "bungalow_inactive":
      return "El bungalow destino no está activo.";
    case "reservation_not_found":
      return "No se encontró la reserva seleccionada.";
    case "invalid_payload":
      return "Los datos enviados no son válidos.";
    case "booking_request_not_found":
      return "No se encontró la solicitud web vinculada.";
    case "zoho_sync_failed":
      return "No se pudo sincronizar el hilo con el correo operativo.";
    case "unauthorized":
    case "forbidden":
      return "La sesión no tiene permisos para esta acción.";
    default:
      return message ?? reason ?? error ?? "No se pudo completar la acción";
  }
}

function feedbackTone(feedback: FeedbackState): string {
  if (!feedback) {
    return "";
  }
  if (feedback.kind === "success") {
    return styles.feedbackSuccess;
  }
  if (feedback.kind === "blocked") {
    return styles.feedbackBlocked;
  }
  return styles.feedbackError;
}

function buildReservationMeta(item: ReservationListItem): string {
  return `${item.channel.toUpperCase()} · ${item.startDate} → ${item.endDate}`;
}

function balanceLabel(item: ReservationListItem): string {
  const balanceCents = Math.max((item.amountTotalCents ?? 0) - (item.amountPaidCents ?? 0), 0);
  return balanceCents > 0 ? formatMoneyCents(balanceCents, item.currencyCode ?? "PEN") : "Sin saldo";
}

function syncStatusLabel(status: BookingRequestMonitorItem["syncStatus"]): string {
  switch (status) {
    case "synced":
      return "Hilo alineado";
    case "degraded":
      return "Hilo desincronizado";
    default:
      return "Sync pendiente";
  }
}

function recommendationToneClass(tone: "anchor" | "move" | "review"): string {
  switch (tone) {
    case "anchor":
      return styles.statusConfirmed;
    case "move":
      return styles.statusCancelled;
    default:
      return styles.paymentPending;
  }
}

function conflictRoleCopy(recommendation?: ReservationConflictRecommendation | null): {
  badge: string;
  title: string;
  detail: string;
} {
  switch (recommendation?.tone) {
    case "anchor":
      return {
        badge: "Se mantiene",
        title: "Reserva que se queda",
        detail: "Se toma como base operativa. No la muevas hasta cerrar el resto del cruce.",
      };
    case "move":
      return {
        badge: "Mover ahora",
        title: "Reserva a mover",
        detail: "Aquí haces la reprogramación exacta o la reubicación para liberar la celda.",
      };
    case "review":
      return {
        badge: "Revisión manual",
        title: "Reserva en revisión",
        detail: "Valida prioridad comercial y operativa antes de modificar fechas o bungalow.",
      };
    default:
      return {
        badge: "Revisar",
        title: "Reserva en revisión",
        detail: "Usa esta ficha para validar la acción correcta sobre la reserva.",
      };
  }
}

function buildGuestPriorityLine(
  item: ReservationListItem,
  linkedRequest?: BookingRequestMonitorItem,
): string {
  if (linkedRequest) {
    const phone = linkedRequest.guestPhone ? ` · ${linkedRequest.guestPhone}` : "";
    return `Cliente: ${linkedRequest.guestName} · ${linkedRequest.guestEmail}${phone}`;
  }

  return item.channel === "ota"
    ? "Reserva OTA sin hilo web vinculado"
    : "Reserva manual sin hilo web vinculado";
}

type Props = {
  reservation: ReservationListItem | null;
  reservationsInCell: ReservationListItem[];
  bungalow: Bungalow | null;
  bungalows: Bungalow[];
  permissions: MonitorPermissions;
  candidateReservations: ReservationListItem[];
  weekLabel: string;
  selectedDay: string | null;
  selectedCellState: OccupancyCellState | null;
  linkedRequestsByReservationId?: Record<string, BookingRequestMonitorItem>;
  onClose: () => void;
};

export function OccupancySelectionDialog({
  reservation,
  reservationsInCell,
  bungalow,
  bungalows,
  permissions,
  candidateReservations,
  weekLabel,
  selectedDay,
  selectedCellState,
  linkedRequestsByReservationId = {},
  onClose,
}: Props) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [pendingRescheduleKey, setPendingRescheduleKey] = useState<string | null>(null);
  const [pendingThreadActionKey, setPendingThreadActionKey] = useState<string | null>(null);
  const [activeReplyRequestId, setActiveReplyRequestId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const activeBungalows = useMemo(() => bungalows.filter((item) => item.active), [bungalows]);
  const hasConflict = reservationsInCell.length > 1;
  const visibleReservations = reservationsInCell.length > 0 ? reservationsInCell : reservation ? [reservation] : [];
  const selectionSignature = `${selectedDay ?? "none"}:${bungalow?.id ?? "none"}:${visibleReservations
    .map((item) => item.id)
    .join(",")}`;
  const createReservationHref = useMemo(() => {
    const params = new URLSearchParams();

    if (bungalow?.id) {
      params.set("bungalowId", bungalow.id);
    }
    if (selectedDay) {
      params.set("startDate", selectedDay);
      params.set("endDate", selectedDay);
    }

    params.set(
      "returnTo",
      buildReservationsOccupancyHref({
        date: selectedDay ?? undefined,
        selected: bungalow?.id && selectedDay ? `${bungalow.id}:${selectedDay}` : undefined,
        view: "occupancy",
        week: weekLabel,
      }),
    );

    const suffix = params.toString();
    return suffix ? `/admin/reservations/new?${suffix}` : "/admin/reservations/new";
  }, [bungalow?.id, selectedDay, weekLabel]);

  useEffect(() => {
    setFeedback(null);
    setPendingKey(null);
    setPendingRescheduleKey(null);
    setPendingThreadActionKey(null);
    setActiveReplyRequestId(null);
  }, [selectionSignature]);

  const reservationRecommendations = useMemo(
    () =>
      Object.fromEntries(
        buildReservationConflictRecommendations(
          visibleReservations.map((item) => ({
            reservationId: item.id,
            number: item.number,
            channel: item.channel,
            status: item.status,
            paymentStatus: item.paymentStatus ?? null,
            sourceRequestId: item.sourceRequestId ?? null,
          })),
        ).map((recommendation) => [recommendation.reservationId, recommendation] as const),
      ),
    [visibleReservations],
  );
  const conflictResolutionPlan = useMemo(() => {
    if (!hasConflict) {
      return null;
    }

    return buildOccupancyConflictResolutionPlan(
      visibleReservations.map((item) => ({
        reservationId: item.id,
        number: item.number,
        channel: item.channel,
        status: item.status,
        paymentStatus: item.paymentStatus ?? null,
        sourceRequestId: item.sourceRequestId ?? null,
      })),
    );
  }, [hasConflict, visibleReservations]);
  const guidedRequest = conflictResolutionPlan?.contactReservationId
    ? linkedRequestsByReservationId[conflictResolutionPlan.contactReservationId] ?? null
    : null;
  const guideSteps = conflictResolutionPlan?.steps.map((step, index) => ({
    id: `${index + 1}:${step}`,
    label: `Paso ${index + 1}`,
    detail: step,
  })) ?? [];

  const submitAssign = async (reservationItem: ReservationListItem, bungalowId: string, bungalowName: string) => {
    if (!permissions.canAssign || pendingKey) {
      return;
    }

    setFeedback(null);
    const nextPendingKey = `${reservationItem.id}:${bungalowId}`;
    setPendingKey(nextPendingKey);

    try {
      const response = await fetch(`/api/reservations/${reservationItem.id}/assign`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          bungalowId,
          reason: "Resolución rápida desde ocupación semanal",
          actorId: "system",
        }),
      });

      if (!response.ok) {
        const body = await readResponseBody(response);
        setFeedback({
          kind: response.status === 403 || response.status === 409 || response.status === 422 ? "blocked" : "error",
          message: describeApiIssue(body.error, body.message, body.reason),
        });
        return;
      }

      setFeedback({
        kind: "success",
        message: `${reservationItem.number} quedó dirigido a ${bungalowName}. Refrescando la grilla para validar el nuevo cruce.`,
      });
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setFeedback({ kind: "error", message: "No se pudo conectar con el servidor." });
    } finally {
      setPendingKey(null);
    }
  };

  const syncLinkedRequest = async (request: BookingRequestMonitorItem) => {
    if (!permissions.canWrite || pendingThreadActionKey) {
      return;
    }

    setFeedback(null);
    const actionKey = `${request.id}:sync`;
    setPendingThreadActionKey(actionKey);

    try {
      const response = await fetch(`/api/booking-requests/${request.id}/sync`, {
        method: "POST",
      });

      if (!response.ok) {
        const body = await readResponseBody(response);
        setFeedback({
          kind: response.status === 400 || response.status === 409 ? "blocked" : "error",
          message: describeApiIssue(body.error, body.message, body.reason),
        });
        return;
      }

      setFeedback({ kind: "success", message: `${request.publicRef} quedó sincronizada con el hilo operativo.` });
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setFeedback({ kind: "error", message: "No se pudo conectar con el servidor." });
    } finally {
      setPendingThreadActionKey(null);
    }
  };

  const replyLinkedRequest = async (event: FormEvent<HTMLFormElement>, request: BookingRequestMonitorItem) => {
    event.preventDefault();
    if (!permissions.canWrite || pendingThreadActionKey) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const subject = String(formData.get("subject") ?? "").trim();
    const bodyText = String(formData.get("bodyText") ?? "").trim();
    if (!bodyText) {
      setFeedback({ kind: "blocked", message: "Escribe el mensaje antes de enviarlo al cliente." });
      return;
    }

    setFeedback(null);
    const actionKey = `${request.id}:reply`;
    setPendingThreadActionKey(actionKey);

    try {
      const response = await fetch(`/api/booking-requests/${request.id}/reply`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subject, bodyText }),
      });

      if (!response.ok) {
        const body = await readResponseBody(response);
        setFeedback({
          kind: response.status === 400 || response.status === 409 ? "blocked" : "error",
          message: describeApiIssue(body.error, body.message, body.reason),
        });
        return;
      }

      setFeedback({ kind: "success", message: `Respuesta enviada a ${request.guestEmail} dentro del mismo hilo.` });
      setActiveReplyRequestId(null);
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setFeedback({ kind: "error", message: "No se pudo conectar con el servidor." });
    } finally {
      setPendingThreadActionKey(null);
    }
  };

  const submitReprogramReservation = async (event: FormEvent<HTMLFormElement>, item: ReservationListItem) => {
    event.preventDefault();
    if (!permissions.canWrite || pendingRescheduleKey || !item.bungalowId) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const bungalowId = String(formData.get("bungalowId") ?? "").trim() || item.bungalowId;
    const startDate = String(formData.get("startDate") ?? "").trim();
    const endDate = String(formData.get("endDate") ?? "").trim();
    const nextKey = `${item.id}:reschedule`;

    setFeedback(null);
    setPendingRescheduleKey(nextKey);

    try {
      const response = await fetch(`/api/reservations/${item.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          channel: item.channel,
          bungalowId,
          startDate,
          endDate,
          amountTotalCents: item.amountTotalCents,
          amountPaidCents: item.amountPaidCents,
        }),
      });

      if (!response.ok) {
        const body = await readResponseBody(response);
        setFeedback({
          kind: response.status === 400 || response.status === 409 || response.status === 422 ? "blocked" : "error",
          message: describeApiIssue(body.error, body.message, body.reason),
        });
        return;
      }

      setFeedback({
        kind: "success",
        message: `${item.number} quedó reprogramada. La grilla y los conflictos se recalculan con la nueva configuración.`,
      });
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setFeedback({ kind: "error", message: "No se pudo conectar con el servidor." });
    } finally {
      setPendingRescheduleKey(null);
    }
  };

  const renderLinkedRequestSupport = (item: ReservationListItem) => {
    const linkedRequest = linkedRequestsByReservationId[item.id];
    if (!linkedRequest) {
      return null;
    }

    const canReply = permissions.canWrite && linkedRequest.threadMessages.length > 0;
    const canSync = permissions.canWrite && Boolean(linkedRequest.threadId || linkedRequest.threadKey);
    const latestMessages = linkedRequest.threadMessages.slice(-2).reverse();
    const isReplyOpen = activeReplyRequestId === linkedRequest.id;

    return (
      <div className={styles.requestSyncCard}>
        <div className={styles.requestSectionHeader}>
          <div className={styles.detailSummary}>
            <span className={styles.fieldLabel}>
              Contacto cliente
              <InfoTooltip label="Este bloque reutiliza el mismo hilo del pedido web para evitar perder contexto cuando reprogramas fechas o resuelves cruces con OTA." />
            </span>
            <strong className={styles.requestListTitle}>
              {linkedRequest.guestName} · {linkedRequest.publicRef}
            </strong>
            <p className={styles.helper}>
              {linkedRequest.guestEmail}
              {linkedRequest.guestPhone ? ` · ${linkedRequest.guestPhone}` : ""} · check-in{" "}
              {linkedRequest.requestedCheckIn} · check-out {linkedRequest.requestedCheckOut}
            </p>
          </div>
          <div className={styles.detailActionList}>
            <span className={styles.requestPill}>{syncStatusLabel(linkedRequest.syncStatus)}</span>
            {linkedRequest.attachments.length > 0 ? (
              <span className={styles.requestPill}>{linkedRequest.attachments.length} adjuntos</span>
            ) : null}
            {linkedRequest.conflicts.length > 0 ? (
              <span className={styles.requestPill}>{linkedRequest.conflicts.length} alertas</span>
            ) : null}
          </div>
        </div>

        {latestMessages.length > 0 ? (
          <ol className={styles.requestTimeline}>
            {latestMessages.map((message) => (
              <li key={message.id} className={styles.requestTimelineItem}>
                <div className={styles.requestTimelineHeader}>
                  <span className={styles.requestTimelineTitle}>{message.author}</span>
                  <span className={styles.requestTimelineMeta}>{message.sentAt}</span>
                </div>
                <p className={styles.requestTimelineCopy}>{message.summary}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className={styles.helper}>Todavía no hay mensajes sincronizados para este hilo.</p>
        )}

        <div className={styles.buttonRow}>
          <Link
            className={`${styles.button} ${styles.buttonSecondary}`}
            href={`/admin/reservations/requests/${linkedRequest.id}` as never}
          >
            Ver hilo completo
          </Link>
          <button
            className={`${styles.button} ${styles.buttonSecondary}`}
            type="button"
            onClick={() => setActiveReplyRequestId((current) => (current === linkedRequest.id ? null : linkedRequest.id))}
            disabled={!canReply || pendingThreadActionKey !== null}
          >
            Responder al cliente
          </button>
          <button
            className={`${styles.button} ${styles.buttonSecondary}`}
            type="button"
            onClick={() => syncLinkedRequest(linkedRequest)}
            disabled={!canSync || pendingThreadActionKey !== null}
          >
            {pendingThreadActionKey === `${linkedRequest.id}:sync`
              ? "Sincronizando..."
              : linkedRequest.syncDetail.actionLabel ?? "Sincronizar hilo"}
          </button>
        </div>

        {isReplyOpen ? (
          <form className={styles.form} onSubmit={(event) => replyLinkedRequest(event, linkedRequest)}>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor={`reply-subject-${linkedRequest.id}`}>
                Asunto
              </label>
              <input
                className={styles.input}
                id={`reply-subject-${linkedRequest.id}`}
                name="subject"
                defaultValue={linkedRequest.replyDraft.subject}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor={`reply-body-${linkedRequest.id}`}>
                Mensaje
              </label>
              <textarea
                className={styles.textarea}
                id={`reply-body-${linkedRequest.id}`}
                name="bodyText"
                defaultValue={linkedRequest.replyDraft.bodyPreview}
              />
            </div>
            <div className={styles.buttonRow}>
              <button className={styles.button} type="submit" disabled={pendingThreadActionKey !== null}>
                {pendingThreadActionKey === `${linkedRequest.id}:reply`
                  ? "Enviando..."
                  : linkedRequest.replyDraft.actionLabel}
              </button>
              <button
                className={`${styles.button} ${styles.buttonSecondary}`}
                type="button"
                onClick={() => setActiveReplyRequestId(null)}
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : null}
      </div>
    );
  };

  const renderReservationActions = (item: ReservationListItem, destinationMode: "free-slot" | "relocation") => {
    const actionAllowed = permissions.canAssign && canPerformAction(item.status, "assign");
    const alternativeBungalows =
      destinationMode === "free-slot"
        ? bungalow && bungalow.active
          ? [bungalow]
          : []
        : activeBungalows.filter((target) => target.id !== (item.bungalowId ?? bungalow?.id));
    const recommendation = reservationRecommendations[item.id];
    const linkedRequest = linkedRequestsByReservationId[item.id];
    const roleCopy = conflictRoleCopy(recommendation);
    const isAnchorReservation = destinationMode === "relocation" && recommendation?.tone === "anchor";
    const shouldShowMoveTools =
      destinationMode === "free-slot" || !isAnchorReservation || !hasConflict;
    const shouldShowExactReprogramming =
      destinationMode === "relocation" && permissions.canWrite && item.bungalowId && shouldShowMoveTools;
    const shouldShowLinkedRequestSupport =
      destinationMode === "relocation" &&
      Boolean(linkedRequest) &&
      (!isAnchorReservation || conflictResolutionPlan?.contactReservationId === item.id);
    const reprogrammingHelper = linkedRequest
      ? `Al guardar, la solicitud ${linkedRequest.publicRef} se moverá con estas mismas fechas y el conflicto se recalculará.`
      : item.channel === "ota"
        ? "Si decides mover esta OTA, registra aquí la nueva fecha o bungalow y luego valida la coordinación externa."
        : "Ajusta fechas y bungalow desde aquí para recalcular la ocupación sin salir de la semana.";
    const reprogrammingActionLabel = linkedRequest
      ? `Guardar cambio y reflejar en ${linkedRequest.publicRef}`
      : item.channel === "ota"
        ? "Guardar cambio OTA"
        : "Guardar reprogramación";

    return (
      <div className={styles.stack}>
        {destinationMode === "relocation" && recommendation ? (
          <div className={styles.detailSummary}>
            <div className={styles.detailActionList}>
              <span className={`${styles.badge} ${recommendationToneClass(recommendation.tone)}`}>
                {recommendation.label}
              </span>
            </div>
            <p className={styles.helper}>{roleCopy.detail} {recommendation.detail}</p>
          </div>
        ) : null}

        <div className={styles.buttonRow}>
          <Link className={`${styles.button} ${styles.buttonSecondary}`} href={`/admin/reservations/${item.id}` as never}>
            Ver ficha completa
          </Link>
          {destinationMode === "relocation" && permissions.canWrite && shouldShowMoveTools ? (
            <Link className={`${styles.button} ${styles.buttonSecondary}`} href={`/admin/reservations/${item.id}/edit` as never}>
              Editar fechas
            </Link>
          ) : null}
          <Link
            className={`${styles.button} ${styles.buttonSecondary}`}
            href={buildReservationsMonitorHref({
              view: "agenda",
              selected: item.id,
              date: selectedDay ?? undefined,
            }) as never}
          >
            Abrir agenda
          </Link>
        </div>

        {actionAllowed && shouldShowMoveTools ? (
          alternativeBungalows.length > 0 ? (
            <div className={styles.detailSummary}>
              <span className={styles.fieldLabel}>
                {destinationMode === "free-slot" ? "Asignación puntual" : "Alternativas activas"}
              </span>
              <div className={styles.detailActionList}>
                {alternativeBungalows.map((target) => {
                  const key = `${item.id}:${target.id}`;
                  const pending = pendingKey === key;
                  return (
                    <button
                      key={target.id}
                      className={styles.detailActionPill}
                      type="button"
                      disabled={pending}
                      onClick={() => submitAssign(item, target.id, target.name)}
                    >
                      {destinationMode === "free-slot" ? "Asignar aquí" : `Mover a ${target.name}`}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className={styles.helper}>No hay bungalows activos disponibles para una reubicación rápida.</p>
          )
        ) : (
          <p className={styles.helper}>
            {isAnchorReservation
              ? "Mantén esta reserva como ancla. Si necesitas romper la regla sugerida, hazlo desde la ficha completa para dejar trazabilidad."
              : "Esta reserva no admite reasignación rápida en su estado actual. El ajuste exacto debe completarse desde la ficha completa."}
          </p>
        )}

        {shouldShowExactReprogramming ? (
          <div className={styles.requestSyncCard}>
            <div className={styles.detailSummary}>
              <span className={styles.fieldLabel}>Reprogramación exacta</span>
              <p className={styles.helper}>{reprogrammingHelper}</p>
            </div>
            <form className={styles.form} onSubmit={(event) => submitReprogramReservation(event, item)}>
              <div className={styles.fieldGrid}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Entrada</span>
                  <input className={styles.input} type="date" name="startDate" defaultValue={item.startDate} required />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Salida</span>
                  <input className={styles.input} type="date" name="endDate" defaultValue={item.endDate} required />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Bungalow</span>
                  <select className={styles.select} name="bungalowId" defaultValue={item.bungalowId ?? undefined}>
                    {activeBungalows.map((target) => (
                      <option key={target.id} value={target.id}>
                        {target.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className={styles.buttonRow}>
                <button className={styles.button} type="submit" disabled={pendingRescheduleKey !== null}>
                  {pendingRescheduleKey === `${item.id}:reschedule` ? "Guardando..." : reprogrammingActionLabel}
                </button>
              </div>
              {linkedRequest ? (
                <p className={styles.formHelper}>
                  La reserva está ligada a {linkedRequest.publicRef}. El hilo comercial seguirá usando esas fechas actualizadas.
                </p>
              ) : null}
            </form>
          </div>
        ) : null}

        {shouldShowLinkedRequestSupport ? renderLinkedRequestSupport(item) : null}
      </div>
    );
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalPanel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="occupancy-selection-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.eyebrow}>Wakaya · ocupación</p>
            <h2 id="occupancy-selection-dialog-title" className={styles.modalTitle}>
              Resolución operativa
            </h2>
          </div>

          <button className={`${styles.button} ${styles.buttonSecondary}`} type="button" onClick={onClose}>
            Cerrar
          </button>
        </div>

        {feedback ? <p className={`${styles.feedbackBanner} ${feedbackTone(feedback)}`}>{feedback.message}</p> : null}

        <div className={styles.stack}>
          <div className={styles.legendGrid}>
            {selectedCellState ? <OccupancyStateBadge state={selectedCellState} /> : null}
            {selectedDay ? <span className={styles.badge}>{selectedDay}</span> : null}
            <span className={styles.badge}>{bungalow?.name ?? "Sin bungalow"}</span>
            <span className={styles.badge}>{weekLabel}</span>
          </div>

          {selectedCellState === "free" ? (
            <section className={styles.requestSection}>
              <div className={styles.requestSectionHeader}>
                <div>
                  <h3 className={styles.cardTitle}>Asignar o crear desde la celda libre</h3>
                  <p className={styles.helper}>
                    Esta celda está libre. Puedes crear una reserva nueva con la fecha y el bungalow ya listos o usar una existente.
                  </p>
                </div>
                {permissions.canWrite ? (
                  <Link className={styles.button} href={createReservationHref as never}>
                    Crear reserva aquí
                  </Link>
                ) : null}
              </div>

              <div className={styles.detailSummary}>
                <span className={styles.fieldLabel}>Asignar reserva existente</span>
                <p className={styles.helper}>
                  Solo se muestran reservas que aún permiten asignación rápida para esta fecha.
                </p>
              </div>

              {permissions.canAssign ? (
                candidateReservations.length > 0 ? (
                  <ul className={styles.requestList}>
                    {candidateReservations.map((item) => (
                      <li key={item.id} className={styles.requestListItem}>
                        <div>
                          <span className={styles.requestListTitle}>{item.number}</span>
                          <p className={styles.requestListMeta}>{buildReservationMeta(item)}</p>
                          <div className={styles.requestBadgeRow}>
                            <ReservationStatusBadge status={item.status} />
                            <span className={`${styles.badge} ${styles[paymentTone(item.paymentStatus ?? "pending") as keyof typeof styles]}`}>
                              {PAYMENT_STATUS_LABELS[item.paymentStatus ?? "pending"]}
                            </span>
                            <span className={styles.badge}>{item.bungalow?.name ?? "Sin asignar"}</span>
                          </div>
                        </div>

                        {renderReservationActions(item, "free-slot")}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className={styles.emptyStateInline}>
                    <strong>No hay reservas listas para asignar.</strong>
                    <span>Si es una estadía nueva, usa `Crear reserva aquí`. Si es una reubicación, prepara la reserva en agenda o en su ficha completa.</span>
                  </div>
                )
              ) : (
                <p className={styles.helper}>Tu perfil no tiene permiso para asignar reservas desde esta vista.</p>
              )}
            </section>
          ) : hasConflict ? (
            <section className={styles.requestSection}>
              <div className={styles.requestSectionHeader}>
                <div>
                  <h3 className={styles.cardTitle}>Conflicto operativo</h3>
                  <p className={styles.helper}>
                    La misma fecha quedó ocupada por más de una reserva. Decide cuál permanece, cuál debe reprogramarse y, si viene de web, coordina el cambio dentro del mismo hilo del cliente.
                  </p>
                </div>
                <span className={`${styles.badge} ${styles.statusCancelled}`}>{reservationsInCell.length} reservas solapadas</span>
              </div>

              {conflictResolutionPlan ? (
                <div className={`${styles.resolutionGuide} ${styles.resolutionGuideCritical}`}>
                  <div className={styles.requestSectionHeader}>
                    <div className={styles.detailSummary}>
                      <span className={`${styles.fieldLabel} ${styles.resolutionGuideEyebrow}`}>Guía de resolución</span>
                      <strong className={styles.requestListTitle}>{conflictResolutionPlan.title}</strong>
                      <p className={styles.helper}>{conflictResolutionPlan.summary}</p>
                    </div>
                    <div className={styles.detailActionList}>
                      {conflictResolutionPlan.anchorNumber ? (
                        <span className={`${styles.badge} ${styles.statusConfirmed}`}>
                          Ancla: {conflictResolutionPlan.anchorNumber}
                        </span>
                      ) : null}
                      {conflictResolutionPlan.moveFirstNumber ? (
                        <span className={`${styles.badge} ${styles.statusCancelled}`}>
                          Mover: {conflictResolutionPlan.moveFirstNumber}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className={styles.resolutionPriorityGrid}>
                    <div className={`${styles.resolutionPriorityCard} ${styles.resolutionPriorityAnchor}`}>
                      <span className={styles.fieldLabel}>Reserva que se queda</span>
                      <strong className={styles.requestListTitle}>{conflictResolutionPlan.anchorNumber ?? "Definir ancla"}</strong>
                      <p className={styles.helper}>Debe seguir ocupando esta celda mientras resuelves el resto del cruce.</p>
                    </div>
                    <div className={`${styles.resolutionPriorityCard} ${styles.resolutionPriorityMove}`}>
                      <span className={styles.fieldLabel}>Reserva a mover</span>
                      <strong className={styles.requestListTitle}>{conflictResolutionPlan.moveFirstNumber ?? "Definir movimiento"}</strong>
                      <p className={styles.helper}>Aquí concentras la reprogramación o el cambio de bungalow para liberar la noche.</p>
                    </div>
                    {guidedRequest ? (
                      <div className={`${styles.resolutionPriorityCard} ${styles.resolutionPriorityContact}`}>
                        <span className={styles.fieldLabel}>Cliente a contactar</span>
                        <strong className={styles.requestListTitle}>{guidedRequest.guestName}</strong>
                        <p className={styles.helper}>
                          {guidedRequest.guestEmail}
                          {guidedRequest.guestPhone ? ` · ${guidedRequest.guestPhone}` : ""}
                          {" · "}
                          {guidedRequest.publicRef}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  <div className={styles.detailSummary}>
                    <span className={styles.fieldLabel}>Qué hacer ahora</span>
                    <p className={styles.helper}>
                      Sigue este orden para no perder trazabilidad ni seguir solapando noches en la grilla.
                    </p>
                  </div>

                  <ol className={styles.resolutionSteps}>
                    {guideSteps.map((step) => (
                      <li key={step.id} className={styles.resolutionStep}>
                        <span className={styles.resolutionStepLabel}>{step.label}</span>
                        <span>{step.detail}</span>
                      </li>
                    ))}
                  </ol>

                  {guidedRequest ? (
                    <div className={styles.buttonRow}>
                      <button
                        className={styles.button}
                        type="button"
                        onClick={() => setActiveReplyRequestId((current) => (current === guidedRequest.id ? null : guidedRequest.id))}
                        disabled={!permissions.canWrite || pendingThreadActionKey !== null}
                      >
                        Abrir contacto cliente
                      </button>
                      <Link
                        className={`${styles.button} ${styles.buttonSecondary}`}
                        href={`/admin/reservations/requests/${guidedRequest.id}` as never}
                      >
                        Abrir hilo {guidedRequest.publicRef}
                      </Link>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <ul className={styles.requestConflictList}>
                {reservationsInCell.map((item) => {
                  const recommendation = reservationRecommendations[item.id];
                  const roleCopy = conflictRoleCopy(recommendation);
                  const linkedRequest = linkedRequestsByReservationId[item.id];

                  return (
                  <li
                    key={item.id}
                    className={`${styles.requestConflictItem} ${
                      recommendation?.tone === "anchor"
                        ? styles.requestConflictItemAnchor
                        : recommendation?.tone === "move"
                          ? styles.requestConflictItemMove
                          : styles.requestConflictItemReview
                    }`}
                  >
                    <div>
                      <div className={styles.requestBadgeRow}>
                        <span className={`${styles.badge} ${recommendation ? recommendationToneClass(recommendation.tone) : ""}`}>
                          {roleCopy.badge}
                        </span>
                        <span className={styles.requestListTitle}>{item.number}</span>
                        <ReservationStatusBadge status={item.status} />
                        <span className={`${styles.badge} ${styles[paymentTone(item.paymentStatus ?? "pending") as keyof typeof styles]}`}>
                          {PAYMENT_STATUS_LABELS[item.paymentStatus ?? "pending"]}
                        </span>
                      </div>
                      <p className={styles.requestCardMeta}>{roleCopy.title}</p>
                      <p className={styles.requestListMeta}>{buildReservationMeta(item)}</p>
                      <p className={styles.requestCardMeta}>
                        {buildGuestPriorityLine(item, linkedRequest)} · Saldo operativo: {balanceLabel(item)}
                      </p>
                    </div>

                    {renderReservationActions(item, "relocation")}
                  </li>
                  );
                })}
              </ul>
            </section>
          ) : visibleReservations.length > 0 ? (
            <section className={styles.requestSection}>
              <div className={styles.requestSectionHeader}>
                <div>
                  <h3 className={styles.cardTitle}>{selectedCellState === "attention-needed" ? "Atención operativa" : "Reserva activa"}</h3>
                  <p className={styles.helper}>
                    Revisa el estado exacto de la reserva y, si todavía admite reasignación, resuélvela sin salir de la semana.
                  </p>
                </div>
              </div>

              <ul className={styles.requestList}>
                {visibleReservations.map((item) => (
                  <li key={item.id} className={styles.requestListItem}>
                    <div>
                      <div className={styles.requestBadgeRow}>
                        <span className={styles.requestListTitle}>{item.number}</span>
                        <ReservationStatusBadge status={item.status} />
                        <span className={`${styles.badge} ${styles[paymentTone(item.paymentStatus ?? "pending") as keyof typeof styles]}`}>
                          {PAYMENT_STATUS_LABELS[item.paymentStatus ?? "pending"]}
                        </span>
                      </div>
                      <p className={styles.requestListMeta}>{buildReservationMeta(item)}</p>
                      <p className={styles.requestCardMeta}>
                        Estado: {STATUS_LABELS[item.status]} · Auditoría por sesión activa
                      </p>
                    </div>

                    {renderReservationActions(item, "relocation")}
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <div className={styles.emptyStateInline}>
              <strong>Sin contexto operativo.</strong>
              <span>Selecciona otra celda de la grilla para cargar una resolución exacta.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
