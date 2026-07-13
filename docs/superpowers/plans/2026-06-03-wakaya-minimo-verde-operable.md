# Wakaya Minimo Verde Operable Implementation Plan

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Indice de documentacion](../../README.md)
- Siguiente: [Indice de documentacion](../../README.md)
<!-- nav-guided:end -->


> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Leave the repo in a minimum operable green state by clearing `check:trace-drift`, restoring `npm run typecheck`, restoring `npm run build`, and rerunning `npm run check:project` on a more truthful baseline.

**Architecture:** Execute one short hardening pass in three slices: normalize traceability data and parser behavior first, then fix the TypeScript/build blockers in the public reservation baseline, then rerun the governance/build evidence set without widening into constitution or gate-canon work.

**Tech Stack:** Node.js scripts, Next.js 16 App Router, TypeScript 6, React 19, Vitest 4, Zod 4

---

## File Map

- `TRACEABILITY_MATRIX.md`
  - Global rollup that still publishes stale placeholders and contradicts the feature-level traceability file.
- `specs/001-reservations/traceability.md`
  - Current feature-level source of truth for implemented RF/RNF links; only touch if formatting needs explicit normalization.
- `ci/scripts/check-trace-drift.mjs`
  - Drift validator that currently treats comma-separated `codigo` and `test` cells as one literal string.
- `src/app/api/public/reservations/route.ts`
  - Public reservation POST handler with an unsafe spread over `unknown`.
- `src/app/api/public/reservations/route.test.ts`
  - Existing API regression test for the public reservation endpoint.
- `src/components/public-site/play-header.tsx`
  - Public prototype header using `next/link` for hash anchors, which conflicts with typed routes.
- `src/components/public-site/play-header.test.tsx`
  - New lightweight render regression for the hash-anchor navigation.
- `src/lib/i18n.ts`
  - Unused baseline scaffold that currently imports `next-intl/server` without the dependency being installed.
- `src/lib/pii-redact.ts`
  - Shared redaction utility with a `String.replace` callback typing mismatch.
- `tests/unit/pii-redact.test.ts`
  - Existing regression suite for the redaction utility.
- `tests/contract/resource.pact.test.ts`
  - Pact baseline test using a matcher not exported by the installed Pact version.
- `next.config.mjs`
  - Next.js config still using `experimental.typedRoutes` instead of the top-level `typedRoutes`.

### Task 1: Normalize Traceability Data and Drift Parsing

**Files:**
- Modify: `TRACEABILITY_MATRIX.md`
- Modify: `ci/scripts/check-trace-drift.mjs`
- Optional normalize-only: `specs/001-reservations/traceability.md`
- Test: `npm run check:trace-drift`

- [ ] **Step 1: Capture the current red state for trace drift**

Run:

```bash
npm run check:trace-drift
```

Expected:

```text
DRIFT: 12 trace links apuntan a artefactos que no existen.
```

The output should include both real placeholders (`reservationQueryService`, `reservationQueryTest`) and comma-joined file lists that are currently being misread as one path.

- [ ] **Step 2: Replace the stale global traceability rollup with real implemented links**

Update `TRACEABILITY_MATRIX.md` to stop advertising placeholder artifacts and to mirror the implemented `001-reservations` links that already exist in the repo.

Write:

```md
# TRACEABILITY_MATRIX

> Matriz global de trazabilidad: rollup de todas las features del proyecto.
> Cada feature mantiene su propio `traceability.md` dentro de `specs/` con el detalle;
> este archivo consolida la vista. `node scripts/ai-framework-agent.mjs sync-memory`
> parsea este archivo y las `traceability.md` por feature para poblar la memoria.

## Matriz global
| Feature | RF | HU | UX/SPDD | Prototipo | API | BD | Codigo | Test | Estado | Evidencia |
|---|---|---|---|---|---|---|---|---|---|---|
| 001-reservations | RF-01 | HU-01 | spdd-frontend.md | prototype-html5/index.html | GET /api/reservations | reservation, bungalow, reservation_occupancy | src/lib/reservations/store.ts, src/app/api/reservations/route.ts | src/app/api/reservations/route.test.ts, src/lib/reservations/persistence.test.ts | Implementado y validado | specs/001-reservations/prototype-validation.md |
| 001-reservations | RF-02 | HU-01 | spdd-frontend.md | prototype-html5/index.html | GET /api/reservations/{id} | reservation, reservation_audit | src/lib/reservations/store.ts, src/app/api/reservations/[id]/route.ts | src/app/api/reservations/[id]/route.test.ts | Implementado y validado | specs/001-reservations/prototype-validation.md |
| 001-reservations | RF-03 | HU-02 | spdd-frontend.md | prototype-html5/index.html | POST /api/reservations/{id}/assign | reservation, bungalow, reservation_audit | src/lib/reservations/store.ts, src/app/api/reservations/[id]/assign/route.ts | src/app/api/reservations/[id]/assign/route.test.ts | Implementado y validado | specs/001-reservations/reglas-negocio-estados-criterios.md |
| 001-reservations | RF-04 | HU-02 | spdd-frontend.md | prototype-html5/index.html | POST /api/reservations/{id}/status | reservation, reservation_audit | src/lib/reservations/state-machine.ts, src/lib/reservations/store.ts, src/app/api/reservations/[id]/status/route.ts | src/app/api/reservations/[id]/status/route.test.ts, tests/unit/reservations/state-machine.test.ts | Implementado y validado | specs/001-reservations/reglas-negocio-estados-criterios.md |
| 001-reservations | RF-05 | HU-03 | spdd-frontend.md | prototype-html5/index.html | GET /api/reservations/{id}/audit | reservation_audit | src/lib/reservations/audit.ts, src/lib/reservations/store.ts, src/app/api/reservations/[id]/audit/route.ts | src/app/api/reservations/[id]/audit/route.test.ts | Implementado y validado | specs/001-reservations/prototype-validation.md |
| 001-reservations | RF-06 | HU-04 | spdd-frontend.md | prototype-html5/index.html | POST /api/public/reservations | reservation, bungalow, reservation_occupancy | src/components/public-site/booking-band.tsx, src/lib/reservations/store.ts, src/app/api/public/reservations/route.ts | src/app/api/public/reservations/route.test.ts, src/lib/reservations/persistence.test.ts | Implementado y validado | specs/001-reservations/prototype-validation.md |
| 001-reservations | RNF-01 | HU-01 | spdd-frontend.md | prototype-html5/index.html | 401/403 | rbac | src/lib/rbac.ts, src/middleware/authn.ts | src/middleware/authn.test.ts | Implementado y validado | docs/fase-3-arquitectura/03.08-auth-authz.md |

## Estado de gates por feature
| Feature | Gate | Estado | Evidencia |
|---|---|---|---|
| 001-reservations | gate-0-1 | Pendiente | docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md |
| 001-reservations | gate-prototype-ready | Pendiente | specs/001-reservations/prototype-validation.md |
| 001-reservations | gate-spdd-approved | Pendiente | specs/001-reservations/spdd-frontend.md |
| 002-public-site | gate-prototype-ready | Pendiente | specs/002-public-site/prototype-validation.md |
| 002-public-site | gate-spdd-approved | Pendiente | specs/002-public-site/spdd-frontend.md |

## Requerimientos sin implementacion
- `001-reservations` ya tiene codigo y test enlazados en su matriz viva.
- `002-public-site` sigue en diseno SPDD y no se incluye aqui como implementacion productiva.

## Decisiones transversales
- Markdown es la fuente de verdad; la BD es un indice reconstruible.

## Preguntas abiertas globales
- Confirmar cuando `002-public-site` deja de ser prototipo y pasa a cobertura productiva.
```

- [ ] **Step 3: Teach the drift validator to validate comma-separated code/test refs one by one**

Refactor `ci/scripts/check-trace-drift.mjs` so it reports only the invalid tokens inside a multi-value cell instead of treating the entire cell as one literal path.

Replace the link loop and target validation helpers with:

```js
const issues = [];
for (const link of links) {
  const invalidTargets = findInvalidTargets(link);
  if (invalidTargets.length > 0) {
    issues.push({
      ...link,
      target_ref: invalidTargets.join(", "),
    });
  }
}

if (issues.length === 0) {
  console.log(`OK. ${links.length} trace links validados; cero drift.`);
  process.exit(0);
}

console.error(`DRIFT: ${issues.length} trace links apuntan a artefactos que no existen.`);
for (const link of issues) {
  console.error(`  ${link.source_ref} --${link.target_type}--> ${link.target_ref}`);
}
process.exit(1);

function findInvalidTargets(link) {
  const targets = splitTargetRefs(link.target_ref);
  if (targets.length === 0 || (targets.length === 1 && targets[0] === "-")) {
    return [];
  }
  return targets.filter((target) => !validateSingleTarget(link.target_type, target));
}

function splitTargetRefs(targetRef) {
  return String(targetRef || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function validateSingleTarget(targetType, target) {
  switch (targetType) {
    case "codigo":
    case "test": {
      const needle = target.toLowerCase();
      return sourceFiles.some((f) => {
        const fname = basename(f).toLowerCase();
        return (
          fname.includes(needle.replace(/\..*$/, "")) ||
          f.toLowerCase().endsWith(needle)
        );
      });
    }
    case "api": {
      const needle = target.replace(/^\w+\s+/, "").toLowerCase();
      return (
        allMd.some((f) => readFileSafe(f).toLowerCase().includes(needle)) ||
        allApiSpecs.some((f) => readFileSafe(f).toLowerCase().includes(needle))
      );
    }
    case "bd": {
      const needle = target.split(/[\s(]/)[0].toLowerCase();
      return (
        allMd.some((f) => readFileSafe(f).toLowerCase().includes(needle)) ||
        sourceFiles.some((f) => readFileSafe(f).toLowerCase().includes(needle))
      );
    }
    case "prototipo":
    case "spdd":
    case "sdd":
    case "product-design":
    case "pantalla":
    case "componente": {
      const needle = target.toLowerCase();
      return (
        existsSafe(join(root, target)) ||
        allMd.some((f) => readFileSafe(f).toLowerCase().includes(needle))
      );
    }
    default:
      return true;
  }
}
```

Do not broaden the parser beyond explicit comma splitting in this task.

- [ ] **Step 4: Re-run the focused drift check**

Run:

```bash
npm run check:trace-drift
```

Expected:

```text
OK. 
```

The command should stop reporting the old placeholders and should no longer flag valid comma-separated `codigo`/`test` cells as drift.

- [ ] **Step 5: Commit the traceability slice**

Run:

```bash
git add TRACEABILITY_MATRIX.md ci/scripts/check-trace-drift.mjs
git commit -m "fix: normalize trace drift inputs"
```

Expected:

```text
A new commit is created with subject: fix: normalize trace drift inputs
```

### Task 2: Repair the Public Reservation Baseline Type Errors

**Files:**
- Modify: `src/components/public-site/play-header.tsx`
- Create: `src/components/public-site/play-header.test.tsx`
- Modify: `src/app/api/public/reservations/route.ts`
- Test: `npx vitest run src/components/public-site/play-header.test.tsx src/app/api/public/reservations/route.test.ts`
- Verify: `npm run typecheck`

- [ ] **Step 1: Capture the current TypeScript red state for the route and header**

Run:

```bash
npm run typecheck
```

Expected excerpt:

```text
src/app/api/public/reservations/route.ts(13,7): error TS2698
src/components/public-site/play-header.tsx(41,36): error TS2769
```

Do not try to clear the other TypeScript errors in this step.

- [ ] **Step 2: Add a render regression for the public header and switch hash navigation away from `next/link`**

Create `src/components/public-site/play-header.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PlayHeader } from "./play-header";

describe("PlayHeader", () => {
  it("renders hash anchors for the prototype navigation", () => {
    const html = renderToStaticMarkup(<PlayHeader />);

    expect(html).toContain('href="#home"');
    expect(html).toContain('href="#booking"');
    expect(html).toContain("Consultar");
  });
});
```

Update `src/components/public-site/play-header.tsx`:

```tsx
'use client';

import { useState } from 'react';

import styles from './public-site-theme.module.css';

const navItems = [
  { label: 'Inicio', href: '#home' },
  { label: 'Bungalows', href: '#bungalows' },
  { label: 'Experiencias', href: '#activities' },
  { label: 'Eventos', href: '#events' },
];

export function PlayHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.brandMark}>W</span>
        <div className={styles.brandCopy}>
          <small>Pucallpa · Perú</small>
          <strong>Wakaya Ecolodge</strong>
        </div>
      </div>

      <button
        className={styles.menuButton}
        type="button"
        aria-expanded={open}
        aria-label="Abrir navegación"
        onClick={() => setOpen((value) => !value)}
      >
        <span />
      </button>

      <div className={`${styles.navWrap} ${open ? styles.navOpen : ''}`}>
        <nav className={styles.nav} aria-label="Navegación del prototipo público">
          {navItems.map((item) => (
            <a key={item.label} href={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </a>
          ))}
        </nav>

        <a className={styles.headerCta} href="#booking" onClick={() => setOpen(false)}>
          Consultar
        </a>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Guard the public reservation payload before spreading it into Zod input**

Update `src/app/api/public/reservations/route.ts`:

```ts
import { NextResponse } from "next/server";

import { failureResponse, readJsonBody } from "@/lib/reservations/http";
import { reservationCreateSchema } from "@/lib/reservations/schemas";
import { nextReservationNumber } from "@/lib/reservations/numbering";
import { reservationStore } from "@/lib/reservations/store";

function asObjectPayload(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export async function POST(request: Request) {
  try {
    const rawBody = await readJsonBody<unknown>(request);
    const payload = asObjectPayload(rawBody);
    const number = nextReservationNumber(reservationStore.list());
    const parsed = reservationCreateSchema.parse({
      ...payload,
      number,
      channel: "web",
    });

    const result = reservationStore.create({
      ...parsed,
      channel: "web",
      responsibleId: null,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return failureResponse(error);
  }
}
```

- [ ] **Step 4: Run the focused regressions and the narrowed typecheck**

Run:

```bash
npx vitest run src/components/public-site/play-header.test.tsx src/app/api/public/reservations/route.test.ts
npm run typecheck
```

Expected:

```text
Test Files  2 passed
```

And the previous `route.ts` / `play-header.tsx` TypeScript errors should disappear from the `typecheck` output, even if other files still fail.

- [ ] **Step 5: Commit the public baseline slice**

Run:

```bash
git add src/components/public-site/play-header.tsx src/components/public-site/play-header.test.tsx src/app/api/public/reservations/route.ts
git commit -m "fix: restore public baseline type safety"
```

Expected:

```text
A new commit is created with subject: fix: restore public baseline type safety
```

### Task 3: Remove the Remaining TypeScript/Build Blockers

**Files:**
- Modify: `src/lib/i18n.ts`
- Modify: `src/lib/pii-redact.ts`
- Modify: `tests/contract/resource.pact.test.ts`
- Modify: `next.config.mjs`
- Test: `npx vitest run tests/unit/pii-redact.test.ts tests/contract/resource.pact.test.ts`
- Verify: `npm run typecheck`, `npm run build`

- [ ] **Step 1: Capture the remaining TypeScript red state after Task 2**

Run:

```bash
npm run typecheck
```

Expected excerpt:

```text
src/lib/i18n.ts(9,34): error TS2307
src/lib/pii-redact.ts(27,5): error TS2322
tests/contract/resource.pact.test.ts(9,25): error TS2339
```

- [ ] **Step 2: Replace the unused `next-intl` scaffold with a local locale helper and move `typedRoutes` to the supported config key**

Update `src/lib/i18n.ts`:

```ts
export const locales = ["es", "en", "pt"] as const;
export const defaultLocale = "es" as const;

export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
```

Update `next.config.mjs`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  typedRoutes: true,
};

export default nextConfig;
```

- [ ] **Step 3: Fix the redaction callback typing and align Pact with the installed matcher API**

Update `src/lib/pii-redact.ts`:

```ts
type PatternReplacement = readonly [RegExp, (...args: any[]) => string];

const PATTERN_REPLACEMENTS: PatternReplacement[] = [
  [
    /\b([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*@([A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/g,
    (_match, head, domain) => `${head}***@${domain}`,
  ],
  [
    /\b(?:\d[ -]?){13,19}\b/g,
    (match) => `[REDACTED:CARD:${match.replace(/\D/g, "").slice(-4)}]`,
  ],
  [
    /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
    () => "[REDACTED:JWT]",
  ],
];
```

Update `tests/contract/resource.pact.test.ts`:

```ts
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import { describe, it, expect } from 'vitest';
import path from 'node:path';

const { like, eachLike, datetime, uuid } = MatchersV3;
const apiResourcePath = '/api/reservations'.startsWith('__') ? '/api/resource' : '/api/reservations';
const apiResourcePlural = 'reservations'.startsWith('__') ? 'resources' : 'reservations';
const webComponentName = 'wakaya-erp-web'.startsWith('__') ? 'web' : 'wakaya-erp-web';
const apiServiceName = 'wakaya-erp-api'.startsWith('__') ? 'api' : 'wakaya-erp-api';

const provider = new PactV3({
  consumer: webComponentName,
  provider: apiServiceName,
  dir: path.resolve(__dirname, '../../pacts'),
  logLevel: 'warn',
});

describe(`Pact contract: list ${apiResourcePlural}`, () => {
  it('returns a paginated list', async () => {
    provider
      .given(`there are active ${apiResourcePlural}`)
      .uponReceiving(`GET ${apiResourcePath}?status=open`)
      .withRequest({
        method: 'GET',
        path: apiResourcePath,
        query: { status: 'open' },
        headers: { Accept: 'application/json' },
      })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          items: eachLike({
            id: uuid(),
            status: like('open'),
            updatedAt: datetime("yyyy-MM-dd'T'HH:mm:ssXXX", '2026-07-20T10:30:00Z'),
          }),
          page: like(1),
          pageSize: like(20),
          total: like(42),
        },
      });

    await provider.executeTest(async (mockserver) => {
      const res = await fetch(
        `${mockserver.url}${apiResourcePath}?status=open`,
        { headers: { Accept: 'application/json' } },
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items.length).toBeGreaterThan(0);
    });
  });
});
```

- [ ] **Step 4: Run the focused shared regressions**

Run:

```bash
npx vitest run tests/unit/pii-redact.test.ts tests/contract/resource.pact.test.ts
```

Expected:

```text
Test Files  2 passed
```

- [ ] **Step 5: Re-run the full local baseline checks**

Run:

```bash
npm run typecheck
npm run build
```

Expected:

```text
TypeScript: no errors
Next.js build: Compiled successfully
```

The `experimental.typedRoutes` warning should be gone. A separate lockfile-root warning may still appear and does not belong to this slice.

- [ ] **Step 6: Commit the remaining baseline fixes**

Run:

```bash
git add src/lib/i18n.ts src/lib/pii-redact.ts tests/contract/resource.pact.test.ts next.config.mjs
git commit -m "fix: close remaining baseline blockers"
```

Expected:

```text
A new commit is created with subject: fix: close remaining baseline blockers
```

### Task 4: Rerun the Minimum Green Evidence Set

**Files:**
- No file edits in this task unless a new blocker needs documentation after the rerun
- Test: `npm run check:trace-drift`
- Test: `npm run check:project`
- Test: `npm run typecheck`
- Test: `npm run build`
- Optional confirm: `npm run test`

- [ ] **Step 1: Reconfirm trace drift is green**

Run:

```bash
npm run check:trace-drift
```

Expected:

```text
OK.
```

- [ ] **Step 2: Rerun the main governance pipeline**

Run:

```bash
npm run check:project
```

Expected:

```text
The command no longer stops at check:trace-drift.
```

Best case: the command passes. Acceptable case for this slice: it fails later on a different validator, which becomes the next trustworthy blocker.

- [ ] **Step 3: Reconfirm the local baseline**

Run:

```bash
npm run typecheck
npm run build
npm run test
```

Expected:

```text
typecheck: clean
build: passes
tests: 24 passed
```

- [ ] **Step 4: Stop and summarize the outcome without widening scope**

Record in the final handoff:

```text
- whether check:project passed completely or which validator failed next
- whether typecheck/build remained green after the full rerun
- that constitution and gate-canon work remain intentionally deferred
```

Do not start `CONSTITUTION.md`, `check:constitution`, or gate unification in this plan even if they become the next blockers.
