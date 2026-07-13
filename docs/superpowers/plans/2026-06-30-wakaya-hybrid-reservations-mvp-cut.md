# Wakaya Hybrid Reservations MVP Cut Implementation Plan

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Indice de documentacion](../../README.md)
- Siguiente: [Indice de documentacion](../../README.md)
<!-- nav-guided:end -->


> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current reservation-centric demo flow with a real `booking_request -> review -> confirm -> reservation` operational path backed by PostgreSQL, hybrid mail adapters, and public forms aligned to that flow.

**Architecture:** Keep `wakaya-erp` as the single implementation repo and split the work into five slices: domain contracts, PostgreSQL persistence, public intake plus transactional outbound mail, back office review plus conversion, and public-site continuity with home-aligned forms and SEO. Use a small repository-and-service layer instead of wiring route handlers directly to the current SQLite-seeded store so the booking-request flow and the existing reservation flow can coexist during the cut-over. During the first two tasks, prefer additive compatibility over destructive contract removal: introduce `booking_request` and the new helpers first, then remove legacy reservation-only members only after the store and its consumers are migrated.

**Tech Stack:** Next.js App Router, TypeScript, Zod, `pg`, React Server Components, CSS Modules, Vitest.

---

### Task 1: Replace the reservation-only domain contracts with booking-request-aware contracts

**Files:**
- Modify: `src/lib/reservations/types.ts`
- Modify: `src/lib/reservations/state-machine.ts`
- Modify: `src/lib/reservations/schemas.ts`
- Modify: `src/lib/reservations/http.ts`
- Create: `src/lib/reservations/state-machine.test.ts`
- Create: `src/lib/reservations/booking-request-schemas.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/reservations/state-machine.test.ts
import { describe, expect, it } from "vitest";
import {
  canPerformRequestAction,
  nextBookingRequestStatus,
  nextReservationStatus,
} from "@/lib/reservations/state-machine";

describe("booking request state machine", () => {
  it("moves a newly created request into awaiting transfer after the initial email is sent", () => {
    expect(nextBookingRequestStatus("request_received", "mark_initial_email_sent")).toBe("awaiting_transfer");
  });

  it("moves a proof-received request into converted once transfer is confirmed", () => {
    expect(nextBookingRequestStatus("proof_received", "confirm_transfer")).toBe("converted_to_reservation");
  });

  it("rejects invalid booking-request transitions", () => {
    expect(() => nextBookingRequestStatus("request_received", "confirm_transfer")).toThrow("invalid_transition");
  });

  it("keeps ota reservations on the confirmed -> assigned -> checked_in path", () => {
    expect(nextReservationStatus("confirmed", "assign")).toBe("assigned");
    expect(nextReservationStatus("assigned", "check_in")).toBe("checked_in");
  });

  it("exposes back office actions for booking requests", () => {
    expect(canPerformRequestAction("proof_received", "confirm_transfer")).toBe(true);
    expect(canPerformRequestAction("cancelled", "confirm_transfer")).toBe(false);
  });
});

// src/lib/reservations/booking-request-schemas.test.ts
import { describe, expect, it } from "vitest";
import { bookingRequestCreateSchema } from "@/lib/reservations/schemas";

describe("booking request schema", () => {
  it("accepts the public request payload without reservation-only fields", () => {
    const parsed = bookingRequestCreateSchema.parse({
      guestName: "Ada Lovelace",
      guestEmail: "ada@example.com",
      guestPhone: "+51987654321",
      requestedCheckIn: "2026-07-10",
      requestedCheckOut: "2026-07-12",
      requestedGuests: 2,
      requestedBungalowType: "bungalow-matrimonial",
    });

    expect(parsed.requestedBungalowType).toBe("bungalow-matrimonial");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:
```bash
npm test -- src/lib/reservations/state-machine.test.ts src/lib/reservations/booking-request-schemas.test.ts
```
Expected: FAIL because the booking-request state machine, actions, and schema do not exist yet.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/lib/reservations/types.ts
export type ReservationChannel = "web" | "ota";

export type BookingRequestStatus =
  | "request_received"
  | "awaiting_initial_email"
  | "awaiting_transfer"
  | "proof_received"
  | "needs_attention"
  | "converted_to_reservation"
  | "cancelled";

export type BookingRequestAction =
  | "mark_initial_email_sent"
  | "mark_proof_received"
  | "confirm_transfer"
  | "mark_needs_attention"
  | "cancel";

// Keep the legacy reservation members temporarily for compatibility with the
// current store/routes/UI. Task 2+ will migrate consumers before removing them.
export type ReservationStatus =
  | "pending_review"
  | "ota_imported_confirmed"
  | "confirmed"
  | "assigned"
  | "checked_in"
  | "checked_out"
  | "paid"
  | "cancelled"
  | "no_show";

export interface BookingRequest {
  id: string;
  publicRef: string;
  status: BookingRequestStatus;
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  requestedCheckIn: string;
  requestedCheckOut: string;
  requestedGuests: number;
  requestedBungalowType: string | null;
  sourceChannel: "web_public";
  threadId: string | null;
  notes: string | null;
  lastMessageAt: string | null;
  syncStatus: "pending" | "synced" | "degraded";
  createdAt: string;
  updatedAt: string;
}

export interface Reservation {
  id: string;
  number: string;
  channel: ReservationChannel;
  status: ReservationStatus;
  paymentStatus?: "pending" | "partial" | "paid";
  amountTotalCents?: number;
  amountPaidCents?: number;
  currencyCode?: "PEN";
  bungalowId: string | null;
  responsibleId: string | null;
  startDate: string;
  endDate: string;
  updatedAt: string;
  sourceRequestId?: string | null;
}

// src/lib/reservations/state-machine.ts
const REQUEST_TRANSITIONS = {
  request_received: { mark_initial_email_sent: "awaiting_transfer", cancel: "cancelled" },
  awaiting_initial_email: { mark_initial_email_sent: "awaiting_transfer", cancel: "cancelled" },
  awaiting_transfer: { mark_proof_received: "proof_received", mark_needs_attention: "needs_attention", cancel: "cancelled" },
  proof_received: { confirm_transfer: "converted_to_reservation", mark_needs_attention: "needs_attention", cancel: "cancelled" },
  needs_attention: { mark_proof_received: "proof_received", cancel: "cancelled" },
  converted_to_reservation: {},
  cancelled: {},
} as const;

export function nextBookingRequestStatus(current: BookingRequestStatus, action: BookingRequestAction): BookingRequestStatus {
  const next = REQUEST_TRANSITIONS[current]?.[action];
  if (!next) throw new Error("invalid_transition");
  return next;
}

export function canPerformRequestAction(current: BookingRequestStatus, action: BookingRequestAction): boolean {
  return Boolean(REQUEST_TRANSITIONS[current]?.[action]);
}

const RESERVATION_TRANSITIONS = {
  pending_review: { confirm: "confirmed", cancel: "cancelled" },
  ota_imported_confirmed: { assign: "assigned", mark_no_show: "no_show", cancel: "cancelled" },
  confirmed: { assign: "assigned", cancel: "cancelled", mark_no_show: "no_show" },
  assigned: { check_in: "checked_in", cancel: "cancelled", mark_no_show: "no_show" },
  checked_in: { check_out: "checked_out", cancel: "cancelled" },
  checked_out: { mark_paid: "paid" },
  paid: {},
  cancelled: {},
  no_show: {},
} as const;

// src/lib/reservations/schemas.ts
export const bookingRequestCreateSchema = z.object({
  guestName: z.string().trim().min(1, "required"),
  guestEmail: z.email(),
  guestPhone: z.string().trim().min(7).optional(),
  requestedCheckIn: isoDate,
  requestedCheckOut: isoDate,
  requestedGuests: z.coerce.number().int().positive(),
  requestedBungalowType: z.string().trim().min(1).nullable().optional(),
  notes: z.string().trim().max(1000).optional(),
});

// src/lib/reservations/http.ts
case "booking_request_not_found":
  return { body: { error: "booking_request_not_found" }, status: 404 };
case "initial_email_failed":
  return { body: { error: "initial_email_failed" }, status: 502 };
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:
```bash
npm test -- src/lib/reservations/state-machine.test.ts src/lib/reservations/booking-request-schemas.test.ts
```
Expected: PASS with the new booking-request contracts in place.

- [ ] **Step 5: Commit**

```bash
git add src/lib/reservations/types.ts src/lib/reservations/state-machine.ts src/lib/reservations/schemas.ts src/lib/reservations/http.ts src/lib/reservations/state-machine.test.ts src/lib/reservations/booking-request-schemas.test.ts
git commit -m "feat: add booking request domain contracts"
```

### Task 2: Introduce PostgreSQL persistence and remove SQLite-backed operational behavior

**Files:**
- Modify: `package.json`
- Create: `db/migrations/001_hybrid_reservations.sql`
- Modify: `scripts/migrate.js`
- Create: `src/lib/reservations/postgres.ts`
- Create: `src/lib/reservations/repository.ts`
- Create: `src/lib/reservations/postgres-repository.ts`
- Create: `src/lib/reservations/service.ts`
- Modify: `src/lib/reservations/store.ts`
- Delete: `src/lib/reservations/sqlite-persistence.ts`
- Modify: `src/lib/reservations/persistence.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/reservations/persistence.test.ts
import { describe, expect, it } from "vitest";
import { buildReservationService } from "@/lib/reservations/service";

describe("reservation service boot", () => {
  it("fails fast when the operational database url is missing", async () => {
    const restore = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    try {
      expect(() => buildReservationService()).toThrow("database_url_missing");
    } finally {
      if (restore) process.env.DATABASE_URL = restore;
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npm test -- src/lib/reservations/persistence.test.ts
```
Expected: FAIL because the PostgreSQL-backed service and boot guard do not exist yet.

- [ ] **Step 3: Write the minimal implementation**

```sql
-- db/migrations/001_hybrid_reservations.sql
create table if not exists booking_request (
  id uuid primary key,
  public_ref text not null unique,
  status text not null,
  guest_name text not null,
  guest_email text not null,
  guest_phone text,
  requested_check_in date not null,
  requested_check_out date not null,
  requested_guests integer not null,
  requested_bungalow_type text,
  source_channel text not null default 'web_public',
  thread_id uuid,
  notes text,
  last_message_at timestamptz,
  sync_status text not null default 'pending',
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists reservation (
  id uuid primary key,
  number text not null unique,
  channel text not null,
  status text not null,
  source_request_id uuid unique,
  bungalow_id text,
  responsible_id text,
  start_date date not null,
  end_date date not null,
  amount_total_cents integer,
  amount_paid_cents integer,
  currency_code text,
  updated_at timestamptz not null
);

create table if not exists outbound_email (
  id uuid primary key,
  event_type text not null,
  linked_entity_type text not null,
  linked_entity_id uuid not null,
  idempotency_key text not null unique,
  status text not null,
  payload jsonb not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);
```

```ts
// src/lib/reservations/postgres.ts
import { Pool } from "pg";

let pool: Pool | null = null;

export function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("database_url_missing");
  pool ??= new Pool({ connectionString });
  return pool;
}

// src/lib/reservations/service.ts
import { PostgresReservationRepository } from "@/lib/reservations/postgres-repository";

export function buildReservationService() {
  return new PostgresReservationRepository(getPool());
}

// src/lib/reservations/store.ts
import { buildReservationService } from "@/lib/reservations/service";

export const reservationStore = buildReservationService();
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:
```bash
npm test -- src/lib/reservations/persistence.test.ts
npm run typecheck
```
Expected: PASS, and the codebase no longer compiles against the old SQLite persistence path.

- [ ] **Step 5: Commit**

```bash
git add package.json db/migrations/001_hybrid_reservations.sql scripts/migrate.js src/lib/reservations/postgres.ts src/lib/reservations/repository.ts src/lib/reservations/postgres-repository.ts src/lib/reservations/service.ts src/lib/reservations/store.ts src/lib/reservations/persistence.test.ts
git rm src/lib/reservations/sqlite-persistence.ts
git commit -m "feat: switch reservations flow to postgres repository"
```

### Task 3: Add public booking-request intake and transactional outbound mail

**Files:**
- Create: `src/lib/mail/types.ts`
- Create: `src/lib/mail/resend-client.ts`
- Create: `src/lib/mail/email-outbox.ts`
- Create: `src/lib/mail/email-outbox.test.ts`
- Create: `src/app/api/public/booking-requests/route.ts`
- Create: `src/app/api/public/booking-requests/route.test.ts`
- Modify: `src/app/api/public/reservations/route.ts`
- Modify: `src/app/api/public/reservations/route.test.ts`
- Modify: `src/lib/reservations/numbering.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/app/api/public/booking-requests/route.test.ts
import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

describe("POST /api/public/booking-requests", () => {
  it("creates a booking request and queues the initial transfer email", async () => {
    const response = await POST(
      new Request("http://localhost/api/public/booking-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          guestName: "Ada Lovelace",
          guestEmail: "ada@example.com",
          guestPhone: "+51987654321",
          requestedCheckIn: "2026-07-10",
          requestedCheckOut: "2026-07-12",
          requestedGuests: 2,
          requestedBungalowType: "bungalow-matrimonial",
        }),
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      bookingRequest: { status: "awaiting_initial_email" },
      email: { status: "queued" },
    });
  });
});

// src/lib/mail/email-outbox.test.ts
import { describe, expect, it } from "vitest";
import { buildInitialTransferEmail } from "@/lib/mail/email-outbox";

describe("initial transfer email", () => {
  it("uses reservas@wakayaecolodge.com as reply context", () => {
    const email = buildInitialTransferEmail({
      guestName: "Ada Lovelace",
      guestEmail: "ada@example.com",
      publicRef: "WR-2026-0001",
      requestedCheckIn: "2026-07-10",
      requestedCheckOut: "2026-07-12",
    });

    expect(email.to).toEqual(["ada@example.com"]);
    expect(email.replyTo).toBe("reservas@wakayaecolodge.com");
    expect(email.subject).toContain("WR-2026-0001");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:
```bash
npm test -- src/app/api/public/booking-requests/route.test.ts src/lib/mail/email-outbox.test.ts
```
Expected: FAIL because the booking-request route and email builder do not exist yet.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/lib/mail/types.ts
export interface OutboundEmailMessage {
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo: string;
  idempotencyKey: string;
}

// src/lib/mail/email-outbox.ts
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

// src/lib/mail/resend-client.ts
export async function sendTransactionalEmail(message: OutboundEmailMessage) {
  if (!process.env.RESEND_API_KEY) {
    return { status: "queued_without_provider" as const };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "reservas@wakayaecolodge.com",
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      reply_to: message.replyTo,
    }),
  });

  if (!response.ok) throw new Error("initial_email_failed");
  return { status: "sent" as const };
}

// src/app/api/public/booking-requests/route.ts
const parsed = bookingRequestCreateSchema.parse(await readJsonBody(request));
const result = await reservationStore.createBookingRequest(parsed);
const email = buildInitialTransferEmail({
  guestName: result.bookingRequest.guestName,
  guestEmail: result.bookingRequest.guestEmail,
  publicRef: result.bookingRequest.publicRef,
  requestedCheckIn: result.bookingRequest.requestedCheckIn,
  requestedCheckOut: result.bookingRequest.requestedCheckOut,
});
return jsonResponse({ bookingRequest: result.bookingRequest, email: { status: "queued" } }, 201);
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:
```bash
npm test -- src/app/api/public/booking-requests/route.test.ts src/lib/mail/email-outbox.test.ts
```
Expected: PASS with a real public intake route and initial outbound email payload.

- [ ] **Step 5: Commit**

```bash
git add src/lib/mail/types.ts src/lib/mail/resend-client.ts src/lib/mail/email-outbox.ts src/lib/mail/email-outbox.test.ts src/app/api/public/booking-requests/route.ts src/app/api/public/booking-requests/route.test.ts src/app/api/public/reservations/route.ts src/app/api/public/reservations/route.test.ts src/lib/reservations/numbering.ts
git commit -m "feat: add public booking request intake"
```

### Task 4: Add Zoho thread synchronization and back office request review plus conversion

**Files:**
- Create: `src/lib/mail/zoho-client.ts`
- Create: `src/lib/mail/thread-sync.ts`
- Create: `src/lib/mail/thread-sync.test.ts`
- Create: `src/app/api/booking-requests/route.ts`
- Create: `src/app/api/booking-requests/[id]/route.ts`
- Create: `src/app/api/booking-requests/[id]/sync/route.ts`
- Create: `src/app/api/booking-requests/[id]/confirm-transfer/route.ts`
- Create: `src/app/api/booking-requests/[id]/sync/route.test.ts`
- Create: `src/app/api/booking-requests/[id]/confirm-transfer/route.test.ts`
- Modify: `src/lib/reservations/http.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/app/api/booking-requests/[id]/confirm-transfer/route.test.ts
import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("POST /api/booking-requests/[id]/confirm-transfer", () => {
  it("converts a proof-received request into a confirmed reservation", async () => {
    const response = await POST(
      new Request("http://localhost/api/booking-requests/request-1/confirm-transfer", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer valid" },
        body: JSON.stringify({ actorId: "user-reception-1", reason: "proof validated" }),
      }),
      { params: Promise.resolve({ id: "request-1" }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      bookingRequest: { status: "converted_to_reservation" },
      reservation: { status: "confirmed", channel: "web" },
    });
  });
});

// src/lib/mail/thread-sync.test.ts
import { describe, expect, it } from "vitest";
import { dedupeProviderMessages } from "@/lib/mail/thread-sync";

describe("thread sync", () => {
  it("deduplicates inbound provider messages by provider id", () => {
    const messages = dedupeProviderMessages([
      { providerMessageId: "m1" },
      { providerMessageId: "m1" },
      { providerMessageId: "m2" },
    ]);

    expect(messages).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:
```bash
npm test -- src/app/api/booking-requests/[id]/confirm-transfer/route.test.ts src/lib/mail/thread-sync.test.ts
```
Expected: FAIL because the booking-request admin API and Zoho sync helpers do not exist yet.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/lib/mail/zoho-client.ts
export async function listThreadMessages(providerThreadId: string) {
  if (!process.env.ZOHO_MAIL_ACCOUNT_ID || !process.env.ZOHO_MAIL_ACCESS_TOKEN) {
    return [];
  }

  const response = await fetch(
    `https://mail.zoho.com/api/accounts/${process.env.ZOHO_MAIL_ACCOUNT_ID}/messages/view?threadId=${providerThreadId}`,
    { headers: { authorization: `Zoho-oauthtoken ${process.env.ZOHO_MAIL_ACCESS_TOKEN}` } },
  );

  if (!response.ok) throw new Error("zoho_sync_failed");
  const json = await response.json();
  return json.data ?? [];
}

// src/lib/mail/thread-sync.ts
export function dedupeProviderMessages<T extends { providerMessageId: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.providerMessageId)) return false;
    seen.add(item.providerMessageId);
    return true;
  });
}

// src/app/api/booking-requests/[id]/confirm-transfer/route.ts
const result = await reservationStore.confirmBookingRequestTransfer(params.id, parsed.actorId, parsed.reason);
return jsonResponse(result, 200);
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:
```bash
npm test -- src/app/api/booking-requests/[id]/confirm-transfer/route.test.ts src/lib/mail/thread-sync.test.ts
```
Expected: PASS with conversion and inbound deduplication behavior implemented.

- [ ] **Step 5: Commit**

```bash
git add src/lib/mail/zoho-client.ts src/lib/mail/thread-sync.ts src/lib/mail/thread-sync.test.ts src/app/api/booking-requests/route.ts src/app/api/booking-requests/[id]/route.ts src/app/api/booking-requests/[id]/sync/route.ts src/app/api/booking-requests/[id]/confirm-transfer/route.ts src/app/api/booking-requests/[id]/sync/route.test.ts src/app/api/booking-requests/[id]/confirm-transfer/route.test.ts src/lib/reservations/http.ts
git commit -m "feat: add booking request review apis"
```

### Task 5: Add back office request review UI and public-form integration

**Files:**
- Create: `src/app/admin/reservations/requests/page.tsx`
- Create: `src/app/admin/reservations/requests/page.test.tsx`
- Create: `src/app/admin/reservations/requests/booking-requests-monitor.tsx`
- Create: `src/app/admin/reservations/requests/booking-request-detail-panel.tsx`
- Modify: `src/app/admin/admin-navigation.ts`
- Modify: `src/app/admin/reservations/reservations.module.css`
- Modify: `src/components/public-site/booking-band.tsx`
- Modify: `src/app/prototype/public-site/contact/page.tsx`
- Modify: `src/app/prototype/public-site/bungalows/[slug]/page.tsx`
- Modify: `src/app/prototype/public-site/internal-route-smoke.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// src/app/admin/reservations/requests/page.test.tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import RequestsAdminPage from "./page";

describe("booking requests admin page", () => {
  it("renders the request inbox with thread and confirm-transfer actions", async () => {
    const html = renderToStaticMarkup(await RequestsAdminPage({ searchParams: {} }));
    expect(html).toContain("Solicitudes web");
    expect(html).toContain("Confirmar transferencia");
    expect(html).toContain("Hilo del cliente");
  });
});

// src/app/prototype/public-site/internal-route-smoke.test.tsx
it("routes the public contact flow to booking requests language", async () => {
  const html = renderToStaticMarkup(<PublicSiteContactPage />);
  expect(html).toContain("solicitud");
  expect(html).toContain("transferencia");
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:
```bash
npm test -- src/app/admin/reservations/requests/page.test.tsx src/app/prototype/public-site/internal-route-smoke.test.tsx
```
Expected: FAIL because the request inbox and booking-request-oriented copy do not exist yet.

- [ ] **Step 3: Write the minimal implementation**

```tsx
// src/app/admin/admin-navigation.ts
export const adminNavigation = [
  { label: "Reservas", href: "/admin/reservations" },
  { label: "Solicitudes web", href: "/admin/reservations/requests" },
];

// src/components/public-site/booking-band.tsx
<form className={styles.bookingForm} action="/prototype/public-site/contact" method="get">
  <input type="hidden" name="requestedCheckIn" value={defaultCheckIn} />
  <input type="hidden" name="requestedCheckOut" value={defaultCheckOut} />
  <input type="hidden" name="requestedGuests" value={defaultGuests} />
  <input type="hidden" name="requestedBungalowType" value={selectedCategory} />
  <button className={styles.primaryButton} type="submit">Solicitar disponibilidad</button>
</form>

// src/app/prototype/public-site/contact/page.tsx
export const metadata = {
  title: "Contacto | Wakaya Ecolodge",
  description: "Solicita disponibilidad y coordina tu estadía en Wakaya Ecolodge.",
};

// Render a server form whose success language says:
// "Tu solicitud fue recibida. Wakaya te escribirá desde reservas@wakayaecolodge.com."
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:
```bash
npm test -- src/app/admin/reservations/requests/page.test.tsx src/app/prototype/public-site/internal-route-smoke.test.tsx
npm run typecheck
```
Expected: PASS with a basic request inbox and public forms using request language.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/reservations/requests/page.tsx src/app/admin/reservations/requests/page.test.tsx src/app/admin/reservations/requests/booking-requests-monitor.tsx src/app/admin/reservations/requests/booking-request-detail-panel.tsx src/app/admin/admin-navigation.ts src/app/admin/reservations/reservations.module.css src/components/public-site/booking-band.tsx src/app/prototype/public-site/contact/page.tsx src/app/prototype/public-site/bungalows/[slug]/page.tsx src/app/prototype/public-site/internal-route-smoke.test.tsx
git commit -m "feat: add booking request back office flow"
```

### Task 6: Preserve the home language across priority public pages and add the SEO baseline

**Files:**
- Modify: `src/app/prototype/public-site/layout.tsx`
- Modify: `src/app/prototype/public-site/page.tsx`
- Modify: `src/app/prototype/public-site/about/page.tsx`
- Modify: `src/app/prototype/public-site/contact/page.tsx`
- Modify: `src/app/prototype/public-site/bungalows/[slug]/page.tsx`
- Modify: `src/components/public-site/page-hero.tsx`
- Modify: `src/components/public-site/public-site-theme.module.css`
- Modify: `src/components/public-site/public-site-data.ts`
- Create: `src/app/prototype/public-site/about/page.test.tsx`
- Modify: `src/app/prototype/public-site/bungalows/[slug]/page.test.tsx`
- Modify: `src/app/prototype/public-site/page.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// src/app/prototype/public-site/about/page.test.tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import PublicSiteAboutPage from "./page";

describe("public about page", () => {
  it("exports metadata and richer sectional content aligned to the home language", () => {
    const html = renderToStaticMarkup(<PublicSiteAboutPage />);
    expect(html).toContain("Wakaya");
    expect(html).toContain("historia");
    expect(html).toContain("naturaleza");
    expect(html).toContain("section");
  });
});

// src/app/prototype/public-site/page.test.tsx
it("keeps the home-level metadata baseline", async () => {
  expect(homeSlides[0].title.length).toBeGreaterThan(10);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:
```bash
npm test -- src/app/prototype/public-site/about/page.test.tsx src/app/prototype/public-site/bungalows/[slug]/page.test.tsx src/app/prototype/public-site/page.test.tsx
```
Expected: FAIL because the enriched interior content and metadata baseline are not implemented yet.

- [ ] **Step 3: Write the minimal implementation**

```tsx
// src/app/prototype/public-site/layout.tsx
export const metadata = {
  metadataBase: new URL("https://wakayaecolodge.com"),
  title: {
    default: "Wakaya Ecolodge",
    template: "%s | Wakaya Ecolodge",
  },
  description: "Wakaya Ecolodge en Pucallpa: bungalows, naturaleza y atención personalizada para tu próxima estadía.",
  openGraph: {
    title: "Wakaya Ecolodge",
    description: "Bungalows, laguna, piscina y coordinación personalizada en Wakaya.",
    url: "https://wakayaecolodge.com/prototype/public-site",
    siteName: "Wakaya Ecolodge",
    type: "website",
  },
};

// src/app/prototype/public-site/about/page.tsx
export const metadata = {
  title: "Nosotros",
  description: "Conoce la historia, el entorno y la propuesta de hospitalidad de Wakaya Ecolodge.",
};

// Keep the current page shell, but add a stronger editorial section stack:
// story block, experience principles, image-led mosaic, and a CTA back to booking/contact.

// src/app/prototype/public-site/bungalows/[slug]/page.tsx
export const metadata = {
  title: roomName,
  description: `${roomName} en Wakaya Ecolodge · ${room.capacity} · ${room.priceFrom}.`,
};
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:
```bash
npm test -- src/app/prototype/public-site/about/page.test.tsx src/app/prototype/public-site/bungalows/[slug]/page.test.tsx src/app/prototype/public-site/page.test.tsx
npm run typecheck
```
Expected: PASS with the home-adjacent interior pages and metadata baseline in place.

- [ ] **Step 5: Commit**

```bash
git add src/app/prototype/public-site/layout.tsx src/app/prototype/public-site/page.tsx src/app/prototype/public-site/about/page.tsx src/app/prototype/public-site/contact/page.tsx src/app/prototype/public-site/bungalows/[slug]/page.tsx src/components/public-site/page-hero.tsx src/components/public-site/public-site-theme.module.css src/components/public-site/public-site-data.ts src/app/prototype/public-site/about/page.test.tsx src/app/prototype/public-site/bungalows/[slug]/page.test.tsx src/app/prototype/public-site/page.test.tsx
git commit -m "feat: align public site interiors with home language"
```

### Task 7: Run the full verification set and update operational docs

**Files:**
- Modify: `specs/001-reservations/reglas-negocio-estados-criterios.md`
- Modify: `specs/001-reservations/spec-funcional.md`
- Modify: `specs/001-reservations/spec-tecnica.md`
- Modify: `specs/002-public-site/spec-funcional.md`
- Modify: `specs/002-public-site/spec-tecnica.md`
- Modify: `README.md`

- [ ] **Step 1: Write the failing documentation checks**

```bash
npm run check:bd-documented
npm run check:trace-drift
```

Expected: FAIL or warn because the specs still describe `pending_review`, `ota_imported_confirmed`, and SQLite-backed operational behavior.

- [ ] **Step 2: Update the docs to match the implemented cut**

```md
<!-- specs/001-reservations/reglas-negocio-estados-criterios.md -->
- la web crea `booking_request`
- OTA crea `reservation.status = confirmed`
- la confirmación manual convierte la solicitud en reserva
- PostgreSQL es la única persistencia operativa

<!-- specs/002-public-site/spec-funcional.md -->
- el formulario público crea una solicitud
- el home mantiene prioridad SEO
- contacto y detalle usan continuidad visual del home
```

- [ ] **Step 3: Run the full verification set**

Run:
```bash
npm test
npm run typecheck
npm run build
npm run check:project
```
Expected: PASS, with any external-provider-dependent checks covered by test doubles rather than live credentials.

- [ ] **Step 4: Commit**

```bash
git add specs/001-reservations/reglas-negocio-estados-criterios.md specs/001-reservations/spec-funcional.md specs/001-reservations/spec-tecnica.md specs/002-public-site/spec-funcional.md specs/002-public-site/spec-tecnica.md README.md
git commit -m "docs: align wakaya specs with hybrid reservations cut"
```
