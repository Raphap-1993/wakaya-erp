# Wakaya Public Home Parador Implementation Plan

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Indice de documentacion](../../README.md)
- Siguiente: [Indice de documentacion](../../README.md)
<!-- nav-guided:end -->


> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar la home actual del prototipo HTML5 de `002-public-site` por una home basada casi directamente en `Parador`, traducida a Wakaya por color, fotografia, copy y oferta real, y dejar la documentacion canonica alineada.

**Architecture:** El repo ya usa un prototipo HTML5 autocontenido en `specs/002-public-site/prototype-html5/index.html`, con vistas internas para `home`, `habitaciones`, `habitacion-detalle`, `eventos` y `full-day`. La implementacion debe preservar ese entrypoint unico y reescribir solo la `home` y su shell visual, manteniendo navegacion, detalle de habitaciones y validadores documentales coherentes con la nueva direccion.

**Tech Stack:** HTML5, CSS con custom properties, JavaScript vanilla, validadores `ci/scripts/check-*.mjs`, generador de hub `scripts/ai-framework-agent.mjs`.

---

## File Structure

- Modify: `specs/002-public-site/product-design.md`
  Reemplazar la direccion `Tropical Modern Warmth` por la nueva referencia `Parador` casi directa.
- Modify: `specs/002-public-site/spdd-frontend.md`
  Alinear flujo visible, componentes y reglas de composicion con `hero slider + booking bar + room grid + bloques grandes`.
- Modify: `specs/002-public-site/prototype-html5/decisiones-ux.md`
  Cambiar golden y referencia visual del prototipo para que ya no apunte a la mezcla editorial anterior.
- Modify: `specs/002-public-site/prototype.md`
  Corregir la ruta canonica: el repo usa `prototype-html5/index.html`, no `home.html` separado.
- Modify: `specs/002-public-site/traceability.md`
  Corregir links de prototipo a anchors dentro de `prototype-html5/index.html`.
- Modify: `specs/002-public-site/prototype-validation.md`
  Ajustar criterios de revision para la nueva home y mantener revision humana en `pending`.
- Modify: `specs/002-public-site/prototype-html5/index.html`
  Reescribir la home, sus estilos principales y el JS del hero slider, sin romper el resto de vistas.
- Modify: `prototype/index.html`
  Regenerado con `npm run prototype:hub`; no editar a mano.

## Guardrails

- No crear paginas HTML separadas para `home`, `habitaciones`, `eventos` o `full-day`.
- No reutilizar la home actual como base compositiva.
- No tocar la implementacion de backend ni rutas productivas de Next.js en este slice.
- Si `Parador` choca con contenido o negocio real de Wakaya, gana Wakaya.
- `publicaciones` no vuelve a entrar en la home.

### Task 1: Alinear los artefactos canonicos al nuevo direccionamiento

**Files:**
- Modify: `specs/002-public-site/product-design.md`
- Modify: `specs/002-public-site/spdd-frontend.md`
- Modify: `specs/002-public-site/prototype-html5/decisiones-ux.md`
- Modify: `specs/002-public-site/prototype.md`
- Modify: `specs/002-public-site/traceability.md`
- Modify: `specs/002-public-site/prototype-validation.md`

- [ ] **Step 1: Confirmar el baseline desalineado antes de editar**

Run: `rg -n "Tropical Modern Warmth|Variante base|home.html|habitaciones.html|eventos.html|full-day.html|template generico" specs/002-public-site/product-design.md specs/002-public-site/spdd-frontend.md specs/002-public-site/prototype-html5/decisiones-ux.md specs/002-public-site/prototype.md specs/002-public-site/traceability.md specs/002-public-site/prototype-validation.md`

Expected: aparecen la direccion anterior y las rutas viejas `home.html` / `habitaciones.html`.

- [ ] **Step 2: Reescribir la direccion de producto y composicion SPDD**

```md
## Direccion elegida
- Referencia base: `Parador`
- Traduccion de marca: `eco-luxury tropical`
- Hero: slider mixto con personas, agua y bungalows
- Booking: barra flotante protagonica
- Motion: cinematica suave
- Regla de base: la home actual del prototipo deja de ser referencia visual

## Reglas de composicion
- usar estructura casi directa de `Parador`
- hero slider ancho y dominante
- booking bar inmediata bajo hero
- habitaciones como primera seccion comercial
- alternar bloques grandes para promo, servicios, eventos/full day y galeria
- evitar apariencia de pagina angosta o landing SaaS
```

- [ ] **Step 3: Cambiar `decisiones-ux.md` y `prototype.md` para que hablen del nuevo golden y del entrypoint unico**

```md
## Golden de referencia

- Path: referencia visual externa `Parador`
- Por qué este golden: aporta hero slider, booking band protagonista, cards comerciales y ritmo hospitality.
- Patrones estructurales que voy a replicar:
  - hero slider dominante con CTA
  - booking band flotante inmediatamente debajo
  - habitaciones destacadas primero
  - bloques promo y galeria en secuencia comercial

## Ruta HTML5
`prototype-html5/index.html`

## Pantallas cubiertas
- `prototype-html5/index.html#view-home`
- `prototype-html5/index.html#view-habitaciones`
- `prototype-html5/index.html#view-habitacion-detalle`
- `prototype-html5/index.html#view-eventos`
- `prototype-html5/index.html#view-full-day`
```

- [ ] **Step 4: Corregir trazabilidad y validacion hacia anchors reales**

```md
| RF | HU | UX/SPDD | Prototipo | API | BD | Codigo | Test | Estado | Evidencia |
|---|---|---|---|---|---|---|---|---|---|
| RF-01 | HU-PS-01 | spdd-frontend.md | prototype-html5/index.html#view-home | - | - | - | - | En diseno SPDD | product-design.md |
| RF-02 | HU-PS-01 | spdd-frontend.md | prototype-html5/index.html#view-habitaciones | - | - | - | - | En diseno SPDD | product-design.md |
| RF-03 | HU-PS-01 | spdd-frontend.md | prototype-html5/index.html#view-habitacion-detalle | - | - | - | - | En diseno SPDD | product-design.md |
| RF-04 | HU-PS-02 | spdd-frontend.md | prototype-html5/index.html#view-home | POST /public/pre-reservations | leads | - | - | En diseno SPDD | prototype.md |
| RF-05 | HU-PS-03 | spdd-frontend.md | prototype-html5/index.html#view-eventos | POST /public/event-requests | leads | - | - | En diseno SPDD | prototype.md |
| RF-06 | HU-PS-04 | spdd-frontend.md | prototype-html5/index.html#view-full-day | POST /public/full-day-requests | leads | - | - | En diseno SPDD | prototype.md |
| RF-07 | HU-PS-02 | spdd-frontend.md | prototype-html5/index.html#request-modal | 202 accepted | requests | - | - | En diseno SPDD | prototype-validation.md |
| RF-08 | HU-PS-02 | spdd-frontend.md | prototype-html5/index.html#view-home | - | - | - | - | En diseno SPDD | spec-funcional.md |

## Validacion
| Criterio | Estado | Observacion |
|---|---|---|
| La home se siente visualmente cercana a Parador | PENDIENTE | Validar hero, booking band y ritmo de secciones en el HTML final. |
| El color y contenido siguen sintiendose Wakaya | PENDIENTE | Revisar fotos, copy y oferta real. |
| La pagina ya no se siente angosta | PENDIENTE | Confirmar ancho y jerarquia del hero en desktop y mobile. |
```

- [ ] **Step 5: Verificar que ya no quedan referencias a archivos de prototipo separados**

Run: `rg -n "home.html|habitaciones.html|habitacion-detalle.html|eventos.html|full-day.html" specs/002-public-site/prototype.md specs/002-public-site/traceability.md`

Expected: no output.

- [ ] **Step 6: Ejecutar validacion documental**

Run: `npm run check:docs`

Expected: exit `0`.

- [ ] **Step 7: Commit de alineacion canonica**

```bash
git add specs/002-public-site/product-design.md specs/002-public-site/spdd-frontend.md specs/002-public-site/prototype-html5/decisiones-ux.md specs/002-public-site/prototype.md specs/002-public-site/traceability.md specs/002-public-site/prototype-validation.md
git commit -m "docs: align public home with parador direction"
```

### Task 2: Reemplazar la shell visual y los estilos principales de la home

**Files:**
- Modify: `specs/002-public-site/prototype-html5/index.html`

- [ ] **Step 1: Confirmar que el HTML actual sigue usando la home descartada**

Run: `rg -n "home-story|story-hero|paper-band|story-booking-strip|story-activities|story-split" specs/002-public-site/prototype-html5/index.html`

Expected: aparecen los selectores de la home anterior.

- [ ] **Step 2: Reemplazar el bloque de tokens y estilos de home por la nueva shell inspirada en Parador**

```html
<style>
  :root {
    --brand: #1fb566;
    --brand-deep: #17924f;
    --brand-soft: rgba(31, 181, 102, 0.14);
    --forest: #16392f;
    --forest-deep: #102821;
    --mist: #f6f3ed;
    --sand: #f5efe6;
    --ink: #232833;
    --ink-soft: #6f7480;
    --white: #ffffff;
    --line: rgba(35, 40, 51, 0.12);
    --shadow-hero: 0 22px 74px rgba(16, 24, 20, 0.18);
    --shadow-band: 0 16px 48px rgba(21, 27, 39, 0.12);
    --content-w: 1320px;
    --radius-lg: 22px;
    --radius-xl: 34px;
    --font-display: "Avenir Next", "Segoe UI", sans-serif;
    --font-body: "Avenir Next", "Segoe UI", sans-serif;
  }

  .hero-slider { position: relative; min-height: 760px; overflow: hidden; }
  .hero-slide { position: absolute; inset: 0; opacity: 0; transition: opacity 480ms ease; }
  .hero-slide.is-active { opacity: 1; }
  .hero-slide-media { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .hero-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(15,20,26,.34), rgba(15,20,26,.56)); }
  .hero-copy { position: relative; z-index: 2; max-width: 760px; padding: 220px 0 140px; color: var(--white); }
  .hero-copy h1 { font-size: clamp(4rem, 8vw, 6.6rem); line-height: .92; font-weight: 800; letter-spacing: -0.05em; }
  .hero-kicker { margin-bottom: 20px; font-size: 14px; letter-spacing: .18em; font-weight: 700; }
  .hero-actions { display: flex; gap: 18px; margin-top: 28px; flex-wrap: wrap; }
  .hero-arrow { position: absolute; top: 50%; width: 56px; height: 56px; border-radius: 50%; border: 1px solid rgba(255,255,255,.46); background: rgba(255,255,255,.08); color: var(--white); transform: translateY(-50%); }
  .hero-arrow-prev { left: 42px; }
  .hero-arrow-next { right: 42px; }
  .hero-dots { position: absolute; left: 50%; bottom: 122px; display: flex; gap: 10px; transform: translateX(-50%); z-index: 3; }
  .hero-dot { width: 12px; height: 12px; border-radius: 50%; background: rgba(255,255,255,.42); }
  .hero-dot.is-active { background: var(--brand); }
  .hero-booking-band { position: relative; z-index: 3; max-width: var(--content-w); margin: -64px auto 0; }
  .booking-band { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)) auto; gap: 0; background: var(--white); border-radius: 34px; box-shadow: var(--shadow-band); overflow: hidden; }
  .booking-band-field { padding: 24px 28px; border-right: 1px solid rgba(35,40,51,.1); }
  .booking-band-field span { display: block; margin-bottom: 10px; font-size: 13px; color: var(--ink-soft); }
  .booking-band-field input, .booking-band-field select { width: 100%; border: none; background: transparent; color: var(--ink); font-size: 17px; }
  .booking-band-cta { display: inline-flex; min-width: 228px; align-items: center; justify-content: center; background: #313646; color: var(--white); font-weight: 800; }
  .home-shell { background: var(--mist); }
  .section-shell { max-width: var(--content-w); margin: 0 auto; padding: 96px 28px; }
  .section-head { display: flex; justify-content: space-between; align-items: end; gap: 22px; margin-bottom: 34px; }
  .section-head h2 { font-size: clamp(2.2rem, 4vw, 3.4rem); line-height: 1; color: var(--ink); }
  .section-head p { max-width: 580px; color: var(--ink-soft); line-height: 1.7; }
  .room-grid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 22px; }
  .room-showcase-card { background: var(--white); border-radius: var(--radius-lg); overflow: hidden; box-shadow: 0 18px 42px rgba(23, 30, 44, .08); }
  .room-showcase-card img { width: 100%; height: 420px; object-fit: cover; }
  .room-showcase-copy { padding: 24px; }
  .room-showcase-meta { display: flex; gap: 14px; margin: 18px 0; color: var(--ink-soft); font-size: 15px; }
  .promo-split { display: grid; grid-template-columns: 1.05fr .95fr; gap: 28px; align-items: stretch; }
  .promo-split img { width: 100%; height: 100%; min-height: 420px; object-fit: cover; border-radius: var(--radius-xl); }
  .services-grid { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 20px; }
  .service-tile { min-height: 220px; padding: 28px; border-radius: var(--radius-lg); background: var(--white); box-shadow: 0 16px 34px rgba(23, 30, 44, .06); }
  .service-tile strong { display: block; margin-bottom: 12px; font-size: 1.2rem; }
  .experience-split { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; align-items: center; }
  .experience-split img { width: 100%; min-height: 420px; object-fit: cover; border-radius: var(--radius-xl); }
  .immersive-gallery { display: grid; grid-template-columns: 1.2fr .8fr; gap: 18px; }
  .immersive-gallery > img, .gallery-stack img { width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius-xl); }
  .gallery-stack { display: grid; gap: 18px; }
  .final-cta { border-radius: var(--radius-xl); padding: 56px; background: linear-gradient(135deg, var(--forest), #1e4a3f); color: var(--white); }
  .button-primary, .button-secondary { display: inline-flex; align-items: center; justify-content: center; min-height: 56px; padding: 0 26px; border-radius: 999px; font-weight: 800; }
  .button-primary { background: var(--brand); color: var(--white); }
  .button-secondary { background: rgba(255,255,255,.14); color: var(--white); border: 1px solid rgba(255,255,255,.28); }
</style>
```

- [ ] **Step 3: Verificar que la nueva shell existe y que los selectores viejos de home salieron**

Run: `rg -n "hero-slider|booking-band|room-grid|promo-split|immersive-gallery|final-cta" specs/002-public-site/prototype-html5/index.html && ! rg -n "story-hero|story-booking-strip|story-activities|story-split" specs/002-public-site/prototype-html5/index.html`

Expected: el primer `rg` devuelve matches y el segundo no devuelve salida.

- [ ] **Step 4: Commit de la nueva base visual**

```bash
git add specs/002-public-site/prototype-html5/index.html
git commit -m "feat: replace public home visual shell"
```

### Task 3: Reescribir `#view-home` con la estructura aprobada

**Files:**
- Modify: `specs/002-public-site/prototype-html5/index.html`

- [ ] **Step 1: Sustituir el markup actual de `#view-home` por la secuencia canonica**

```html
<section class="view is-active" id="view-home" data-view="home">
  <div class="home-shell">
    <section class="hero-slider" aria-label="Hero principal de Wakaya">
      <article class="hero-slide is-active" data-slide="0">
        <img class="hero-slide-media" src="https://wakayaecolodge.com/es/images/wakaya/banner/banner_2.jpg" alt="Familia recorriendo la laguna de Wakaya">
        <div class="hero-overlay"></div>
        <div class="section-shell">
          <div class="hero-copy">
            <p class="hero-kicker">HOTEL WAKAYA ECOLODGE</p>
            <h1>Lo mejor de la selva del Perù.</h1>
            <div class="hero-actions">
              <button class="button-primary" type="button" data-target-view="habitaciones">Nuestras habitaciones</button>
              <button class="button-secondary" type="button" data-target-view="habitaciones">Reserva una ahora</button>
            </div>
          </div>
        </div>
      </article>
      <article class="hero-slide" data-slide="1">
        <img class="hero-slide-media" src="https://wakayaecolodge.com/es/images/wakaya/banner/banner_1.jpg" alt="Bungalows de Wakaya rodeados de vegetacion">
        <div class="hero-overlay"></div>
        <div class="section-shell">
          <div class="hero-copy">
            <p class="hero-kicker">BUNGALOWS · NATURALEZA · DESCANSO</p>
            <h1>Cálidos y cómodos bungalows.</h1>
            <div class="hero-actions">
              <button class="button-primary" type="button" data-target-view="habitaciones">Explorar categorías</button>
              <button class="button-secondary" type="button" data-room-target="suite">Ver bungalow suite</button>
            </div>
          </div>
        </div>
      </article>
      <article class="hero-slide" data-slide="2">
        <img class="hero-slide-media" src="https://wakayaecolodge.com/es/images/wakaya/services/servicio_fullday_laguna.jpg" alt="Vista de laguna y experiencia tropical en Wakaya">
        <div class="hero-overlay"></div>
        <div class="section-shell">
          <div class="hero-copy">
            <p class="hero-kicker">EVENTOS · FULL DAY · EXPERIENCIA</p>
            <h1>Un refugio para dormir, celebrar y desconectar.</h1>
            <div class="hero-actions">
              <button class="button-primary" type="button" data-target-view="eventos">Ver eventos</button>
              <button class="button-secondary" type="button" data-target-view="full-day">Ver full day</button>
            </div>
          </div>
        </div>
      </article>
      <button class="hero-arrow hero-arrow-prev" type="button" data-slide-dir="-1" aria-label="Slide anterior">←</button>
      <button class="hero-arrow hero-arrow-next" type="button" data-slide-dir="1" aria-label="Siguiente slide">→</button>
      <div class="hero-dots" aria-label="Paginacion del hero"></div>
    </section>

    <div class="hero-booking-band">
      <section class="booking-band" aria-label="Consulta de disponibilidad referencial">
        <label class="booking-band-field"><span>Habitaciones</span><select id="booking-category"><option value="all">Seleccione una habitación</option><option value="familiar">Bungalow Familiar</option><option value="suite">Bungalow Suite</option><option value="rio">Bungalow Matrimonial</option></select></label>
        <label class="booking-band-field"><span>Check in</span><input id="booking-checkin" type="date" value="2026-06-12"></label>
        <label class="booking-band-field"><span>Check out</span><input id="booking-checkout" type="date" value="2026-06-14"></label>
        <label class="booking-band-field"><span>Personas</span><select id="booking-guests"><option>01</option><option selected>02</option><option>03</option><option>04</option><option>05</option></select></label>
        <button class="booking-band-cta" id="availability-cta" type="button">Consultar disponibilidad</button>
      </section>
    </div>

    <section class="section-shell room-section" aria-label="Habitaciones destacadas">
      <div class="section-head">
        <h2>Nuestras habitaciones destacadas</h2>
        <p>Tres categorías visibles para que el visitante compare capacidad, estilo y tarifa referencial sin perder el impulso comercial del home.</p>
      </div>
      <div class="room-grid" id="home-room-grid"></div>
    </section>

    <section class="section-shell promo-section" aria-label="Bloque promo ecolodge">
      <div class="promo-split"></div>
    </section>

    <section class="section-shell services-section" aria-label="Servicios del ecolodge">
      <div class="section-head">
        <h2>Servicios para una experiencia completa</h2>
        <p>Wakaya vende estadía, pero también laguna, piscina, restaurante y tiempo de calidad dentro del mismo lugar.</p>
      </div>
      <div class="services-grid"></div>
    </section>

    <section class="section-shell experience-section" aria-label="Eventos y full day">
      <div class="experience-split"></div>
    </section>

    <section class="section-shell gallery-section" aria-label="Galería inmersiva">
      <div class="immersive-gallery"></div>
    </section>

    <section class="section-shell final-cta-section" aria-label="Cierre comercial">
      <div class="final-cta"></div>
    </section>
  </div>
</section>
```

- [ ] **Step 2: Mapear el contenido real de Wakaya dentro de habitaciones, servicios y experiencia**

```html
<div class="room-grid" id="home-room-grid">
  <article class="room-showcase-card">
    <img src="https://wakayaecolodge.com/es/images/wakaya/habitaciones/BF_1.jpg" alt="Bungalow Familiar de Wakaya">
    <div class="room-showcase-copy">
      <h3>Bungalow Familiar</h3>
      <p>Mayor amplitud para compartir la experiencia de laguna, jardines y descanso.</p>
      <div class="room-showcase-meta"><span>4 huéspedes</span><span>Desde S/ 350</span></div>
      <button class="button-primary" type="button" data-room-target="familiar">Ver detalle</button>
    </div>
  </article>
  <article class="room-showcase-card">
    <img src="https://wakayaecolodge.com/es/images/wakaya/habitaciones/0BT_1.jpg" alt="Bungalow Suite de Wakaya">
    <div class="room-showcase-copy">
      <h3>Bungalow Suite</h3>
      <p>La categoria mas intima para una llegada mas exclusiva y una estadia de descanso privado.</p>
      <div class="room-showcase-meta"><span>2 huéspedes</span><span>Desde S/ 420</span></div>
      <button class="button-primary" type="button" data-room-target="suite">Ver detalle</button>
    </div>
  </article>
  <article class="room-showcase-card">
    <img src="https://wakayaecolodge.com/es/images/wakaya/habitaciones/BM_1.jpg" alt="Bungalow Matrimonial de Wakaya">
    <div class="room-showcase-copy">
      <h3>Bungalow Matrimonial</h3>
      <p>Una alternativa flexible para escapadas cortas con integracion natural y un rango mas accesible.</p>
      <div class="room-showcase-meta"><span>2 huéspedes</span><span>Desde S/ 250</span></div>
      <button class="button-primary" type="button" data-room-target="rio">Ver detalle</button>
    </div>
  </article>
</div>

<div class="services-grid">
  <article class="service-tile"><strong>Laguna natural</strong><span>Recorridos suaves y experiencia de selva viva.</span></article>
  <article class="service-tile"><strong>Piscina</strong><span>Tiempo de relax dentro del lodge.</span></article>
  <article class="service-tile"><strong>Restaurante</strong><span>Comida y servicio para la experiencia completa.</span></article>
  <article class="service-tile"><strong>Zona de juegos</strong><span>Apoyo para estadias familiares y de grupo.</span></article>
</div>

<div class="promo-split">
  <div class="promo-copy">
    <p class="section-kicker">Experiencia Wakaya</p>
    <h2>Un refugio tropical para dormir, celebrar y desconectar.</h2>
    <p>La nueva home debe vender naturaleza, agua, madera y descanso sin perder claridad comercial.</p>
  </div>
  <img src="https://wakayaecolodge.com/es/images/wakaya/services/servicio_laguna.jpg" alt="Laguna de Wakaya">
</div>

<div class="experience-split">
  <article class="experience-copy">
    <p class="section-kicker">Eventos y Full Day</p>
    <h2>Una segunda línea de negocio visible, sin quitarle el protagonismo al hospedaje.</h2>
    <p>El home debe mostrar bodas, eventos corporativos y visitas de día completo como extensiones naturales de la experiencia Wakaya.</p>
    <div class="hero-actions">
      <button class="button-primary" type="button" data-target-view="eventos">Ver eventos</button>
      <button class="button-secondary" type="button" data-target-view="full-day">Ver full day</button>
    </div>
  </article>
  <img src="https://wakayaecolodge.com/es/images/wakaya/eventos/evenos_celebraciones_familiar.jpg" alt="Celebración en Wakaya">
</div>

<div class="immersive-gallery">
  <img src="https://wakayaecolodge.com/es/images/wakaya/services/servicio_fullday_laguna.jpg" alt="Vista de laguna y vegetación en Wakaya">
  <div class="gallery-stack">
    <img src="https://wakayaecolodge.com/es/images/wakaya/services/servicio_piscina.jpg" alt="Piscina de Wakaya">
    <img src="https://wakayaecolodge.com/es/images/wakaya/services/DSC_5853-PLATO%20COMIDA.jpg" alt="Restaurante de Wakaya">
  </div>
</div>

<div class="final-cta">
  <p class="section-kicker">Reserva Wakaya</p>
  <h2>Consulta disponibilidad y deja que el equipo cierre contigo la mejor estadía.</h2>
  <p>La web mantiene disponibilidad referencial y confirmación manual, pero la experiencia de decisión debe sentirse inmediata y premium.</p>
  <div class="hero-actions">
    <button class="button-primary" type="button" data-target-view="habitaciones">Explorar habitaciones</button>
    <button class="button-secondary" type="button" id="final-availability-cta">Consultar disponibilidad</button>
  </div>
</div>
```

- [ ] **Step 3: Mantener consistencia entre home y detalle actualizando el modelo `rooms`**

```js
const rooms = {
  familiar: {
    title: "Bungalow Familiar",
    kicker: "Amplio · familiar · descanso compartido",
    guests: "4 huéspedes",
    price: "S/ 350",
    availability: "3 espacios referenciales",
    badge: "Categoría familiar",
    description: "La opción más amplia para grupos pequeños o familias que quieren combinar descanso, piscina, laguna y áreas verdes en una sola estadía.",
    image: "https://wakayaecolodge.com/es/images/wakaya/habitaciones/BF_1.jpg",
    amenities: [
      "Capacidad superior para visitas familiares.",
      "Acceso cómodo a zonas comunes y jardines.",
      "Funciona bien para escapadas de grupo corto.",
      "Coordinación manual de reserva y pago posterior."
    ]
  },
  suite: {
    title: "Bungalow Suite",
    kicker: "Privado · premium · descanso íntimo",
    guests: "2 huéspedes",
    price: "S/ 420",
    availability: "2 espacios referenciales",
    badge: "Categoría premium",
    description: "La categoría más reservada para estadías de pareja o visitas donde prima la privacidad, el confort y una llegada más exclusiva desde el primer contacto.",
    image: "https://wakayaecolodge.com/es/images/wakaya/habitaciones/0BT_1.jpg",
    amenities: [
      "Privacidad superior para estadías cortas o de pareja.",
      "Interior de madera y atmósfera más exclusiva.",
      "Rango tarifario más alto dentro del catálogo visible.",
      "Validación final de reserva con el equipo de Wakaya."
    ]
  },
  rio: {
    title: "Bungalow Matrimonial",
    kicker: "Flexible · cálido · primera visita",
    guests: "2 huéspedes",
    price: "S/ 250",
    availability: "4 espacios referenciales",
    badge: "Categoría de entrada",
    description: "Una alternativa accesible para entrar a Wakaya sin perder integración con naturaleza, vegetación y sensación de descanso tropical.",
    image: "https://wakayaecolodge.com/es/images/wakaya/habitaciones/BM_1.jpg",
    amenities: [
      "Buena opción para escapadas cortas y de primera visita.",
      "Integración cercana con jardines y zonas comunes.",
      "Capacidad cómoda para una pareja.",
      "Coordinación manual de disponibilidad y pago."
    ]
  }
};
```

- [ ] **Step 4: Verificar que la home nueva ya expone todos los bloques aprobados**

Run: `rg -n "hero-slider|booking-band|room-grid|promo-split|services-grid|experience-section|gallery-section|final-cta-section|Consultar disponibilidad" specs/002-public-site/prototype-html5/index.html`

Expected: aparecen todos los bloques y el CTA principal del booking band.

- [ ] **Step 5: Commit del nuevo contenido de home**

```bash
git add specs/002-public-site/prototype-html5/index.html
git commit -m "feat: rebuild public home content flow"
```

### Task 4: Añadir comportamiento del slider, validar y regenerar el hub

**Files:**
- Modify: `specs/002-public-site/prototype-html5/index.html`
- Modify: `prototype/index.html`

- [ ] **Step 1: Extender el JS actual con slider y controles del hero**

```js
const heroSlides = Array.from(document.querySelectorAll(".hero-slide"));
const heroDots = document.querySelector(".hero-dots");
let activeHeroSlide = 0;
let heroTimer = null;

function renderHeroDots() {
  heroDots.innerHTML = heroSlides
    .map((_, index) => `<button type="button" class="hero-dot${index === activeHeroSlide ? " is-active" : ""}" data-slide-index="${index}" aria-label="Ir al slide ${index + 1}"></button>`)
    .join("");
}

function setHeroSlide(index) {
  activeHeroSlide = (index + heroSlides.length) % heroSlides.length;
  heroSlides.forEach((slide, slideIndex) => {
    slide.classList.toggle("is-active", slideIndex === activeHeroSlide);
  });
  renderHeroDots();
}

function startHeroAutoplay() {
  clearInterval(heroTimer);
  heroTimer = window.setInterval(() => setHeroSlide(activeHeroSlide + 1), 4800);
}

document.addEventListener("click", (event) => {
  const arrow = event.target.closest("[data-slide-dir]");
  if (arrow) {
    setHeroSlide(activeHeroSlide + Number(arrow.dataset.slideDir));
    startHeroAutoplay();
  }

  const dot = event.target.closest("[data-slide-index]");
  if (dot) {
    setHeroSlide(Number(dot.dataset.slideIndex));
    startHeroAutoplay();
  }

  if (event.target.id === "final-availability-cta") {
    showView("habitaciones");
  }
});

renderHeroDots();
startHeroAutoplay();
```

- [ ] **Step 2: Verificar que el JS del hero convive con `showView` y `renderRoomDetail`**

Run: `rg -n "const heroSlides|renderHeroDots|setHeroSlide|startHeroAutoplay|showView\\(|renderRoomDetail\\(" specs/002-public-site/prototype-html5/index.html`

Expected: aparecen las funciones del slider y se mantienen `showView` y `renderRoomDetail`.

- [ ] **Step 3: Ejecutar validadores del prototipo**

Run: `node ci/scripts/check-html5-prototype-quality.mjs --spec specs/002-public-site --strict`

Expected: exit `0`.

- [ ] **Step 4: Ejecutar contrato, producto visible y cross-links**

Run: `node ci/scripts/check-prototype-contract.mjs --feature 002-public-site --strict && node ci/scripts/check-prototype-visible-product.mjs --feature 002-public-site --strict && node ci/scripts/check-prototype-cross-links.mjs --strict`

Expected: todos salen `0`; `check-prototype-visible-product` puede seguir reportando revision humana `pending` sin bloquear mientras el formato sea valido.

- [ ] **Step 5: Regenerar y validar el hub**

Run: `npm run prototype:hub && node ci/scripts/check-prototype-hub.mjs --strict`

Expected: exit `0` y `prototype/index.html` actualizado sin edicion manual.

- [ ] **Step 6: Verificar diff final del slice**

Run: `git diff -- specs/002-public-site/product-design.md specs/002-public-site/spdd-frontend.md specs/002-public-site/prototype-html5/decisiones-ux.md specs/002-public-site/prototype.md specs/002-public-site/traceability.md specs/002-public-site/prototype-validation.md specs/002-public-site/prototype-html5/index.html prototype/index.html`

Expected: el diff muestra reemplazo de la home actual, correccion documental y regeneracion del hub.

- [ ] **Step 7: Commit del prototipo listo para revision**

```bash
git add specs/002-public-site/product-design.md specs/002-public-site/spdd-frontend.md specs/002-public-site/prototype-html5/decisiones-ux.md specs/002-public-site/prototype.md specs/002-public-site/traceability.md specs/002-public-site/prototype-validation.md specs/002-public-site/prototype-html5/index.html prototype/index.html
git commit -m "feat: redesign wakaya public home from parador"
```

## Self-Review

- Cobertura del spec:
  - `Parador` como base visual: Tasks 2, 3 y 4.
  - Wakaya como contenido y color: Tasks 1 y 3.
  - Home actual descartada: Tasks 2 y 3.
  - `publicaciones` fuera de home: Task 3.
  - Hub listo para revision humana: Task 4.
- Placeholder scan:
  - No se dejan `TODO`, `TBD` ni referencias a archivos ficticios.
- Consistencia:
  - La ruta canonica se mantiene en `prototype-html5/index.html`.
  - Los nombres de vista se mantienen: `home`, `habitaciones`, `habitacion-detalle`, `eventos`, `full-day`.
