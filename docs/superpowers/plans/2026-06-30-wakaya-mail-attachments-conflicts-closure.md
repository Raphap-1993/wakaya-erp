# Wakaya Mail, Attachments, and Conflict Closure Implementation Plan

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Indice de documentacion](../../README.md)
- Siguiente: [Indice de documentacion](../../README.md)
<!-- nav-guided:end -->


> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the last operational gap of the Wakaya MVP so public booking requests send the initial transactional email, keep a durable inbox thread with attachments, allow back office replies from the ERP, and surface date conflicts before conversion or assignment.

**Architecture:** Keep `wakaya-erp` as the single repo and add the missing operational backbone in three slices with disjoint ownership: outbound delivery plus thread bootstrap, inbound Zoho sync plus attachment persistence and reply, and conflict creation plus back office visibility. Persist mail truth in PostgreSQL via new `message_thread`, `message_item`, and `message_attachment` tables, while keeping `outbound_email` as the transactional outbox and `availability_conflict` as the explicit alert surface.

**Tech Stack:** Next.js App Router, TypeScript, Zod, PostgreSQL (`pg`), Vitest, CSS Modules.

---

### Task 1: Send the initial Resend email for real and bootstrap the local thread key

**Files:**
- Modify: `db/migrations/001_hybrid_reservations.sql`
- Create: `db/migrations/002_mail_threads_and_conflicts.sql`
- Modify: `src/lib/mail/types.ts`
- Create: `src/lib/mail/resend-client.test.ts`
- Modify: `src/lib/mail/resend-client.ts`
- Modify: `src/lib/mail/email-outbox.test.ts`
- Modify: `src/lib/mail/email-outbox.ts`
- Modify: `src/lib/reservations/types.ts`
- Modify: `src/lib/reservations/repository.ts`
- Modify: `src/lib/reservations/store.ts`
- Modify: `src/lib/reservations/postgres-repository.ts`
- Modify: `src/app/api/public/booking-requests/route.test.ts`
- Modify: `src/app/api/public/booking-requests/route.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/mail/resend-client.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

describe("sendTransactionalEmail", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    process.env.RESEND_API_KEY = "re_test";
  });

  it("sends attachments and thread headers to Resend", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "email_123" }),
    });

    const { sendTransactionalEmail } = await import("./resend-client");
    const result = await sendTransactionalEmail({
      to: ["ada@example.com"],
      subject: "Solicitud WR-2026-0001",
      html: "<p>Hola</p>",
      text: "Hola",
      replyTo: "reservas@wakayaecolodge.com",
      idempotencyKey: "booking-request:WR-2026-0001:initial-email",
      threadKey: "booking-request:WR-2026-0001",
      attachments: [
        {
          filename: "transfer-proof.pdf",
          content: "ZmFrZQ==",
          contentType: "application/pdf",
        },
      ],
    });

    expect(result).toMatchObject({ status: "sent", providerMessageId: "email_123" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[1]?.body).toContain("transfer-proof.pdf");
    expect(fetchMock.mock.calls[0]?.[1]?.body).toContain("booking-request:WR-2026-0001");
  });
});

// src/app/api/public/booking-requests/route.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const queueOutboundEmailMock = vi.fn();
const sendTransactionalEmailMock = vi.fn();

vi.mock("@/lib/mail/email-outbox", async () => {
  const actual = await vi.importActual<typeof import("@/lib/mail/email-outbox")>("@/lib/mail/email-outbox");
  return {
    ...actual,
    queueOutboundEmail: queueOutboundEmailMock,
  };
});

vi.mock("@/lib/mail/resend-client", () => ({
  sendTransactionalEmail: sendTransactionalEmailMock,
}));

describe("POST /api/public/booking-requests", () => {
  beforeEach(() => {
    vi.resetModules();
    queueOutboundEmailMock.mockReset();
    sendTransactionalEmailMock.mockReset();
    queueOutboundEmailMock.mockResolvedValue({ status: "sent", providerMessageId: "email_123" });
    sendTransactionalEmailMock.mockResolvedValue({ status: "sent", providerMessageId: "email_123" });
  });

  it("creates the booking request and sends the initial transactional email", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/public/booking-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          guestName: "Ada Lovelace",
          guestEmail: "ada@example.com",
          requestedCheckIn: "2026-07-10",
          requestedCheckOut: "2026-07-12",
          requestedGuests: 2,
        }),
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      bookingRequest: {
        threadKey: expect.stringMatching(/^booking-request:WR-\d{4}-\d{4}$/),
      },
      email: {
        status: "sent",
        providerMessageId: "email_123",
      },
    });
    expect(sendTransactionalEmailMock).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:
```bash
./node_modules/.bin/vitest run src/lib/mail/resend-client.test.ts src/app/api/public/booking-requests/route.test.ts
```
Expected: FAIL because attachments/thread bootstrap/provider response are not implemented yet.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/lib/mail/types.ts
export interface MailAttachmentInput {
  filename: string;
  content: string;
  contentType: string;
}

export interface OutboundEmailMessage {
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo: string;
  idempotencyKey: string;
  threadKey: string;
  attachments?: MailAttachmentInput[];
}

// src/lib/reservations/types.ts
export interface BookingRequest {
  // ...
  threadId: string | null;
  threadKey: string;
  // ...
}

// src/lib/mail/resend-client.ts
export async function sendTransactionalEmail(message: OutboundEmailMessage) {
  // send through Resend and return the provider message id for later thread correlation
}

// src/app/api/public/booking-requests/route.ts
const { bookingRequest } = await reservationStore.createBookingRequest(parsed);
const message = buildInitialTransferEmail({ ... });
const email = await sendTransactionalEmail(message);
await queueOutboundEmail({
  eventType: "booking_request.initial_transfer_instructions",
  linkedEntityType: "booking_request",
  linkedEntityId: bookingRequest.id,
  message,
  delivery: email,
});
return jsonResponse({ bookingRequest, email }, 201);
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:
```bash
./node_modules/.bin/vitest run src/lib/mail/resend-client.test.ts src/app/api/public/booking-requests/route.test.ts
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add db/migrations/001_hybrid_reservations.sql db/migrations/002_mail_threads_and_conflicts.sql src/lib/mail/types.ts src/lib/mail/resend-client.test.ts src/lib/mail/resend-client.ts src/lib/mail/email-outbox.test.ts src/lib/mail/email-outbox.ts src/lib/reservations/types.ts src/lib/reservations/repository.ts src/lib/reservations/store.ts src/lib/reservations/postgres-repository.ts src/app/api/public/booking-requests/route.test.ts src/app/api/public/booking-requests/route.ts
git commit -m "feat: deliver booking request emails with thread keys"
```

### Task 2: Persist Zoho threads, messages, and attachments and allow back office replies

**Files:**
- Modify: `src/lib/mail/types.ts`
- Create: `src/lib/mail/zoho-client.test.ts`
- Modify: `src/lib/mail/zoho-client.ts`
- Modify: `src/lib/mail/thread-sync.test.ts`
- Modify: `src/lib/mail/thread-sync.ts`
- Modify: `src/lib/reservations/types.ts`
- Modify: `src/lib/reservations/repository.ts`
- Modify: `src/lib/reservations/store.ts`
- Modify: `src/lib/reservations/postgres-repository.ts`
- Create: `src/app/api/booking-requests/[id]/sync/route.test.ts`
- Modify: `src/app/api/booking-requests/[id]/sync/route.ts`
- Create: `src/app/api/booking-requests/[id]/reply/route.test.ts`
- Create: `src/app/api/booking-requests/[id]/reply/route.ts`
- Modify: `src/app/api/booking-requests/[id]/route.ts`
- Modify: `src/app/admin/reservations/requests/page.test.tsx`
- Modify: `src/app/admin/reservations/requests/booking-request-detail-panel.tsx`
- Modify: `src/app/admin/reservations/requests/booking-requests-monitor.tsx`
- Modify: `src/app/admin/reservations/reservations.module.css`

- [ ] **Step 1: Write the failing tests**

```ts
// src/app/api/booking-requests/[id]/sync/route.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const requirePermissionMock = vi.fn();
const listThreadMessagesMock = vi.fn();

vi.mock("@/middleware/authn", () => ({
  requirePermission: requirePermissionMock,
}));

vi.mock("@/lib/mail/zoho-client", () => ({
  listThreadMessages: listThreadMessagesMock,
}));

describe("POST /api/booking-requests/[id]/sync", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "user-reception-1",
    });
    listThreadMessagesMock.mockResolvedValue([
      {
        messageId: "zoho-msg-1",
        threadId: "zoho-thread-1",
        fromAddress: "ada@example.com",
        subject: "Comprobante WR-2026-0001",
        receivedTime: "2026-07-01T10:00:00.000Z",
        summary: "Adjunto comprobante",
        attachments: [
          {
            attachmentId: "att-1",
            fileName: "proof.pdf",
            contentType: "application/pdf",
            size: 2048,
            contentBase64: "ZmFrZQ==",
          },
        ],
      },
    ]);
  });

  it("persists inbound messages and supported attachments for the request thread", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/booking-requests/request-1/sync", {
        method: "POST",
        headers: { authorization: "Bearer valid" },
      }),
      { params: Promise.resolve({ id: "request-1" }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      thread: {
        provider: "zoho_mail",
        messageCount: 1,
      },
      attachments: [
        {
          fileName: "proof.pdf",
          isSupported: true,
        },
      ],
    });
  });
});

// src/app/api/booking-requests/[id]/reply/route.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const requirePermissionMock = vi.fn();
const sendThreadReplyMock = vi.fn();

vi.mock("@/middleware/authn", () => ({
  requirePermission: requirePermissionMock,
}));

vi.mock("@/lib/mail/zoho-client", () => ({
  sendThreadReply: sendThreadReplyMock,
}));

describe("POST /api/booking-requests/[id]/reply", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "user-reception-1",
    });
    sendThreadReplyMock.mockResolvedValue({
      providerMessageId: "zoho-reply-1",
      threadId: "zoho-thread-1",
      sentAt: "2026-07-01T12:00:00.000Z",
    });
  });

  it("sends a reply from the same operational thread", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/booking-requests/request-1/reply", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer valid" },
        body: JSON.stringify({
          bodyText: "Gracias. Validaremos tu transferencia hoy.",
        }),
      }),
      { params: Promise.resolve({ id: "request-1" }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      reply: {
        providerMessageId: "zoho-reply-1",
      },
    });
  });
});

// src/app/admin/reservations/requests/page.test.tsx
expect(html).toContain("Adjuntos");
expect(html).toContain("Responder al cliente");
expect(html).toContain("Sincronizar hilo");
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:
```bash
./node_modules/.bin/vitest run src/app/api/booking-requests/[id]/sync/route.test.ts src/app/api/booking-requests/[id]/reply/route.test.ts src/app/admin/reservations/requests/page.test.tsx src/lib/mail/thread-sync.test.ts
```
Expected: FAIL because persistent sync, attachment ingestion, and reply APIs do not exist yet.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/lib/reservations/types.ts
export interface MessageThread { /* provider, providerThreadId, threadKey, messageCount, syncStatus */ }
export interface MessageItem { /* direction, providerMessageId, bodyText, receivedAt, sentAt */ }
export interface MessageAttachment { /* fileName, contentType, fileSizeBytes, fileHash, isSupported */ }

// src/lib/mail/zoho-client.ts
export async function listThreadMessages(providerThreadId: string) {
  // normalize Zoho payload to internal message shape, including attachment metadata/content
}

export async function sendThreadReply(input: {
  providerMessageId: string;
  bodyText: string;
  attachments?: MailAttachmentInput[];
}) {
  // POST reply via Zoho
}

// src/lib/reservations/repository.ts
export interface ReservationServiceLike {
  // ...
  syncBookingRequestThread(id: string): Promise<SyncBookingRequestThreadResult>;
  replyToBookingRequestThread(id: string, input: BookingRequestReplyInput): Promise<BookingRequestReplyResult>;
}

// src/app/api/booking-requests/[id]/sync/route.ts
const result = await reservationStore.syncBookingRequestThread(await readId(context));
return jsonResponse(result, 200);

// src/app/api/booking-requests/[id]/reply/route.ts
const payload = replySchema.parse(await readJsonBody(request));
const result = await reservationStore.replyToBookingRequestThread(await readId(context), {
  actorId: auth.subject ?? "system",
  ...payload,
});
return jsonResponse(result, 200);
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:
```bash
./node_modules/.bin/vitest run src/app/api/booking-requests/[id]/sync/route.test.ts src/app/api/booking-requests/[id]/reply/route.test.ts src/app/admin/reservations/requests/page.test.tsx src/lib/mail/thread-sync.test.ts src/lib/mail/zoho-client.test.ts
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/mail/types.ts src/lib/mail/zoho-client.test.ts src/lib/mail/zoho-client.ts src/lib/mail/thread-sync.test.ts src/lib/mail/thread-sync.ts src/lib/reservations/types.ts src/lib/reservations/repository.ts src/lib/reservations/store.ts src/lib/reservations/postgres-repository.ts src/app/api/booking-requests/[id]/sync/route.test.ts src/app/api/booking-requests/[id]/sync/route.ts src/app/api/booking-requests/[id]/reply/route.test.ts src/app/api/booking-requests/[id]/reply/route.ts src/app/api/booking-requests/[id]/route.ts src/app/admin/reservations/requests/page.test.tsx src/app/admin/reservations/requests/booking-request-detail-panel.tsx src/app/admin/reservations/requests/booking-requests-monitor.tsx src/app/admin/reservations/reservations.module.css
git commit -m "feat: add booking request thread sync and replies"
```

### Task 3: Create and surface availability conflicts for request conversion and assignment continuation

**Files:**
- Create: `src/lib/reservations/conflicts.test.ts`
- Create: `src/lib/reservations/conflicts.ts`
- Modify: `src/lib/reservations/types.ts`
- Modify: `src/lib/reservations/repository.ts`
- Modify: `src/lib/reservations/http.ts`
- Modify: `src/lib/reservations/store.ts`
- Modify: `src/lib/reservations/postgres-repository.ts`
- Modify: `src/app/api/booking-requests/[id]/confirm-transfer/route.test.ts`
- Modify: `src/app/api/booking-requests/[id]/confirm-transfer/route.ts`
- Create: `src/app/api/booking-requests/[id]/conflicts/route.test.ts`
- Create: `src/app/api/booking-requests/[id]/conflicts/route.ts`
- Modify: `src/app/admin/reservations/requests/page.test.tsx`
- Modify: `src/app/admin/reservations/requests/booking-request-detail-panel.tsx`
- Modify: `src/app/admin/reservations/requests/booking-requests-monitor.tsx`

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/reservations/conflicts.test.ts
import { describe, expect, it } from "vitest";
import { detectRequestConflicts } from "./conflicts";

describe("request conflicts", () => {
  it("detects overlap between a web request and an existing confirmed reservation", () => {
    const result = detectRequestConflicts(
      {
        requestedCheckIn: "2026-07-10",
        requestedCheckOut: "2026-07-12",
      },
      [
        {
          reservationId: "reservation-1",
          bungalowId: "bungalow-matrimonial",
          startDate: "2026-07-11",
          endDate: "2026-07-13",
        },
      ],
    );

    expect(result).toMatchObject({
      hasConflict: true,
      conflictType: "date_overlap",
    });
  });
});

// src/app/api/booking-requests/[id]/confirm-transfer/route.test.ts
it("returns 409 and persists a visible conflict when the request overlaps an operational stay", async () => {
  const { POST } = await loadRoute();
  const response = await POST(
    new Request("http://localhost/api/booking-requests/request-1/confirm-transfer", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer valid" },
      body: JSON.stringify({ actorId: "user-reception-1", reason: "proof validated" }),
    }),
    { params: Promise.resolve({ id: "request-1" }) },
  );

  expect(response.status).toBe(409);
  await expect(response.json()).resolves.toMatchObject({
    error: "occupancy_conflict",
    conflict: {
      status: "open",
      conflictType: "date_overlap",
    },
  });
});

// src/app/admin/reservations/requests/page.test.tsx
expect(html).toContain("Conflictos activos");
expect(html).toContain("Cruce de fechas");
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:
```bash
./node_modules/.bin/vitest run src/lib/reservations/conflicts.test.ts src/app/api/booking-requests/[id]/confirm-transfer/route.test.ts src/app/admin/reservations/requests/page.test.tsx
```
Expected: FAIL because conflict records and UI surface do not exist yet.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/lib/reservations/types.ts
export interface AvailabilityConflict {
  id: string;
  status: "open" | "resolved";
  conflictType: "date_overlap" | "assignment_overlap";
  requestId: string | null;
  reservationId: string | null;
  notes: string | null;
  createdBy: string | null;
  resolvedBy: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

// src/lib/reservations/postgres-repository.ts
// during confirmBookingRequestTransfer:
// 1. detect overlap against existing confirmed occupancy / reservations
// 2. insert availability_conflict if blocked
// 3. throw occupancy_conflict without creating reservation

// src/app/api/booking-requests/[id]/confirm-transfer/route.ts
// include `conflict` payload when the service returns a typed occupancy conflict result
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:
```bash
./node_modules/.bin/vitest run src/lib/reservations/conflicts.test.ts src/app/api/booking-requests/[id]/confirm-transfer/route.test.ts src/app/admin/reservations/requests/page.test.tsx
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/reservations/conflicts.test.ts src/lib/reservations/conflicts.ts src/lib/reservations/types.ts src/lib/reservations/repository.ts src/lib/reservations/http.ts src/lib/reservations/store.ts src/lib/reservations/postgres-repository.ts src/app/api/booking-requests/[id]/confirm-transfer/route.test.ts src/app/api/booking-requests/[id]/confirm-transfer/route.ts src/app/api/booking-requests/[id]/conflicts/route.test.ts src/app/api/booking-requests/[id]/conflicts/route.ts src/app/admin/reservations/requests/page.test.tsx src/app/admin/reservations/requests/booking-request-detail-panel.tsx src/app/admin/reservations/requests/booking-requests-monitor.tsx
git commit -m "feat: surface booking request conflicts"
```

### Task 4: Verify the integrated manual-payment MVP and document the operational setup

**Files:**
- Modify: `src/app/admin/reservations/requests/page.test.tsx`
- Modify: `docs/superpowers/specs/2026-06-30-wakaya-mvp-cut-hybrid-reservations-public-site-design.md`
- Create: `docs/fase-8-operacion/08.10-wakaya-reservations-mail-runbook.md`
- Create: `docs/fase-7-deploy/07.12-wakaya-reservations-env-checklist.md`

- [ ] **Step 1: Extend the failing verification test/doc checklist**

```ts
// src/app/admin/reservations/requests/page.test.tsx
it("renders thread, attachments, reply, conflict alert, and confirm-transfer actions together", async () => {
  const html = renderToStaticMarkup(await RequestsAdminPage({ searchParams: {} }));

  expect(html).toContain("Hilo del cliente");
  expect(html).toContain("Adjuntos");
  expect(html).toContain("Responder al cliente");
  expect(html).toContain("Conflictos activos");
  expect(html).toContain("Confirmar transferencia");
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:
```bash
./node_modules/.bin/vitest run src/app/admin/reservations/requests/page.test.tsx
```
Expected: FAIL until the integrated back office surface is complete.

- [ ] **Step 3: Write the minimal implementation and runbooks**

```md
<!-- docs/fase-8-operacion/08.10-wakaya-reservations-mail-runbook.md -->
# Runbook de reservas por correo

- Variables requeridas: `DATABASE_URL`, `RESEND_API_KEY`, `ZOHO_MAIL_ACCOUNT_ID`, `ZOHO_MAIL_ACCESS_TOKEN`
- Alias canonico: `reservas@wakayaecolodge.com`
- Flujo: request -> email inicial -> reply/adjunto -> sync -> confirmacion -> reserva -> asignacion
- Riesgos residuales: dependencia de tokens Zoho, falta de webhook inbound, reintentos manuales de outbox
```

- [ ] **Step 4: Run the integrated verification suite**

Run:
```bash
./node_modules/.bin/vitest run src/lib/mail/resend-client.test.ts src/lib/mail/zoho-client.test.ts src/lib/mail/thread-sync.test.ts src/lib/reservations/conflicts.test.ts src/app/api/public/booking-requests/route.test.ts src/app/api/booking-requests/[id]/sync/route.test.ts src/app/api/booking-requests/[id]/reply/route.test.ts src/app/api/booking-requests/[id]/confirm-transfer/route.test.ts src/app/admin/reservations/requests/page.test.tsx
./node_modules/.bin/tsc --noEmit
npm run build
```
Expected: PASS. Build may still print the known OIDC configuration warnings, but it must succeed.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/reservations/requests/page.test.tsx docs/superpowers/specs/2026-06-30-wakaya-mvp-cut-hybrid-reservations-public-site-design.md docs/fase-8-operacion/08.10-wakaya-reservations-mail-runbook.md docs/fase-7-deploy/07.12-wakaya-reservations-env-checklist.md
git commit -m "docs: add wakaya reservations mail runbook"
```
