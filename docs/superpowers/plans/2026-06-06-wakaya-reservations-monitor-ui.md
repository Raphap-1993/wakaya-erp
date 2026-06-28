# Wakaya Reservations Monitor UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert `/admin/reservations` into the primary reception console with a persistent detail panel, row-driven selection, inline action feedback, and preserved deep-link support.

**Architecture:** Keep the existing server-rendered Next.js route as the data source, but move the interactive shell into a focused client component that owns row selection, URL synchronization, and mutation feedback. Reuse the current reservation store and API routes; the UI should compose those existing truths instead of inventing new state. Preserve `/admin/reservations/[id]` as a fallback deep-link view, but make the main list screen the default operational path.

**Tech Stack:** Next.js App Router, React 19, TypeScript, CSS Modules, Vitest, Playwright.

---

## File Map

- `src/app/admin/reservations/page.tsx` - server page that loads filtered reservations, resolves the active selection, and passes data into the interactive shell.
- `src/app/admin/reservations/reservations-monitor.tsx` - new client shell for table selection, side-panel rendering, URL updates, and inline mutation feedback.
- `src/app/admin/reservations/reservations-query.ts` - query-string helpers for filter normalization and `selected` persistence.
- `src/app/admin/reservations/reservations.module.css` - layout, selected-row state, detail-panel styling, and empty/error state visuals.
- `src/app/admin/reservations/[id]/page.tsx` - fallback deep-link detail page aligned with the new UI language.
- `src/app/admin/reservations/page.test.tsx` - server rendering tests for the main console.
- `src/app/admin/reservations/reservations-query.test.ts` - pure helper tests for query preservation.
- `e2e/admin-reservations.spec.ts` - browser coverage for row selection, filter retention, and inline action feedback.

---

### Task 1: Add query helpers and the interactive monitor shell

**Files:**
- Create: `src/app/admin/reservations/reservations-query.ts`
- Create: `src/app/admin/reservations/reservations-query.test.ts`
- Create: `src/app/admin/reservations/reservations-monitor.tsx`

- [ ] **Step 1: Write the failing helper test**

```ts
import { describe, expect, it } from "vitest";
import { buildReservationsMonitorHref, normalizeReservationsMonitorQuery } from "./reservations-query";

describe("reservations monitor query helpers", () => {
  it("preserves the selected reservation while filtering", () => {
    const query = normalizeReservationsMonitorQuery({
      status: "pending_review",
      channel: "web",
      responsibleId: "user-reception-1",
      date: "2026-06-15",
      selected: "reservation-demo-1",
    });

    expect(buildReservationsMonitorHref(query)).toBe(
      "/admin/reservations?status=pending_review&channel=web&responsibleId=user-reception-1&date=2026-06-15&selected=reservation-demo-1",
    );
  });
});
```

- [ ] **Step 2: Run the helper test to confirm it fails**

Run: `npm test -- src/app/admin/reservations/reservations-query.test.ts`
Expected: FAIL because the helper module does not exist yet.

- [ ] **Step 3: Implement the minimal query helper and client shell**

```ts
// reservations-query.ts
export type ReservationsMonitorQuery = {
  status?: string;
  channel?: string;
  responsibleId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  selected?: string;
};

export function normalizeReservationsMonitorQuery(query: Partial<ReservationsMonitorQuery>): ReservationsMonitorQuery {
  const normalized: ReservationsMonitorQuery = {};
  for (const key of ["status", "channel", "responsibleId", "date", "startDate", "endDate", "selected"] as const) {
    const value = query[key]?.trim();
    if (value) normalized[key] = value;
  }
  return normalized;
}

export function buildReservationsMonitorHref(query: ReservationsMonitorQuery): string {
  const params = new URLSearchParams();
  for (const key of ["status", "channel", "responsibleId", "date", "startDate", "endDate", "selected"] as const) {
    const value = query[key];
    if (value) params.set(key, value);
  }
  const suffix = params.toString();
  return suffix ? `/admin/reservations?${suffix}` : "/admin/reservations";
}
```

```tsx
// reservations-monitor.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./reservations.module.css";
import { buildReservationsMonitorHref } from "./reservations-query";

type ReservationItem = {
  id: string;
  number: string;
  channel: "web" | "ota";
  status: string;
  bungalowId: string | null;
  responsibleId: string | null;
  startDate: string;
  endDate: string;
  updatedAt: string;
  bungalow: { id: string; name: string } | null;
};

type Props = {
  items: ReservationItem[];
  selectedId: string | null;
  query: {
    status?: string;
    channel?: string;
    responsibleId?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    selected?: string;
  };
};

export default function ReservationsMonitor({ items, selectedId, query }: Props) {
  const router = useRouter();
  const [activeId, setActiveId] = useState(selectedId ?? items[0]?.id ?? null);
  const activeItem = useMemo(
    () => items.find((item) => item.id === activeId) ?? null,
    [activeId, items],
  );

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <MonitorKpis items={items} />
          <MonitorFilters query={query} selectedId={activeId} />
        </header>
        <section className={styles.detailGrid}>
          <div className={styles.tableCard}>
            <MonitorTable
              items={items}
              activeId={activeId}
              onSelect={(id) => {
                setActiveId(id);
                router.replace(buildReservationsMonitorHref({ ...query, selected: id }));
              }}
            />
          </div>
          <aside className={styles.actions}>
            <MonitorDetailPanel item={activeItem} onActionSuccess={() => router.refresh()} />
          </aside>
        </section>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Run the helper test and the shell render test**

Run: `npm test -- src/app/admin/reservations/reservations-query.test.ts`
Run: `npm test -- src/app/admin/reservations/page.test.tsx`
Expected: the helper test passes and the page test still fails until the page is wired to the new shell.

- [ ] **Step 5: Commit the helper/shell slice**

```bash
git add src/app/admin/reservations/reservations-query.ts src/app/admin/reservations/reservations-query.test.ts src/app/admin/reservations/reservations-monitor.tsx
git commit -m "feat: add reservations monitor shell helpers"
```

### Task 2: Rewire the main monitor page and CSS around the side panel

**Files:**
- Modify: `src/app/admin/reservations/page.tsx`
- Modify: `src/app/admin/reservations/reservations.module.css`
- Modify: `src/app/admin/reservations/page.test.tsx`

- [ ] **Step 1: Write the failing page test for selected detail and date filter**

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ReservationsAdminPage from "./page";

describe("ReservationsAdminPage", () => {
  it("renders the selected reservation in the side panel", async () => {
    const html = renderToStaticMarkup(
      await ReservationsAdminPage({
        searchParams: {
          selected: "reservation-demo-1",
          date: "2026-06-12",
        },
      }),
    );

    expect(html).toContain("Mini monitor de reservas");
    expect(html).toContain("RESERVATION-2026-0001");
    expect(html).toContain("Auditoría");
    expect(html).toContain("selected");
  });
});
```

- [ ] **Step 2: Run the page test to confirm it fails**

Run: `npm test -- src/app/admin/reservations/page.test.tsx`
Expected: FAIL because the server page still renders the old table-only layout.

- [ ] **Step 3: Rewire the server page to pass filtered items and selection into the shell**

```tsx
// page.tsx
import { reservationStore } from "@/lib/reservations/store";
import type { ReservationChannel, ReservationStatus } from "@/lib/reservations/types";
import { normalizeReservationsMonitorQuery } from "./reservations-query";
import ReservationsMonitor from "./reservations-monitor";

const query = normalizeReservationsMonitorQuery(await searchParams);
const items = reservationStore.list({
  status: query.status as ReservationStatus | undefined,
  channel: query.channel as ReservationChannel | undefined,
  responsibleId: query.responsibleId,
  date: query.date,
  startDate: query.startDate,
  endDate: query.endDate,
});
const selectedId = query.selected ?? items[0]?.id ?? null;

return <ReservationsMonitor items={items} selectedId={selectedId} query={query} />;
```

```css
/* reservations.module.css */
.detailGrid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(360px, 0.85fr);
  gap: 20px;
  align-items: start;
}

.selectedRow {
  background: rgba(220, 239, 226, 0.7);
}

.emptyState,
.inlineError,
.panelHint {
  border: 1px solid rgba(21, 40, 34, 0.08);
  border-radius: 18px;
  padding: 14px 16px;
}
```

- [ ] **Step 4: Run the page test and typecheck after the rewiring**

Run: `npm test -- src/app/admin/reservations/page.test.tsx`
Run: `npm run typecheck`
Expected: the page test passes, and typecheck catches any prop or query typing mismatches before moving on.

- [ ] **Step 5: Commit the main page slice**

```bash
git add src/app/admin/reservations/page.tsx src/app/admin/reservations/reservations.module.css src/app/admin/reservations/page.test.tsx
git commit -m "feat: rework reservations monitor main screen"
```

### Task 3: Align the deep-link detail page and browser coverage

**Files:**
- Modify: `src/app/admin/reservations/[id]/page.tsx`
- Modify: `src/app/admin/reservations/[id]/page.test.tsx`
- Modify: `e2e/admin-reservations.spec.ts`

- [ ] **Step 1: Write the failing browser flow test for row selection and filter retention**

```ts
import { expect, test } from "@playwright/test";

test("keeps the selection while filtering the reservations table", async ({ page }) => {
  await page.goto("/admin/reservations");

  await page.getByRole("button", { name: /reservation-demo-1/i }).click();
  await expect(page.getByRole("heading", { name: /RESERVATION-2026-0001/i })).toBeVisible();
  await expect(page.getByText(/auditoría/i)).toBeVisible();

  await page.getByLabel("Estado").selectOption("pending_review");
  await expect(page).toHaveURL(/selected=reservation-demo-1/);
});
```

- [ ] **Step 2: Run the e2e test to confirm it fails**

Run: `npx playwright test e2e/admin-reservations.spec.ts`
Expected: FAIL because the monitor still uses the old link-out detail flow.

- [ ] **Step 3: Update the fallback detail page to share the same operational language**

```tsx
// [id]/page.tsx
return (
  <main className={styles.page}>
    <div className={styles.shell}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>Wakaya · detalle de reserva</p>
          <h1 className={styles.title}>{detail.number}</h1>
          <p className={styles.lead}>
            Pantalla de apoyo para acceso directo, depuración y soporte operativo.
          </p>
        </div>
        <Link className={styles.link} href={`/admin/reservations?selected=${detail.id}`}>
          Volver al monitor
        </Link>
      </div>
    </div>
  </main>
);
```

- [ ] **Step 4: Run the detail-page test and Playwright again**

Run: `npm test -- src/app/admin/reservations/[id]/page.test.tsx`
Run: `npx playwright test e2e/admin-reservations.spec.ts`
Expected: both pass with the main page acting as the operational surface and the fallback page remaining available.

- [ ] **Step 5: Commit the UI verification slice**

```bash
git add src/app/admin/reservations/[id]/page.tsx src/app/admin/reservations/[id]/page.test.tsx e2e/admin-reservations.spec.ts
git commit -m "feat: add interactive reservations monitor ui"
```

---

## Self-Review Checklist

- The plan covers the full `T-005` scope: list, detail, actions, inline feedback, and deep-link fallback.
- The plan keeps state inside the existing Next.js app and reuses the current API/store instead of inventing a separate data model.
- There are no placeholder instructions like "TBD" or "similar to above".
- The test path is explicit for each task, including the Playwright coverage that proves the shell is operational.
- The selected reservation state is preserved through the URL so filters and deep links stay coherent.
