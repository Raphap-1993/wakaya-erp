"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState, useTransition } from "react";

import { InfoTooltip } from "@/app/admin/info-tooltip";
import styles from "../reservations.module.css";
import type { MonitorPermissions } from "../reservations-monitor-shared";
import type { BookingRequest, Bungalow } from "@/lib/reservations/types";

type Props = {
  request: BookingRequest | null;
  bungalows: Bungalow[];
  permissions: MonitorPermissions;
};

type UnknownRecord = Record<string, unknown>;

type BookingRequestThreadMessage = {
  id: string;
  direction: string;
  author: string;
  summary: string;
  sentAt: string;
};

type BookingRequestAttachment = {
  id: string;
  name: string;
  meta: string | null;
  status: string | null;
  contentType: string | null;
  kind: "pdf" | "image" | "file";
  previewHref: string | null;
};

type BookingRequestReplyDraft = {
  subject: string;
  bodyPreview: string;
  actionLabel: string;
};

type BookingRequestSyncDetail = {
  summary: string;
  detail: string | null;
  actionLabel: string | null;
};

type BookingRequestConflict = {
  id: string;
  title: string;
  detail: string | null;
  href: string | null;
};

type FeedbackState =
  | { kind: "success"; message: string }
  | { kind: "blocked"; message: string }
  | { kind: "error"; message: string }
  | null;

type DetailTabId = "operation" | "communication" | "conflicts";

const BOOKING_REQUEST_STATUS_LABELS: Record<BookingRequest["status"], string> = {
  request_received: "Solicitud recibida",
  awaiting_initial_email: "Pendiente de correo inicial",
  awaiting_transfer: "Esperando transferencia",
  proof_received: "Comprobante recibido",
  needs_attention: "Requiere atención",
  converted_to_reservation: "Convertida en reserva",
  cancelled: "Cancelada",
};

const SYNC_STATUS_LABELS: Record<BookingRequest["syncStatus"], string> = {
  pending: "Pendiente",
  synced: "Sincronizado",
  degraded: "Desincronizado",
};

function describeSourceChannel(channel: BookingRequest["sourceChannel"]): string {
  switch (channel) {
    case "web_public":
      return "Web pública";
    default:
      return channel;
  }
}

function buildGuestInitials(name: string, email: string): string {
  const source = name.trim() || email.trim();
  const parts = source.split(/\s+/).filter(Boolean).slice(0, 2);
  if (parts.length === 0) {
    return "WK";
  }
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function readThreadMessages(value: unknown): BookingRequestThreadMessage[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item, index) => {
    if (!isRecord(item)) return [];
    return [
      {
        id: readString(item.id) ?? `message-${index + 1}`,
        direction: readString(item.direction) ?? "internal",
        author: readString(item.author) ?? "Back office",
        summary: readString(item.summary) ?? "Sin resumen operativo.",
        sentAt: readString(item.sentAt) ?? "Pendiente de sincronización",
      },
    ];
  });
}

function readAttachments(value: unknown): BookingRequestAttachment[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item, index) => {
    if (!isRecord(item)) return [];
    const name = readString(item.name);
    if (!name) return [];
    const kindValue = readString(item.kind);
    const kind =
      kindValue === "pdf" || kindValue === "image" || kindValue === "file"
        ? kindValue
        : "file";
    return [
      {
        id: readString(item.id) ?? `attachment-${index + 1}`,
        name,
        meta: readString(item.meta),
        status: readString(item.status),
        contentType: readString(item.contentType),
        kind,
        previewHref: readString(item.previewHref),
      },
    ];
  });
}

function readReplyDraft(value: unknown, request: BookingRequest): BookingRequestReplyDraft {
  if (!isRecord(value)) {
    return {
      subject: `Re: ${request.publicRef}`,
      bodyPreview: "Gracias, estamos validando la solicitud y responderemos por este mismo hilo.",
      actionLabel: "Enviar respuesta",
    };
  }

  return {
    subject: readString(value.subject) ?? `Re: ${request.publicRef}`,
    bodyPreview:
      readString(value.bodyPreview) ??
      "Gracias, estamos validando la solicitud y responderemos por este mismo hilo.",
    actionLabel: readString(value.actionLabel) ?? "Enviar respuesta",
  };
}

function readSyncDetail(value: unknown, request: BookingRequest): BookingRequestSyncDetail {
  if (!isRecord(value)) {
    return {
      summary:
        request.syncStatus === "degraded"
          ? "Se detectó una diferencia entre el inbox operativo y la ficha interna."
          : request.syncStatus === "synced"
            ? "El hilo está alineado con el inbox operativo."
            : "El hilo todavía no se sincroniza desde el proveedor de correo.",
      detail: request.lastMessageAt
        ? `Último evento detectado: ${request.lastMessageAt}.`
        : "Todavía no hay un evento sincronizado desde el proveedor de correo.",
      actionLabel:
        request.syncStatus === "synced"
          ? "Re-sincronizar"
          : request.syncStatus === "degraded"
            ? "Reintentar sync"
            : "Sincronizar hilo",
    };
  }

  return {
    summary:
      readString(value.summary) ??
      (request.syncStatus === "degraded"
        ? "Se detectó una diferencia entre el inbox operativo y la ficha interna."
        : "El hilo todavía no se sincroniza desde el proveedor de correo."),
    detail:
      readString(value.detail) ??
      (request.lastMessageAt
        ? `Último evento detectado: ${request.lastMessageAt}.`
        : "Todavía no hay un evento sincronizado desde el proveedor de correo."),
    actionLabel:
      readString(value.actionLabel) ??
      (request.syncStatus === "synced"
        ? "Re-sincronizar"
        : request.syncStatus === "degraded"
          ? "Reintentar sync"
          : "Sincronizar hilo"),
  };
}

function readConflicts(value: unknown): BookingRequestConflict[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item, index) => {
    if (!isRecord(item)) return [];
    const title = readString(item.title);
    if (!title) return [];
    return [
      {
        id: readString(item.id) ?? `conflict-${index + 1}`,
        title,
        detail: readString(item.detail),
        href: readString(item.href),
      },
    ];
  });
}

function readThreadLabel(source: UnknownRecord, request: BookingRequest): string {
  return readString(source.threadLabel) ?? request.threadId ?? request.threadKey;
}

function readInboxPayload(request: BookingRequest) {
  const source = request as BookingRequest & UnknownRecord;

  return {
    threadLabel: readThreadLabel(source, request),
    threadMessages: readThreadMessages(source.threadMessages),
    attachments: readAttachments(source.attachments),
    replyDraft: readReplyDraft(source.replyDraft, request),
    syncDetail: readSyncDetail(source.syncDetail, request),
    conflicts: readConflicts(source.conflicts),
  };
}

function describeDirection(direction: string): string {
  switch (direction) {
    case "inbound":
      return "Cliente";
    case "outbound":
      return "Reservas Wakaya";
    default:
      return "Back office";
  }
}

async function readResponseBody(
  response: Response,
): Promise<{ error?: string; message?: string; reason?: string; conflict?: { notes?: string | null } | null }> {
  try {
    return (await response.json()) as {
      error?: string;
      message?: string;
      reason?: string;
      conflict?: { notes?: string | null } | null;
    };
  } catch {
    return {};
  }
}

function describeApiIssue(
  body: { error?: string; message?: string; reason?: string; conflict?: { notes?: string | null } | null },
): string {
  switch (body.error ?? body.reason) {
    case "occupancy_conflict":
      return body.conflict?.notes ?? "Se detectó un cruce de fechas. Revisa conflictos operativos antes de confirmar.";
    case "zoho_sync_failed":
      return "No se pudo conciliar el hilo con Zoho. Revisa las credenciales y vuelve a intentar.";
    case "booking_request_not_found":
      return "No se encontró la solicitud.";
    case "invalid_payload":
      return "Los datos enviados no son válidos.";
    case "unauthorized":
    case "forbidden":
      return "La sesión no tiene permisos para esta acción.";
    default:
      return body.message ?? body.reason ?? body.error ?? "No se pudo completar la acción.";
  }
}

export function BookingRequestDetailPanel({ request, bungalows, permissions }: Props) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [pendingAction, setPendingAction] = useState<"reply" | "sync" | "advance" | "confirm" | "reschedule" | null>(null);
  const [activeDialog, setActiveDialog] = useState<"reply" | "confirm" | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTabId>("operation");
  const [, startTransition] = useTransition();
  const refreshTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setFeedback(null);
    setPendingAction(null);
    setActiveDialog(null);
    setActiveTab("operation");
    if (refreshTimerRef.current !== null) {
      window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, [request?.id]);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  const activeBungalows = bungalows.filter((item) => item.active);

  if (!request) {
    return (
      <aside className={styles.sectionCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Detalle de solicitud</h2>
        </div>
        <p className={styles.helper}>No hay solicitudes disponibles.</p>
      </aside>
    );
  }

  const inbox = readInboxPayload(request);
  const requestedBungalowLabel =
    activeBungalows.find((item) => item.id === request.requestedBungalowType)?.name ??
    request.requestedBungalowType ??
    "Sin fijar";
  const requestedExperienceLabel = request.requestedExperienceId ?? "Sin fijar";
  const guestInitials = buildGuestInitials(request.guestName, request.guestEmail);
  const hasConflicts = inbox.conflicts.length > 0;
  const primaryAttachment =
    inbox.attachments.find((attachment) => attachment.previewHref && (attachment.kind === "image" || attachment.kind === "pdf")) ??
    inbox.attachments.find((attachment) => attachment.previewHref) ??
    inbox.attachments[0] ??
    null;
  const canReply = permissions.canWrite && Boolean(request.threadKey);
  const canSync = permissions.canWrite && Boolean(request.threadKey);
  const canMarkInitialEmailSent =
    permissions.canWrite && (request.status === "request_received" || request.status === "awaiting_initial_email");
  const canMarkProofReceived =
    permissions.canWrite && (request.status === "awaiting_transfer" || request.status === "needs_attention");
  const canConfirmTransfer = permissions.canApprove && request.status === "proof_received";
  const canReschedule = permissions.canWrite && request.status !== "converted_to_reservation" && request.status !== "cancelled";

  const refreshAfterSuccess = () => {
    if (refreshTimerRef.current !== null) {
      window.clearTimeout(refreshTimerRef.current);
    }
    refreshTimerRef.current = window.setTimeout(() => {
      startTransition(() => {
        router.refresh();
      });
      refreshTimerRef.current = null;
    }, 500);
  };

  const handleReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pendingAction || !canReply) return;

    const formData = new FormData(event.currentTarget);
    const subject = String(formData.get("subject") ?? "").trim();
    const bodyText = String(formData.get("bodyText") ?? "").trim();
    if (!bodyText) {
      setFeedback({ kind: "blocked", message: "Escribe una respuesta antes de enviar." });
      return;
    }

    setFeedback(null);
    setPendingAction("reply");
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
          message: describeApiIssue(body),
        });
        return;
      }

      setFeedback({ kind: "success", message: "Respuesta enviada dentro del hilo operativo." });
      setActiveDialog(null);
      refreshAfterSuccess();
    } catch {
      setFeedback({ kind: "error", message: "No se pudo conectar con el servidor." });
    } finally {
      setPendingAction(null);
    }
  };

  const handleSync = async () => {
    if (pendingAction || !canSync) return;

    setFeedback(null);
    setPendingAction("sync");
    try {
      const response = await fetch(`/api/booking-requests/${request.id}/sync`, {
        method: "POST",
      });

      if (!response.ok) {
        const body = await readResponseBody(response);
        setFeedback({
          kind: response.status === 400 || response.status === 409 ? "blocked" : "error",
          message: describeApiIssue(body),
        });
        return;
      }

      setFeedback({ kind: "success", message: "Hilo sincronizado con el inbox operativo." });
      refreshAfterSuccess();
    } catch {
      setFeedback({ kind: "error", message: "No se pudo conectar con el servidor." });
    } finally {
      setPendingAction(null);
    }
  };

  const handleAdvanceStatus = async (
    action: "mark_initial_email_sent" | "mark_proof_received",
    successMessage: string,
  ) => {
    if (pendingAction) return;

    setFeedback(null);
    setPendingAction("advance");
    try {
      const response = await fetch(`/api/booking-requests/${request.id}/status`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action,
          reason:
            action === "mark_initial_email_sent"
              ? "correo inicial validado desde back office"
              : "comprobante revisado en back office",
        }),
      });

      if (!response.ok) {
        const body = await readResponseBody(response);
        setFeedback({
          kind: response.status === 400 || response.status === 409 ? "blocked" : "error",
          message: describeApiIssue(body),
        });
        return;
      }

      setFeedback({ kind: "success", message: successMessage });
      refreshAfterSuccess();
    } catch {
      setFeedback({ kind: "error", message: "No se pudo conectar con el servidor." });
    } finally {
      setPendingAction(null);
    }
  };

  const handleConfirmTransfer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pendingAction || request.status !== "proof_received") return;

    const formData = new FormData(event.currentTarget);
    const reason = String(formData.get("reason") ?? "").trim();
    if (!reason) {
      setFeedback({ kind: "blocked", message: "Ingresa el motivo de confirmación." });
      return;
    }

    setFeedback(null);
    setPendingAction("confirm");
    try {
      const response = await fetch(`/api/booking-requests/${request.id}/confirm-transfer`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const body = await readResponseBody(response);
        setFeedback({
          kind: response.status === 400 || response.status === 409 ? "blocked" : "error",
          message: describeApiIssue(body),
        });
        return;
      }

      setFeedback({ kind: "success", message: "Transferencia confirmada y reserva creada." });
      setActiveDialog(null);
      refreshAfterSuccess();
    } catch {
      setFeedback({ kind: "error", message: "No se pudo conectar con el servidor." });
    } finally {
      setPendingAction(null);
    }
  };

  const handleReschedule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pendingAction || !canReschedule) return;

    const formData = new FormData(event.currentTarget);
    const requestedCheckIn = String(formData.get("requestedCheckIn") ?? "").trim();
    const requestedCheckOut = String(formData.get("requestedCheckOut") ?? "").trim();
    const requestedBungalowType = String(formData.get("requestedBungalowType") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();

    setFeedback(null);
    setPendingAction("reschedule");
    try {
      const response = await fetch(`/api/booking-requests/${request.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          requestedCheckIn,
          requestedCheckOut,
          requestedBungalowType: requestedBungalowType || null,
          notes: notes || null,
          reason: "reprogramación operativa desde backoffice",
        }),
      });

      if (!response.ok) {
        const body = await readResponseBody(response);
        setFeedback({
          kind: response.status === 400 || response.status === 409 ? "blocked" : "error",
          message: describeApiIssue(body),
        });
        return;
      }

      setFeedback({
        kind: "success",
        message: "La propuesta quedó actualizada y los conflictos se recalcularon con las nuevas fechas.",
      });
      refreshAfterSuccess();
    } catch {
      setFeedback({ kind: "error", message: "No se pudo conectar con el servidor." });
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <aside className={styles.sectionCard}>
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>Cliente y contexto operativo</h2>
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
        >
          {feedback.message}
        </p>
      ) : null}

      <div className={styles.stack}>
        <div className={styles.requestIdentityHero}>
          <div className={styles.requestOverviewLayout}>
            <div className={styles.requestIdentityCard}>
              <div className={styles.requestIdentityHeader}>
                <div className={styles.requestIdentityMain}>
                  <span className={styles.requestIdentityAvatar} aria-hidden="true">
                    {guestInitials}
                  </span>
                  <div className={styles.requestIdentityCopy}>
                    <span className={styles.requestIdentityEyebrow}>Cliente principal</span>
                    <strong className={styles.requestIdentityName}>{request.guestName}</strong>
                  </div>
                </div>

                <div className={styles.requestIdentityStatus}>
                  <span
                    className={`${styles.badge} ${
                      request.status === "needs_attention"
                        ? styles.statusCancelled
                        : request.status === "proof_received"
                          ? styles.statusPendingReview
                          : styles.statusConfirmed
                    }`}
                  >
                    {BOOKING_REQUEST_STATUS_LABELS[request.status]}
                  </span>
                  <span className={styles.requestPill}>{request.publicRef}</span>
                </div>
              </div>

              <div className={styles.requestContactSection}>
                <span className={styles.requestIdentityEyebrow}>Datos personales</span>
                <div className={styles.requestContactGrid}>
                  <div className={styles.requestContactCard}>
                    <span className={styles.kvLabel}>Correo principal</span>
                    <strong className={styles.requestContactValue}>{request.guestEmail}</strong>
                  </div>
                  <div className={styles.requestContactCard}>
                    <span className={styles.kvLabel}>Teléfono</span>
                    <strong className={styles.requestContactValue}>{request.guestPhone ?? "Sin teléfono"}</strong>
                  </div>
                </div>
              </div>

              <div className={styles.requestIdentityGrid}>
                <div className={styles.requestIdentityField}>
                  <span className={styles.kvLabel}>Canal</span>
                  <span className={styles.requestIdentityValue}>{describeSourceChannel(request.sourceChannel)}</span>
                </div>
                <div className={styles.requestIdentityField}>
                  <span className={styles.kvLabel}>Thread</span>
                  <span className={styles.requestIdentityValue}>{inbox.threadLabel}</span>
                </div>
              </div>
            </div>

            <div className={styles.requestOverviewRail}>
              <div className={styles.requestOverviewRailHeader}>
                <span className={styles.requestIdentityEyebrow}>Contexto de reserva</span>
              </div>

              <div className={styles.requestOverviewGrid}>
                <div className={styles.requestSummaryCard}>
                  <span className={styles.kvLabel}>Fechas</span>
                  <strong className={styles.requestSummaryValue}>
                    {request.requestedCheckIn} → {request.requestedCheckOut}
                  </strong>
                </div>
                <div className={styles.requestSummaryCard}>
                  <span className={styles.kvLabel}>Huéspedes</span>
                  <strong className={styles.requestSummaryValue}>{request.requestedGuests}</strong>
                </div>
                <div className={styles.requestSummaryCard}>
                  <span className={styles.kvLabel}>Bungalow solicitado</span>
                  <strong className={styles.requestSummaryValue}>{requestedBungalowLabel}</strong>
                </div>
                <div className={styles.requestSummaryCard}>
                  <span className={styles.kvLabel}>Experiencia solicitada</span>
                  <strong className={styles.requestSummaryValue}>{requestedExperienceLabel}</strong>
                </div>
                <div className={styles.requestSummaryCard}>
                  <span className={styles.kvLabel}>Sync</span>
                  <strong className={styles.requestSummaryValue}>{SYNC_STATUS_LABELS[request.syncStatus]}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {hasConflicts ? (
          <div className={styles.requestConflictAlert}>
            <span className={styles.requestConflictEyebrow}>Atención inmediata</span>
            <div className={styles.detailSummary}>
              <strong className={styles.requestConflictAlertTitle}>Cliente impactado</strong>
              <p className={styles.helper}>
                {request.guestName} · {request.guestEmail}
                {request.guestPhone ? ` · ${request.guestPhone}` : ""}
              </p>
              <p className={styles.helper}>
                Fechas en riesgo: {request.requestedCheckIn} → {request.requestedCheckOut}
              </p>
            </div>
            <div className={styles.detailActionList}>
              <span className={`${styles.badge} ${styles.statusCancelled}`}>Conflicto crítico</span>
              <span className={styles.requestPill}>{inbox.conflicts.length} alerta{inbox.conflicts.length === 1 ? "" : "s"}</span>
            </div>
          </div>
        ) : null}

        <div className={styles.sectionTabsShell}>
          <div className={styles.sectionTabs} role="tablist" aria-label="Secciones de la solicitud">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "operation"}
              className={activeTab === "operation" ? `${styles.sectionTab} ${styles.sectionTabActive}` : styles.sectionTab}
              onClick={() => setActiveTab("operation")}
            >
              Operación
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "communication"}
              className={activeTab === "communication" ? `${styles.sectionTab} ${styles.sectionTabActive}` : styles.sectionTab}
              onClick={() => setActiveTab("communication")}
            >
              Comunicación
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "conflicts"}
              className={activeTab === "conflicts" ? `${styles.sectionTab} ${styles.sectionTabActive}` : styles.sectionTab}
              onClick={() => setActiveTab("conflicts")}
            >
              Conflictos
              {hasConflicts ? <span className={styles.sectionTabCount}>{inbox.conflicts.length}</span> : null}
            </button>
          </div>
        </div>

        <div className={styles.sectionPanel}>
          {activeTab === "operation" ? (
            <>
              <section className={styles.requestSection}>
                <div className={styles.requestSectionHeader}>
                <div className={styles.detailSummary}>
                  <span className={styles.fieldLabelInline}>
                    Acciones rápidas
                    <InfoTooltip label="Usa estas acciones solo cuando toque mover el caso: responder al cliente, reconciliar el hilo o confirmar la transferencia." />
                  </span>
                </div>
                  <span className={styles.requestPill}>{BOOKING_REQUEST_STATUS_LABELS[request.status]}</span>
                </div>

                <div className={styles.buttonRow}>
                  {permissions.canWrite ? (
                    <button
                      className={styles.button}
                      type="button"
                      disabled={!canReply || pendingAction !== null}
                      onClick={() => setActiveDialog("reply")}
                    >
                      Responder por correo
                    </button>
                  ) : null}

                  {permissions.canWrite ? (
                    <button
                      className={`${styles.button} ${styles.buttonSecondary}`}
                      type="button"
                      onClick={handleSync}
                      disabled={!canSync || pendingAction !== null}
                    >
                      {pendingAction === "sync" ? "Sincronizando..." : "Sincronizar hilo"}
                    </button>
                  ) : null}

                  {permissions.canApprove ? (
                    <button
                      className={`${styles.button} ${styles.buttonSecondary}`}
                      type="button"
                      disabled={!canConfirmTransfer || pendingAction !== null}
                      onClick={() => setActiveDialog("confirm")}
                    >
                      Confirmar transferencia
                    </button>
                  ) : null}
                </div>

                {!permissions.canWrite && !permissions.canApprove ? (
                  <div className={styles.detailActionList}>
                    <span className={`${styles.badge} ${styles.statusConfirmed}`}>Solo lectura</span>
                  </div>
                ) : null}
              </section>

              <section className={styles.requestSection}>
                <div className={styles.detailSummary}>
                  <span className={styles.fieldLabelInline}>
                    Reprogramación operativa
                    <InfoTooltip label="Después de hablar con el cliente, guarda aquí la nueva propuesta de fechas o bungalow. El conflicto se recalcula en el momento." />
                  </span>
                </div>

                {canReschedule ? (
                  <form className={styles.form} onSubmit={handleReschedule}>
                    <div className={styles.fieldGrid}>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>Nueva entrada</span>
                        <input
                          className={styles.input}
                          type="date"
                          name="requestedCheckIn"
                          defaultValue={request.requestedCheckIn}
                          required
                        />
                      </label>

                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>Nueva salida</span>
                        <input
                          className={styles.input}
                          type="date"
                          name="requestedCheckOut"
                          defaultValue={request.requestedCheckOut}
                          required
                        />
                      </label>

                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>Bungalow preferido</span>
                        <select
                          className={styles.select}
                          name="requestedBungalowType"
                          defaultValue={request.requestedBungalowType ?? ""}
                        >
                          <option value="">Sin fijar</option>
                          {activeBungalows.map((bungalow) => (
                            <option key={bungalow.id} value={bungalow.id}>
                              {bungalow.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <input type="hidden" name="requestedExperienceId" value={request.requestedExperienceId ?? ""} />

                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>Nota operativa</span>
                        <input
                          className={styles.input}
                          name="notes"
                          defaultValue={request.notes ?? ""}
                          placeholder="Cliente acepta mover el check-in..."
                        />
                      </label>
                    </div>
                    <p className={styles.formHelper}>
                      Guarda primero la nueva propuesta. Luego vuelve a revisar el conflicto y recién después confirma la transferencia.
                    </p>
                    <div className={styles.buttonRow}>
                      <button className={styles.button} type="submit" disabled={pendingAction !== null}>
                        {pendingAction === "reschedule" ? "Guardando..." : "Guardar nueva propuesta"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className={styles.helper}>Esta solicitud ya no admite reprogramación directa desde esta ficha.</p>
                )}
              </section>

              <section className={styles.requestSection}>
                <div className={styles.detailSummary}>
                  <span className={styles.fieldLabelInline}>
                    Puente operativo
                    <InfoTooltip label="Estas transiciones mueven la solicitud entre correo inicial, espera de transferencia y revisión del comprobante." />
                  </span>
                </div>

                {permissions.canWrite ? (
                  <div className={styles.buttonRow}>
                    {canMarkInitialEmailSent ? (
                      <button
                        className={styles.button}
                        type="button"
                        onClick={() =>
                          handleAdvanceStatus(
                            "mark_initial_email_sent",
                            "La solicitud quedó movida a espera de transferencia.",
                          )
                        }
                        disabled={pendingAction !== null}
                      >
                        {pendingAction === "advance" ? "Actualizando..." : "Marcar correo inicial enviado"}
                      </button>
                    ) : null}

                    {canMarkProofReceived ? (
                      <button
                        className={styles.button}
                        type="button"
                        onClick={() =>
                          handleAdvanceStatus(
                            "mark_proof_received",
                            "El comprobante quedó registrado como revisado.",
                          )
                        }
                        disabled={pendingAction !== null}
                      >
                        {pendingAction === "advance" ? "Actualizando..." : "Marcar comprobante recibido"}
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div className={styles.detailActionList}>
                    <span className={`${styles.badge} ${styles.statusConfirmed}`}>Solo lectura</span>
                  </div>
                )}

                {!canMarkInitialEmailSent && !canMarkProofReceived ? (
                  <p className={styles.helper}>
                    {!permissions.canWrite
                      ? "Este rol no puede mover la solicitud entre estados operativos."
                      : request.status === "proof_received"
                      ? "El comprobante ya quedó validado; continúa con la confirmación de transferencia."
                      : request.status === "converted_to_reservation"
                        ? "La solicitud ya fue convertida en reserva."
                        : request.status === "cancelled"
                          ? "La solicitud ya fue cerrada."
                          : "No hay avances manuales pendientes en este estado."}
                  </p>
                ) : null}
              </section>

              <section className={styles.requestSection}>
                <div className={styles.detailSummary}>
                  <span className={styles.fieldLabelInline}>
                    Conversión operativa
                    <InfoTooltip label="Confirma la transferencia solo cuando el hilo, los adjuntos y la revisión manual estén listos para crear la reserva." />
                  </span>
                </div>

                {permissions.canApprove ? (
                  <div className={styles.requestSyncCard}>
                    <strong className={styles.requestListTitle}>
                      {canConfirmTransfer ? "Lista para crear la reserva" : "Aún no se puede confirmar"}
                    </strong>
                    <p className={styles.helper}>
                      {canConfirmTransfer
                        ? "Abre el popup final solo cuando ya revisaste comprobante, conflictos y continuidad del hilo."
                        : "La confirmación final se habilita cuando el comprobante ya quedó registrado en esta ficha."}
                    </p>
                    <div className={styles.buttonRow}>
                      <button
                        className={styles.button}
                        type="button"
                        disabled={!canConfirmTransfer || pendingAction !== null}
                        onClick={() => setActiveDialog("confirm")}
                      >
                        Confirmar transferencia
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.detailSummary}>
                    <div className={styles.detailActionList}>
                      <span className={`${styles.badge} ${styles.paymentPending}`}>Aprobación requerida</span>
                    </div>
                    <p className={styles.helper}>
                      La confirmación final de la transferencia solo está disponible para roles con permiso de aprobación.
                    </p>
                  </div>
                )}
              </section>
            </>
          ) : null}

          {activeTab === "communication" ? (
            <>
              <section className={styles.requestSection}>
                <div className={styles.requestSectionHeader}>
                  <div className={styles.detailSummary}>
                    <span className={styles.fieldLabelInline}>
                      Hilo del cliente
                      <InfoTooltip label="Este historial conserva el ida y vuelta con el cliente desde reservas@wakayaecolodge.com para no perder contexto comercial ni operativo." />
                    </span>
                  </div>
                  <span className={styles.requestPill}>{inbox.threadLabel}</span>
                </div>

                <div className={`${styles.detailGrid} ${styles.detailGridWide}`}>
                  <div className={styles.detailStack}>
                    {inbox.threadMessages.length > 0 ? (
                      <ol className={styles.requestTimeline}>
                        {inbox.threadMessages.map((message) => (
                          <li key={message.id} className={styles.requestTimelineItem}>
                            <div className={styles.requestTimelineHeader}>
                              <span className={styles.requestTimelineTitle}>
                                {describeDirection(message.direction)} · {message.author}
                              </span>
                              <span className={styles.requestTimelineMeta}>{message.sentAt}</span>
                            </div>
                            <p className={styles.requestTimelineCopy}>{message.summary}</p>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className={styles.helper}>Aún no hay mensajes visibles. Puedes enviar el primer correo desde esta ficha o sincronizar el hilo.</p>
                    )}
                  </div>

                  <div className={styles.detailStack}>
                    <div className={styles.requestAttachmentSpotlight}>
                      <div className={styles.requestSectionHeader}>
                        <div className={styles.detailSummary}>
                          <span className={styles.fieldLabelInline}>
                            Comprobante visible
                            <InfoTooltip label="Cuando el hilo trae el binario del adjunto, aquí se muestra el comprobante para revisión rápida sin salir de la ficha." />
                          </span>
                        </div>
                        {primaryAttachment?.status ? <span className={styles.requestPill}>{primaryAttachment.status}</span> : null}
                      </div>

                      {primaryAttachment ? (
                        <div className={styles.requestAttachmentPreviewCard}>
                          <div className={styles.detailSummary}>
                            <strong className={styles.requestListTitle}>{primaryAttachment.name}</strong>
                            {primaryAttachment.meta ? <p className={styles.requestCardMeta}>{primaryAttachment.meta}</p> : null}
                          </div>

                          {primaryAttachment.previewHref && primaryAttachment.kind === "image" ? (
                            <img
                              className={styles.requestAttachmentImage}
                              src={primaryAttachment.previewHref}
                              alt={`Adjunto ${primaryAttachment.name}`}
                            />
                          ) : null}

                          {primaryAttachment.previewHref && primaryAttachment.kind === "pdf" ? (
                            <iframe
                              className={styles.requestAttachmentFrame}
                              src={primaryAttachment.previewHref}
                              title={primaryAttachment.name}
                            />
                          ) : null}

                          {!primaryAttachment.previewHref ? (
                            <p className={styles.helper}>
                              Este archivo existe en el hilo, pero esta semilla no trae una vista previa embebida para mostrarlo aquí.
                            </p>
                          ) : null}

                          <div className={styles.detailActionList}>
                            {primaryAttachment.previewHref ? (
                              <a className={styles.link} href={primaryAttachment.previewHref} target="_blank" rel="noreferrer">
                                Abrir adjunto
                              </a>
                            ) : null}
                          </div>
                        </div>
                      ) : (
                        <p className={styles.helper}>Sin comprobante visible todavía en este hilo.</p>
                      )}
                    </div>

                    <div className={styles.requestAttachmentListCard}>
                      <div className={styles.detailSummary}>
                        <span className={styles.fieldLabelInline}>
                          Adjuntos del hilo
                          <InfoTooltip label="Aquí se listan comprobantes y archivos que llegaron dentro del mismo hilo del cliente." />
                        </span>
                      </div>

                      {inbox.attachments.length > 0 ? (
                        <ul className={styles.requestList}>
                          {inbox.attachments.map((attachment) => (
                            <li key={attachment.id} className={styles.requestListItem}>
                              <div>
                                <span className={styles.requestListTitle}>{attachment.name}</span>
                                {attachment.meta ? <span className={styles.requestListMeta}>{attachment.meta}</span> : null}
                              </div>
                              <div className={styles.detailActionList}>
                                {attachment.status ? <span className={styles.requestPill}>{attachment.status}</span> : null}
                                {attachment.previewHref ? (
                                  <a className={styles.link} href={attachment.previewHref} target="_blank" rel="noreferrer">
                                    Ver archivo
                                  </a>
                                ) : null}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className={styles.helper}>Sin adjuntos registrados en este hilo.</p>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section className={styles.requestSection}>
                <div className={styles.detailGrid}>
                  <div className={styles.requestSyncCard}>
                    <div className={styles.detailSummary}>
                      <span className={styles.fieldLabelInline}>
                        Reply operativo
                        <InfoTooltip label="La respuesta sale por el mismo hilo del cliente para mantener continuidad y trazabilidad dentro del backoffice." />
                      </span>
                      {permissions.canWrite ? (
                        <>
                          <strong className={styles.requestListTitle}>{inbox.replyDraft.subject}</strong>
                        </>
                      ) : (
                        <>
                          <div className={styles.detailActionList}>
                            <span className={`${styles.badge} ${styles.statusConfirmed}`}>Solo lectura</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className={styles.requestSyncCard}>
                    <div className={styles.requestSectionHeader}>
                      <div className={styles.detailSummary}>
                        <span className={styles.fieldLabelInline}>
                          Sync de correo
                          <InfoTooltip label="Usa este bloque para alinear el hilo real de correo con la ficha interna cuando aparezcan diferencias o falte contexto." />
                        </span>
                      </div>
                      <span className={styles.requestPill}>{SYNC_STATUS_LABELS[request.syncStatus]}</span>
                    </div>

                    <strong className={styles.requestListTitle}>{inbox.syncDetail.summary}</strong>
                    {inbox.syncDetail.detail ? <p className={styles.helper}>{inbox.syncDetail.detail}</p> : null}
                    {permissions.canWrite ? (
                      <div className={styles.buttonRow}>
                        <button
                          className={`${styles.button} ${styles.buttonSecondary}`}
                          type="button"
                          onClick={handleSync}
                          disabled={!canSync || pendingAction !== null}
                        >
                          {pendingAction === "sync" ? "Sincronizando..." : inbox.syncDetail.actionLabel ?? "Sincronizar hilo"}
                        </button>
                      </div>
                    ) : (
                      <div className={styles.detailActionList}>
                        <span className={`${styles.badge} ${styles.statusConfirmed}`}>Solo lectura</span>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </>
          ) : null}

          {activeTab === "conflicts" ? (
            <section className={styles.requestSection}>
              <div className={styles.detailSummary}>
                <span className={styles.fieldLabelInline}>
                  Conflictos operativos
                  <InfoTooltip label="Aquí aparecen choques con OTA, ocupación u otros bloqueos antes de convertir la solicitud en reserva." />
                </span>
              </div>

              {hasConflicts ? (
                <div className={styles.requestConflictStack}>
                  <div className={`${styles.resolutionGuide} ${styles.resolutionGuideCritical}`}>
                    <span className={`${styles.fieldLabel} ${styles.resolutionGuideEyebrow}`}>Resolución</span>
                    <ol className={styles.resolutionSteps}>
                      <li className={styles.resolutionStep}>
                        <span className={styles.resolutionStepLabel}>Paso 1</span>
                        Valida fechas y comprobante.
                      </li>
                      <li className={styles.resolutionStep}>
                        <span className={styles.resolutionStepLabel}>Paso 2</span>
                        Confirma con el cliente el cambio necesario.
                      </li>
                      <li className={styles.resolutionStep}>
                        <span className={styles.resolutionStepLabel}>Paso 3</span>
                        Reprograma y luego reasigna.
                      </li>
                    </ol>
                  </div>

                  <ul className={styles.requestConflictList}>
                    {inbox.conflicts.map((conflict) => (
                      <li key={conflict.id} className={`${styles.requestConflictItem} ${styles.requestConflictItemCritical}`}>
                        <div className={styles.detailSummary}>
                          <div className={styles.detailActionList}>
                            <span className={`${styles.badge} ${styles.statusCancelled}`}>Conflicto crítico</span>
                          </div>
                          <strong className={styles.requestListTitle}>{conflict.title}</strong>
                          {conflict.detail ? <p className={styles.helper}>{conflict.detail}</p> : null}
                        </div>
                        {conflict.href ? (
                          <a className={styles.link} href={conflict.href}>
                            Abrir contexto
                          </a>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className={styles.helper}>Sin conflictos detectados para esta solicitud.</p>
              )}
            </section>
          ) : null}
        </div>
      </div>

      {activeDialog === "reply" ? (
        <div className={styles.modalOverlay} onClick={() => setActiveDialog(null)}>
          <div
            className={styles.modalPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`reply-dialog-title-${request.id}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.eyebrow}>Wakaya · reply operativo</p>
                <h2 id={`reply-dialog-title-${request.id}`} className={styles.modalTitle}>
                  Responder dentro del hilo
                </h2>
              </div>

              <button className={`${styles.button} ${styles.buttonSecondary}`} type="button" onClick={() => setActiveDialog(null)}>
                Cerrar
              </button>
            </div>

            <form className={styles.form} onSubmit={handleReply}>
              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor={`reply-subject-${request.id}`}>
                  Asunto
                </label>
                <input
                  className={styles.input}
                  id={`reply-subject-${request.id}`}
                  name="subject"
                  defaultValue={inbox.replyDraft.subject}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor={`reply-body-${request.id}`}>
                  Mensaje
                </label>
                <textarea
                  className={styles.textarea}
                  id={`reply-body-${request.id}`}
                  name="bodyText"
                  defaultValue={inbox.replyDraft.bodyPreview}
                />
              </div>
              <p className={styles.formHelper}>Preparando respuesta operativa.</p>
              <div className={styles.buttonRow}>
                <button className={styles.button} type="submit" disabled={!canReply || pendingAction !== null}>
                  {pendingAction === "reply" ? "Enviando..." : inbox.replyDraft.actionLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {activeDialog === "confirm" ? (
        <div className={styles.modalOverlay} onClick={() => setActiveDialog(null)}>
          <div
            className={styles.modalPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`confirm-dialog-title-${request.id}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.eyebrow}>Wakaya · confirmación manual</p>
                <h2 id={`confirm-dialog-title-${request.id}`} className={styles.modalTitle}>
                  Confirmar transferencia
                </h2>
              </div>

              <button className={`${styles.button} ${styles.buttonSecondary}`} type="button" onClick={() => setActiveDialog(null)}>
                Cerrar
              </button>
            </div>

            <form className={styles.form} onSubmit={handleConfirmTransfer}>
              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor={`reason-${request.id}`}>
                  Motivo de confirmación
                </label>
                <input
                  className={styles.input}
                  id={`reason-${request.id}`}
                  name="reason"
                  defaultValue="Transferencia validada en back office"
                />
              </div>
              <div className={styles.buttonRow}>
                <button className={styles.button} type="submit" disabled={!canConfirmTransfer || pendingAction !== null}>
                  {pendingAction === "confirm" ? "Confirmando..." : "Confirmar transferencia"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
