import { randomUUID } from "node:crypto";

import type { OutboundEmailDeliveryResult, OutboundEmailMessage } from "@/lib/mail/types";
import { getPool, getReservationDatabaseUrl } from "@/lib/reservations/postgres";
import { WAKAYA_PRIMARY_PHONE_DISPLAY, WAKAYA_SECONDARY_PHONE_DISPLAY } from "@/lib/wakaya-contact";

type StoredOutboundEmailPayload = OutboundEmailMessage & {
  delivery?: OutboundEmailDeliveryResult;
};

const MEMORY_OUTBOX = new Map<string, { id: string; payload: StoredOutboundEmailPayload; status: string }>();

function buildStoredPayload(
  message: OutboundEmailMessage,
  delivery?: OutboundEmailDeliveryResult,
): StoredOutboundEmailPayload {
  if (!delivery) {
    return { ...message };
  }

  return {
    ...message,
    delivery,
  };
}

export function buildInitialBookingRequestSubject(publicRef: string): string {
  return `Solicitud ${publicRef} · recibida por Reservas Wakaya`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatRequestedBungalowType(value: string | null | undefined): string | null {
  if (!value) return null;

  const normalized = value
    .trim()
    .replaceAll(/[-_]+/g, " ")
    .toLowerCase();
  if (!normalized) return null;

  return normalized.replace(/\b\w/g, (character) => character.toUpperCase());
}

export function buildInitialTransferEmail(input: {
  guestName: string;
  guestEmail: string;
  publicRef: string;
  requestedCheckIn: string;
  requestedCheckOut: string;
  requestedGuests?: number;
  requestedBungalowType?: string | null;
}): OutboundEmailMessage {
  const guestName = input.guestName.trim();
  const subject = buildInitialBookingRequestSubject(input.publicRef);
  const preferredBungalowType = formatRequestedBungalowType(input.requestedBungalowType);
  const summaryLines = [
    `Código: ${input.publicRef}`,
    `Check-in: ${input.requestedCheckIn}`,
    `Check-out: ${input.requestedCheckOut}`,
    input.requestedGuests ? `Huéspedes: ${input.requestedGuests}` : null,
    preferredBungalowType ? `Categoría solicitada: ${preferredBungalowType}` : null,
  ].filter((line): line is string => Boolean(line));
  const summaryHtml = summaryLines
    .map((line) => `<li style="margin:0 0 8px; color:#37516d;">${escapeHtml(line)}</li>`)
    .join("");

  return {
    to: [input.guestEmail],
    subject,
    replyTo: "reservas@wakayaecolodge.com",
    text: [
      `Hola ${guestName},`,
      "",
      `Recibimos tu solicitud ${input.publicRef} en Wakaya.`,
      "Nuestro equipo de reservas ya está revisando tu solicitud y te escribirá lo más pronto posible para continuar la coordinación.",
      "",
      "Resumen de tu solicitud:",
      ...summaryLines,
      "",
      "Si deseas adelantar información adicional o compartir tu comprobante de transferencia, responde a este mismo hilo.",
      "",
      "Reservas Wakaya",
      "reservas@wakayaecolodge.com",
      `${WAKAYA_PRIMARY_PHONE_DISPLAY} / ${WAKAYA_SECONDARY_PHONE_DISPLAY}`,
    ].join("\n"),
    html: `
      <div style="margin:0; background:#f3f7fb; padding:32px 16px; font-family:Arial, Helvetica, sans-serif; color:#16324f;">
        <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #d9e6f2; border-radius:24px; overflow:hidden;">
          <div style="padding:24px 28px; background:linear-gradient(135deg, #16324f 0%, #2e5c87 100%); color:#ffffff;">
            <div style="font-size:12px; letter-spacing:0.18em; text-transform:uppercase; opacity:0.82;">Reservas Wakaya</div>
            <h1 style="margin:10px 0 0; font-size:28px; line-height:1.2; font-weight:600;">Recibimos tu solicitud</h1>
          </div>
          <div style="padding:28px;">
            <p style="margin:0 0 16px; font-size:16px; line-height:1.7;">Hola ${escapeHtml(guestName)},</p>
            <p style="margin:0 0 16px; font-size:16px; line-height:1.7;">
              Estamos revisando tu solicitud <strong>${escapeHtml(input.publicRef)}</strong>. Nuestro equipo de reservas te escribirá lo más pronto posible para continuar la coordinación.
            </p>
            <div style="margin:24px 0; padding:20px 22px; border:1px solid #d9e6f2; border-radius:18px; background:#f8fbff;">
              <div style="margin:0 0 12px; font-size:12px; letter-spacing:0.14em; text-transform:uppercase; color:#5b7690;">Resumen de tu solicitud</div>
              <ul style="margin:0; padding-left:20px;">${summaryHtml}</ul>
            </div>
            <p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:#37516d;">
              Si deseas adelantar información adicional o compartir tu comprobante de transferencia, responde a este mismo hilo y nuestro equipo continuará contigo por esta vía.
            </p>
            <div style="margin-top:28px; padding-top:18px; border-top:1px solid #e4edf5; font-size:14px; line-height:1.7; color:#5b7690;">
              <strong style="display:block; color:#16324f;">Reservas Wakaya</strong>
              reservas@wakayaecolodge.com<br />
              ${WAKAYA_PRIMARY_PHONE_DISPLAY} / ${WAKAYA_SECONDARY_PHONE_DISPLAY}
            </div>
          </div>
        </div>
      </div>
    `.trim(),
    idempotencyKey: `booking-request:${input.publicRef}:initial-email`,
    threadKey: `booking-request:${input.publicRef}`,
  };
}

export async function queueOutboundEmail(input: {
  eventType: string;
  linkedEntityType: string;
  linkedEntityId: string;
  message: OutboundEmailMessage;
  delivery?: OutboundEmailDeliveryResult;
}): Promise<{ status: "queued" }> {
  const payload = buildStoredPayload(input.message, input.delivery);
  const status = input.delivery?.status ?? "queued";

  try {
    getReservationDatabaseUrl();
  } catch {
    MEMORY_OUTBOX.set(input.message.idempotencyKey, {
      id: randomUUID(),
      payload,
      status,
    });
    return { status: "queued" };
  }

  const now = new Date().toISOString();
  await getPool().query(
    `
      insert into outbound_email(
        id, event_type, linked_entity_type, linked_entity_id, idempotency_key, status, payload, created_at, updated_at
      ) values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)
      on conflict (idempotency_key) do update
      set
        status = excluded.status,
        payload = excluded.payload,
        updated_at = excluded.updated_at
    `,
    [
      randomUUID(),
      input.eventType,
      input.linkedEntityType,
      input.linkedEntityId,
      input.message.idempotencyKey,
      status,
      JSON.stringify(payload),
      now,
      now,
    ],
  );

  return { status: "queued" };
}
