# Reservations Agenda Operativa Visible Pass Implementation Plan

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Indice de documentacion](../../README.md)
- Siguiente: [Indice de documentacion](../../README.md)
<!-- nav-guided:end -->


> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `specs/001-reservations/` from an auto-quality level-2 seed into a visibly product-like reception console centered on agenda, lateral detail, bungalow assignment, and embedded audit.

**Architecture:** Keep the work in prototype/SPDD mode. Update the feature design artifacts first, then rebuild the standalone HTML prototype around a split-view operational shell, and finally refresh validation/evidence so the slice is ready for human review through the prototype hub.

**Tech Stack:** Markdown specs, standalone HTML/CSS/vanilla JavaScript, Node-based quality validator (`ci/scripts/check-html5-prototype-quality.mjs`), ripgrep, git.

---

## File Map

- `specs/001-reservations/product-design.md`
  Responsibility: user problem, actor, journey, and success metrics for the approved reception slice.
- `specs/001-reservations/spdd-frontend.md`
  Responsibility: screens, states, components, and validations for the visible prototype pass.
- `specs/001-reservations/prototype.md`
  Responsibility: canonical summary of the HTML prototype, covered screens, and validation status.
- `specs/001-reservations/prototype-html5/decisiones-ux.md`
  Responsibility: approved interaction model, visual pattern, and constraints of the HTML prototype.
- `specs/001-reservations/prototype-html5/flujo.md`
  Responsibility: happy path, covered states, and data richness of the prototype.
- `specs/001-reservations/prototype-html5/index.html`
  Responsibility: standalone visible prototype that opens without build.
- `specs/001-reservations/prototype-validation.md`
  Responsibility: explicit readiness evidence and pending human-review status.
- `specs/001-reservations/ui-test-cases.md`
  Responsibility: slice-specific UX checks for the revised prototype.

### Task 1: Align The SPDD Narrative To The Approved Slice

**Files:**
- Modify: `specs/001-reservations/product-design.md`
- Modify: `specs/001-reservations/spdd-frontend.md`
- Modify: `specs/001-reservations/prototype.md`

- [ ] **Step 1: Capture the current generic placeholders as the failing baseline**

Run:

```bash
rg -n 'SUPUESTO|Dashboard/lista principal|Seguimiento o detalle|Operador\\.|Permission denied|centralizado a reservations' \
  specs/001-reservations/product-design.md \
  specs/001-reservations/spdd-frontend.md \
  specs/001-reservations/prototype.md
```

Expected: matches in all three files showing generic wording and placeholders that do not describe the approved `Recepción` slice.

- [ ] **Step 2: Replace `product-design.md` with the approved reception narrative**

Write this file content:

```md
# Product Design - Wakaya ERP

[README principal](../../../README.md) | [Specs](../../README.md)

## Problema
Recepción necesita operar llegadas, salidas y asignaciones de bungalow desde una sola superficie. Hoy la validación del contexto de la reserva, la asignación y la trazabilidad todavía no están materializadas en una experiencia visible del producto.

## Objetivo
Convertir el módulo de reservas en una consola diaria para Recepción que permita detectar reservas críticas, revisar el contexto de la estadía y asignar o reasignar bungalow con trazabilidad inmediata.

## Usuarios
- Recepción como actor principal.
- Supervisión como actor secundario para excepciones.
- Auditor como consumidor de trazabilidad.

## Journey
Ingresar a agenda del día -> filtrar reservas críticas -> seleccionar reserva -> revisar detalle lateral -> asignar o reasignar bungalow -> confirmar acción -> validar auditoría reciente.

## Hipótesis
Una agenda operativa con detalle lateral persistente reduce la ambigüedad operativa y acelera la asignación de bungalow en reservas con llegada inmediata.

## Métricas
- tiempo para asignar bungalow a reservas sin asignación,
- reservas críticas resueltas sin salir de la pantalla principal,
- reducción de consultas internas para confirmar el último cambio operativo.
```

- [ ] **Step 3: Replace `spdd-frontend.md` with concrete screens, states, and components**

Write this file content:

```md
# SPDD Frontend - Wakaya ERP

[README principal](../../../README.md) | [Specs](../../README.md)

## Flujo UX
Recepción abre la agenda operativa, filtra reservas del día, selecciona una reserva crítica, revisa el detalle lateral, asigna o reasigna bungalow y confirma la acción viendo la auditoría en la misma superficie.

## Pantallas
- Agenda operativa con filtros rápidos.
- Detalle lateral persistente de la reserva seleccionada.
- Confirmación corta de asignación o cambio operativo.
- Timeline resumido de auditoría dentro del detalle.
- Empty.
- Error.
- Acción bloqueada por conflicto o regla.

## Estados UI
- Loading.
- Empty.
- Error.
- Success.
- Bloqueado.

## Componentes previstos
- TopbarSearch.
- OperationsKpiStrip.
- QuickFilterBar.
- ReservationsAgendaList.
- ReservationRowBadge.
- ReservationDetailPanel.
- BungalowAssignmentModal.
- AuditTimeline.
- Toast.

## Validaciones visibles
- No permitir asignación si el bungalow entra en conflicto.
- Mostrar acción bloqueada cuando la reserva no cumple la regla operativa.
- Confirmar visualmente la asignación y reflejarla en la auditoría reciente.
```

- [ ] **Step 4: Rewrite `prototype.md` to describe the visible-product pass instead of the generic seed**

Write this file content:

```md
# Prototype - Wakaya ERP

[README principal](../../../README.md) | [Specs](../../README.md)

## Herramienta
HTML5-first por defecto. Penpot queda fuera de este slice salvo decisión posterior de formalización visual.

## Ruta HTML5
prototype-html5/index.html

## Link Penpot
No aplica en esta iteración.

## Pantallas cubiertas
- Agenda operativa de reservas del día.
- Filtros rápidos y filtros secundarios.
- Detalle lateral persistente.
- Confirmación corta de asignación o cambio operativo.
- Auditoría embebida en el detalle.
- Empty.
- Error.
- Acción bloqueada por conflicto.

## Estado
Listo para revisión visual humana una vez actualizado el HTML y rerun del quality checker.
```

- [ ] **Step 5: Verify the placeholders are gone and commit the docs slice**

Run:

```bash
rg -n 'SUPUESTO|Dashboard/lista principal|Seguimiento o detalle|Permission denied' \
  specs/001-reservations/product-design.md \
  specs/001-reservations/spdd-frontend.md \
  specs/001-reservations/prototype.md
```

Expected: no output.

Then commit:

```bash
git add \
  specs/001-reservations/product-design.md \
  specs/001-reservations/spdd-frontend.md \
  specs/001-reservations/prototype.md
git commit -m "docs: align reservations spdd slice to reception agenda"
```

### Task 2: Upgrade The Prototype UX Docs And Validation Narrative

**Files:**
- Modify: `specs/001-reservations/prototype-html5/decisiones-ux.md`
- Modify: `specs/001-reservations/prototype-html5/flujo.md`
- Modify: `specs/001-reservations/prototype-validation.md`
- Modify: `specs/001-reservations/ui-test-cases.md`

- [ ] **Step 1: Capture the current seed-only wording as the failing baseline**

Run:

```bash
rg -n 'SEED nivel 2|pendiente, regenerar|placeholder|Sin panel de detalle|Sin historial|PENDIENTE \\|' \
  specs/001-reservations/prototype-html5/decisiones-ux.md \
  specs/001-reservations/prototype-html5/flujo.md \
  specs/001-reservations/prototype-validation.md \
  specs/001-reservations/ui-test-cases.md
```

Expected: matches showing seed language, pending detail, placeholder screens, and validation rows still untouched.

- [ ] **Step 2: Rewrite `decisiones-ux.md` so it documents the approved interaction model**

Write this file content:

~~~~md
# Decisiones UX prototipo HTML5 — Wakaya ERP

## Decisión de patrón de producto

- Dominio del spec: consola operativa interna de reservas para Recepción.
- Actor principal: Recepción operando llegadas, salidas y asignaciones de bungalow día a día.
- Tarea principal navegable de inicio a fin: filtrar reservas críticas, abrir una reserva con llegada próxima, asignar o reasignar bungalow y validar la auditoría reciente en el mismo panel.
- Patrón visual elegido: split view operativo con topbar, franja de KPIs del día, agenda central y detalle lateral persistente.
- Por qué NO se usa una shell genérica sidenav+tabla: la asignación de bungalow necesita comparar lista y detalle sin cambiar de pantalla ni esconder la trazabilidad detrás de navegación secundaria.
- Interacciones del prototipo: filtrar reservas del día, seleccionar reserva, asignar bungalow, reasignar bungalow, registrar check-in, registrar check-out, revisar auditoría reciente.
- Limitaciones conocidas: no hay integración real con OIDC, motor de ocupación productivo ni persistencia real.

## Golden de referencia

- Path: `ejemplos/fase-2-ux-ui/prototype-html5-golden/saas-operativo/index.html`
- Por qué este golden: aporta densidad operativa, KPIs visibles y jerarquía útil para una consola interna, pero se reinterpretará con lenguaje hotelero y detalle lateral persistente.
- Patrones estructurales que voy a replicar: topbar persistente, franja de KPIs, filtros compactos, lista operativa y panel lateral accionable.
- Tokens base reutilizados de `:root`: `--brand`, `--brand-dark`, `--neutral-100`, `--neutral-200`, `--neutral-700`, `--success`, `--warning`, `--danger`.

## Estado del slice

Este prototipo deja de presentarse como seed genérico y pasa a una iteración visible de producto para revisión de stakeholders.
- Promesa del slice: Recepción puede detectar reservas críticas, validar contexto y asignar bungalow sin salir de la agenda.
- Señales obligatorias: lenguaje de reservas, bungalow visible, estado de pago, alertas operativas y auditoría reciente.

## Verificación

~~~sh
node ci/scripts/check-html5-prototype-quality.mjs --spec specs/001-reservations --strict
~~~
~~~~

- [ ] **Step 3: Rewrite `flujo.md`, `prototype-validation.md`, and `ui-test-cases.md` to match the new slice**

Write these file contents:

~~~~md
# Flujo prototipo HTML5 — Wakaya ERP

## Tarea principal recorrible (happy path)

~~~text
Agenda operativa del día
  └─ Filtro "Sin bungalow"
      └─ Selección de reserva con llegada hoy
          └─ Revisión de detalle lateral
              └─ Asignar bungalow
                  └─ Confirmar acción
                      └─ Ver auditoría actualizada
~~~

## Pantallas y estados cubiertos

| Vista | Cómo se llega | Estados cubiertos |
|---|---|---|
| Agenda operativa | URL inicial | success, loading, empty, error |
| Detalle lateral | click en una reserva | success, blocked |
| Confirmación de asignación | CTA principal del detalle | success, blocked |
| Auditoría embebida | bloque inferior del detalle | success |

## Estados UI

| Estado | Cómo se dispara |
|---|---|
| Loading | carga inicial de agenda |
| Empty | filtros sin coincidencias |
| Error | acción de demo para fallo de agenda |
| Success | asignación o cambio operativo confirmado |
| Blocked | conflicto de bungalow o regla operativa |

## Datos mock

12 reservas con mezcla de llegadas hoy, salidas hoy, reservas sin bungalow, huéspedes VIP, pagos pendientes y conflictos operativos.
~~~~

~~~~md
# Prototype Validation - Wakaya ERP

[README principal](../../../README.md) | [Specs](../../README.md)

## Validacion
| Criterio | Estado | Observacion |
|---|---|---|
| Flujo extremo a extremo entendible | LISTO PARA REVISION | Happy path agenda -> detalle -> asignación -> auditoría definido |
| Estados loading/empty/error/success claros | LISTO PARA REVISION | Deben quedar visibles en el HTML actualizado |
| Roles/permisos visibles | LISTO PARA REVISION | Recepción queda explícito como actor principal |
| Validaciones entendibles | LISTO PARA REVISION | Debe existir estado bloqueado por conflicto o regla |
| Navegacion funcional | LISTO PARA REVISION | La agenda y el detalle deben operar en la misma superficie |
| Feedback UX visible | LISTO PARA REVISION | Toast y actualización de auditoría tras acciones |
| Se puede abrir sin build | LISTO PARA REVISION | HTML standalone mantenido |
| Requiere formalizacion Penpot | NO | No aplica en esta iteración |

## Decision
PENDIENTE de validación humana explícita. El slice debe quedar listo para revisión en el hub del prototipo, pero no mover `gate-spdd-approved` sin revisión visual humana.

## Revision visual humana
- Resultado: pending
- Revisor: pendiente de asignar
- Fecha: pendiente
- Evidencia revisada: `specs/001-reservations/prototype-html5/index.html`
- Observaciones: la autoevaluación técnica no sustituye la revisión humana del slice visible.
~~~~

~~~~md
# UI Test Cases - Wakaya ERP

[README principal](../../../README.md) | [Specs](../../README.md)

| Caso | Estado esperado |
|---|---|
| Carga inicial de agenda | loading breve y luego agenda visible con KPIs del día |
| Filtro `Sin bungalow` | lista reducida a reservas sin asignación |
| Selección de reserva | detalle lateral refleja huésped, fechas, pago y bungalow |
| Asignación válida | confirmación corta, toast success y auditoría actualizada |
| Conflicto de bungalow | estado blocked con mensaje inline y sin mutar la fila |
| Error de agenda | mensaje seguro y botón de reintento |
| Filtros sin coincidencias | empty state y acción para limpiar filtros |
~~~~

- [ ] **Step 4: Verify the docs now describe a reviewable slice**

Run:

```bash
rg -n 'SEED nivel 2|pendiente, regenerar|placeholder|Sin panel de detalle|Sin historial' \
  specs/001-reservations/prototype-html5/decisiones-ux.md \
  specs/001-reservations/prototype-html5/flujo.md \
  specs/001-reservations/prototype-validation.md \
  specs/001-reservations/ui-test-cases.md
```

Expected: no output.

- [ ] **Step 5: Commit the UX-doc slice**

```bash
git add \
  specs/001-reservations/prototype-html5/decisiones-ux.md \
  specs/001-reservations/prototype-html5/flujo.md \
  specs/001-reservations/prototype-validation.md \
  specs/001-reservations/ui-test-cases.md
git commit -m "docs: define reservations prototype ux and validation"
```

### Task 3: Rebuild The HTML Prototype As A Reservation Console

**Files:**
- Modify: `specs/001-reservations/prototype-html5/index.html`

- [ ] **Step 1: Capture the generic seed markers as the failing baseline**

Run:

```bash
rg -n 'SEED nivel 2|Asunto|Responsable|Mis reservations|caso operativo|Supervisora|Listado operativo con filtros y detalle por registro' \
  specs/001-reservations/prototype-html5/index.html
```

Expected: matches generic seed language and non-hotel copy that must be removed.

- [ ] **Step 2: Replace the shell and copy with hotel-operational structure**

Update the main layout so it has:

- topbar with search by reservation/guest/bungalow
- KPI strip for hotel operations
- compact quick-filter zone at the top of the agenda panel
- center agenda list
- right persistent detail panel

Use these representative replacements:

```html
<div class="page-title">
  <div class="breadcrumb">Recepción · <span id="breadcrumbCurrent">Agenda del día</span></div>
  <h1 id="pageTitle">Agenda operativa de reservas</h1>
  <p>Control diario de llegadas, salidas, asignaciones y alertas de bungalow.</p>
</div>

<div class="kpi-row">
  <div class="kpi-card highlight"><div class="kpi-label">Llegadas hoy</div><div class="kpi-value">7</div><div class="kpi-delta up">2 sin bungalow</div></div>
  <div class="kpi-card"><div class="kpi-label">Salidas hoy</div><div class="kpi-value">4</div><div class="kpi-delta">1 late checkout</div></div>
  <div class="kpi-card"><div class="kpi-label">En casa</div><div class="kpi-value">18</div><div class="kpi-delta up">Ocupación 82%</div></div>
  <div class="kpi-card"><div class="kpi-label">Alertas</div><div class="kpi-value">3</div><div class="kpi-delta">2 pagos pendientes</div></div>
</div>
```

```html
<div class="workspace">
  <section class="agenda-panel">
    <div class="filter-bar">
      <button class="chip active" data-quick-filter="unassigned" onclick="setQuickFilter('unassigned')">Sin bungalow</button>
      <button class="chip" data-quick-filter="arrivals" onclick="setQuickFilter('arrivals')">Llegadas hoy</button>
      <button class="chip" data-quick-filter="departures" onclick="setQuickFilter('departures')">Salidas hoy</button>
      <button class="chip" data-quick-filter="payment" onclick="setQuickFilter('payment')">Pago pendiente</button>
      <button class="chip" data-quick-filter="inhouse" onclick="setQuickFilter('inhouse')">Alojados</button>
    </div>
    <div class="table-card">
      <table id="reservationsTable">
        <thead>
          <tr>
            <th>Reserva</th>
            <th>Huésped</th>
            <th>Estadía</th>
            <th>Bungalow</th>
            <th>Pago</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody id="tableBody"></tbody>
      </table>
      <div class="empty-state" id="emptyState" hidden></div>
      <div class="error-state" id="errorState" hidden></div>
    </div>
  </section>

  <aside class="detail-panel" id="detailPanel">
    <div class="detail-empty" id="detailEmpty">Selecciona una reserva para revisar asignación y auditoría.</div>
    <div class="detail-body" id="detailBody" hidden></div>
  </aside>
</div>
```

- [ ] **Step 3: Replace the generic mock rows with reservation data and domain renderers**

Replace the current records array and labels with a reservation-oriented shape:

```html
<script>
const RESERVATIONS = [
  {
    id: 'RES-240606-071',
    guest: 'Elena Vargas',
    status: 'confirmed',
    payment: 'pending',
    channel: 'Web',
    bungalow: null,
    arrival: '2026-06-06',
    departure: '2026-06-09',
    nights: 3,
    occupancy: '2 adultos',
    quick: ['arrivals', 'unassigned', 'payment'],
    alerts: ['Llegada hoy', 'Pago pendiente'],
    requests: ['Cuna', 'Late arrival'],
    audit: [
      { time: '08:10', actor: 'Web pública', action: 'Prereserva creada', delta: 'draft -> pending_review' },
      { time: '08:42', actor: 'Recepción', action: 'Reserva confirmada', delta: 'pending_review -> confirmed' },
    ],
  },
  {
    id: 'RES-240606-068',
    guest: 'Thomas Reed',
    status: 'in_house',
    payment: 'paid',
    channel: 'Agencia',
    bungalow: 'B-12',
    arrival: '2026-06-04',
    departure: '2026-06-07',
    nights: 3,
    occupancy: '2 adultos, 1 niño',
    quick: ['departures', 'inhouse'],
    alerts: ['VIP'],
    requests: ['Amenity premium'],
    audit: [
      { time: '09:00', actor: 'Recepción', action: 'Check-in registrado', delta: 'confirmed -> in_house' },
    ],
  },
];

const STATUS_LABELS = {
  pending_review: { label: 'Pending review', cls: 'badge-review' },
  confirmed: { label: 'Confirmada', cls: 'badge-confirmed' },
  in_house: { label: 'In house', cls: 'badge-house' },
  check_out_today: { label: 'Salida hoy', cls: 'badge-warning' },
  completed: { label: 'Finalizada', cls: 'badge-completed' },
};
</script>
```

And update table headers to:

```html
<tr>
  <th>Reserva</th>
  <th>Huésped</th>
  <th>Estadía</th>
  <th>Bungalow</th>
  <th>Pago</th>
  <th>Estado</th>
</tr>
```

- [ ] **Step 4: Verify the HTML now reads like the reservations product**

Run:

```bash
rg -n 'SEED nivel 2|Asunto|Responsable|Mis reservations|caso operativo|Supervisora' \
  specs/001-reservations/prototype-html5/index.html
```

Expected: no output.

Then run:

```bash
node ci/scripts/check-html5-prototype-quality.mjs --spec specs/001-reservations --strict
```

Expected: `RESULTADO: APROBADO` and level `2` or `3`.

- [ ] **Step 5: Commit the shell and data rewrite**

```bash
git add specs/001-reservations/prototype-html5/index.html
git commit -m "feat: rebuild reservations prototype shell"
```

### Task 4: Add Detail Interactions, Audit Feedback, And Final Evidence

**Files:**
- Modify: `specs/001-reservations/prototype-html5/index.html`
- Modify: `specs/001-reservations/prototype-validation.md`
- Modify: `specs/001-reservations/ui-test-cases.md`

- [ ] **Step 1: Capture the missing interaction behavior as the failing baseline**

Run:

```bash
rg -n 'showToast\\(.+detalle|handleNew|Exportación simulada|Abriendo detalle de .+implementa el panel de detalle' \
  specs/001-reservations/prototype-html5/index.html
```

Expected: matches the current placeholder handlers proving the detail panel and assignment flow are not implemented yet.

- [ ] **Step 2: Implement selection, detail render, blocked state, and confirmation modal**

Add detail rendering and action handlers with explicit reservation logic:

```html
<div class="modal-backdrop" id="assignModal" hidden>
  <div class="modal-card">
    <h3 id="assignTitle">Asignar bungalow</h3>
    <p id="assignSummary">Confirma la asignación para la reserva seleccionada.</p>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="closeAssignModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="confirmAssignment()">Confirmar asignación</button>
    </div>
  </div>
</div>
```

```js
let selectedReservationId = null;
let quickFilter = 'unassigned';
let pendingAssignment = null;

function selectReservation(id) {
  selectedReservationId = id;
  renderTable();
  renderDetail();
}

function renderDetail() {
  const item = RESERVATIONS.find((reservation) => reservation.id === selectedReservationId);
  const empty = document.getElementById('detailEmpty');
  const body = document.getElementById('detailBody');
  if (!item) {
    empty.hidden = false;
    body.hidden = true;
    body.innerHTML = '';
    return;
  }

  empty.hidden = true;
  body.hidden = false;
  body.innerHTML = `
    <div class="detail-header">
      <div>
        <p class="eyebrow">Reserva seleccionada</p>
        <h2>${item.guest}</h2>
        <p>${item.id} · ${item.channel}</p>
      </div>
      <span class="badge ${STATUS_LABELS[item.status].cls}">${STATUS_LABELS[item.status].label}</span>
    </div>
    <div class="detail-grid">
      <div><strong>Estadía</strong><span>${item.arrival} → ${item.departure}</span></div>
      <div><strong>Noches</strong><span>${item.nights}</span></div>
      <div><strong>Ocupación</strong><span>${item.occupancy}</span></div>
      <div><strong>Bungalow</strong><span>${item.bungalow ?? 'Sin asignar'}</span></div>
      <div><strong>Pago</strong><span>${item.payment}</span></div>
      <div><strong>Solicitudes</strong><span>${item.requests.join(', ')}</span></div>
    </div>
    <div class="detail-actions">
      <button class="btn btn-primary" onclick="openAssignModal()">${item.bungalow ? 'Reasignar bungalow' : 'Asignar bungalow'}</button>
      <button class="btn btn-secondary" onclick="registerCheckIn()" ${item.status !== 'confirmed' ? 'disabled' : ''}>Registrar check-in</button>
      <button class="btn btn-secondary" onclick="registerCheckOut()" ${item.status !== 'in_house' ? 'disabled' : ''}>Registrar check-out</button>
    </div>
    <div id="detailInlineState"></div>
    <section class="audit-card">
      <h3>Auditoría reciente</h3>
      <ul class="audit-list">
        ${item.audit.map((entry) => `<li><strong>${entry.time}</strong> ${entry.actor} · ${entry.action} <span>${entry.delta}</span></li>`).join('')}
      </ul>
    </section>
  `;
}
```

- [ ] **Step 3: Implement assignment success and conflict demo paths**

Use deterministic demo rules instead of fake generic toasts:

```js
function openAssignModal() {
  const item = RESERVATIONS.find((reservation) => reservation.id === selectedReservationId);
  if (!item) return;
  pendingAssignment = item.id;
  document.getElementById('assignTitle').textContent = item.bungalow ? 'Reasignar bungalow' : 'Asignar bungalow';
  document.getElementById('assignSummary').textContent = `Confirma la asignación de bungalow para ${item.guest}.`;
  document.getElementById('assignModal').hidden = false;
}

function confirmAssignment() {
  const item = RESERVATIONS.find((reservation) => reservation.id === pendingAssignment);
  if (!item) return;
  if (item.id === 'RES-240606-071' && item.bungalow === null) {
    item.bungalow = 'B-07';
    item.audit.unshift({
      time: '10:14',
      actor: 'Recepción',
      action: 'Bungalow asignado',
      delta: 'Sin asignar -> B-07',
    });
    closeAssignModal();
    renderTable();
    renderDetail();
    showToast('Bungalow B-07 asignado correctamente', 'success');
    return;
  }

  closeAssignModal();
  renderInlineBlocked('El bungalow sugerido entra en conflicto con otra estadía. Elige otro bungalow.');
}

function renderInlineBlocked(message) {
  const container = document.getElementById('detailInlineState');
  if (!container) return;
  container.innerHTML = `<div class="inline-blocked">${message}</div>`;
}
```

- [ ] **Step 4: Refresh the final evidence docs and rerun the validator**

After the interaction code works, tighten the evidence wording:

```md
## Revision visual humana
- Resultado: pending
- Revisor: pendiente de asignar
- Fecha: pendiente
- Evidencia revisada: `specs/001-reservations/prototype-html5/index.html`
- Observaciones: el prototipo queda listo para revisión por el hub con agenda operativa, detalle lateral, asignación y auditoría visible.
```

Then run:

```bash
node ci/scripts/check-html5-prototype-quality.mjs --spec specs/001-reservations --strict
git diff -- specs/001-reservations
```

Expected:

- validator returns `RESULTADO: APROBADO`
- diff shows only the planned SPDD and prototype files

- [ ] **Step 5: Commit the interaction pass**

```bash
git add \
  specs/001-reservations/prototype-html5/index.html \
  specs/001-reservations/prototype-validation.md \
  specs/001-reservations/ui-test-cases.md
git commit -m "feat: add reservations detail and assignment interactions"
```

## Self-Review Checklist

- [ ] `product-design.md` names `Recepción` as the primary actor.
- [ ] `spdd-frontend.md` no longer mentions `Permission denied` as a required visible screen for this slice.
- [ ] `prototype.md` says the HTML pass is ready for human review, not approved.
- [ ] `decisiones-ux.md` and `flujo.md` no longer present the work as a seed regeneration note.
- [ ] `index.html` no longer contains `Asunto`, `Responsable`, `Mis reservations`, or `caso operativo`.
- [ ] `index.html` contains agenda, detail, assignment, audit, empty, error, and blocked states.
- [ ] `prototype-validation.md` still keeps human approval pending.
- [ ] `node ci/scripts/check-html5-prototype-quality.mjs --spec specs/001-reservations --strict` passes at the end.
