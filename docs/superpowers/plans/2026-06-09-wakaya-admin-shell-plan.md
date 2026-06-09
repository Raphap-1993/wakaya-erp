# Wakaya Admin Shell Normalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify the entire `/admin` backoffice under one compact shell with a shared sidebar, contextual header, and consistent visual hierarchy for `Reservas`, `Ocupación`, and future modules.

**Architecture:** Add a global admin layout that wraps all admin routes and delegates chrome to a reusable shell component. The shell owns module navigation and the contextual header; the existing reservations and occupancy pages keep their operational content and only lose duplicated module-switch chrome. Shared admin navigation data should live in one file so future modules can be added without duplicating labels or route logic.

**Tech Stack:** Next.js App Router, React, TypeScript, CSS Modules, Vitest, existing reservations monitor views.

---

### Task 1: Create the global admin shell and module navigation config

**Files:**
- Create: `src/app/admin/admin-navigation.ts`
- Create: `src/app/admin/admin-shell.tsx`
- Create: `src/app/admin/admin-shell.module.css`
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/admin-shell.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/app/admin/admin-shell.test.tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import AdminShell from "./admin-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/reservations/occupancy",
}));

it("renders the shared admin navigation with the active module highlighted", () => {
  const html = renderToStaticMarkup(
    <AdminShell>
      <div data-testid="content">Body</div>
    </AdminShell>,
  );

  expect(html).toContain("Reservas");
  expect(html).toContain("Ocupación");
  expect(html).toContain("Pagos");
  expect(html).toContain("Reportes");
  expect(html).toContain("Configuración");
  expect(html).toContain("Body");
  expect(html).toContain('aria-current="page"');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npm test -- src/app/admin/admin-shell.test.tsx
```
Expected: FAIL because the shell, layout, and navigation config do not exist yet.

- [ ] **Step 3: Write the minimal implementation**

```tsx
// src/app/admin/admin-navigation.ts
export const ADMIN_MODULES = [
  { href: "/admin/reservations", label: "Reservas" },
  { href: "/admin/reservations/occupancy", label: "Ocupación" },
  { href: "/admin/payments", label: "Pagos" },
  { href: "/admin/reports", label: "Reportes" },
  { href: "/admin/settings", label: "Configuración" },
] as const;

// src/app/admin/layout.tsx
import AdminShell from "./admin-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}

// src/app/admin/admin-shell.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_MODULES } from "./admin-navigation";
import styles from "./admin-shell.module.css";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeModule = ADMIN_MODULES.find((module) => pathname.startsWith(module.href)) ?? ADMIN_MODULES[0];

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Backoffice">
        <div className={styles.brandBlock}>
          <p className={styles.brandKicker}>Wakaya</p>
          <strong className={styles.brandTitle}>Backoffice</strong>
        </div>
        <nav className={styles.nav}>
          {ADMIN_MODULES.map((module) => (
            <Link
              key={module.href}
              className={module.href === activeModule.href ? styles.navItemActive : styles.navItem}
              href={module.href}
              aria-current={module.href === activeModule.href ? "page" : undefined}
            >
              {module.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className={styles.surface}>
        <header className={styles.header}>
          <div>
            <p className={styles.headerKicker}>Administración</p>
            <h1 className={styles.headerTitle}>{activeModule.label}</h1>
          </div>
        </header>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npm test -- src/app/admin/admin-shell.test.tsx
```
Expected: PASS with the shared navigation and active module state visible.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/admin-navigation.ts src/app/admin/admin-shell.tsx src/app/admin/admin-shell.module.css src/app/admin/layout.tsx src/app/admin/admin-shell.test.tsx
git commit -m "feat: add global admin shell"
```

### Task 2: Remove duplicated module-switch chrome from reservations pages

**Files:**
- Modify: `src/app/admin/reservations/page.tsx`
- Modify: `src/app/admin/reservations/occupancy/page.tsx`
- Modify: `src/app/admin/reservations/page.test.tsx`
- Modify: `src/app/admin/reservations/occupancy/page.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/app/admin/reservations/page.test.tsx
import AdminShell from "@/app/admin/admin-shell";

it("renders the reservations content inside the admin shell without duplicating module navigation", async () => {
  const html = renderToStaticMarkup(
    <AdminShell>
      {await ReservationsAdminPage({ searchParams: { selected: "reservation-demo-1" } })}
    </AdminShell>,
  );

  expect(html).toContain("Reservas");
  expect(html).toContain("Ocupación");
  expect(html).toContain("Mini monitor de reservas");
  expect(html).not.toContain('href="/admin/reservations?view=agenda"');
  expect(html).not.toContain('href="/admin/reservations/occupancy?view=occupancy"');
});

// src/app/admin/reservations/occupancy/page.test.tsx
it("renders the occupancy content inside the admin shell without duplicating module navigation", async () => {
  const html = renderToStaticMarkup(
    <AdminShell>
      {await ReservationsOccupancyPage({
        searchParams: { selected: "reservation-demo-1", date: "2026-06-13" },
      })}
    </AdminShell>,
  );

  expect(html).toContain("Ocupación semanal");
  expect(html).toContain("Reservas");
  expect(html).toContain("Ocupación");
  expect(html).not.toContain('href="/admin/reservations?view=agenda"');
  expect(html).not.toContain('href="/admin/reservations/occupancy?view=occupancy"');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npm test -- src/app/admin/reservations/page.test.tsx src/app/admin/reservations/occupancy/page.test.tsx src/app/admin/admin-shell.test.tsx
```
Expected: FAIL until the duplicated module-switch chrome is removed from the routes and the tests render through the shell.

- [ ] **Step 3: Write the minimal implementation**

```tsx
// src/app/admin/reservations/page.tsx
// Remove the local Agenda/Ocupación button strip.
return (
  <ReservationsMonitor
    items={items}
    selectedId={selectedId}
    query={query}
    bungalows={bungalows}
    permissions={permissions}
  />
);

// src/app/admin/reservations/occupancy/page.tsx
// Remove the local Agenda/Ocupación button strip.
return (
  <OccupancyView
    items={items}
    bungalows={bungalows}
    query={{ ...query, date: query.date ?? anchorDate }}
    auditsByReservationId={auditsByReservationId}
  />
);
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npm test -- src/app/admin/reservations/page.test.tsx src/app/admin/reservations/occupancy/page.test.tsx src/app/admin/admin-shell.test.tsx
```
Expected: PASS with the routes rendered inside the shell and no duplicated module-switch block.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/reservations/page.tsx src/app/admin/reservations/occupancy/page.tsx src/app/admin/reservations/page.test.tsx src/app/admin/reservations/occupancy/page.test.tsx
git commit -m "feat: route reservations through admin shell"
```

### Task 3: Normalize shell styling and verify responsive behavior

**Files:**
- Modify: `src/app/admin/admin-shell.module.css`
- Modify: `src/app/admin/admin-shell.test.tsx`
- Modify: `src/app/admin/reservations/reservations.module.css` only if the shared shell needs minor spacing or background compatibility adjustments

- [ ] **Step 1: Write the failing test**

```tsx
// src/app/admin/admin-shell.test.tsx
it("uses one consistent admin frame and keeps the current module visible", () => {
  const html = renderToStaticMarkup(
    <AdminShell>
      <div>Body</div>
    </AdminShell>,
  );

  expect(html).toContain("Backoffice");
  expect(html).toContain("Administración");
  expect(html).toContain("Reservas");
  expect(html).toContain("Ocupación");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npm test -- src/app/admin/admin-shell.test.tsx
```
Expected: FAIL until the shell styling and responsive classes exist.

- [ ] **Step 3: Write the minimal implementation**

```css
/* src/app/admin/admin-shell.module.css */
.shell {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  min-height: 100vh;
  background: linear-gradient(180deg, #f4f0e7 0%, #eef1eb 48%, #e7ebe5 100%);
}

.sidebar {
  position: sticky;
  top: 0;
  min-height: 100vh;
  border-right: 1px solid rgba(21, 40, 34, 0.08);
  background: rgba(250, 248, 242, 0.96);
}

.surface {
  display: grid;
  gap: 20px;
  padding: 24px;
}

@media (max-width: 960px) {
  .shell {
    grid-template-columns: 1fr;
  }
  .sidebar {
    min-height: auto;
    position: relative;
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npm test -- src/app/admin/admin-shell.test.tsx src/app/admin/reservations/page.test.tsx src/app/admin/reservations/occupancy/page.test.tsx
npm run typecheck
```
Expected: PASS with consistent admin shell styling and no route regressions.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/admin-shell.module.css src/app/admin/admin-shell.test.tsx src/app/admin/reservations/reservations.module.css
git commit -m "feat: normalize admin shell styling"
```

## Self-Review Checklist

- The plan covers a single `/admin` shell, not the public site.
- The admin navigation is defined once and reused everywhere.
- `Reservas` and `Ocupación` stop carrying duplicated module-switch chrome.
- The shell is compact, operational, and responsive.
- The file boundaries stay small and focused.
- Tests verify the shell, active module, and route integration.
