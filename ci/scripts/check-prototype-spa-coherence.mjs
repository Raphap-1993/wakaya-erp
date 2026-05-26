#!/usr/bin/env node
/**
 * check-prototype-spa-coherence.mjs (v12.85)
 *
 * Coherencia del modo portfolio-spa: si el proyecto es SPA (centraliza en
 * specs/_shared/), entonces TODOS los prototipos de feature deben enlazar
 * _shared/, usar el sidebar COMPARTIDO (_shared/nav.js) sin duplicarlo, y el
 * manifiesto (nav-items.js) debe estar en sintonia con los prototipos reales.
 *
 * Cierra el patron real (opencodev3): se eligio SPA, se creo specs/_shared/,
 * pero los prototipos quedaron standalone (no enlazan _shared/, sidebar
 * duplicado, sin cross-link) -> _shared/ muerto. Y nuevas casuisticas (v12.85):
 * mount inerte (#spdd-nav hidden), sidebar inline coexistiendo con nav.js, y
 * drift manifiesto<->filesystem (prototipo no registrado / entrada sin prototipo).
 *
 * Deteccion de "proyecto SPA" (si CUALQUIERA es verdad):
 *   - _shared/nav-items.js tiene >=1 item declarado, O
 *   - >=1 prototipo de feature enlaza ../../_shared/.
 * Si el proyecto NO es SPA (standalone), no aplica -> OK.
 *
 * BLOQUEA (cuando SPA activo):
 *   - prototype-no-enlaza-shared: una feature con prototipo no enlaza _shared/.
 *   - mount-inerte: enlaza nav.js pero #spdd-nav sigue con `hidden` (sidebar no visible).
 *   - sidebar-duplicado: usa nav.js pero conserva un sidebar inline (<aside .sidebar>).
 *   - no-registrado-en-manifiesto: prototipo SPA ausente de nav-items.js (inalcanzable).
 *   - manifiesto-sin-prototipo: entrada de nav-items.js sin prototipo real (link roto).
 * WARNING:
 *   - sin-nav-compartido: enlaza _shared/ pero no usa _shared/nav.js (sidebar no centralizado).
 *
 * Modos: --strict | --warn (default) | --feature X | --root <path>.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { listIncludedFeatures } from "./_lib/feature-filter.mjs";
import { resolveStrict } from "./_lib/strict-mode.mjs";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = resolveStrict(args);
const featureFilter = args.feature || null;

const navItemsPath = join(root, "specs", "_shared", "nav-items.js");
function stripComments(s) {
  return String(s).replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}
const navItemsRaw = existsSync(navItemsPath) ? readFileSync(navItemsPath, "utf8") : "";
const navItemsCode = stripComments(navItemsRaw);
const navItemsSlugs = [];
{
  const re = /slug\s*:\s*["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(navItemsCode)) !== null) navItemsSlugs.push(m[1]);
}
const navItemsHasEntries = navItemsSlugs.length > 0;

const features = listIncludedFeatures(root).filter((s) => !featureFilter || s.startsWith(featureFilter));
const withProto = [];
for (const slug of features) {
  const p = join(root, "specs", slug, "prototype-html5", "index.html");
  if (!existsSync(p)) continue;
  withProto.push({ slug, html: readFileSync(p, "utf8") });
}

const anyLinksShared = withProto.some((f) => /\.\.\/\.\.\/_shared\//.test(f.html));
const spaActive = navItemsHasEntries || anyLinksShared;

console.log(`check-prototype-spa-coherence (v12.85) ${strict ? "[STRICT]" : "[WARN]"}`);
if (!spaActive) {
  console.log(`Proyecto no usa portfolio-spa (specs/_shared no referenciado). No aplica — OK.`);
  process.exit(0);
}
console.log(`Proyecto en modo portfolio-spa. Prototipos evaluados: ${withProto.length} | items en manifiesto: ${navItemsSlugs.length}`);

const blockers = [];
const warnings = [];

// ── Detectores de markup ──────────────────────────────────────────────
// #spdd-nav que sigue oculto -> el sidebar compartido NO se ve (mount inerte).
function mountIsInert(html) {
  const m = html.match(/<div[^>]*id=["']spdd-nav["'][^>]*>/i);
  return m ? /\shidden(\s|=|>|\/)/i.test(m[0]) : false;
}
// Sidebar propio del golden conservado junto al compartido -> duplicado visual.
function hasInlineSidebar(html) {
  if (/<aside[^>]*class=["'][^"']*\bsidebar\b/i.test(html)) return true;
  if (/<nav[^>]*class=["'][^"']*\bsidebar\b/i.test(html)) return true;
  return false;
}

for (const f of withProto) {
  const linksShared = /\.\.\/\.\.\/_shared\//.test(f.html);
  const usesNav = /_shared\/nav\.js/.test(f.html);
  if (!linksShared) {
    blockers.push({ slug: f.slug, kind: "prototype-no-enlaza-shared", message: "no enlaza ../../_shared/ (en proyecto portfolio-spa cada prototipo debe usar la infra compartida)." });
    continue;
  }
  if (!usesNav) {
    warnings.push({ slug: f.slug, kind: "sin-nav-compartido", message: "enlaza _shared/ pero no usa _shared/nav.js — el sidebar no esta centralizado (probable duplicado)." });
  } else {
    // Usa nav.js: validar que el mount este activo y sin sidebar duplicado.
    if (mountIsInert(f.html)) {
      blockers.push({ slug: f.slug, kind: "mount-inerte", message: "<div id=\"spdd-nav\"> sigue con `hidden`: el sidebar compartido no se renderiza. Quita el atributo hidden." });
    }
    if (hasInlineSidebar(f.html)) {
      blockers.push({ slug: f.slug, kind: "sidebar-duplicado", message: "conserva un sidebar inline (<aside class=\"sidebar\">) ademas de _shared/nav.js — dos menus. Elimina el sidebar del golden." });
    }
  }
  // Drift: cada prototipo SPA debe estar en el manifiesto (si no, inalcanzable).
  if (navItemsHasEntries && navItemsSlugs.indexOf(f.slug) === -1) {
    blockers.push({ slug: f.slug, kind: "no-registrado-en-manifiesto", message: "tiene prototipo SPA pero no esta en _shared/nav-items.js — inalcanzable desde el sidebar. Registra el item (o corre scaffold:prototype --mode portfolio-spa)." });
  }
}

// Drift inverso: cada entrada del manifiesto debe tener prototipo real.
for (const slug of navItemsSlugs) {
  const p = join(root, "specs", slug, "prototype-html5", "index.html");
  if (!existsSync(p)) {
    blockers.push({ slug, kind: "manifiesto-sin-prototipo", message: `_shared/nav-items.js declara "${slug}" pero no existe specs/${slug}/prototype-html5/index.html — link roto en el sidebar.` });
  }
}

if (blockers.length === 0 && warnings.length === 0) {
  console.log(`\nOK. Todos los prototipos usan la infra compartida + el sidebar comun (_shared/nav.js) y el manifiesto esta en sintonia.`);
  process.exit(0);
}

if (blockers.length > 0) {
  console.error(`\nBloqueantes (${blockers.length}):`);
  for (const b of blockers) console.error(`  ✗ [${b.kind}] specs/${b.slug}: ${b.message}`);
}
if (warnings.length > 0) {
  console.error(`\nWarnings (${warnings.length}):`);
  for (const w of warnings) console.error(`  ⚠ [${w.kind}] specs/${w.slug}: ${w.message}`);
}
console.error(`\nFix sugerido:`);
console.error(`  1. Regenera cada prototipo en modo SPA (enlaza _shared/ + sidebar compartido):`);
console.error(`     npm run scaffold:prototype -- --feature <slug> --domain <dominio> --mode portfolio-spa --force`);
console.error(`  2. Elimina el <aside>/sidebar inline del golden y quita el atributo hidden de <div id="spdd-nav">.`);
console.error(`  3. Manten _shared/nav-items.js en sintonia: 1 item por prototipo, sin entradas huerfanas.`);
console.error(`  4. Si NO querias SPA, no centralices: usa --mode standalone y no dejes _shared/ a medias.`);

process.exit(blockers.length > 0 && strict ? 1 : 0);

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      if (argv[i + 1] && !argv[i + 1].startsWith("--")) out[key] = argv[++i];
      else out[key] = true;
    }
  }
  return out;
}
