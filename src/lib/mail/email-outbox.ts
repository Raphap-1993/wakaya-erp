import { randomUUID } from "node:crypto";

import type { OutboundEmailMessage } from "@/lib/mail/types";
import { getPool, getReservationDatabaseUrl } from "@/lib/reservations/postgres";

const MEMORY_OUTBOX = new Map<string, { id: string; payload: OutboundEmailMessage }>();

export function buildInitialTransferEmail(input: {
  guestName: string;
  guestEmail: string;
  publicRef: string;
  requestedCheckIn: string;
  requestedCheckOut: string;
}): OutboundEmailMessage {
  return {
    to: [input.guestEmail],
    subject: `Solicitud ${input.publicRef} · instrucciones de transferencia`,
    replyTo: "reservas@wakayaecolodge.com",
    text: `Hola ${input.guestName}, responde a este correo con tu comprobante de transferencia para continuar tu solicitud ${input.publicRef}.`,
    html: `<p>Hola ${input.guestName},</p><p>Responde a este mismo hilo con tu comprobante de transferencia para continuar tu solicitud <strong>${input.publicRef}</strong>.</p>`,
    idempotencyKey: `booking-request:${input.publicRef}:initial-email`,
  };
}

export async function queueOutboundEmail(input: {
  eventType: string;
  linkedEntityType: string;
  linkedEntityId: string;
  message: OutboundEmailMessage;
}): Promise<{ status: "queued" }> {
  try {
    getReservationDatabaseUrl();
  } catch {
    MEMORY_OUTBOX.set(input.message.idempotencyKey, {
      id: randomUUID(),
      payload: input.message,
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
        payload = excluded.payload,
        updated_at = excluded.updated_at
    `,
    [
      randomUUID(),
      input.eventType,
      input.linkedEntityType,
      input.linkedEntityId,
      input.message.idempotencyKey,
      "queued",
      JSON.stringify(input.message),
      now,
      now,
    ],
  );

  return { status: "queued" };
}
