/**
 * shared-prototype-helpers.js (v12.52)
 *
 * Helper canonico para navegacion cross-spec entre prototipos HTML5.
 * Copia este bloque al final de tu <script> en specs/<feature>/prototype-html5/index.html
 * (o referencia este archivo como <script src="../../../plantillas/transversal/shared-prototype-helpers.js">
 *  si tu prototipo esta dentro del template canonico).
 *
 * Cierra la limitacion v12.51: los prototipos no podian pasarse contexto entre si.
 *
 * Convencion de parametros canonicos (URLSearchParams):
 *   ?from=<hub|spec-NNN>          quien abrio este prototipo
 *   ?role=<rol-del-dominio>        rol activo del usuario simulado
 *   ?id=<resource-id>              ID del recurso especifico (EXP-001, USER-123, etc.)
 *   ?demo-mode=true                indica que vino del hub de simulacion
 *   ?spec=<NNN>                    spec origen del cross-link
 *
 * Uso minimo en cualquier prototipo:
 *   const ctx = getPrototypeContext();
 *   applyContextualUI(ctx);
 *   // Para abrir otra feature con contexto:
 *   openPrototypeBySpec('002', { id: 'EXP-001', role: ctx.role });
 */

(function () {
  if (typeof window === 'undefined') return;
  if (window.__protoHelpers) return; // idempotente

  /**
   * Lee URL params y devuelve un objeto inmutable con el contexto canonico.
   * Cualquier param adicional queda en ctx.extra.
   */
  function getPrototypeContext() {
    const params = new URLSearchParams(window.location.search);
    const known = ['from', 'role', 'id', 'demo-mode', 'spec'];
    const extra = {};
    for (const [k, v] of params) {
      if (!known.includes(k)) extra[k] = v;
    }
    return Object.freeze({
      from: params.get('from') || null,
      role: params.get('role') || null,
      id: params.get('id') || null,
      demoMode: params.get('demo-mode') === 'true' || params.get('from') === 'hub',
      specOrigin: params.get('spec') || null,
      extra,
      raw: params.toString(),
    });
  }

  /**
   * Aplica UI segun contexto. Patrones default:
   *   - Si vino del hub o demoMode=true, asegura visibilidad del link al hub.
   *   - Si vino con role=<X>, sincroniza switches/selectores con [data-role-switch].
   *   - Si vino con id=<X>, expone el id en window.title como sufijo y selecciona la fila [data-resource-id="X"].
   *   - Si vino con specOrigin=<NNN>, agrega banner discreto "Volver a spec NNN".
   */
  function applyContextualUI(ctx) {
    const hub = document.querySelector('[data-hub-link], .hub-link');
    if (hub && ctx.demoMode) hub.style.display = '';

    // Sincronizar rol con cualquier <select data-role-switch> o radios.
    if (ctx.role) {
      document.querySelectorAll('[data-role-switch]').forEach((el) => {
        if ('value' in el) el.value = ctx.role;
      });
      // Anota el rol como atributo en <body> para CSS condicional.
      document.body.setAttribute('data-active-role', ctx.role);
    }

    // Seleccionar recurso si vino con id.
    if (ctx.id) {
      // Sufijo de title sin sobrescribir el principal.
      if (document.title && !document.title.includes(ctx.id)) {
        document.title = `${document.title} · ${ctx.id}`;
      }
      const row = document.querySelector(`[data-resource-id="${cssEscape(ctx.id)}"]`);
      if (row) {
        row.classList.add('row--linked-context');
        row.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }

    // Banner de origen cross-spec discreto si vino de otro spec.
    if (ctx.specOrigin) {
      const banner = document.createElement('a');
      banner.href = `../../../specs/${cssEscape(ctx.specOrigin)}*/prototype-html5/index.html?from=spec-return`;
      banner.textContent = `← Volver a spec ${ctx.specOrigin}`;
      banner.setAttribute('data-cross-spec-return', '');
      Object.assign(banner.style, {
        position: 'fixed', bottom: '14px', left: '14px', zIndex: '99',
        fontSize: '11px', padding: '5px 11px', borderRadius: '6px',
        background: 'rgba(0,0,0,.75)', color: '#fff', textDecoration: 'none',
        boxShadow: '0 4px 12px rgba(0,0,0,.15)',
      });
      document.body.appendChild(banner);
    }
  }

  /**
   * Abre otro prototipo (por # de spec) con contexto.
   *   openPrototypeBySpec('002', { id: 'EXP-001', role: 'supervisor' });
   * Usa la primera coincidencia de specs/NNN-* via patron heuristico.
   * @param specNum string|number — numero de spec (ej. '002' o 2).
   * @param params object — { id?, role?, ...extra }
   * @param target string — '_blank' (default) o '_self'.
   */
  function openPrototypeBySpec(specNum, params = {}, target = '_blank') {
    const ctxNow = getPrototypeContext();
    const slug = String(specNum).padStart(3, '0');
    const query = new URLSearchParams();
    query.set('from', 'spec-' + (ctxNow.specOrigin || resolveCurrentSpec() || 'unknown'));
    if (params.role || ctxNow.role) query.set('role', params.role || ctxNow.role);
    if (params.id) query.set('id', params.id);
    if (ctxNow.demoMode) query.set('demo-mode', 'true');
    for (const [k, v] of Object.entries(params)) {
      if (['role', 'id'].includes(k)) continue;
      if (v != null) query.set(k, String(v));
    }
    // Heuristica: en goldens del template, los prototipos viven en specs/NNN-<slug>/prototype-html5/.
    // El href usa el patron de carpetas hermanas. El navegador resuelve fileuri.
    const href = `../../../specs/${slug}-*/prototype-html5/index.html?${query.toString()}`;
    window.open(href, target);
  }

  /** Heuristica: el spec actual se infiere de location.pathname (.../specs/NNN-slug/...). */
  function resolveCurrentSpec() {
    const m = (window.location.pathname || '').match(/\/specs\/(\d{3,})-/);
    return m ? m[1] : null;
  }

  function cssEscape(s) {
    return String(s).replace(/[^a-zA-Z0-9_-]/g, (c) => '\\' + c);
  }

  window.__protoHelpers = { getPrototypeContext, applyContextualUI, openPrototypeBySpec, resolveCurrentSpec };
  window.getPrototypeContext = getPrototypeContext;
  window.applyContextualUI = applyContextualUI;
  window.openPrototypeBySpec = openPrototypeBySpec;
})();
