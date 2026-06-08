# Wakaya Reservations Occupancy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a sibling occupancy view for the reservations backoffice that shows a weekly bungalow map with a daily detail panel, using the same reservations truth as the agenda.

**Architecture:** Build `/admin/reservations/occupancy` as a route sibling to the current agenda. Reuse the existing reservations store, permissions, and audit APIs, but project them into a week-based bungalow grid plus a right-side day detail panel. Keep the agenda intact and share navigation, selection semantics, and visual language across both views.

**Tech Stack:** Next.js App Router, React, TypeScript, CSS Modules, existing `reservationStore`, existing `requirePermission` RBAC guard, Vitest, HTML5 prototype artifact.

---

### Task 1: Add occupancy routing and shared query helpers

**Files:**
- Modify: `src/app/admin/reservations/reservations-query.ts`
- Modify: `src/app/admin/reservations/page.tsx`
- Create: `src/app/admin/reservations/occupancy/page.tsx`
- Create: `src/app/admin/reservations/occupancy/page.test.tsx`
- Modify: `src/app/admin/reservations/page.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/app/admin/reservations/page.test.tsx
it("links to the occupancy view from the main monitor", async () => {
  const html = renderToStaticMarkup(
    await ReservationsAdminPage({
      searchParams: { selected: "reservation-demo-1" },
    }),
  );

  expect(html).toContain('href="/admin/reservations/occupancy');
  expect(html).toContain("Ocupación");
});

// src/app/admin/reservations/occupancy/page.test.tsx
it("renders the occupancy shell and selects the current week", async () => {
  const html = renderToStaticMarkup(
    await ReservationsOccupancyPage({
      searchParams: { selected: "reservation-demo-1" },
    }),
  );

  expect(html).toContain("Calendario de ocupación");
  expect(html).toContain("Agenda");
  expect(html).toContain("Ocupación");
  expect(html).toContain("Semana actual");
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:
```bash
npm test -- src/app/admin/reservations/page.test.tsx src/app/admin/reservations/occupancy/page.test.tsx
```
Expected: FAIL because the occupancy route and top-nav link do not exist yet.

- [ ] **Step 3: Write the minimal implementation**

```tsx
// src/app/admin/reservations/reservations-query.ts
export type ReservationsMonitorView = "agenda" | "occupancy";

export type ReservationsMonitorQuery = {
  status?: string;
  channel?: string;
  responsibleId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  selected?: string;
  view?: ReservationsMonitorView;
  week?: string;
};

const QUERY_KEYS = [
  "status",
  "channel",
  "responsibleId",
  "date",
  "startDate",
  "endDate",
  "selected",
  "view",
  "week",
] as const;

export function buildReservationsMonitorHref(query: ReservationsMonitorQuery): string {
  const params = new URLSearchParams();
  for (const key of QUERY_KEYS) {
    const value = query[key];
    if (value) params.set(key, value);
  }
  const suffix = params.toString();
  return suffix ? `/admin/reservations?${suffix}` : "/admin/reservations";
}

export function buildReservationsOccupancyHref(query: ReservationsMonitorQuery): string {
  const params = new URLSearchParams();
  for (const key of QUERY_KEYS) {
    const value = query[key];
    if (value) params.set(key, value);
  }
  params.set("view", "occupancy");
  const suffix = params.toString();
  return suffix ? `/admin/reservations/occupancy?${suffix}` : "/admin/reservations/occupancy";
}

// src/app/admin/reservations/page.tsx
import { buildReservationsMonitorHref, buildReservationsOccupancyHref } from "./reservations-query";

// In the hero or header actions, render:
// <Link href={buildReservationsMonitorHref({...query, view: "agenda"})}>Agenda</Link>
// <Link href={buildReservationsOccupancyHref({...query, view: "occupancy"})}>Ocupación</Link>

// src/app/admin/reservations/occupancy/page.tsx
import { reservationStore } from "@/lib/reservations/store";
import { authenticate } from "@/middleware/authn";

// Authenticate with reservation:read, derive the selected week, load the
// bungalow list and visible reservations, then render the occupancy view.
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:
```bash
npm test -- src/app/admin/reservations/page.test.tsx src/app/admin/reservations/occupancy/page.test.tsx
```
Expected: PASS after the route and navigation link are in place.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/reservations/reservations-query.ts src/app/admin/reservations/page.tsx src/app/admin/reservations/occupancy/page.tsx src/app/admin/reservations/page.test.tsx src/app/admin/reservations/occupancy/page.test.tsx
git commit -m "feat: add reservations occupancy route"
```

### Task 2: Build the weekly bungalow grid and daily detail panel

**Files:**
- Create: `src/app/admin/reservations/occupancy/occupancy-view.tsx`
- Create: `src/app/admin/reservations/occupancy/occupancy-grid.tsx`
- Create: `src/app/admin/reservations/occupancy/occupancy-detail-panel.tsx`
- Create: `src/app/admin/reservations/occupancy/occupancy-utils.ts`
- Create: `src/app/admin/reservations/occupancy/occupancy-view.test.tsx`
- Modify: `src/app/admin/reservations/reservations.module.css`

- [ ] **Step 1: Write the failing test**

```tsx
// src/app/admin/reservations/occupancy/occupancy-view.test.tsx
it("renders a weekly bungalow grid with a daily detail panel", () => {
  const html = renderToStaticMarkup(
    <OccupancyView
      bungalows={reservationStore.listBungalows()}
      items={reservationStore.list()}
      selectedWeek="2026-06-08"
      selectedReservationId="reservation-demo-1"
    />,
  );

  expect(html).toContain("Semana actual");
  expect(html).toContain("Bungalow Suite");
  expect(html).toContain("Cobro y saldo");
  expect(html).toContain("Ver reserva");
  expect(html).toContain("Exportar reporte del bungalow");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npm test -- src/app/admin/reservations/occupancy/occupancy-view.test.tsx
```
Expected: FAIL because the occupancy components do not exist yet.

- [ ] **Step 3: Write the minimal implementation**

```tsx
// src/app/admin/reservations/occupancy/occupancy-utils.ts
export function getWeekDates(anchorDate: string): string[] {
  const anchor = new Date(`${anchorDate}T12:00:00Z`);
  const day = anchor.getUTCDay() || 7;
  anchor.setUTCDate(anchor.getUTCDate() - day + 1);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(anchor);
    date.setUTCDate(anchor.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

export function groupOccupancyByBungalowAndDate(items: Array<{ bungalowId: string | null; startDate: string; endDate: string; id: string }>, weekDates: string[]) {
  const matrix = new Map<string, Map<string, string>>();
  for (const item of items) {
    if (!item.bungalowId) continue;
    const row = matrix.get(item.bungalowId) ?? new Map<string, string>();
    for (const date of weekDates) {
      if (date >= item.startDate && date <= item.endDate) {
        row.set(date, item.id);
      }
    }
    matrix.set(item.bungalowId, row);
  }
  return matrix;
}

// src/app/admin/reservations/occupancy/occupancy-grid.tsx
// Render the weekly grid with one row per bungalow and one column per day,
// reading occupancy state from the matrix returned by occupancy-utils.ts.

// src/app/admin/reservations/occupancy/occupancy-detail-panel.tsx
// Render the selected bungalow/day detail using the existing reservation detail
// shape, including payment, audit and valid action buttons.
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npm test -- src/app/admin/reservations/occupancy/occupancy-view.test.tsx
```
Expected: PASS with the week grid and detail panel visible.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/reservations/occupancy/occupancy-view.tsx src/app/admin/reservations/occupancy/occupancy-grid.tsx src/app/admin/reservations/occupancy/occupancy-detail-panel.tsx src/app/admin/reservations/occupancy/occupancy-utils.ts src/app/admin/reservations/occupancy/occupancy-view.test.tsx src/app/admin/reservations/reservations.module.css
git commit -m "feat: add reservations occupancy grid"
```

### Task 3: Wire occupancy actions and shared navigation states

**Files:**
- Modify: `src/app/admin/reservations/occupancy/page.tsx`
- Modify: `src/app/admin/reservations/occupancy/occupancy-detail-panel.tsx`
- Modify: `src/app/admin/reservations/occupancy/occupancy-view.test.tsx`
- Modify: `src/app/admin/reservations/occupancy/page.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it("shows free, occupied, and blocked cells with explicit states", () => {
  const html = renderToStaticMarkup(
    <OccupancyView
      bungalows={reservationStore.listBungalows()}
      items={reservationStore.list()}
      selectedWeek="2026-06-08"
      selectedReservationId="reservation-demo-3"
    />,
  );

  expect(html).toContain("Libre");
  expect(html).toContain("Ocupado");
  expect(html).toContain("Bloqueado");
  expect(html).toContain("Registrar check-out");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npm test -- src/app/admin/reservations/occupancy/occupancy-view.test.tsx src/app/admin/reservations/occupancy/page.test.tsx
```
Expected: FAIL until the action and state rendering is completed.

- [ ] **Step 3: Write the minimal implementation**

```tsx
// Show state badges directly in the weekly grid.
// Drive actions from the same reservation state machine already used by agenda.
// Keep the detail panel consistent with the current reservations API and audit trail.
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npm test -- src/app/admin/reservations/occupancy/occupancy-view.test.tsx src/app/admin/reservations/occupancy/page.test.tsx
```
Expected: PASS with explicit cell states and valid actions.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/reservations/occupancy/page.tsx src/app/admin/reservations/occupancy/occupancy-detail-panel.tsx src/app/admin/reservations/occupancy/occupancy-view.test.tsx src/app/admin/reservations/occupancy/page.test.tsx
git commit -m "feat: wire reservations occupancy actions"
```

### Task 4: Update docs and prototype traceability

**Files:**
- Modify: `specs/001-reservations/ui-test-cases.md`
- Modify: `specs/001-reservations/traceability.md`
- Modify: `specs/001-reservations/prototype-validation.md`
- Modify: `specs/001-reservations/prototype-html5/index.html` only if the occupancy slice is mirrored in the prototype

- [ ] **Step 1: Write the failing test or documentation assertion**

```markdown
| Vista `Ocupación` | muestra grilla semanal por bungalow y detalle diario sin mezclar servicios |
```

- [ ] **Step 2: Run the relevant checks**

Run:
```bash
npm run typecheck
npm test -- src/app/admin/reservations/occupancy/page.test.tsx src/app/admin/reservations/occupancy/occupancy-view.test.tsx
```
Expected: PASS before documentation sync is finalized.

- [ ] **Step 3: Write the minimal implementation**

```markdown
- Add the occupancy route to the UX test matrix.
- Add the new route to traceability with the implemented files and tests.
- Keep prototype validation unchanged unless the HTML5 prototype is updated in the same slice.
```

- [ ] **Step 4: Run the checks to verify they pass**

Run:
```bash
npm run typecheck
npm test -- src/app/admin/reservations/occupancy/page.test.tsx src/app/admin/reservations/occupancy/occupancy-view.test.tsx
```
Expected: PASS with docs and code aligned.

- [ ] **Step 5: Commit**

```bash
git add specs/001-reservations/ui-test-cases.md specs/001-reservations/traceability.md specs/001-reservations/prototype-validation.md
git commit -m "docs: add reservations occupancy traceability"
```

## Self-Review Checklist

- The plan covers the new sibling route, the weekly grid, the detail panel, the
  shared navigation, and the docs update.
- The plan does not mix services into the bungalow calendar.
- The plan keeps the agenda intact and treats occupancy as complementary.
- The file responsibilities are separated into route, grid, detail panel, and
  utilities.
- The tests are tied to concrete files and behaviors, not placeholders.
