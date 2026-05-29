# Wakaya Design Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved Wakaya visual split: premium editorial public site plus calm, dense, operational reservations monitor.

**Architecture:** Keep the existing Next.js app and refine the two current surfaces instead of adding another frontend stack. Introduce a shared global shell for tokens and metadata, keep the public prototype as the hospitality experience, and keep the internal reservations monitor compact and status-driven. The two surfaces should share brand foundations but differ in composition, density, and emotional tone.

**Tech Stack:** Next.js 16, React 19, TypeScript 6, CSS Modules, App Router, Vitest, Playwright.

---

## File Map

- `src/app/globals.css` — shared tokens, body background, base typography, and common focus treatment.
- `src/app/layout.tsx` — app metadata and global shell import.
- `src/app/page.tsx` — small launcher page that points to the public prototype and internal monitor.
- `src/app/layout.test.tsx` and `src/app/page.test.tsx` — shell and launcher regression tests.
- `src/app/prototype/public-site/page.tsx` — premium hospitality prototype.
- `src/components/public-site/public-site-theme.module.css` — public-facing theme, spacing, hero, booking bar, cards, and editorial rhythm.
- `e2e/public-site-prototype.spec.ts` — browser smoke for the public route.
- `src/app/admin/reservations/page.tsx` — reservations list / monitor.
- `src/app/admin/reservations/[id]/page.tsx` — reservation detail, actions, and audit trail.
- `src/app/admin/reservations/reservations.module.css` — operational theme, badges, table density, and form styling.
- `e2e/admin-reservations.spec.ts` — browser smoke for the internal monitor.

## Task 1: Shared shell and launcher

**Files:**
- Create: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Create: `src/app/layout.test.tsx`
- Modify: `src/app/page.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import RootLayout from "./layout";
import HomePage from "./page";

describe("Wakaya shell", () => {
  it("exposes a branded root shell", () => {
    const html = renderToStaticMarkup(<RootLayout>{<div>slot</div>}</RootLayout>);

    expect(html).toContain('lang="es"');
    expect(html).toContain("Wakaya");
  });

  it("shows a launcher to the public site and monitor", () => {
    const html = renderToStaticMarkup(<HomePage />);

    expect(html).toContain("/prototype/public-site");
    expect(html).toContain("/admin/reservations");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- 'src/app/layout.test.tsx' 'src/app/page.test.tsx'`

Expected: fail because the root shell still uses scaffold defaults and the home page does not yet expose the split launcher.

- [ ] **Step 3: Write the minimal implementation**

`src/app/layout.tsx`

```tsx
import "./globals.css";

export const metadata = {
  title: "Wakaya",
  description: "Wakaya hospitality site and reservations monitor",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
```

`src/app/page.tsx`

```tsx
export default function HomePage() {
  return (
    <main>
      <h1>Wakaya</h1>
      <p>Public hospitality site and internal reservations monitor.</p>
      <nav>
        <a href="/prototype/public-site">Open public site prototype</a>
        <a href="/admin/reservations">Open reservations monitor</a>
      </nav>
    </main>
  );
}
```

`src/app/globals.css`

```css
:root {
  color-scheme: light;
  --wakaya-bg: #f7f1e7;
  --wakaya-surface: rgba(255, 252, 247, 0.9);
  --wakaya-text: #17362f;
  --wakaya-muted: #6e6256;
  --wakaya-line: rgba(69, 52, 35, 0.12);
  --wakaya-accent: #efad1a;
  --wakaya-forest: #28473e;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  min-height: 100%;
  background: var(--wakaya-bg);
  color: var(--wakaya-text);
  font-family: "Avenir Next", "Inter", "Segoe UI", sans-serif;
}

a {
  color: inherit;
}

button,
input,
select,
textarea {
  font: inherit;
}

:focus-visible {
  outline: 3px solid var(--wakaya-accent);
  outline-offset: 3px;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- 'src/app/layout.test.tsx' 'src/app/page.test.tsx'`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx src/app/layout.test.tsx src/app/page.tsx src/app/page.test.tsx
git commit -m "feat: add wakaya shared shell and launcher"
```

## Task 2: Public hospitality surface

**Files:**
- Modify: `src/app/prototype/public-site/page.tsx`
- Modify: `src/components/public-site/public-site-theme.module.css`
- Modify: `e2e/public-site-prototype.spec.ts`
- Update as needed: `src/app/prototype/public-site/page.test.tsx`

- [ ] **Step 1: Write the failing browser smoke**

```ts
import { expect, test } from "@playwright/test";

test.describe("public site prototype route", () => {
  test("renders the editorial hospitality surface", async ({ page }) => {
    await page.goto("/prototype/public-site");

    await expect(page.getByRole("heading", { level: 1, name: /respira la naturaleza/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /consultar disponibilidad/i })).toBeVisible();
    await expect(page.getByText(/Bungalow Suite/i)).toBeVisible();
    await expect(page.getByText(/Eventos/i)).toBeVisible();
    await expect(page.getByText(/Full Day/i)).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test:e2e -- e2e/public-site-prototype.spec.ts`

Expected: fail until the public prototype consistently reflects the approved editorial surface and copy.

- [ ] **Step 3: Write the minimal implementation**

Update `src/components/public-site/public-site-theme.module.css` with the public direction:

```css
.page {
  --bg: #f7f1e7;
  --surface: rgba(255, 252, 247, 0.9);
  --text: #17362f;
  --muted: #6e6256;
  --accent: #efad1a;
  --forest: #28473e;
  background:
    radial-gradient(circle at top left, rgba(244, 183, 58, 0.18), transparent 24%),
    linear-gradient(180deg, #fbf6ef 0%, var(--bg) 40%, #f2eadf 100%);
  color: var(--text);
}
```

Keep `src/app/prototype/public-site/page.tsx` aligned with the approved direction:

```tsx
<span className={styles.heroKicker}>Pucallpa · agua · madera · descanso</span>
<h1>Respira la naturaleza sin salir del confort.</h1>
<a className={styles.primaryButton} href="#booking">Consultar disponibilidad</a>
```

Keep the section order and hierarchy explicit:

```tsx
<section id="booking">...</section>
<section id="bungalows">...</section>
<section id="activities">...</section>
<section id="events">...</section>
<section id="full-day">...</section>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test:e2e -- e2e/public-site-prototype.spec.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/prototype/public-site/page.tsx src/components/public-site/public-site-theme.module.css e2e/public-site-prototype.spec.ts src/app/prototype/public-site/page.test.tsx
git commit -m "feat: refine wakaya public hospitality surface"
```

## Task 3: Internal reservations monitor

**Files:**
- Modify: `src/app/admin/reservations/page.tsx`
- Modify: `src/app/admin/reservations/[id]/page.tsx`
- Modify: `src/app/admin/reservations/reservations.module.css`
- Create: `e2e/admin-reservations.spec.ts`
- Update as needed: `src/app/admin/reservations/page.test.tsx`, `src/app/admin/reservations/[id]/page.test.tsx`

- [ ] **Step 1: Write the failing browser smoke**

```ts
import { expect, test } from "@playwright/test";

test.describe("reservations monitor", () => {
  test("shows the operational list and detail views", async ({ page }) => {
    await page.goto("/admin/reservations");

    await expect(page.getByRole("heading", { name: /mini monitor de reservas/i })).toBeVisible();
    await expect(page.getByText("RESERVATION-2026-0001")).toBeVisible();

    await page.goto("/admin/reservations/reservation-demo-1");

    await expect(page.getByRole("heading", { name: /RESERVATION-2026-0001/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /asignar bungalow/i })).toBeVisible();
    await expect(page.getByText(/Auditoría/i)).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test:e2e -- e2e/admin-reservations.spec.ts`

Expected: fail until the internal monitor consistently presents the dense operational layout and the detail page actions.

- [ ] **Step 3: Write the minimal implementation**

Keep the list and detail pages readable and operational:

```tsx
<span className={statusClass(item.status)}>{STATUS_LABELS[item.status]}</span>
<div className={styles.muted}>{item.status}</div>
```

Keep the action area compact and explicit:

```tsx
<button className={styles.button} type="submit" disabled={!assignEnabled}>
  Asignar bungalow
</button>
```

Keep the audit trail visible on the detail page:

```tsx
<ul className={styles.auditList}>
  {auditTrail.map((item) => (
    <li key={item.id} className={styles.auditItem}>
      <div className={styles.auditMeta}>
        <span>{item.createdAt}</span>
        <span>{item.actorId}</span>
        <span>{item.action}</span>
      </div>
    </li>
  ))}
</ul>
```

Update `src/app/admin/reservations/reservations.module.css` so the internal monitor stays calm, dense, and readable:

```css
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 0.84rem;
  font-weight: 700;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test:e2e -- e2e/admin-reservations.spec.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/reservations/page.tsx src/app/admin/reservations/[id]/page.tsx src/app/admin/reservations/reservations.module.css e2e/admin-reservations.spec.ts src/app/admin/reservations/page.test.tsx src/app/admin/reservations/[id]/page.test.tsx
git commit -m "feat: refine wakaya reservations monitor"
```

## Task 4: Browser QA and acceptance

**Files:**
- Modify: `tests/e2e/README.md` only if a short run instruction is needed
- Use: `e2e/public-site-prototype.spec.ts`, `e2e/admin-reservations.spec.ts`
- Use: `src/app/layout.test.tsx`, `src/app/page.test.tsx`, `src/app/prototype/public-site/page.test.tsx`, `src/app/admin/reservations/page.test.tsx`, `src/app/admin/reservations/[id]/page.test.tsx`

- [ ] **Step 1: Run the focused unit suite**

Run:

```bash
npm run test -- 'src/app/layout.test.tsx' 'src/app/page.test.tsx' 'src/app/prototype/public-site/page.test.tsx' 'src/app/admin/reservations/page.test.tsx' 'src/app/admin/reservations/[id]/page.test.tsx'
```

Expected: PASS.

- [ ] **Step 2: Run the focused browser smoke**

Run:

```bash
AUTH_DEV_BYPASS=true npm run test:e2e -- e2e/public-site-prototype.spec.ts e2e/admin-reservations.spec.ts
```

Expected: PASS.

- [ ] **Step 3: Verify what remains out of scope**

Do not treat the repo-wide `npm run typecheck` as the acceptance gate for this slice. The repository currently has unrelated type errors in `src/components/public-site/play-header.tsx`, `src/lib/i18n.ts`, `src/lib/pii-redact.ts`, and `tests/contract/resource.pact.test.ts`. Those are separate cleanup items and should not block the Wakaya design split.

- [ ] **Step 4: Commit**

```bash
git add e2e/admin-reservations.spec.ts e2e/public-site-prototype.spec.ts src/app/layout.tsx src/app/page.tsx src/app/globals.css src/app/prototype/public-site/page.tsx src/components/public-site/public-site-theme.module.css src/app/admin/reservations/page.tsx src/app/admin/reservations/[id]/page.tsx src/app/admin/reservations/reservations.module.css
git commit -m "feat: complete wakaya design split"
```
