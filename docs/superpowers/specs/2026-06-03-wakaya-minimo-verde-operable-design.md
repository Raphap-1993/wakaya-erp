# Wakaya Minimo Verde Operable Design

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Indice de documentacion](../../README.md)
- Siguiente: [Indice de documentacion](../../README.md)
<!-- nav-guided:end -->


Date: 2026-06-03
Status: Draft approved in conversation, pending final user review
Topic: Minimum operable green pass for governance drift and local baseline

## Objective

Define the smallest safe intervention that moves `wakaya-erp` from the current
hardening focus to a locally governable and buildable state.

This design does not try to close all governance debt. It only targets the
minimum slice required to make the current repo easier to trust and continue:

- unblock `check:trace-drift`
- restore `npm run typecheck`
- restore `npm run build`
- rerun `npm run check:project` with evidence that it progresses beyond the
  current first blocker

## Active Context

The repo is currently in a hardening focus, not in a safe state for new feature
construction.

Current verified state:

- `npm run test` passes
- `npm run typecheck` fails
- `npm run build` fails after compilation during TypeScript
- `npm run check:project` fails immediately in `check:trace-drift`
- governance docs and validators still contain broader inconsistencies that are
  intentionally deferred out of this slice

This design follows the active focus documented in:

- `AI_CONTEXT.md`
- `docs/superpowers/plans/2026-06-02-wakaya-local-readiness-handoff.md`
- `docs/superpowers/audits/2026-06-03-wakaya-governance-audit-active-focus.md`

## Scope

### In scope

1. Normalize traceability so the pipeline can evaluate the current repo using
   real file references instead of stale placeholders or parser-hostile cells.
2. Fix the current TypeScript and build breakages in the live baseline.
3. Re-run the minimum evidence set and record the resulting state.

### Out of scope

- `CONSTITUTION.md`
- wiring `check:constitution` into `check:project`
- unifying the canon of gates across docs and scripts
- broad cleanup of all legacy domain/stack residues
- new feature work in public site or internal monitor

## Chosen Approach

Use a short combined hardening pass in three ordered slices:

1. `trace-drift`
2. `typecheck/build`
3. verification rerun

This order is intentional.

If TypeScript is fixed first, the main governance pipeline still remains blocked
at the first step and gives little operational value. If traceability is fixed
first, the repo gets a more truthful governance signal before code-level
baseline work is validated.

## Slice A - Trace Drift

### Problem

The repo has two simultaneous issues in traceability:

- real drift still exists in the global rollup
- valid multi-file cells in `specs/001-reservations/traceability.md` are being
  treated as one literal string by the validator

That combination causes `npm run check:trace-drift` and therefore
`npm run check:project` to fail immediately.

### Design

Update both the data and the validator:

- refresh `TRACEABILITY_MATRIX.md` so it stops advertising old placeholders
  such as `reservationQueryService` and `reservationQueryTest`
- keep `specs/001-reservations/traceability.md` as the feature-level source of
  truth for current code/test links
- teach `ci/scripts/check-trace-drift.mjs` to split comma-separated entries for
  `codigo` and `test` targets before resolution

### Expected result

- real missing files still fail the check
- valid comma-separated paths stop producing false negatives
- `npm run check:trace-drift` becomes a useful signal instead of noisy blockage

## Slice B - Local Baseline

### Problem

The current buildable baseline is broken by a small set of discrete TypeScript
and config issues:

- unsafe spread over `unknown`
- hash anchors incompatible with typed routes
- missing `next-intl/server` dependency or unused baseline import
- incorrect replacer typing in PII redaction
- Pact matcher mismatch with installed version
- stale `experimental.typedRoutes` config

### Design

Fix only what is required for a clean local baseline, without widening scope
into UX or product behavior changes.

The implementation should:

- preserve the current public/internal split
- avoid introducing new dependencies unless they are truly required
- prefer simplifying or removing dead baseline scaffolding over adding more
  framework integration
- keep changes localized to the currently failing files

### Expected result

- `npm run typecheck` passes
- `npm run build` passes
- Next.js config warning about `typedRoutes` is removed

## Slice C - Verification and Closeout

### Minimum evidence set

After slices A and B, rerun:

- `npm run check:trace-drift`
- `npm run check:project`
- `npm run typecheck`
- `npm run build`

Optional but useful confirmation:

- `npm run test`

### Success condition

This slice is successful if:

- `check:trace-drift` is green
- `typecheck` is green
- `build` is green
- `check:project` progresses beyond the current first blocker, ideally to green
  within this limited scope

## File Boundaries

Expected touch set:

- `TRACEABILITY_MATRIX.md`
- `specs/001-reservations/traceability.md` only if normalization is needed to
  keep formatting explicit and parser-safe
- `ci/scripts/check-trace-drift.mjs`
- `src/app/api/public/reservations/route.ts`
- `src/components/public-site/play-header.tsx`
- `src/lib/i18n.ts`
- `src/lib/pii-redact.ts`
- `tests/contract/resource.pact.test.ts`
- `next.config.mjs`
- canonical audit or handoff artifact only if the rerun result needs to be
  recorded formally

No other functional expansion should be mixed into this pass.

## Risks and Guardrails

### Risk 1

Fixing the trace parser could accidentally hide real drift.

Guardrail:

- only split explicit comma-separated values
- keep existing file-resolution behavior for each resulting token
- verify that stale placeholders still fail if left in place

### Risk 2

Fixing TypeScript by adding dependencies could widen scope.

Guardrail:

- prefer removing unused or template-only integrations before installing new
  packages

### Risk 3

`check:project` may continue failing on a later governance issue after
`trace-drift` is fixed.

Guardrail:

- that is acceptable in this slice as long as the pipeline advances and the new
  blocker is recorded accurately

## Exit Criteria

The design is complete when all of the following are true:

- traceability is normalized enough for `check:trace-drift` to be meaningful
- the repo is locally buildable via `typecheck` and `build`
- the combined rerun produces a trustworthy next blocker or a green result
- no constitution or gate-canon work is mixed into this slice

## Recommendation

Execute this as a single short hardening plan with three tasks that follow the
same sequence as the slices above.

Do not start broader governance refactors until this minimum operable green pass
is complete, because the repo still needs a trustworthy local baseline before
the larger methodological cleanup can be evaluated correctly.
