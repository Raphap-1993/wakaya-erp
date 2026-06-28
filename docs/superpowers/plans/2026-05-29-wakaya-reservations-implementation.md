# Wakaya Reservations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first production-safe Wakaya reservations slice with a single Next.js app, PostgreSQL, Prisma, PM2, and a deterministic availability model that prevents double booking.

**Architecture:** Keep Wakaya as a single full-stack Next.js application with two surfaces: public booking and internal reservation operations. Availability is the source of truth and must be enforced server-side with transactional inserts and a unique per-night occupancy ledger. The implementation should add the data model first, then domain rules, then API endpoints, then the internal monitor UI, and finally QA evidence and deploy readiness.

**Tech Stack:** Next.js App Router, TypeScript, Prisma, PostgreSQL, PM2, Hestia/Nginx, Playwright, Vitest.

---

## File structure to touch

- `src/app/page.tsx` - public landing entry point.
- `src/app/api/reservations/**` - reservations API routes.
- `src/app/api/audit/**` - audit read endpoints if needed for the monitor.
- `src/app/admin/reservations/**` - internal reservation monitor UI routes.
- `src/components/**` - shared UI for table, filters, badges, detail panel.
- `src/lib/**` - RBAC, reservation state machine, availability helpers, audit helpers.
- `prisma/schema.prisma` - reservation, bungalow, occupancy, audit models.
- `prisma/migrations/**` - database migrations.
- `tests/**` - unit, contract, and E2E tests.
- `specs/001-reservations/**` - traceability, spec links, and evidence.

---

### Task 1: Define the reservation data model and occupancy ledger

**Files:**
- Create/modify: `prisma/schema.prisma`
- Create/modify: `prisma/migrations/**`
- Create/modify: `tests/contract/reservation-schema.test.ts`
- Modify: `specs/001-reservations/spec-tecnica.md`

- [ ] **Step 1: Write the failing test**

Create a schema-level test that asserts the project exposes these logical entities and constraints:

```ts
import { readFile } from 'node:fs/promises';
import { describe, it, expect } from 'vitest';

describe('reservation schema', () => {
  it('declares reservation, bungalow, reservation_occupancy, and reservation_audit models', async () => {
    const schema = await readFile('prisma/schema.prisma', 'utf8');
    expect(schema).toContain('model Reservation');
    expect(schema).toContain('model Bungalow');
    expect(schema).toContain('model ReservationOccupancy');
    expect(schema).toContain('model ReservationAudit');
    expect(schema).toContain('@@unique([bungalowId, date])');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```powershell
npm run test -- tests/contract/reservation-schema.test.ts
```
Expected: fail because the models and unique constraint are not implemented yet.

- [ ] **Step 3: Write minimal implementation**

Implement `prisma/schema.prisma` with:

```prisma
model Reservation {
  id                String   @id @default(uuid())
  number            String   @unique
  channel           String
  status            String
  bungalowId        String?
  responsibleId     String?
  startDate         DateTime
  endDate           DateTime
  updatedAt         DateTime @updatedAt
  occupancies       ReservationOccupancy[]
  auditEntries      ReservationAudit[]
}

model Bungalow {
  id          String   @id @default(uuid())
  code        String   @unique
  name        String
  active      Boolean  @default(true)
  capacity    Int
  occupancies ReservationOccupancy[]
}

model ReservationOccupancy {
  id            String   @id @default(uuid())
  reservationId String
  bungalowId    String
  date          DateTime
  source        String
  status        String
  createdAt     DateTime @default(now())

  reservation Reservation @relation(fields: [reservationId], references: [id])
  bungalow    Bungalow    @relation(fields: [bungalowId], references: [id])

  @@unique([bungalowId, date])
  @@index([reservationId])
  @@index([bungalowId, date])
}

model ReservationAudit {
  id             String   @id @default(uuid())
  reservationId  String
  actorId        String
  action         String
  previousStatus  String
  nextStatus      String
  reason         String
  createdAt      DateTime @default(now())

  reservation Reservation @relation(fields: [reservationId], references: [id])

  @@index([reservationId, createdAt])
}
```

Then create the initial migration for those tables.

- [ ] **Step 4: Run the test to verify it passes**

Run:
```powershell
npm run test -- tests/contract/reservation-schema.test.ts
npm run typecheck
```
Expected: pass after Prisma schema and migration are in place.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations tests/contract/reservation-schema.test.ts specs/001-reservations/spec-tecnica.md
git commit -m "feat(wakaya): add reservation data model and occupancy ledger"
```

---

### Task 2: Implement the availability service with atomic night blocking

**Files:**
- Create: `src/lib/reservations/availability.ts`
- Create: `tests/lib/reservations/availability.test.ts`
- Modify: `src/app/api/reservations/route.ts` or the reservation creation handler
- Modify: `src/lib/rbac.ts` only if a permission helper is needed

- [ ] **Step 1: Write the failing test**

Write tests that prove two requests cannot block the same bungalow night and that a conflict returns a deterministic error:

```ts
import { describe, it, expect } from 'vitest';
import { canBlockOccupancy } from '@/lib/reservations/availability';

describe('canBlockOccupancy', () => {
  it('rejects overlapping nights for the same bungalow', async () => {
    const existing = [
      { bungalowId: 'b1', date: '2026-06-12' },
    ];

    const result = canBlockOccupancy(existing, {
      bungalowId: 'b1',
      startDate: '2026-06-12',
      endDate: '2026-06-14',
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('occupancy_conflict');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```powershell
npm run test -- tests/lib/reservations/availability.test.ts
```
Expected: fail because the helper does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Implement `canBlockOccupancy()` as a pure helper that expands date ranges into nightly keys and rejects duplicates before hitting persistence. Keep the helper deterministic and side-effect free.

- [ ] **Step 4: Run the test to verify it passes**

Run:
```powershell
npm run test -- tests/lib/reservations/availability.test.ts
npm run typecheck
```
Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/reservations/availability.ts tests/lib/reservations/availability.test.ts src/app/api/reservations/route.ts
git commit -m "feat(wakaya): add atomic reservation availability checks"
```

---

### Task 3: Implement the reservation state machine and audit write path

**Files:**
- Create: `src/lib/reservations/state-machine.ts`
- Create: `src/lib/reservations/audit.ts`
- Create: `tests/lib/reservations/state-machine.test.ts`
- Modify: `src/app/api/reservations/[id]/status/route.ts`
- Modify: `src/app/api/reservations/[id]/assign/route.ts`

- [ ] **Step 1: Write the failing test**

Cover valid and invalid transitions:

```ts
import { describe, it, expect } from 'vitest';
import { nextReservationStatus } from '@/lib/reservations/state-machine';

describe('nextReservationStatus', () => {
  it('allows pending_review -> confirmed', () => {
    expect(nextReservationStatus('pending_review', 'confirm')).toBe('confirmed');
  });

  it('rejects invalid transitions', () => {
    expect(() => nextReservationStatus('checked_out', 'confirm')).toThrow('invalid_transition');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```powershell
npm run test -- tests/lib/reservations/state-machine.test.ts
```
Expected: fail because the state machine is not implemented yet.

- [ ] **Step 3: Write minimal implementation**

Implement a small, explicit transition map for:

- `pending_review`
- `ota_imported_confirmed`
- `confirmed`
- `assigned`
- `checked_in`
- `checked_out`
- `paid`
- `cancelled`
- `no_show`

Write the audit helper so every status mutation emits:

- actor
- action
- previous status
- next status
- reason
- timestamp

- [ ] **Step 4: Run the test to verify it passes**

Run:
```powershell
npm run test -- tests/lib/reservations/state-machine.test.ts
npm run typecheck
```
Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/reservations/state-machine.ts src/lib/reservations/audit.ts tests/lib/reservations/state-machine.test.ts src/app/api/reservations/[id]/status/route.ts src/app/api/reservations/[id]/assign/route.ts
git commit -m "feat(wakaya): add reservation state machine and audit trail"
```

---

### Task 4: Expose the internal reservation monitor API

**Files:**
- Create/modify: `src/app/api/reservations/route.ts`
- Create/modify: `src/app/api/reservations/[id]/route.ts`
- Create/modify: `src/app/api/reservations/[id]/audit/route.ts`
- Create: `tests/contract/reservations-api.test.ts`

- [ ] **Step 1: Write the failing test**

Write a contract test that checks:

- list endpoint returns allowed reservations
- detail endpoint returns one reservation with bungalow and audit summary
- read permission is enforced

The test should assert at minimum the fields:

- `id`
- `number`
- `status`
- `channel`
- `bungalow`
- `responsible`

- [ ] **Step 2: Run the test to verify it fails**

Run:
```powershell
npm run test:contract -- tests/contract/reservations-api.test.ts
```
Expected: fail because the handlers are not fully implemented.

- [ ] **Step 3: Write minimal implementation**

Return a stable JSON shape from the Next.js route handlers and enforce server-side permissions with `reservation:read`.

- [ ] **Step 4: Run the test to verify it passes**

Run:
```powershell
npm run test:contract -- tests/contract/reservations-api.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/reservations src/app/api/reservations/[id] tests/contract/reservations-api.test.ts
git commit -m "feat(wakaya): expose reservations monitor api"
```

---

### Task 5: Build the internal reservations monitor UI

**Files:**
- Create: `src/app/admin/reservations/page.tsx`
- Create: `src/app/admin/reservations/[id]/page.tsx`
- Create: `src/components/reservations/**`
- Create: `tests/e2e/reservations-monitor.spec.ts`

- [ ] **Step 1: Write the failing test**

Write an E2E test that checks:

- the monitor list renders
- filters are visible
- detail opens
- empty/error/loading states exist
- role denied state is visible when permission is absent

- [ ] **Step 2: Run the test to verify it fails**

Run:
```powershell
npm run test:e2e -- tests/e2e/reservations-monitor.spec.ts
```
Expected: fail because the admin route is not fully implemented.

- [ ] **Step 3: Write minimal implementation**

Implement the monitor UI with:

- list
- filters
- status badges
- detail panel
- audit section
- assign bungalow action

Keep the layout aligned with the approved SPDD, but do not overdesign beyond the approved flow.

- [ ] **Step 4: Run the test to verify it passes**

Run:
```powershell
npm run test:e2e -- tests/e2e/reservations-monitor.spec.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/reservations src/components/reservations tests/e2e/reservations-monitor.spec.ts
git commit -m "feat(wakaya): add internal reservations monitor ui"
```

---

### Task 6: QA sweep and release readiness

**Files:**
- Modify: `specs/001-reservations/prototype-validation.md`
- Modify: `specs/001-reservations/traceability.md`
- Modify: `specs/001-reservations/spec-tareas.md`
- Create/modify: `docs/fase-6-qa/**` if needed

- [ ] **Step 1: Run the full relevant test set**

Run:
```powershell
npm run typecheck
npm run test
npm run test:contract
npm run test:e2e
npm run check:project
```

- [ ] **Step 2: Confirm evidence**

Record:

- what passed
- what failed
- what remains blocked
- what needs review

- [ ] **Step 3: Update traceability**

Mark implemented artifacts with real file names and keep planned items as `-` until they exist.

- [ ] **Step 4: Update prototype validation**

If the UI is now implemented, mark the prototype criteria accordingly and keep any remaining human approvals explicit.

- [ ] **Step 5: Commit**

```bash
git add specs/001-reservations docs/fase-6-qa
git commit -m "docs(wakaya): close reservations qa and traceability"
```

---

## Coverage check

- Availability and no-overlap: Task 1, Task 2
- State machine and audit: Task 3
- API contracts and permissions: Task 4
- UI monitor: Task 5
- QA and traceability: Task 6

## Risks and open questions

- Exact auth integration path for the internal monitor if the current OIDC middleware needs extension.
- Exact Prisma connection and migration command wiring if the repo already uses a custom migration runner.
- Whether OTA imports need a separate endpoint now or can wait for the first integration slice.

## Execution note

This plan assumes the team will work in a safe branch or worktree and keep the release isolated from other VPS clients. Use small commits and do not merge the public site and reservations work into one undifferentiated change.
