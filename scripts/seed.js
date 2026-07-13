#!/usr/bin/env node

const { randomUUID } = require("node:crypto");
const { Client } = require("pg");

const DEFAULT_DATABASE_URL = "postgres://postgres:postgres@localhost:5432/wakaya-erp";
const NOW = new Date();

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(base, amount) {
  const next = new Date(base);
  next.setUTCDate(next.getUTCDate() + amount);
  return next;
}

function isoTimestamp(date) {
  return date.toISOString();
}

const TODAY = isoDate(NOW);
const YESTERDAY = isoDate(addDays(NOW, -1));
const TOMORROW = isoDate(addDays(NOW, 1));
const NEXT_WEEK = isoDate(addDays(NOW, 4));
const NEXT_WEEK_END = isoDate(addDays(NOW, 6));
const AFTER_NEXT_WEEK = isoDate(addDays(NOW, 7));
const AFTER_NEXT_WEEK_END = isoDate(addDays(NOW, 8));

const RESERVATIONS = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    number: "RESERVATION-2026-9001",
    channel: "ota",
    status: "confirmed",
    bungalowId: "bungalow-family",
    responsibleId: "user-ota-1",
    startDate: NEXT_WEEK,
    endDate: NEXT_WEEK_END,
    amountTotalCents: 48000,
    amountPaidCents: 48000,
    paymentStatus: "paid",
    audit: {
      id: "11111111-aaaa-4111-8111-111111111111",
      actorId: "system",
      action: "confirm",
      previousStatus: "ota_imported_confirmed",
      nextStatus: "confirmed",
      reason: "Reserva OTA importada y aprobada por sistema.",
    },
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    number: "RESERVATION-2026-9002",
    channel: "web",
    status: "assigned",
    bungalowId: "bungalow-suite",
    responsibleId: "user-reception-seed",
    startDate: TODAY,
    endDate: TOMORROW,
    amountTotalCents: 36000,
    amountPaidCents: 0,
    paymentStatus: "pending",
    audit: {
      id: "22222222-aaaa-4222-8222-222222222222",
      actorId: "user-reception-seed",
      action: "assign",
      previousStatus: "confirmed",
      nextStatus: "assigned",
      reason: "Reserva lista para check-in en el backoffice.",
    },
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    number: "RESERVATION-2026-9003",
    channel: "ota",
    status: "checked_in",
    bungalowId: "bungalow-triple",
    responsibleId: "user-reception-seed",
    startDate: YESTERDAY,
    endDate: TODAY,
    amountTotalCents: 42000,
    amountPaidCents: 12000,
    paymentStatus: "partial",
    audit: {
      id: "33333333-aaaa-4333-8333-333333333333",
      actorId: "user-reception-seed",
      action: "check_in",
      previousStatus: "assigned",
      nextStatus: "checked_in",
      reason: "Huésped en casa y pendiente de check-out hoy.",
    },
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    number: "RESERVATION-2026-9004",
    channel: "web",
    status: "confirmed",
    bungalowId: null,
    responsibleId: "user-reception-seed",
    startDate: AFTER_NEXT_WEEK,
    endDate: AFTER_NEXT_WEEK_END,
    amountTotalCents: 26000,
    amountPaidCents: 0,
    paymentStatus: "pending",
    audit: {
      id: "44444444-aaaa-4444-8444-444444444444",
      actorId: "user-reception-seed",
      action: "confirm",
      previousStatus: "pending_review",
      nextStatus: "confirmed",
      reason: "Reserva manual lista para asignación operativa.",
    },
  },
];

const BOOKING_REQUESTS = [
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    publicRef: "WR-2026-9001",
    status: "proof_received",
    guestName: "Grace Hopper",
    guestEmail: "grace@example.com",
    guestPhone: "+51999111111",
    requestedCheckIn: NEXT_WEEK,
    requestedCheckOut: NEXT_WEEK_END,
    requestedGuests: 2,
    requestedBungalowType: "bungalow-family",
    threadId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
    threadKey: "booking-request:WR-2026-9001",
    syncStatus: "synced",
  },
  {
    id: "cccccccc-cccc-4ccc-8ccc-ccccccccccc2",
    publicRef: "WR-2026-9002",
    status: "proof_received",
    guestName: "Ada Lovelace",
    guestEmail: "ada@example.com",
    guestPhone: "+51999222222",
    requestedCheckIn: AFTER_NEXT_WEEK,
    requestedCheckOut: AFTER_NEXT_WEEK_END,
    requestedGuests: 2,
    requestedBungalowType: "bungalow-suite",
    threadId: "dddddddd-dddd-4ddd-8ddd-ddddddddddd2",
    threadKey: "booking-request:WR-2026-9002",
    syncStatus: "synced",
  },
];

const THREADS = [
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
    mailboxAddress: "reservas@wakayaecolodge.com",
    provider: "zoho_mail",
    providerThreadId: "seed-zoho-thread-9001",
    subject: "Solicitud WR-2026-9001 · instrucciones de transferencia",
    threadKey: "booking-request:WR-2026-9001",
    linkedEntityId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    syncStatus: "synced",
  },
  {
    id: "dddddddd-dddd-4ddd-8ddd-ddddddddddd2",
    mailboxAddress: "reservas@wakayaecolodge.com",
    provider: "zoho_mail",
    providerThreadId: "seed-zoho-thread-9002",
    subject: "Solicitud WR-2026-9002 · instrucciones de transferencia",
    threadKey: "booking-request:WR-2026-9002",
    linkedEntityId: "cccccccc-cccc-4ccc-8ccc-ccccccccccc2",
    syncStatus: "synced",
  },
];

const MESSAGES = [
  {
    id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1",
    threadId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
    direction: "outbound",
    providerMessageId: "seed-zoho-msg-9001-out",
    fromAddress: "reservas@wakayaecolodge.com",
    toAddresses: ["grace@example.com"],
    ccAddresses: [],
    subject: "Solicitud WR-2026-9001 · instrucciones de transferencia",
    bodyText: "Hola Grace, responde en este hilo con tu comprobante para continuar la solicitud WR-2026-9001.",
    sentAt: isoTimestamp(addDays(NOW, -1)),
    receivedAt: null,
    attachments: [],
  },
  {
    id: "ffffffff-ffff-4fff-8fff-fffffffffff1",
    threadId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
    direction: "inbound",
    providerMessageId: "seed-zoho-msg-9001-in",
    fromAddress: "grace@example.com",
    toAddresses: ["reservas@wakayaecolodge.com"],
    ccAddresses: [],
    subject: "Re: Solicitud WR-2026-9001 · instrucciones de transferencia",
    bodyText: "Adjunto mi comprobante. Quedo atenta a la confirmación.",
    sentAt: isoTimestamp(NOW),
    receivedAt: isoTimestamp(NOW),
    attachments: [
      {
        id: "99999999-9999-4999-8999-999999999991",
        providerAttachmentId: "seed-att-9001",
        fileName: "comprobante-grace.pdf",
        contentType: "application/pdf",
        fileSizeBytes: 2048,
        storageKey: "seed/WR-2026-9001/comprobante-grace.pdf",
        fileHash: "seed-hash-grace-proof",
        isSupported: true,
        contentBase64: "ZmFrZS1wZGYtZ3JhY2U=",
      },
    ],
  },
  {
    id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2",
    threadId: "dddddddd-dddd-4ddd-8ddd-ddddddddddd2",
    direction: "outbound",
    providerMessageId: "seed-zoho-msg-9002-out",
    fromAddress: "reservas@wakayaecolodge.com",
    toAddresses: ["ada@example.com"],
    ccAddresses: [],
    subject: "Solicitud WR-2026-9002 · instrucciones de transferencia",
    bodyText: "Hola Ada, comparte tu comprobante en este hilo para confirmar tu estadía.",
    sentAt: isoTimestamp(addDays(NOW, -1)),
    receivedAt: null,
    attachments: [],
  },
  {
    id: "ffffffff-ffff-4fff-8fff-fffffffffff2",
    threadId: "dddddddd-dddd-4ddd-8ddd-ddddddddddd2",
    direction: "inbound",
    providerMessageId: "seed-zoho-msg-9002-in",
    fromAddress: "ada@example.com",
    toAddresses: ["reservas@wakayaecolodge.com"],
    ccAddresses: [],
    subject: "Re: Solicitud WR-2026-9002 · instrucciones de transferencia",
    bodyText: "Adjunto el comprobante y quedo atenta para cerrar la reserva.",
    sentAt: isoTimestamp(NOW),
    receivedAt: isoTimestamp(NOW),
    attachments: [
      {
        id: "99999999-9999-4999-8999-999999999992",
        providerAttachmentId: "seed-att-9002",
        fileName: "comprobante-ada.pdf",
        contentType: "application/pdf",
        fileSizeBytes: 2048,
        storageKey: "seed/WR-2026-9002/comprobante-ada.pdf",
        fileHash: "seed-hash-ada-proof",
        isSupported: true,
        contentBase64: "ZmFrZS1wZGYtYWRh",
      },
    ],
  },
];

const CONFLICTS = [
  {
    id: "abababab-abab-4aba-8aba-abababababab",
    status: "open",
    conflictType: "date_overlap",
    requestId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    reservationId: "11111111-1111-4111-8111-111111111111",
    notes: "La solicitud WR-2026-9001 cruza con una OTA ya aprobada en Bungalow Familiar.",
    createdBy: "seed-script",
    metadata: {
      overlappingReservationIds: ["11111111-1111-4111-8111-111111111111"],
    },
  },
];

const OUTBOX = [
  {
    id: "12121212-1212-4121-8121-121212121211",
    eventType: "booking_request.initial_transfer_instructions",
    linkedEntityId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    idempotencyKey: "booking-request:WR-2026-9001:initial-email",
    status: "sent",
    payload: {
      to: ["grace@example.com"],
      subject: "Solicitud WR-2026-9001 · instrucciones de transferencia",
      replyTo: "reservas@wakayaecolodge.com",
      text: "Hola Grace, responde a este correo con tu comprobante.",
      html: "<p>Hola Grace, responde a este correo con tu comprobante.</p>",
      threadKey: "booking-request:WR-2026-9001",
      idempotencyKey: "booking-request:WR-2026-9001:initial-email",
      delivery: {
        status: "sent",
        providerMessageId: "resend-seed-9001",
      },
    },
  },
  {
    id: "12121212-1212-4121-8121-121212121212",
    eventType: "booking_request.initial_transfer_instructions",
    linkedEntityId: "cccccccc-cccc-4ccc-8ccc-ccccccccccc2",
    idempotencyKey: "booking-request:WR-2026-9002:initial-email",
    status: "sent",
    payload: {
      to: ["ada@example.com"],
      subject: "Solicitud WR-2026-9002 · instrucciones de transferencia",
      replyTo: "reservas@wakayaecolodge.com",
      text: "Hola Ada, responde a este correo con tu comprobante.",
      html: "<p>Hola Ada, responde a este correo con tu comprobante.</p>",
      threadKey: "booking-request:WR-2026-9002",
      idempotencyKey: "booking-request:WR-2026-9002:initial-email",
      delivery: {
        status: "sent",
        providerMessageId: "resend-seed-9002",
      },
    },
  },
];

async function main() {
  const connectionString = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query("begin");

    for (const reservation of RESERVATIONS) {
      await client.query(
        `
          insert into reservation (
            id, number, channel, status, source_request_id, bungalow_id, responsible_id,
            start_date, end_date, amount_total_cents, amount_paid_cents, payment_status, currency_code, updated_at
          ) values (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11, $12, $13, $14
          )
          on conflict (id) do update
          set
            number = excluded.number,
            channel = excluded.channel,
            status = excluded.status,
            bungalow_id = excluded.bungalow_id,
            responsible_id = excluded.responsible_id,
            start_date = excluded.start_date,
            end_date = excluded.end_date,
            amount_total_cents = excluded.amount_total_cents,
            amount_paid_cents = excluded.amount_paid_cents,
            payment_status = excluded.payment_status,
            currency_code = excluded.currency_code,
            updated_at = excluded.updated_at
        `,
        [
          reservation.id,
          reservation.number,
          reservation.channel,
          reservation.status,
          null,
          reservation.bungalowId,
          reservation.responsibleId,
          reservation.startDate,
          reservation.endDate,
          reservation.amountTotalCents,
          reservation.amountPaidCents,
          reservation.paymentStatus,
          "PEN",
          isoTimestamp(NOW),
        ],
      );

      await client.query(
        `
          insert into reservation_audit (
            id, reservation_id, actor_id, action, previous_status, next_status, reason, created_at
          ) values ($1, $2, $3, $4, $5, $6, $7, $8)
          on conflict (id) do update
          set actor_id = excluded.actor_id,
              action = excluded.action,
              previous_status = excluded.previous_status,
              next_status = excluded.next_status,
              reason = excluded.reason,
              created_at = excluded.created_at
        `,
        [
          reservation.audit.id,
          reservation.id,
          reservation.audit.actorId,
          reservation.audit.action,
          reservation.audit.previousStatus,
          reservation.audit.nextStatus,
          reservation.audit.reason,
          isoTimestamp(NOW),
        ],
      );

      if (reservation.bungalowId) {
        const dates = [];
        let cursor = new Date(`${reservation.startDate}T00:00:00.000Z`);
        const end = new Date(`${reservation.endDate}T00:00:00.000Z`);
        while (cursor <= end) {
          dates.push(isoDate(cursor));
          cursor = addDays(cursor, 1);
        }

        for (const date of dates) {
          await client.query(
            `
              insert into reservation_occupancy (
                id, reservation_id, bungalow_id, date, source, status, created_at
              ) values ($1, $2, $3, $4, $5, $6, $7)
              on conflict (bungalow_id, date) do update
              set reservation_id = excluded.reservation_id,
                  source = excluded.source,
                  status = excluded.status
            `,
            [
              randomUUID(),
              reservation.id,
              reservation.bungalowId,
              date,
              reservation.channel,
              reservation.status === "checked_in" ? "confirmed" : reservation.status === "assigned" ? "confirmed" : "confirmed",
              isoTimestamp(NOW),
            ],
          );
        }
      }
    }

    for (const request of BOOKING_REQUESTS) {
      await client.query(
        `
          insert into booking_request (
            id, public_ref, status, guest_name, guest_email, guest_phone,
            requested_check_in, requested_check_out, requested_guests, requested_bungalow_type,
            source_channel, thread_id, thread_key, notes, last_message_at, sync_status, created_at, updated_at
          ) values (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, $18
          )
          on conflict (id) do update
          set
            public_ref = excluded.public_ref,
            status = excluded.status,
            guest_name = excluded.guest_name,
            guest_email = excluded.guest_email,
            guest_phone = excluded.guest_phone,
            requested_check_in = excluded.requested_check_in,
            requested_check_out = excluded.requested_check_out,
            requested_guests = excluded.requested_guests,
            requested_bungalow_type = excluded.requested_bungalow_type,
            thread_id = excluded.thread_id,
            thread_key = excluded.thread_key,
            last_message_at = excluded.last_message_at,
            sync_status = excluded.sync_status,
            updated_at = excluded.updated_at
        `,
        [
          request.id,
          request.publicRef,
          request.status,
          request.guestName,
          request.guestEmail,
          request.guestPhone,
          request.requestedCheckIn,
          request.requestedCheckOut,
          request.requestedGuests,
          request.requestedBungalowType,
          "web_public",
          request.threadId,
          request.threadKey,
          "Seed operativo para backoffice Wakaya.",
          isoTimestamp(NOW),
          request.syncStatus,
          isoTimestamp(addDays(NOW, -1)),
          isoTimestamp(NOW),
        ],
      );
    }

    for (const thread of THREADS) {
      await client.query(
        `
          insert into message_thread (
            id, mailbox_address, provider, provider_thread_id, subject, thread_key,
            linked_entity_type, linked_entity_id, last_synced_at, sync_status, created_at, updated_at
          ) values (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11, $12
          )
          on conflict (id) do update
          set
            provider_thread_id = excluded.provider_thread_id,
            subject = excluded.subject,
            thread_key = excluded.thread_key,
            last_synced_at = excluded.last_synced_at,
            sync_status = excluded.sync_status,
            updated_at = excluded.updated_at
        `,
        [
          thread.id,
          thread.mailboxAddress,
          thread.provider,
          thread.providerThreadId,
          thread.subject,
          thread.threadKey,
          "booking_request",
          thread.linkedEntityId,
          isoTimestamp(NOW),
          thread.syncStatus,
          isoTimestamp(addDays(NOW, -1)),
          isoTimestamp(NOW),
        ],
      );
    }

    for (const message of MESSAGES) {
      await client.query(
        `
          insert into message_item (
            id, thread_id, direction, provider_message_id, from_address, to_addresses,
            cc_addresses, subject, body_text, body_html, sent_at, received_at, ingested_at
          ) values (
            $1, $2, $3, $4, $5, $6::jsonb,
            $7::jsonb, $8, $9, $10, $11, $12, $13
          )
          on conflict (id) do update
          set
            direction = excluded.direction,
            provider_message_id = excluded.provider_message_id,
            from_address = excluded.from_address,
            to_addresses = excluded.to_addresses,
            cc_addresses = excluded.cc_addresses,
            subject = excluded.subject,
            body_text = excluded.body_text,
            body_html = excluded.body_html,
            sent_at = excluded.sent_at,
            received_at = excluded.received_at,
            ingested_at = excluded.ingested_at
        `,
        [
          message.id,
          message.threadId,
          message.direction,
          message.providerMessageId,
          message.fromAddress,
          JSON.stringify(message.toAddresses),
          JSON.stringify(message.ccAddresses),
          message.subject,
          message.bodyText,
          null,
          message.sentAt,
          message.receivedAt,
          isoTimestamp(NOW),
        ],
      );

      for (const attachment of message.attachments) {
        await client.query(
          `
            insert into message_attachment (
              id, message_id, provider_attachment_id, file_name, content_type, file_size_bytes,
              storage_key, file_hash, is_supported, content_base64, created_at
            ) values (
              $1, $2, $3, $4, $5, $6,
              $7, $8, $9, $10, $11
            )
            on conflict (id) do update
            set
              provider_attachment_id = excluded.provider_attachment_id,
              file_name = excluded.file_name,
              content_type = excluded.content_type,
              file_size_bytes = excluded.file_size_bytes,
              storage_key = excluded.storage_key,
              file_hash = excluded.file_hash,
              is_supported = excluded.is_supported,
              content_base64 = excluded.content_base64
          `,
          [
            attachment.id,
            message.id,
            attachment.providerAttachmentId,
            attachment.fileName,
            attachment.contentType,
            attachment.fileSizeBytes,
            attachment.storageKey,
            attachment.fileHash,
            attachment.isSupported,
            attachment.contentBase64,
            isoTimestamp(NOW),
          ],
        );
      }
    }

    for (const conflict of CONFLICTS) {
      await client.query(
        `
          insert into availability_conflict (
            id, status, conflict_type, request_id, reservation_id, notes,
            created_by, resolved_by, created_at, resolved_at, metadata
          ) values (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11::jsonb
          )
          on conflict (id) do update
          set
            status = excluded.status,
            conflict_type = excluded.conflict_type,
            request_id = excluded.request_id,
            reservation_id = excluded.reservation_id,
            notes = excluded.notes,
            created_by = excluded.created_by,
            resolved_by = excluded.resolved_by,
            created_at = excluded.created_at,
            resolved_at = excluded.resolved_at,
            metadata = excluded.metadata
        `,
        [
          conflict.id,
          conflict.status,
          conflict.conflictType,
          conflict.requestId,
          conflict.reservationId,
          conflict.notes,
          conflict.createdBy,
          null,
          isoTimestamp(NOW),
          null,
          JSON.stringify(conflict.metadata),
        ],
      );
    }

    for (const email of OUTBOX) {
      await client.query(
        `
          insert into outbound_email (
            id, event_type, linked_entity_type, linked_entity_id, idempotency_key, status, payload, created_at, updated_at
          ) values (
            $1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9
          )
          on conflict (idempotency_key) do update
          set
            status = excluded.status,
            payload = excluded.payload,
            updated_at = excluded.updated_at
        `,
        [
          email.id,
          email.eventType,
          "booking_request",
          email.linkedEntityId,
          email.idempotencyKey,
          email.status,
          JSON.stringify(email.payload),
          isoTimestamp(addDays(NOW, -1)),
          isoTimestamp(NOW),
        ],
      );
    }

    await client.query("commit");

    console.log("Seed operativo aplicado.");
    console.log(`Reservas seed: ${RESERVATIONS.length}`);
    console.log(`Solicitudes seed: ${BOOKING_REQUESTS.length}`);
    console.log(`Conflictos seed: ${CONFLICTS.length}`);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
