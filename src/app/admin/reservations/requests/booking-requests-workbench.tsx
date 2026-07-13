"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState, useTransition } from "react";

import {
  attachmentMediaKind,
  isPreviewableAttachment,
} from "@/lib/mail/attachment-media";
import { buildRequestsWorkbenchHref } from "./requests-workbench-query";
import styles from "../reservations.module.css";
import type { MonitorPermissions } from "../reservations-monitor-shared";
import type { OperationThreadView } from "@/lib/reservations/repository";
import type {
  BookingRequest,
  Bungalow,
  MessageAttachment,
  MessageItem,
  OperationsWorkbenchItem,
  OperationsWorkbenchLane,
  QuickReplyTemplate,
} from "@/lib/reservations/types";

type OwnerOption = {
  id: string;
  label: string;
  email: string;
};

type Props = {
  items: OperationsWorkbenchItem[];
  selectedDetail: OperationThreadView | null;
  ownerOptions: OwnerOption[];
  templates: QuickReplyTemplate[];
  bungalows: Bungalow[];
  permissions: MonitorPermissions;
  currentUserId: string | null;
  query: {
    selected?: string;
    lane?: OperationsWorkbenchLane;
    owner?: string;
    query?: string;
  };
};

type FeedbackState =
  | { kind: "success"; message: string }
  | { kind: "error"; message: string }
  | { kind: "blocked"; message: string }
  | null;

const LANE_LABELS: Record<OperationsWorkbenchLane, string> = {
  requires_reply: "Requiere respuesta",
  proof_received: "Comprobante recibido",
  conflict: "Conflicto",
  waiting_customer: "Esperando cliente",
  pending_mapping: "Pendiente de mapping",
  pending_ack: "Pendiente de ack",
  sync_error: "Sync con error",
  closed: "Cerradas",
};

const STATUS_LABELS: Record<BookingRequest["status"], string> = {
  request_received: "Solicitud recibida",
  awaiting_initial_email: "Pendiente de correo inicial",
  awaiting_transfer: "Esperando transferencia",
  proof_received: "Comprobante recibido",
  needs_attention: "Atención operativa",
  converted_to_reservation: "Convertida",
  cancelled: "Cancelada",
};

function laneTone(lane: OperationsWorkbenchLane) {
  switch (lane) {
    case "conflict":
      return styles.statusCancelled;
    case "requires_reply":
      return styles.paymentPending;
    case "proof_received":
      return styles.paymentPartial;
    case "waiting_customer":
      return styles.statusConfirmed;
    case "closed":
      return styles.statusPaid;
    case "pending_mapping":
      return styles.paymentPartial;
    case "pending_ack":
      return styles.paymentPending;
    case "sync_error":
      return styles.statusCancelled;
    default:
      return styles.paymentPartial;
  }
}

function messageCardTone(message: MessageItem) {
  switch (message.origin) {
    case "guest_inbound":
      return styles.workbenchMessageCardGuest;
    case "external_outbound":
      return styles.workbenchMessageCardExternal;
    case "erp_outbound":
      return styles.workbenchMessageCardErp;
    case "system_outbound":
    default:
      return styles.workbenchMessageCardSystem;
  }
}

function messageTone(message: MessageItem) {
  switch (message.origin) {
    case "guest_inbound":
      return styles.statusConfirmed;
    case "external_outbound":
      return styles.statusCancelled;
    case "erp_outbound":
      return styles.paymentPartial;
    default:
      return styles.statusPaid;
  }
}

function messageOriginLabel(message: MessageItem) {
  switch (message.origin) {
    case "guest_inbound":
      return "Cliente";
    case "external_outbound":
      return "Fuera del ERP";
    case "erp_outbound":
      return "ERP";
    case "system_outbound":
    default:
      return "Sistema";
  }
}

function attachmentHref(detail: OperationThreadView, attachmentId: string) {
  if (detail.kind === "reservation" && detail.reservation) {
    return `/api/reservations/${detail.reservation.id}/ota/attachments/${attachmentId}`;
  }
  if (detail.bookingRequest) {
    return `/api/booking-requests/${detail.bookingRequest.id}/attachments/${attachmentId}`;
  }
  return "#";
}

const MONTH_LABELS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const timelineDateTimeFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Lima",
});

function parseIsoDateTime(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateTime(value: string | null) {
  if (!value) return "Sin registro";
  const parsed = parseIsoDateTime(value);
  if (!parsed) return value;
  return timelineDateTimeFormatter.format(parsed).replace(",", " ·");
}

function formatDateOnly(value: string | null) {
  if (!value) return "Sin fecha";
  const [year, month, day] = value.split("-");
  const monthIndex = Number(month) - 1;
  if (!year || !month || !day || monthIndex < 0 || monthIndex > 11) {
    return value;
  }
  return `${day} ${MONTH_LABELS[monthIndex]} ${year}`;
}

function formatDateRange(start: string | null, end: string | null) {
  return `${formatDateOnly(start)} → ${formatDateOnly(end)}`;
}

function messageSummaryLabel(message: MessageItem) {
  switch (message.origin) {
    case "guest_inbound":
      return "Mensaje del cliente";
    case "external_outbound":
      return "Correo enviado fuera del ERP";
    case "erp_outbound":
      return "Respuesta enviada desde ERP";
    case "system_outbound":
    default:
      return "Nota del sistema";
  }
}

function extractBungalowLabel(bungalows: Bungalow[], requestedBungalowType: string | null) {
  if (!requestedBungalowType) return "Sin fijar";
  return bungalows.find((item) => item.id === requestedBungalowType)?.name ?? requestedBungalowType;
}

function resolveTemplate(template: QuickReplyTemplate, detail: OperationThreadView, bungalows: Bungalow[]) {
  if (!detail.bookingRequest) {
    return template.bodyText;
  }
  const requestedBungalowType = extractBungalowLabel(
    bungalows,
    detail.bookingRequest.requestedBungalowType,
  );
  const values: Record<string, string> = {
    guestName: detail.bookingRequest.guestName,
    publicRef: detail.bookingRequest.publicRef,
    checkIn: detail.bookingRequest.requestedCheckIn,
    checkOut: detail.bookingRequest.requestedCheckOut,
    requestedBungalowType,
  };

  return template.bodyText.replace(/\{\{(guestName|publicRef|checkIn|checkOut|requestedBungalowType)\}\}/g, (_, key) => {
    return values[key] ?? "";
  });
}

function selectedGuest(detail: OperationThreadView | null) {
  if (!detail) return { name: "", email: "", phone: null as string | null };
  if (detail.bookingRequest) {
    return {
      name: detail.bookingRequest.guestName,
      email: detail.bookingRequest.guestEmail,
      phone: detail.bookingRequest.guestPhone,
    };
  }
  const reservation = detail.reservation;
  return {
    name: reservation?.guestName ?? "Reserva OTA",
    email: reservation?.guestEmail ?? "Sin correo",
    phone: reservation?.guestPhone ?? null,
  };
}

function selectedStatusLabel(detail: OperationThreadView) {
  if (detail.kind === "booking_request" && detail.bookingRequest) {
    return STATUS_LABELS[detail.bookingRequest.status];
  }

  switch (detail.reservation?.status) {
    case "ota_imported_confirmed":
      return "OTA importada";
    case "confirmed":
      return "Confirmada";
    case "assigned":
      return "Asignada";
    case "checked_in":
      return "Check-in";
    case "checked_out":
      return "Check-out";
    case "paid":
      return "Pagada";
    case "cancelled":
      return "Cancelada";
    case "no_show":
      return "No show";
    case "pending_review":
    default:
      return "Pendiente";
  }
}

function selectedRef(detail: OperationThreadView) {
  return detail.workItem.displayRef;
}

function selectedBungalowType(detail: OperationThreadView) {
  return detail.bookingRequest?.requestedBungalowType ?? detail.reservation?.bungalowId ?? null;
}

function selectedSubject(detail: OperationThreadView) {
  return detail.thread?.subject ?? (detail.kind === "booking_request"
    ? `Solicitud ${detail.bookingRequest?.publicRef ?? detail.workItem.displayRef}`
    : `Reserva ${detail.reservation?.number ?? detail.workItem.displayRef}`);
}

async function readErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as { message?: string; error?: string };
    switch (body.error) {
      case "zoho_sync_failed":
        return "No se pudo enlazar el hilo con Zoho ni enviar el correo inicial. Revisa la integración y vuelve a intentar.";
      case "booking_request_not_found":
        return "No se encontró la solicitud seleccionada.";
      case "invalid_payload":
        return "Los datos enviados no son válidos.";
      default:
        return body.message ?? body.error ?? "No se pudo completar la acción.";
    }
  } catch {
    return "No se pudo completar la acción.";
  }
}

export function BookingRequestsWorkbench({
  items,
  selectedDetail,
  ownerOptions,
  templates,
  bungalows,
  permissions,
  currentUserId,
  query,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [confirmationReason, setConfirmationReason] = useState("Transferencia validada desde el inbox operativo.");
  const [selectedAttachmentId, setSelectedAttachmentId] = useState<string | null>(null);

  const selectedRequest = selectedDetail?.bookingRequest ?? null;
  const selectedReservation = selectedDetail?.reservation ?? null;
  const selectedGuestInfo = selectedGuest(selectedDetail);
  const selectedTemplate = useMemo(
    () => templates.find((item) => item.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates],
  );
  const selectedOwnerId = selectedRequest?.ownerUserId ?? selectedReservation?.responsibleId ?? "";
  const bungalowLabel = selectedDetail
    ? extractBungalowLabel(bungalows, selectedBungalowType(selectedDetail))
    : "Sin fijar";
  const canComposeInErp = selectedDetail?.kind === "booking_request";
  const previewableAttachments = useMemo(() => {
    if (!selectedDetail) {
      return [];
    }

    const uniqueAttachments = new Map<string, MessageAttachment>();
    selectedDetail.attachments.forEach((attachment) => {
      uniqueAttachments.set(attachment.id, attachment);
    });

    return [...uniqueAttachments.values()].filter(
      (attachment) => Boolean(attachment.contentBase64) && isPreviewableAttachment(attachment),
    );
  }, [selectedDetail]);
  const selectedAttachment =
    previewableAttachments.find((attachment) => attachment.id === selectedAttachmentId) ??
    null;
  const latestMessage = selectedDetail?.messages[0] ?? null;
  const pendingReplyMessageId =
    selectedDetail?.workItem.needsReply && latestMessage?.origin === "guest_inbound"
      ? latestMessage.id
      : null;

  useEffect(() => {
    if (!selectedDetail) {
      setReplySubject("");
      setReplyBody("");
      setSelectedTemplateId("");
      setSelectedAttachmentId(null);
      return;
    }

    setReplySubject(selectedSubject(selectedDetail));
    setReplyBody("");
    setSelectedTemplateId("");
    setSelectedAttachmentId(null);
    setFeedback(null);
    setPendingAction(null);
  }, [selectedDetail?.kind, selectedDetail?.bookingRequest?.id, selectedDetail?.reservation?.id, selectedDetail?.thread?.subject]);

  const refresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const loadTemplateIntoComposer = () => {
    if (!selectedTemplate || !selectedDetail || !selectedDetail.bookingRequest) return;
    setReplyBody(resolveTemplate(selectedTemplate, selectedDetail, bungalows));
    if (selectedTemplate.subjectMode === "custom_subject" && !replySubject.trim()) {
      setReplySubject(`Solicitud ${selectedDetail.bookingRequest.publicRef}`);
    }
  };

  const handleReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRequest || !permissions.canWrite || !replyBody.trim() || !canComposeInErp) {
      setFeedback({ kind: "blocked", message: "Escribe o carga una respuesta antes de enviar." });
      return;
    }

    setPendingAction("reply");
    setFeedback(null);
    try {
      const response = await fetch(`/api/booking-requests/${selectedRequest.id}/reply`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          subject: replySubject.trim() || undefined,
          bodyText: replyBody.trim(),
        }),
      });
      if (!response.ok) {
        setFeedback({ kind: "error", message: await readErrorMessage(response) });
        return;
      }
      setFeedback({ kind: "success", message: "Respuesta enviada desde el ERP." });
      setReplyBody("");
      setSelectedTemplateId("");
      refresh();
    } catch {
      setFeedback({ kind: "error", message: "No se pudo conectar con el servidor." });
    } finally {
      setPendingAction(null);
    }
  };

  const handleOwnerAssign = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRequest || !permissions.canAssign) {
      setFeedback({ kind: "blocked", message: "El owner editable aplica solo a solicitudes web en esta versión." });
      return;
    }

    const formData = new FormData(event.currentTarget);
    setPendingAction("owner");
    setFeedback(null);
    try {
      const response = await fetch(`/api/booking-requests/${selectedRequest.id}/owner`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ownerUserId: String(formData.get("ownerUserId") ?? "") || null,
        }),
      });
      if (!response.ok) {
        setFeedback({ kind: "error", message: await readErrorMessage(response) });
        return;
      }
      setFeedback({ kind: "success", message: "Owner actualizado." });
      refresh();
    } catch {
      setFeedback({ kind: "error", message: "No se pudo conectar con el servidor." });
    } finally {
      setPendingAction(null);
    }
  };

  const handleStatusAction = async (action: "mark_proof_received" | "mark_needs_attention" | "cancel") => {
    if (!selectedRequest || !permissions.canWrite) return;

    setPendingAction(action);
    setFeedback(null);
    try {
      const response = await fetch(`/api/booking-requests/${selectedRequest.id}/status`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action,
          reason: "actualización operativa desde el workbench",
        }),
      });
      if (!response.ok) {
        setFeedback({ kind: "error", message: await readErrorMessage(response) });
        return;
      }
      setFeedback({ kind: "success", message: "Estado actualizado." });
      refresh();
    } catch {
      setFeedback({ kind: "error", message: "No se pudo conectar con el servidor." });
    } finally {
      setPendingAction(null);
    }
  };

  const handleSync = async () => {
    if (!selectedDetail || !permissions.canWrite) return;
    setPendingAction("sync");
    setFeedback(null);
    try {
      const endpoint =
        selectedDetail.kind === "booking_request"
          ? `/api/booking-requests/${selectedDetail.bookingRequest?.id}/sync`
          : `/api/reservations/${selectedDetail.reservation?.id}/ota/resync`;
      const response = await fetch(endpoint, {
        method: "POST",
      });
      if (!response.ok) {
        setFeedback({ kind: "error", message: await readErrorMessage(response) });
        return;
      }
      setFeedback({ kind: "success", message: selectedDetail.kind === "booking_request" ? "Hilo re-sincronizado." : "Reserva OTA re-sincronizada." });
      refresh();
    } catch {
      setFeedback({ kind: "error", message: "No se pudo conectar con el servidor." });
    } finally {
      setPendingAction(null);
    }
  };

  const handleResolveReservationConflict = async () => {
    if (!selectedReservation || !permissions.canApprove) return;

    setPendingAction("resolve-conflict");
    setFeedback(null);
    try {
      const response = await fetch(`/api/reservations/${selectedReservation.id}/ota/resolve-conflict`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          notes: "Conflicto revisado desde el inbox operativo.",
        }),
      });
      if (!response.ok) {
        setFeedback({ kind: "error", message: await readErrorMessage(response) });
        return;
      }
      setFeedback({ kind: "success", message: "Conflicto OTA marcado como resuelto." });
      refresh();
    } catch {
      setFeedback({ kind: "error", message: "No se pudo conectar con el servidor." });
    } finally {
      setPendingAction(null);
    }
  };

  const handleConfirmTransfer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRequest || !permissions.canApprove) return;

    setPendingAction("confirm");
    setFeedback(null);
    try {
      const response = await fetch(`/api/booking-requests/${selectedRequest.id}/confirm-transfer`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason: confirmationReason.trim() }),
      });
      if (!response.ok) {
        setFeedback({ kind: "error", message: await readErrorMessage(response) });
        return;
      }
      setFeedback({ kind: "success", message: "Transferencia confirmada y reserva creada." });
      refresh();
    } catch {
      setFeedback({ kind: "error", message: "No se pudo conectar con el servidor." });
    } finally {
      setPendingAction(null);
    }
  };

  const handleReschedule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRequest || !permissions.canWrite) return;

    const formData = new FormData(event.currentTarget);
    setPendingAction("reschedule");
    setFeedback(null);
    try {
      const response = await fetch(`/api/booking-requests/${selectedRequest.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          requestedCheckIn: String(formData.get("requestedCheckIn") ?? ""),
          requestedCheckOut: String(formData.get("requestedCheckOut") ?? ""),
          requestedBungalowType: String(formData.get("requestedBungalowType") ?? "") || null,
          notes: String(formData.get("notes") ?? "") || null,
          reason: "reprogramación desde el inbox operativo",
        }),
      });
      if (!response.ok) {
        setFeedback({ kind: "error", message: await readErrorMessage(response) });
        return;
      }
      setFeedback({ kind: "success", message: "Fechas reprogramadas y conflictos recalculados." });
      refresh();
    } catch {
      setFeedback({ kind: "error", message: "No se pudo conectar con el servidor." });
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Wakaya · inbox operativo</p>
          <h1 className={styles.title}>Inbox operativo</h1>
          <form className={styles.filterBar} action="/admin/reservations/requests" method="get">
            <label className={styles.filterField}>
              <span className={styles.fieldLabel}>Buscar</span>
              <input className={styles.input} name="query" defaultValue={query.query ?? ""} placeholder="Cliente, correo o WR" />
            </label>
            <label className={styles.filterField}>
              <span className={styles.fieldLabel}>Lane</span>
              <select className={styles.select} name="lane" defaultValue={query.lane ?? ""}>
                <option value="">Todas</option>
                {Object.entries(LANE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <div className={styles.filterActions}>
              <label className={styles.filterField}>
                <span className={styles.fieldLabel}>Owner</span>
                <select className={styles.select} name="owner" defaultValue={query.owner ?? ""}>
                  <option value="">Todos</option>
                  {ownerOptions.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.label}
                    </option>
                  ))}
                </select>
              </label>
              <button className={styles.buttonSecondary} type="submit">
                Filtrar
              </button>
              <a className={styles.buttonSecondary} href="/admin/reservations/requests/templates">
                Plantillas
              </a>
            </div>
          </form>
        </header>

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

        <section className={styles.requestsWorkbench}>
          <aside className={styles.workbenchQueue}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>Cola compartida</h2>
                <p className={styles.cardCopy}>{items.length} hilos visibles</p>
              </div>
            </div>

            {items.length === 0 ? (
              <div className={styles.emptyStateInline}>
                <strong>No hay hilos para este filtro.</strong>
                <span>Ajusta lane, owner o búsqueda.</span>
              </div>
            ) : (
              <div className={styles.workbenchQueueList}>
                {items.map((item) => (
                  <a
                    key={item.id}
                    className={`${styles.workbenchQueueItem} ${
                      selectedDetail?.workItem.id === item.id ? styles.workbenchQueueItemActive : ""
                    }`}
                    href={buildRequestsWorkbenchHref({
                      selected: item.id,
                      lane: query.lane,
                      owner: query.owner,
                      query: query.query,
                    })}
                  >
                    <div className={styles.workbenchQueueTop}>
                      <strong>{item.displayRef}</strong>
                      <span className={`${styles.badge} ${laneTone(item.lane)}`}>{LANE_LABELS[item.lane]}</span>
                    </div>
                    <div className={styles.muted}>
                      {item.guestName}
                      {item.sourceProvider ? ` · ${item.sourceProvider}` : item.kind === "booking_request" ? " · web" : ""}
                    </div>
                    {item.needsReply ? (
                      <div className={styles.workbenchAttentionRow}>
                        <span className={styles.workbenchAttentionDot} aria-hidden="true" />
                        <strong>Pendiente de respuesta</strong>
                        <span>{formatDateTime(item.latestCustomerMessageAt)}</span>
                      </div>
                    ) : null}
                    <div className={styles.workbenchQueueMeta}>
                      <span>{item.ownerName ?? "Sin owner"}</span>
                      <span>{item.syncHealth === "degraded" ? "Sync degradado" : "Sync OK"}</span>
                    </div>
                    <div className={styles.workbenchQueueSnippet}>{item.lastSnippet ?? "Sin actividad visible."}</div>
                  </a>
                ))}
              </div>
            )}
          </aside>

          <section className={styles.workbenchTimeline}>
            {!selectedDetail ? (
              <div className={styles.emptyStateInline}>
                <strong>Selecciona un hilo.</strong>
                <span>La conversación, los conflictos y las acciones se cargan aquí mismo.</span>
              </div>
            ) : (
              <>
                <div className={styles.cardHeader}>
                  <div>
                    <h2 className={styles.cardTitle}>Hilo operativo</h2>
                    <p className={styles.cardCopy}>
                      {selectedGuestInfo.name} · {selectedGuestInfo.email}
                    </p>
                  </div>
                  <div className={styles.buttonRow}>
                    <span className={`${styles.badge} ${laneTone(selectedDetail.workItem.lane)}`}>
                      {LANE_LABELS[selectedDetail.workItem.lane]}
                    </span>
                    <button
                      className={`${styles.button} ${styles.buttonSecondary}`}
                      type="button"
                      onClick={handleSync}
                      disabled={!permissions.canWrite || pendingAction === "sync"}
                    >
                      {pendingAction === "sync" ? "Sincronizando..." : "Re-sincronizar"}
                    </button>
                  </div>
                </div>

                <div className={styles.workbenchTimelineList}>
                  {selectedDetail.messages.length === 0 ? (
                    <div className={styles.emptyStateInline}>
                      <strong>No hay mensajes visibles.</strong>
                      <span>Puedes enviar el primer correo desde aquí o re-sincronizar si el hilo ya existe en Zoho.</span>
                    </div>
                  ) : (
                    selectedDetail.messages.map((message) => (
                      <article
                        key={message.id}
                        className={`${styles.workbenchMessageCard} ${messageCardTone(message)} ${
                          pendingReplyMessageId === message.id ? styles.workbenchMessageCardAttention : ""
                        }`}
                      >
                        <div className={styles.workbenchMessageHeader}>
                          <div className={styles.workbenchMessageIntro}>
                            <div className={styles.workbenchMessagePills}>
                              <span className={`${styles.badge} ${messageTone(message)}`}>{messageOriginLabel(message)}</span>
                              {pendingReplyMessageId === message.id ? (
                                <span className={`${styles.badge} ${styles.paymentPending}`}>Pendiente de respuesta</span>
                              ) : null}
                            </div>
                            <strong className={styles.workbenchMessageTitle}>
                              {messageSummaryLabel(message)}
                            </strong>
                            <span className={styles.workbenchMessageSubject}>{message.subject}</span>
                          </div>
                          <div className={styles.workbenchMessageMeta}>
                            <span className={styles.requestPill}>{formatDateTime(message.receivedAt ?? message.sentAt ?? message.ingestedAt)}</span>
                            <span className={styles.muted}>
                              {message.origin === "guest_inbound" ? message.fromAddress : message.toAddresses.join(", ") || "Sin destinatario"}
                            </span>
                          </div>
                        </div>
                        <p className={`${styles.helper} ${styles.workbenchMessageBody}`}>{message.bodyText ?? "Sin cuerpo de texto."}</p>
                        {message.attachments.length > 0 ? (
                          <div className={styles.buttonRow}>
                            {message.attachments.map((attachment) => (
                              attachment.contentBase64 && isPreviewableAttachment(attachment) ? (
                                <button
                                  key={attachment.id}
                                  className={`${styles.button} ${styles.buttonSecondary}`}
                                  type="button"
                                  onClick={() => setSelectedAttachmentId(attachment.id)}
                                >
                                  {attachment.fileName}
                                </button>
                              ) : (
                                <a
                                  key={attachment.id}
                                  className={`${styles.button} ${styles.buttonSecondary}`}
                                  href={attachmentHref(selectedDetail, attachment.id)}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {attachment.fileName}
                                </a>
                              )
                            ))}
                          </div>
                        ) : null}
                      </article>
                    ))
                  )}
                </div>

                {canComposeInErp ? (
                <form className={styles.form} onSubmit={handleReply}>
                  <div className={styles.fieldGrid}>
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>Plantilla rápida</span>
                      <select
                        className={styles.select}
                        value={selectedTemplateId}
                        onChange={(event) => setSelectedTemplateId(event.target.value)}
                        disabled={!permissions.canWrite}
                      >
                        <option value="">Sin plantilla</option>
                        {templates
                          .filter((template) => template.isActive)
                          .map((template) => (
                            <option key={template.id} value={template.id}>
                              {template.label}
                            </option>
                          ))}
                      </select>
                    </label>
                    <div className={styles.actions}>
                      <span className={styles.fieldLabel}>Preview</span>
                      <button
                        className={`${styles.button} ${styles.buttonSecondary}`}
                        type="button"
                        onClick={loadTemplateIntoComposer}
                        disabled={!selectedTemplate || !permissions.canWrite}
                      >
                        Cargar plantilla
                      </button>
                    </div>
                  </div>

                  {selectedTemplate && selectedDetail ? (
                    <div className={styles.formNoteItem}>
                      {resolveTemplate(selectedTemplate, selectedDetail, bungalows)}
                    </div>
                  ) : null}

                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Asunto</span>
                    <input
                      className={styles.input}
                      value={replySubject}
                      onChange={(event) => setReplySubject(event.target.value)}
                      disabled={!permissions.canWrite}
                    />
                  </label>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Respuesta</span>
                    <textarea
                      className={`${styles.textarea} ${styles.textareaTall}`}
                      value={replyBody}
                      onChange={(event) => setReplyBody(event.target.value)}
                      disabled={!permissions.canWrite}
                    />
                  </label>
                  <div className={styles.buttonRow}>
                    <button className={styles.button} type="submit" disabled={!permissions.canWrite || pendingAction === "reply"}>
                      {pendingAction === "reply" ? "Enviando..." : "Responder desde ERP"}
                    </button>
                  </div>
                </form>
                ) : (
                  <div className={styles.emptyStateInline}>
                    <strong>Mensajería nativa no habilitada en este hilo OTA.</strong>
                    <span>La reserva queda visible en la misma cola, pero la respuesta sigue fuera del ERP hasta activar la capacidad del proveedor.</span>
                  </div>
                )}
              </>
            )}
          </section>

          <aside className={styles.workbenchSidebar}>
            {!selectedDetail ? null : (
              <div className={styles.detailStack}>
                <section className={styles.sectionCard}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h2 className={styles.cardTitle}>Contexto</h2>
                      <p className={styles.cardCopy}>{selectedRef(selectedDetail)}</p>
                    </div>
                    <span className={`${styles.badge} ${laneTone(selectedDetail.workItem.lane)}`}>
                      {selectedStatusLabel(selectedDetail)}
                    </span>
                  </div>
                  <div className={styles.kvGrid}>
                    <div className={styles.kv}>
                      <span className={styles.kvLabel}>Cliente</span>
                      <strong className={styles.kvValue}>{selectedGuestInfo.name}</strong>
                    </div>
                    <div className={styles.kv}>
                      <span className={styles.kvLabel}>Correo</span>
                      <strong className={styles.kvValue}>{selectedGuestInfo.email}</strong>
                    </div>
                    <div className={styles.kv}>
                      <span className={styles.kvLabel}>Teléfono</span>
                      <strong className={styles.kvValue}>{selectedGuestInfo.phone ?? "Sin teléfono"}</strong>
                    </div>
                    <div className={styles.kv}>
                      <span className={styles.kvLabel}>Bungalow</span>
                      <strong className={styles.kvValue}>{bungalowLabel}</strong>
                    </div>
                    <div className={styles.kv}>
                      <span className={styles.kvLabel}>Fechas</span>
                      <strong className={styles.kvValue}>
                        {formatDateRange(
                          selectedDetail.workItem.requestedCheckIn,
                          selectedDetail.workItem.requestedCheckOut,
                        )}
                      </strong>
                    </div>
                    <div className={styles.kv}>
                      <span className={styles.kvLabel}>Sync</span>
                      <strong className={styles.kvValue}>{selectedDetail.workItem.syncHealth}</strong>
                    </div>
                  </div>
                </section>

                <section className={styles.sectionCard}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h2 className={styles.cardTitle}>Owner</h2>
                      <p className={styles.cardCopy}>Cola compartida con responsable visible.</p>
                    </div>
                  </div>
                  <form className={styles.form} onSubmit={handleOwnerAssign}>
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>Propietario</span>
                      <select className={styles.select} name="ownerUserId" defaultValue={selectedOwnerId} disabled={!permissions.canAssign}>
                        <option value="">Sin owner</option>
                        {ownerOptions.map((owner) => (
                          <option key={owner.id} value={owner.id}>
                            {owner.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className={styles.buttonRow}>
                      <button className={styles.button} type="submit" disabled={!permissions.canAssign || pendingAction === "owner"}>
                        {pendingAction === "owner"
                          ? "Guardando..."
                          : selectedRequest?.ownerUserId === currentUserId
                            ? "Actualizar owner"
                            : selectedRequest
                              ? "Tomar ownership"
                              : "Solo lectura OTA"}
                      </button>
                    </div>
                  </form>
                </section>

                {selectedDetail.conflicts.length > 0 ? (
                  <section className={`${styles.sectionCard} ${styles.workbenchConflictCard}`}>
                    <div className={styles.cardHeader}>
                      <div>
                        <h2 className={styles.cardTitle}>Conflictos</h2>
                        <p className={styles.cardCopy}>Marcados en rojo para no perder el caso crítico.</p>
                      </div>
                      <span className={`${styles.badge} ${styles.statusCancelled}`}>{selectedDetail.conflicts.length}</span>
                    </div>
                    <div className={styles.stack}>
                      {selectedDetail.conflicts.map((conflict) => (
                        <div key={conflict.id} className={styles.formNoteItem}>
                          <strong>{(conflict.metadata?.title as string | undefined) ?? "Conflicto operativo"}</strong>
                          <div className={styles.helper}>{conflict.notes ?? "Revisar antes de confirmar."}</div>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                <section className={styles.sectionCard}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h2 className={styles.cardTitle}>Acciones</h2>
                      <p className={styles.cardCopy}>Todo ocurre sin salir del inbox.</p>
                    </div>
                  </div>
                  <div className={styles.buttonRow}>
                    <button
                      className={`${styles.button} ${styles.buttonSecondary}`}
                      type="button"
                      onClick={() => handleStatusAction("mark_proof_received")}
                      disabled={!selectedRequest || !permissions.canWrite || pendingAction === "mark_proof_received"}
                    >
                      Marcar comprobante
                    </button>
                    <button
                      className={`${styles.button} ${styles.buttonSecondary}`}
                      type="button"
                      onClick={() => handleStatusAction("mark_needs_attention")}
                      disabled={!selectedRequest || !permissions.canWrite || pendingAction === "mark_needs_attention"}
                    >
                      Marcar atención
                    </button>
                    <button
                      className={`${styles.button} ${styles.buttonSecondary}`}
                      type="button"
                      onClick={() => handleStatusAction("cancel")}
                      disabled={!selectedRequest || !permissions.canWrite || pendingAction === "cancel"}
                    >
                      Cancelar
                    </button>
                    <a
                      className={`${styles.button} ${styles.buttonSecondary}`}
                      href={selectedRequest ? `/admin/reservations/occupancy?requestId=${selectedRequest.id}` : "/admin/reservations/occupancy"}
                    >
                      Abrir ocupación
                    </a>
                    {selectedReservation ? (
                      <button
                        className={`${styles.button} ${styles.buttonSecondary}`}
                        type="button"
                        onClick={handleResolveReservationConflict}
                        disabled={!permissions.canApprove || pendingAction === "resolve-conflict"}
                      >
                        {pendingAction === "resolve-conflict" ? "Resolviendo..." : "Resolver conflicto OTA"}
                      </button>
                    ) : null}
                  </div>
                </section>

                {selectedRequest ? (
                <section className={styles.sectionCard}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h2 className={styles.cardTitle}>Reprogramar</h2>
                    </div>
                  </div>
                  <form className={styles.form} onSubmit={handleReschedule}>
                    <div className={styles.fieldGrid}>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>Check-in</span>
                        <input className={styles.input} name="requestedCheckIn" type="date" defaultValue={selectedRequest.requestedCheckIn} />
                      </label>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>Check-out</span>
                        <input className={styles.input} name="requestedCheckOut" type="date" defaultValue={selectedRequest.requestedCheckOut} />
                      </label>
                    </div>
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>Tipo solicitado</span>
                      <select className={styles.select} name="requestedBungalowType" defaultValue={selectedRequest.requestedBungalowType ?? ""}>
                        <option value="">Sin fijar</option>
                        {bungalows
                          .filter((item) => item.active)
                          .map((bungalow) => (
                            <option key={bungalow.id} value={bungalow.id}>
                              {bungalow.name}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>Notas</span>
                      <textarea className={styles.textarea} name="notes" defaultValue={selectedRequest.notes ?? ""} />
                    </label>
                    <button className={styles.button} type="submit" disabled={!permissions.canWrite || pendingAction === "reschedule"}>
                      {pendingAction === "reschedule" ? "Guardando..." : "Guardar reprogramación"}
                    </button>
                  </form>
                </section>
                ) : null}

                {permissions.canApprove && selectedRequest?.status === "proof_received" ? (
                  <section className={styles.sectionCard}>
                    <div className={styles.cardHeader}>
                      <div>
                        <h2 className={styles.cardTitle}>Convertir a reserva</h2>
                      </div>
                    </div>
                    <form className={styles.form} onSubmit={handleConfirmTransfer}>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>Motivo</span>
                        <textarea
                          className={styles.textarea}
                          value={confirmationReason}
                          onChange={(event) => setConfirmationReason(event.target.value)}
                        />
                      </label>
                      <button className={styles.button} type="submit" disabled={pendingAction === "confirm"}>
                        {pendingAction === "confirm" ? "Confirmando..." : "Confirmar transferencia"}
                      </button>
                    </form>
                  </section>
                ) : null}
              </div>
            )}
          </aside>
        </section>
      </div>

      {selectedDetail && selectedAttachment ? (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-label={`Adjunto ${selectedAttachment.fileName}`}
          onClick={() => setSelectedAttachmentId(null)}
        >
          <div className={`${styles.modalPanel} ${styles.requestAttachmentLightboxPanel}`} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.eyebrow}>Adjunto del hilo</p>
                <h2 className={styles.modalTitle}>{selectedAttachment.fileName}</h2>
              </div>
              <div className={styles.buttonRow}>
                <a
                  className={`${styles.button} ${styles.buttonSecondary}`}
                  href={attachmentHref(selectedDetail, selectedAttachment.id)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir archivo
                </a>
                <button
                  className={`${styles.button} ${styles.buttonSecondary}`}
                  type="button"
                  onClick={() => setSelectedAttachmentId(null)}
                >
                  Cerrar
                </button>
              </div>
            </div>

            <div className={styles.requestAttachmentPreviewCard}>
              {attachmentMediaKind(selectedAttachment) === "image" ? (
                <img
                  className={styles.requestAttachmentLightboxImage}
                  src={attachmentHref(selectedDetail, selectedAttachment.id)}
                  alt={`Adjunto ${selectedAttachment.fileName}`}
                />
              ) : attachmentMediaKind(selectedAttachment) === "pdf" ? (
                <iframe
                  className={styles.requestAttachmentLightboxFrame}
                  src={attachmentHref(selectedDetail, selectedAttachment.id)}
                  title={selectedAttachment.fileName}
                />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
