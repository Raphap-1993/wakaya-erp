# Evidence - Reservations Monitor UI

[README principal](../../README.md)

## Scope
Reservations monitor UI slice for `001-reservations`, including:
- server gate for `reservation:read`
- row-driven selection and deep-link fallback
- inline assign/status actions
- embedded audit timeline
- empty state and permission-aware feedback

## Verification
- `npm run typecheck`
- `npm test -- src/app/admin/reservations/page.test.tsx src/app/admin/reservations/reservations-query.test.ts src/app/admin/reservations/[id]/page.test.tsx`
- browser smoke on `http://localhost:3000/admin/reservations`

## Observed results
- The monitor renders the operational shell with filters, table, detail panel, inline actions, and embedded audit.
- Unauthorized access is rejected at the page boundary.
- Late responses from a previous reservation do not overwrite the currently selected panel.
- Audit entries refresh after successful inline mutations on the selected reservation.
- Empty and permission-blocked states are surfaced inline.

## Residual risks
- Browser automation in this sandbox hit Chromium launch constraints in Playwright, so the final visual smoke was done through the local browser surface instead of the Playwright runner.
- The feature still depends on the authenticated dev context for full interactive smoke of API-backed actions.

## Commit
- `79575a9` - `feat: harden reservations monitor ui`
