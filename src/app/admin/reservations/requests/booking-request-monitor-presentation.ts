import type { BookingRequestThreadView } from "@/lib/reservations/repository";
import type { BookingRequest, MessageAttachment, MessageItem } from "@/lib/reservations/types";

function getSingleValue(value: string | string[] | undefined): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function describeMessageAuthor(message: MessageItem): string {
  return message.direction === "inbound" ? message.fromAddress : "Reservas Wakaya";
}

function describeMessageSummary(message: MessageItem): string {
  const summary = message.bodyText?.trim();
  if (summary) {
    return summary.length > 180 ? `${summary.slice(0, 177)}...` : summary;
  }
  return message.subject;
}

function describeMessageMoment(message: MessageItem): string {
  return message.receivedAt ?? message.sentAt ?? message.ingestedAt;
}

function describeAttachmentMeta(attachment: MessageAttachment): string {
  const sizeMb = attachment.fileSizeBytes > 0 ? `${(attachment.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB` : null;
  const typeLabel =
    attachment.contentType === "application/pdf"
      ? "PDF"
      : attachment.contentType.startsWith("image/")
        ? "Imagen"
        : attachment.contentType;

  return [typeLabel, sizeMb].filter(Boolean).join(" · ");
}

function describeAttachmentKind(attachment: MessageAttachment): "pdf" | "image" | "file" {
  if (attachment.contentType === "application/pdf") {
    return "pdf";
  }
  if (attachment.contentType.startsWith("image/")) {
    return "image";
  }
  return "file";
}

export function readSelectedBookingRequestId(
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>,
): Promise<string | null> | string | null {
  if (searchParams && typeof searchParams === "object" && "then" in searchParams) {
    return Promise.resolve(searchParams).then((resolved) => getSingleValue(resolved.selected));
  }
  return getSingleValue(searchParams?.selected);
}

export function enrichMonitorItem(item: BookingRequest, detail: BookingRequestThreadView) {
  return {
    ...item,
    threadId: detail.thread?.providerThreadId ?? detail.thread?.id ?? item.threadId,
    threadLabel: detail.thread?.providerThreadId ?? detail.thread?.threadKey ?? item.threadKey,
    threadMessages: detail.messages.map((message) => ({
      id: message.id,
      direction: message.direction,
      author: describeMessageAuthor(message),
      summary: describeMessageSummary(message),
      sentAt: describeMessageMoment(message),
    })),
    attachments: detail.attachments.map((attachment) => ({
      id: attachment.id,
      name: attachment.fileName,
      meta: describeAttachmentMeta(attachment),
      status: attachment.isSupported ? "Recibido" : "Formato por revisar",
      contentType: attachment.contentType,
      kind: describeAttachmentKind(attachment),
      previewHref:
        attachment.isSupported && attachment.contentBase64
          ? `/api/booking-requests/${item.id}/attachments/${attachment.id}`
          : null,
    })),
    replyDraft: {
      subject: detail.thread?.subject ?? `Re: ${item.publicRef}`,
      bodyPreview:
        "Gracias, estamos validando la transferencia y la disponibilidad. Te responderemos por este mismo hilo.",
      actionLabel: "Enviar respuesta",
    },
    syncDetail: {
      summary:
        detail.bookingRequest.syncStatus === "synced"
          ? "El hilo está alineado con el inbox operativo."
          : detail.thread?.providerThreadId
            ? "El hilo existe pero todavía requiere conciliación operativa."
            : "Todavía no se encontró el hilo del proveedor; usa sync para enlazarlo.",
      detail:
        detail.thread?.lastSyncedAt
          ? `Última sincronización: ${detail.thread.lastSyncedAt}.`
          : "Aún no existe una sincronización registrada.",
      actionLabel: detail.bookingRequest.syncStatus === "synced" ? "Re-sincronizar" : "Sincronizar hilo",
    },
    conflicts: detail.conflicts.map((conflict) => ({
      id: conflict.id,
      title:
        typeof conflict.metadata?.title === "string"
          ? conflict.metadata.title
          : conflict.conflictType === "date_overlap"
            ? "Choque de fechas con reserva existente"
            : "Choque de asignación operativa",
      detail: conflict.notes,
      href: conflict.metadata?.overlappingReservationIds
        ? `/admin/reservations/occupancy?date=${item.requestedCheckIn}`
        : null,
    })),
  };
}

export type BookingRequestMonitorItem = ReturnType<typeof enrichMonitorItem>;
