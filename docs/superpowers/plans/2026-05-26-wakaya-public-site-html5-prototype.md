# Wakaya Public Site HTML5 Prototype Implementation Plan

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Wakaya Public Site HTML5 Prototype Implementation Plan](2026-05-26-wakaya-public-site-html5-prototype.md)
- Siguiente: [Wakaya Public Site HTML5 Prototype Implementation Plan](2026-05-26-wakaya-public-site-html5-prototype.md)
<!-- nav-guided:end -->

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el prototipo HTML5 premium y navegable del feature `002-public-site`, con Home, Habitaciones, Detalle, Eventos, Full Day y flujo de prereserva manual dentro del artefacto canónico del repo.

**Architecture:** El repo exige un único entrypoint por feature en `specs/<slug>/prototype-html5/index.html`, así que el prototipo debe modelar las cinco páginas públicas como vistas editoriales y estados interactivos dentro de un solo HTML autocontenido. La documentación de soporte (`decisiones-ux.md`, `flujo.md`, `prototype.md`, `prototype-validation.md`, `traceability.md`) debe reflejar ese modelo y el hub `prototype/index.html` debe regenerarse desde los specs reales.

**Tech Stack:** HTML5, CSS con custom properties, JavaScript vanilla, hub generado con `scripts/ai-framework-agent.mjs`, validadores `ci/scripts/check-*.mjs`.

---

## File Structure

- Create: `specs/002-public-site/prototype-html5/index.html`
  Prototipo autocontenido con vistas `home`, `habitaciones`, `habitacion-detalle`, `eventos`, `full-day`, modal de solicitud, y estados `loading`, `empty`, `error`, `success`.
- Create: `specs/002-public-site/prototype-html5/decisiones-ux.md`
  Pre-flight visual, elección de golden y contrato del prototipo alineado a `spec-funcional.md`.
- Create: `specs/002-public-site/prototype-html5/flujo.md`
  Journey navegable, pantallas, transiciones, estados y datos mock del dominio Wakaya.
- Modify: `specs/002-public-site/prototype.md`
  Ruta canónica del HTML5 y cobertura real del prototipo en un solo archivo.
- Modify: `specs/002-public-site/prototype-validation.md`
  Checklist de revisión más sección obligatoria `## Revision visual humana`.
- Modify: `specs/002-public-site/traceability.md`
  Reemplazar rutas hipotéticas `home.html`, `eventos.html`, etc. por anchors o vistas dentro de `prototype-html5/index.html`.
- Modify: `prototype/index.html`
  Regenerado, no editado a mano, para enlazar el nuevo prototipo.
- Modify: `/Users/rapha/Documents/Obsidian Vault/20_Projects/WAKAYA-ERP/12 Public Prototype Direction 2026-05-26.md`
  Reflejar la ruta final del prototipo, estado y comandos de validación.

## Guardrails

- No usar `npm run scaffold:prototype`: el script `scripts/scaffold-prototype.mjs` no existe en este scaffold.
- No usar `npm run prototype:contract`: el script `scripts/prototype-contract.mjs` tampoco existe.
- Validar directamente con `ci/scripts/check-html5-prototype-quality.mjs`, `check-prototype-contract.mjs`, `check-prototype-visible-product.mjs` y `check-prototype-hub.mjs`.
- Mantener modo standalone. No crear `specs/_shared/` ni activar `portfolio-spa` para este feature.
- Evitar cualquier patrón SaaS `sidebar + tabla`. El golden de referencia es una mezcla controlada entre `ecommerce-checkout` y `streaming-catalogo-player`.

### Task 1: Completar el pre-flight y el contrato del prototipo

**Files:**
- Create: `specs/002-public-site/prototype-html5/decisiones-ux.md`
- Create: `specs/002-public-site/prototype-html5/flujo.md`

- [ ] **Step 1: Escribir `decisiones-ux.md` con el patrón editorial de Wakaya y el contrato del prototipo**

```md
# Decisiones UX prototipo HTML5 — Wakaya ERP Public Site

## Decisión de patrón de producto

- Dominio del spec: hospitality / lodge / reserva guiada
- Actor principal: visitante web que evalúa hospedaje premium
- Tarea principal navegable de inicio a fin: descubrir Wakaya -> revisar habitaciones -> abrir detalle -> enviar prereserva manual
- Patrón visual elegido (streaming / operativo / ecommerce / educación / salud / dashboard / otro): otro — hospitality editorial + ecommerce-guided
- Por qué NO se usa una shell genérica sidenav+tabla: el sitio es una superficie pública aspiracional; una shell SaaS rompería la atmósfera premium, la venta emocional del lodge y el journey de conversión.
- Interacciones del prototipo (mínimo 3, expresadas como acciones reales del producto):
  - elegir fechas y huéspedes en la booking bar flotante
  - abrir una categoría de habitación y pasar al detalle
  - enviar una solicitud de prereserva, evento o full day
- Limitaciones conocidas: sin backend real, sin correo real, sin calendario conectado a OTAs, disponibilidad solo referencial

## Golden de referencia

- Path: `ejemplos/fase-2-ux-ui/prototype-html5-golden/ecommerce-checkout/index.html` + `ejemplos/fase-2-ux-ui/prototype-html5-golden/streaming-catalogo-player/index.html`
- Por qué este golden: `ecommerce-checkout` aporta estructura comercial, CTA y summary guiado; `streaming-catalogo-player` aporta hero editorial, ritmo visual y navegación inmersiva.
- Patrones estructurales que voy a replicar:
  - hero dominante con narrativa y CTA claros
  - topbar ligera con navegación editorial y link discreto al hub
  - bloques secundarios con cards visuales y transiciones a detalle
- Tokens base reutilizados de `:root` (≥ 8):
  - `--brand`
  - `--brand-deep`
  - `--sand`
  - `--forest`
  - `--sunset`
  - `--surface`
  - `--surface-strong`
  - `--ink`
  - `--muted`
  - `--shadow-lg`

## Contrato del prototipo

- Estados: loading, empty, error, success
- Roles: visitante web, huésped potencial, prospecto de evento, prospecto de full day
- Entidades: habitación, categoría, tarifa, solicitud, evento, full day
- RF representados: RF-01, RF-02, RF-03, RF-04, RF-05, RF-06, RF-07, RF-08
```

- [ ] **Step 2: Verificar que el contrato quedó completo y con labels exactos**

Run: `rg -n "Dominio del spec|Actor principal|Tarea principal navegable|Patrón visual elegido|Por qué NO se usa|Interacciones del prototipo|## Contrato del prototipo|RF representados" specs/002-public-site/prototype-html5/decisiones-ux.md`

Expected: aparecen los ocho labels requeridos y la sección `## Contrato del prototipo`.

- [ ] **Step 3: Escribir `flujo.md` con el journey principal, flujos secundarios y estados**

```md
# Flujo prototipo HTML5 — Wakaya ERP Public Site

## Tarea principal recorrible (happy path)

Home
  └─ Booking bar flotante
      └─ Habitaciones
          └─ Detalle de habitación
              └─ Solicitud enviada

## Flujos secundarios

- Home -> Eventos -> Solicitud de evento -> Success
- Home -> Full Day -> Solicitud full day -> Success

## Pantallas y estados cubiertos

| Vista | Cómo se llega | Estados cubiertos |
|---|---|---|
| Home | URL inicial | success, loading |
| Habitaciones | CTA “Explorar bungalows” o cards destacadas | success, empty |
| Detalle de habitación | Click en card o CTA “Ver detalle” | success |
| Eventos | Teaser editorial y navegación superior | success, error |
| Full Day | Teaser editorial y navegación superior | success, error |
| Solicitud enviada | Submit del modal de prereserva | success |

## Estados UI

| Estado | Cómo se dispara |
|---|---|
| Loading | Al aplicar búsqueda desde el hero |
| Empty | Fechas/huéspedes sin coincidencia en la disponibilidad referencial |
| Error | Envío demo con email vacío o simulación de falla |
| Success | Solicitud enviada con CTA de seguimiento |

## Datos mock

- 3 categorías de habitación: Familiar Laguna, Suite Canopy, Bungalow Río
- 2 formatos de evento: boda íntima y retiro corporativo
- 2 programas de full day: piscina + restaurante, día amazónico familiar
- Tarifas referenciales en PEN con capacidad visible

## Limitaciones del prototipo

- No hay pago online
- No hay integración real con Booking.com, Expedia o Tripadvisor
- No hay calendario conectado al backend
- La confirmación de reserva sigue siendo manual
```

- [ ] **Step 4: Verificar que `flujo.md` cubre las vistas y estados del spec**

Run: `rg -n "Home|Habitaciones|Detalle de habitación|Eventos|Full Day|loading|empty|error|success" specs/002-public-site/prototype-html5/flujo.md`

Expected: cada vista y los cuatro estados aparecen al menos una vez.

- [ ] **Step 5: Commit de la base documental del prototipo**

```bash
git add specs/002-public-site/prototype-html5/decisiones-ux.md specs/002-public-site/prototype-html5/flujo.md
git commit -m "docs: define public prototype contract and flow"
```

### Task 2: Construir la shell editorial y las vistas de Home, Habitaciones y Detalle

**Files:**
- Create: `specs/002-public-site/prototype-html5/index.html`

- [ ] **Step 1: Crear la shell HTML5 con tokens de marca, topbar, hero y mount de vistas**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wakaya Ecolodge — Prototipo público</title>
  <style>
    :root {
      --brand: #8c5d38;
      --brand-deep: #4c3528;
      --sand: #efe4d4;
      --forest: #20443a;
      --sunset: #c9784f;
      --surface: #fbf7f1;
      --surface-strong: #f1e7da;
      --ink: #1f1b18;
      --muted: #6d635c;
      --line: rgba(31, 27, 24, 0.12);
      --shadow-lg: 0 18px 60px rgba(33, 23, 16, 0.16);
      --radius-xl: 28px;
      --radius-lg: 18px;
      --radius-md: 12px;
      --font-display: "Cormorant Garamond", "Iowan Old Style", "Times New Roman", serif;
      --font-body: "Manrope", "Avenir Next", "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: var(--font-body); background: linear-gradient(180deg, #f7f1e8 0%, #fbf7f1 100%); color: var(--ink); }
    a { color: inherit; text-decoration: none; }
    button, input, select, textarea { font: inherit; }
    .hub-link { font-size: 11px; color: var(--muted); }
    .topbar { position: sticky; top: 0; z-index: 50; display: flex; align-items: center; justify-content: space-between; padding: 18px 28px; backdrop-filter: blur(18px); background: rgba(251,247,241,.78); border-bottom: 1px solid var(--line); }
    .brand { display: flex; align-items: center; gap: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
    .brand-mark { width: 42px; height: 42px; border-radius: 14px; background: linear-gradient(135deg, var(--forest), var(--brand)); color: #fff; display: grid; place-items: center; }
    .hero { min-height: 82vh; padding: 88px 28px 120px; display: grid; align-items: end; background: radial-gradient(circle at 75% 20%, rgba(201,120,79,.22), transparent 28%), linear-gradient(180deg, rgba(26,31,24,.18), rgba(26,31,24,.48)), url("https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80") center/cover; color: #fff; }
    .hero-copy { max-width: 640px; }
    .hero-copy h1 { font-family: var(--font-display); font-size: clamp(3.4rem, 7vw, 6rem); line-height: .94; margin-bottom: 18px; }
    .hero-copy p { max-width: 520px; font-size: 1.05rem; line-height: 1.7; color: rgba(255,255,255,.84); }
    .booking-bar { margin-top: 28px; display: grid; grid-template-columns: repeat(4, minmax(0,1fr)) auto; gap: 14px; padding: 18px; border-radius: 24px; background: rgba(248,243,236,.95); color: var(--ink); box-shadow: var(--shadow-lg); }
    .view { display: none; }
    .view.is-active { display: block; }
  </style>
</head>
<body data-view="home">
  <header class="topbar">
    <div class="brand"><span class="brand-mark">W</span> Wakaya Ecolodge</div>
    <nav class="public-nav">
      <a href="#home" data-nav="home">Inicio</a>
      <a href="#habitaciones" data-nav="habitaciones">Habitaciones</a>
      <a href="#eventos" data-nav="eventos">Eventos</a>
      <a href="#full-day" data-nav="full-day">Full Day</a>
    </nav>
    <a class="hub-link" href="../../../prototype/index.html">← Hub</a>
  </header>

  <main>
    <section class="view is-active" id="view-home" data-view="home"></section>
    <section class="view" id="view-habitaciones" data-view="habitaciones"></section>
    <section class="view" id="view-habitacion-detalle" data-view="habitacion-detalle"></section>
    <section class="view" id="view-eventos" data-view="eventos"></section>
    <section class="view" id="view-full-day" data-view="full-day"></section>
  </main>

  <div id="request-modal" hidden></div>
  <div id="toast-stack" aria-live="polite"></div>
</body>
</html>
```

- [ ] **Step 2: Verificar que la shell ya tiene vistas navegables y booking bar**

Run: `rg -n "data-view|booking-bar|hub-link|public-nav|view-home|view-habitaciones|view-habitacion-detalle" specs/002-public-site/prototype-html5/index.html`

Expected: aparecen los mounts de las cinco vistas y la barra de booking.

- [ ] **Step 3: Implementar Home, Habitaciones y Detalle con datos mock reales de Wakaya**

```html
<section class="view is-active" id="view-home" data-view="home">
  <div class="hero">
    <div class="hero-copy">
      <span class="eyebrow">Pucallpa · naturaleza, descanso y celebraciones</span>
      <h1>Escapadas que se sienten vivas desde la primera mirada.</h1>
      <p>Wakaya combina bungalows, agua, vegetación y hospitalidad cálida para estadías familiares, escapadas de pareja y encuentros memorables.</p>
      <form class="booking-bar" id="booking-bar">
        <label><span>Llegada</span><input type="date" id="checkin"></label>
        <label><span>Salida</span><input type="date" id="checkout"></label>
        <label><span>Huéspedes</span><select id="guests"><option>2 huéspedes</option><option>3 huéspedes</option><option>4 huéspedes</option><option>5 huéspedes</option></select></label>
        <label><span>Categoría</span><select id="category"><option value="all">Todas</option><option value="suite">Suite Canopy</option><option value="familiar">Familiar Laguna</option><option value="rio">Bungalow Río</option></select></label>
        <button type="button" id="apply-search">Ver disponibilidad</button>
      </form>
    </div>
  </div>

  <section class="rooms-highlight">
    <article class="room-card" data-room="suite">
      <p class="room-kicker">Desde S/ 540 · 2 huéspedes</p>
      <h2>Suite Canopy</h2>
      <p>Privacidad, terraza y una noche pensada para bajar el ritmo.</p>
      <button type="button" data-open-room="suite">Ver detalle</button>
    </article>
    <article class="room-card" data-room="familiar">
      <p class="room-kicker">Desde S/ 680 · 4 huéspedes</p>
      <h2>Familiar Laguna</h2>
      <p>El bungalow amplio para compartir descanso, agua y jardín.</p>
      <button type="button" data-open-room="familiar">Ver detalle</button>
    </article>
    <article class="room-card" data-room="rio">
      <p class="room-kicker">Desde S/ 460 · 3 huéspedes</p>
      <h2>Bungalow Río</h2>
      <p>Una estadía cálida con vegetación cercana y sensación de refugio.</p>
      <button type="button" data-open-room="rio">Ver detalle</button>
    </article>
  </section>
</section>
```

```js
const roomCatalog = [
  { id: "suite", title: "Suite Canopy", guests: "2 huéspedes", price: "S/ 540", availability: "3 espacios referenciales", summary: "Terraza privada, desayuno, tina y vista verde." },
  { id: "familiar", title: "Familiar Laguna", guests: "4 huéspedes", price: "S/ 680", availability: "2 espacios referenciales", summary: "Dormitorio amplio, sala corta y acceso cómodo a piscina." },
  { id: "rio", title: "Bungalow Río", guests: "3 huéspedes", price: "S/ 460", availability: "4 espacios referenciales", summary: "Diseño cálido, vegetación cercana y tarifa de entrada." }
];

function renderRoomIndex() {
  const roomsView = document.querySelector("#view-habitaciones");
  roomsView.innerHTML = roomCatalog.map((room) => `
    <article class="catalog-card" data-room="${room.id}">
      <p>${room.price} · ${room.guests}</p>
      <h2>${room.title}</h2>
      <p>${room.summary}</p>
      <button type="button" data-open-room="${room.id}">Ver detalle</button>
    </article>
  `).join("");
}

function openRoomDetail(roomId) {
  const room = roomCatalog.find((item) => item.id === roomId);
  if (!room) return;
  document.querySelector("#view-habitacion-detalle").innerHTML = `
    <section class="detail-shell">
      <a href="#habitaciones" data-nav="habitaciones">← Volver a habitaciones</a>
      <p class="detail-meta">${room.price} · ${room.guests} · ${room.availability}</p>
      <h1>${room.title}</h1>
      <p>${room.summary}</p>
      <ul class="amenities">
        <li>Desayuno incluido</li>
        <li>Acceso a piscina y áreas verdes</li>
        <li>Coordinación manual de reserva y pago</li>
      </ul>
      <button type="button" data-open-request="lodging">Solicitar prereserva</button>
    </section>
  `;
  showView("habitacion-detalle");
}
```

- [ ] **Step 4: Comprobar que Home, Habitaciones y Detalle ya exponen el núcleo comercial**

Run: `rg -n "Suite Canopy|Familiar Laguna|Bungalow Río|Solicitar prereserva|Ver detalle|3 espacios referenciales" specs/002-public-site/prototype-html5/index.html`

Expected: aparecen las tres categorías, el CTA de detalle y el CTA de prereserva.

- [ ] **Step 5: Commit de la shell editorial y las vistas de hospedaje**

```bash
git add specs/002-public-site/prototype-html5/index.html
git commit -m "feat: add wakaya public lodging prototype shell"
```

### Task 3: Completar Eventos, Full Day y el flujo de solicitud con estados reales

**Files:**
- Modify: `specs/002-public-site/prototype-html5/index.html`

- [ ] **Step 1: Añadir las vistas editoriales de Eventos y Full Day con jerarquía secundaria**

```html
<section class="view" id="view-eventos" data-view="eventos">
  <section class="editorial-hero editorial-hero-events">
    <p class="eyebrow">Eventos en Wakaya</p>
    <h1>Bodas íntimas, retiros y encuentros que se sienten fuera de la ciudad.</h1>
    <p>El espacio se presenta como venue natural, no como salón genérico. La confirmación final y el pago se coordinan con el equipo.</p>
    <button type="button" data-open-request="eventos">Solicitar evento</button>
  </section>
</section>

<section class="view" id="view-full-day" data-view="full-day">
  <section class="editorial-hero editorial-hero-daypass">
    <p class="eyebrow">Full Day Wakaya</p>
    <h1>Un día de piscina, vegetación y descanso para salir de la rutina.</h1>
    <p>Programa más accesible, con tono claro y premium, ideal para familias, parejas o grupos pequeños.</p>
    <button type="button" data-open-request="full-day">Solicitar full day</button>
  </section>
</section>
```

- [ ] **Step 2: Implementar el modal de solicitud y los estados `loading`, `empty`, `error`, `success`**

```html
<dialog id="request-modal" class="request-modal">
  <form method="dialog" id="request-form">
    <p class="modal-kicker" id="request-kicker">Solicitud Wakaya</p>
    <h2 id="request-title">Completa tu solicitud</h2>
    <div class="form-grid">
      <label><span>Nombres y apellidos</span><input name="fullName" required></label>
      <label><span>Correo</span><input name="email" type="email" required></label>
      <label><span>Teléfono</span><input name="phone" required></label>
      <label><span>Fecha tentativa</span><input name="requestedDate" type="date" required></label>
      <label class="full"><span>Observaciones</span><textarea name="notes" rows="4" placeholder="Cuéntanos si viajas en pareja, familia o si deseas cotizar un evento."></textarea></label>
    </div>
    <p class="assistive-copy">La disponibilidad es referencial. La aprobación final y el pago se coordinan manualmente con el equipo de Wakaya.</p>
    <div class="modal-actions">
      <button type="button" data-close-request>Cerrar</button>
      <button type="submit" id="submit-request">Enviar solicitud</button>
    </div>
  </form>
</dialog>

<section class="system-state system-state-loading" id="state-loading" hidden>
  <p>Consultando disponibilidad referencial...</p>
</section>
<section class="system-state system-state-empty" id="state-empty" hidden>
  <h2>No encontramos disponibilidad referencial para esas fechas.</h2>
  <p>Prueba otra combinación o deja tu solicitud para revisión manual.</p>
</section>
<section class="system-state system-state-error" id="state-error" hidden>
  <h2>No pudimos enviar la solicitud.</h2>
  <p>Revisa tus datos o vuelve a intentarlo en unos minutos.</p>
</section>
<section class="system-state system-state-success" id="state-success" hidden>
  <h2>Solicitud recibida.</h2>
  <p>El equipo de Wakaya revisará disponibilidad, tarifa y próximos pasos contigo.</p>
</section>
```

- [ ] **Step 3: Añadir la lógica JS de navegación, búsqueda referencial y envío demo**

```js
const appState = {
  view: "home",
  requestType: "lodging",
  simulatedAvailability: "ok"
};

function showView(view) {
  appState.view = view;
  document.body.dataset.view = view;
  document.querySelectorAll(".view").forEach((node) => node.classList.toggle("is-active", node.dataset.view === view));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setState(name) {
  ["loading", "empty", "error", "success"].forEach((state) => {
    const block = document.querySelector(`#state-${state}`);
    if (block) block.hidden = state !== name;
  });
}

function applyAvailabilitySearch() {
  setState("loading");
  window.setTimeout(() => {
    const category = document.querySelector("#category").value;
    if (category === "rio" && document.querySelector("#guests").value === "5 huéspedes") {
      setState("empty");
      showView("habitaciones");
      return;
    }
    setState("success");
    showView("habitaciones");
  }, 700);
}

function openRequest(type) {
  appState.requestType = type;
  document.querySelector("#request-kicker").textContent = type === "eventos" ? "Evento en Wakaya" : type === "full-day" ? "Full Day Wakaya" : "Prereserva Wakaya";
  document.querySelector("#request-title").textContent = type === "lodging" ? "Completa tu solicitud de hospedaje" : `Completa tu solicitud de ${type}`;
  document.querySelector("#request-modal").showModal();
}

function submitRequest(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  if (!String(form.get("email") || "").includes("@")) {
    setState("error");
    return;
  }
  document.querySelector("#request-modal").close();
  setState("success");
  showView("home");
}

document.addEventListener("click", (event) => {
  const nav = event.target.closest("[data-nav]");
  if (nav) showView(nav.dataset.nav);
  const room = event.target.closest("[data-open-room]");
  if (room) openRoomDetail(room.dataset.openRoom);
  const request = event.target.closest("[data-open-request]");
  if (request) openRequest(request.dataset.openRequest);
  if (event.target.id === "apply-search") applyAvailabilitySearch();
  if (event.target.hasAttribute("data-close-request")) document.querySelector("#request-modal").close();
});

document.querySelector("#request-form").addEventListener("submit", submitRequest);
renderRoomIndex();
```

- [ ] **Step 4: Ejecutar la validación específica del prototipo HTML5**

Run: `node ci/scripts/check-html5-prototype-quality.mjs --spec specs/002-public-site --strict`

Expected: exit `0` y resumen sin bloqueantes para `specs/002-public-site/prototype-html5/index.html`.

- [ ] **Step 5: Ejecutar la validación del contrato del prototipo**

Run: `node ci/scripts/check-prototype-contract.mjs --feature 002-public-site --strict`

Expected: `OK. Cada prototipo declara su contrato e implementa estados + cubre los RF/actores de su spec.`

- [ ] **Step 6: Commit del flujo completo público**

```bash
git add specs/002-public-site/prototype-html5/index.html
git commit -m "feat: complete wakaya public request journeys"
```

### Task 4: Alinear la documentación del feature, la validación humana y la referencia en Obsidian

**Files:**
- Modify: `specs/002-public-site/prototype.md`
- Modify: `specs/002-public-site/prototype-validation.md`
- Modify: `specs/002-public-site/traceability.md`
- Modify: `/Users/rapha/Documents/Obsidian Vault/20_Projects/WAKAYA-ERP/12 Public Prototype Direction 2026-05-26.md`

- [ ] **Step 1: Actualizar `prototype.md` para reflejar el artefacto canónico único**

```md
# Prototype - Wakaya ERP Public Site

## Herramienta
HTML5-first. La referencia navegable del feature vive en `prototype-html5/index.html`.

## Ruta HTML5
`prototype-html5/index.html`

## Modelo de navegación
El prototipo usa un único entrypoint HTML5 y modela las pantallas públicas como vistas editoriales:

- `home`
- `habitaciones`
- `habitacion-detalle`
- `eventos`
- `full-day`
- `success`

## Pantallas cubiertas
- Home premium con booking bar flotante
- Catálogo curado de habitaciones
- Detalle de habitación con CTA de prereserva
- Eventos como línea editorial secundaria
- Full Day como línea editorial secundaria
- Estado de solicitud enviada

## Estado
HTML5 navegable implementado y pendiente de revisión visual humana formal.
```

- [ ] **Step 2: Completar `prototype-validation.md` con la sección obligatoria de revisión humana**

```md
## Revision visual humana

- Resultado: pending
- Revisor: pendiente
- Fecha: pendiente
- Evidencia revisada: pendiente
- Observaciones: revisar el hero humano, el balance hospedaje/eventos/full day y la claridad de la solicitud manual antes de marcar approved.
```

- [ ] **Step 3: Corregir `traceability.md` para apuntar al HTML canónico en vez de archivos hipotéticos**

```md
| RF | HU | UX/SPDD | Prototipo | API | BD | Codigo | Test | Estado | Evidencia |
|---|---|---|---|---|---|---|---|---|---|
| RF-01 | HU-PS-01 | spdd-frontend.md | prototype-html5/index.html#view-home | - | - | - | - | Prototipo HTML5 listo | prototype-validation.md |
| RF-02 | HU-PS-01 | spdd-frontend.md | prototype-html5/index.html#view-habitaciones | - | - | - | - | Prototipo HTML5 listo | prototype-validation.md |
| RF-03 | HU-PS-01 | spdd-frontend.md | prototype-html5/index.html#view-habitacion-detalle | - | - | - | - | Prototipo HTML5 listo | prototype-validation.md |
| RF-04 | HU-PS-02 | spdd-frontend.md | prototype-html5/index.html#request-modal | POST /public/pre-reservations | leads | - | - | Prototipo HTML5 listo | prototype-validation.md |
| RF-05 | HU-PS-03 | spdd-frontend.md | prototype-html5/index.html#view-eventos | POST /public/event-requests | leads | - | - | Prototipo HTML5 listo | prototype-validation.md |
| RF-06 | HU-PS-04 | spdd-frontend.md | prototype-html5/index.html#view-full-day | POST /public/full-day-requests | leads | - | - | Prototipo HTML5 listo | prototype-validation.md |
| RF-07 | HU-PS-02 | spdd-frontend.md | prototype-html5/index.html#state-success | 202 accepted | requests | - | - | Prototipo HTML5 listo | prototype-validation.md |
| RF-08 | HU-PS-02 | spdd-frontend.md | prototype-html5/index.html#state-empty | - | - | - | - | Prototipo HTML5 listo | prototype-validation.md |
```

- [ ] **Step 4: Añadir al note de Obsidian la referencia operativa del prototipo HTML5**

```md
## Estado HTML5

- Ruta canónica: `/Users/rapha/Projects/wakaya-erp/specs/002-public-site/prototype-html5/index.html`
- Validadores clave:
  - `node ci/scripts/check-html5-prototype-quality.mjs --spec specs/002-public-site --strict`
  - `node ci/scripts/check-prototype-contract.mjs --feature 002-public-site --strict`
  - `node ci/scripts/check-prototype-visible-product.mjs --feature 002-public-site --strict`
- Estado: implementado, pendiente de revisión visual humana
```

- [ ] **Step 5: Commit de alineación documental**

```bash
git add specs/002-public-site/prototype.md specs/002-public-site/prototype-validation.md specs/002-public-site/traceability.md "/Users/rapha/Documents/Obsidian Vault/20_Projects/WAKAYA-ERP/12 Public Prototype Direction 2026-05-26.md"
git commit -m "docs: align wakaya public prototype references"
```

### Task 5: Regenerar el hub, correr la suite de validación y cerrar el lote

**Files:**
- Modify (generated): `prototype/index.html`

- [ ] **Step 1: Regenerar el hub de prototipos desde los specs reales**

Run: `npm run prototype:hub`

Expected: exit `0` y actualización de `prototype/index.html` con la card/link de `002-public-site`.

- [ ] **Step 2: Validar que el hub quedó consistente**

Run: `node ci/scripts/check-prototype-hub.mjs --strict`

Expected: `✓ Hub cumple las 10 secciones estándar.`

- [ ] **Step 3: Ejecutar la suite de validación del prototipo y documentación**

Run: `node ci/scripts/check-prototype-visible-product.mjs --feature 002-public-site --strict && node ci/scripts/check-prototype-cross-links.mjs --strict && npm run check:docs && node ci/scripts/check-template-instantiation.mjs --mode instantiated --root .`

Expected: todos los comandos salen `0`; `check-prototype-visible-product` acepta `Resultado: pending` porque la revisión humana aún no está aprobada.

- [ ] **Step 4: Revisar el diff final antes del commit de cierre**

Run: `git status --short && git diff -- specs/002-public-site/prototype-html5/index.html specs/002-public-site/prototype.md specs/002-public-site/prototype-validation.md specs/002-public-site/traceability.md prototype/index.html`

Expected: solo aparecen cambios esperados del prototipo público y sus referencias.

- [ ] **Step 5: Commit de cierre del prototipo HTML5**

```bash
git add specs/002-public-site/prototype-html5/index.html specs/002-public-site/prototype-html5/decisiones-ux.md specs/002-public-site/prototype-html5/flujo.md specs/002-public-site/prototype.md specs/002-public-site/prototype-validation.md specs/002-public-site/traceability.md prototype/index.html "/Users/rapha/Documents/Obsidian Vault/20_Projects/WAKAYA-ERP/12 Public Prototype Direction 2026-05-26.md"
git commit -m "feat: add wakaya public site html5 prototype"
```

## Spec Coverage Check

- `RF-01` cubierto en Task 2 con Home editorial.
- `RF-02` cubierto en Task 2 con catálogo de habitaciones.
- `RF-03` cubierto en Task 2 con `openRoomDetail`.
- `RF-04` cubierto en Task 3 con booking bar + modal de prereserva.
- `RF-05` cubierto en Task 3 con vista `eventos`.
- `RF-06` cubierto en Task 3 con vista `full-day`.
- `RF-07` cubierto en Task 3 con `state-success`.
- `RF-08` cubierto en Task 3 y Task 4 con copy de solicitud manual y trazabilidad.

## Placeholder Scan

- El plan no usa `TODO`, `TBD`, “implementar luego” ni referencias vagas.
- Los comandos de scaffold rotos (`scaffold:prototype`, `prototype:contract`) quedaron explícitamente excluidos.
- La revisión visual humana queda `pending`, no auto-aprobada por IA.
