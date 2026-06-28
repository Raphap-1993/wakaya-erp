#!/usr/bin/env node
/**
 * roadmap-next.mjs (v12.63)
 *
 * Devuelve la PROXIMA TAREA SEGURA para un agente IA, en formato JSON
 * estructurado y accionable.
 *
 * v12.62: usa el ladder de estado visual del prototipo (_lib/prototype-state.mjs)
 * para decidir, en fase 2, si el agente debe MEJORAR el prototipo (exists/
 * auto-quality) o si toca pedir REVISION VISUAL HUMANA (visible-product/
 * human-review-pending). La feature no avanza a fase 3 hasta human-approved.
 *
 * v12.63: el output deja de ser "sugerencia" y pasa a ser CONTRATO DE EJECUCION:
 * incluye touch_policy (rutas permitidas/prohibidas), recommended_agent,
 * definition_of_done y transition_request — todo derivado de phase-contracts.mjs.
 * Ademas bloquea por dependencias (## Dependencias) y amplia agent_readiness.
 * Consumido por roadmap:prompt (renderiza prompt) y roadmap:audit (verifica diff).
 *
 * A diferencia de roadmap-status (que reporta estado), roadmap-next
 * RECOMIENDA una accion concreta con:
 *   - next_action       (descripcion en lenguaje natural)
 *   - feature           (feature target, si aplica)
 *   - phase             (fase actual de la feature)
 *   - agent_readiness   (enum ampliado v12.63: ready_for_ai | ready_for_ai_with_constraints |
 *                        needs_human_input | needs_human_approval | blocked_by_dependency |
 *                        blocked_by_gate | blocked_by_missing_context | blocked_by_failed_checks)
 *   - reason            (por que ese readiness — obligatorio cuando no es ready_for_ai puro)
 *   - allowed_actions   (que puede hacer el agente sin romper el metodo)
 *   - forbidden_actions (que NO puede hacer)
 *   - must_read         (archivos que debe leer ANTES de actuar)
 *   - commands_to_run   (comandos sugeridos en orden)
 *   - exit_criteria     (cuando puede declarar la tarea completa)
 *   - blockers          (que lo impide ahora mismo, si aplica)
 *   - touch_policy      (v12.63: allowed_paths / forbidden_paths — enforzable por roadmap:audit)
 *   - recommended_agent / allowed_agents  (v12.63: perfil de agente para la tarea)
 *   - definition_of_done (v12.63: deliverables + checks, derivado del contrato de fase)
 *   - transition_request (v12.63: gate que puede SOLICITAR, no aprobar)
 *
 * Logica de seleccion (prioridad descendente):
 *   1. Bloqueadores activos (faltan archivos canonicos) -> ATACAR primero.
 *   2. Features en fase 2 con gate-prototype-ready pendiente -> completar.
 *   3. Features en fase 4 con gate-sdd-approved pendiente -> spec tecnica.
 *   4. Features en fase 5 sin @trace -> harvest + anotar.
 *   5. Features en fase 6 sin coverage -> agregar tests.
 *   6. Si todo OK, ejecutar check:all y reportar gaps.
 *
 * Uso:
 *   npm run roadmap:next                  # JSON pretty-printed
 *   npm run roadmap:next -- --format text # legible para humanos
 *
 * Exit codes:
 *   0 - tarea sugerida con exito.
 *   1 - error al leer estado.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
import { listIncludedFeatures } from "../ci/scripts/_lib/feature-filter.mjs";
import { getPhaseContract, getTouchPolicy, getAgentProfile, getDefinitionOfDone, getTransitionRequest } from "../ci/scripts/_lib/phase-contracts.mjs";
import { computePrototypeState } from "../ci/scripts/_lib/prototype-state.mjs";
import { activeLockOwner } from "../ci/scripts/_lib/agent-locks.mjs";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const format = args.format || "json";
const autoFix = !!args["auto-fix"];
const myAgent = args.agent ? String(args.agent) : null; // v12.76: identidad del agente que pregunta

if (!existsSync(join(root, "package.json"))) {
  console.error(`Error: ${root} no parece un proyecto valido.`);
  process.exit(1);
}

// 1. Obtener estado del roadmap.
const roadmapStatus = getRoadmapStatus();
const features = enrichFeatures();
// v12.63: anexar bloqueadores por dependencia (## Dependencias) a cada feature.
attachDependencyBlockers(features);

// 2. Calcular la siguiente accion segura.
const next = decideNextAction(roadmapStatus, features);

// v12.58: agregar contrato de ejecucion de la fase actual al output.
if (next.phase >= 0 && next.phase <= 8) {
  next.phase_contract = getPhaseContract(next.phase);
}

// v12.63: contrato de ejecucion ENFORZABLE derivado de phase-contracts (fuente unica).
// touch_policy + perfil de agente + DoD + transition se anexan a CUALQUIER accion,
// con <feature> interpolado al slug real cuando aplica.
if (next.phase >= 0 && next.phase <= 8) {
  const slug = next.feature || null;
  next.touch_policy = getTouchPolicy(next.phase, slug);
  const profile = getAgentProfile(next.phase);
  next.recommended_agent = profile.recommended_agent;
  next.allowed_agents = profile.allowed_agents;
  next.definition_of_done = getDefinitionOfDone(next.phase);
  next.transition_request = getTransitionRequest(next.phase);
}

// v12.59: --auto-fix detecta fixes SEGUROS y los ejecuta tras confirmacion.
// Lista de fixes considerados "seguros" (idempotentes, no destructivos):
//   1. template:upgrade --apply --fix-bidirectional (corrige hrefs hub<->spec)
//   2. memory:sync (re-sincroniza BD desde markdown)
//   3. memory:context (regenera zonas auto)
//   4. prototype:hub (regenera hub si falta link a alguna feature)
//   5. generate:openapi (consolida openapi.yaml desde api-contract.md)
// NO se consideran seguros:
//   - migrate-gates (cambia formato semantico)
//   - replace-mock (reemplaza contenido)
//   - cualquier scaffold (crea archivos nuevos)
if (autoFix) {
  next.auto_fix_available = computeAutoFixes(next);
  if (format !== "json") {
    console.log(``);
    console.log(`AUTO-FIX SEGUROS DISPONIBLES (${next.auto_fix_available.length}):`);
    next.auto_fix_available.forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.command}  — ${f.reason}`);
    });
    console.log(``);
    console.log(`Para aplicar, ejecuta los comandos manualmente (mantiene control humano).`);
    console.log(`auto-fix NO ejecuta automaticamente — solo sugiere fixes seguros.`);
  }
}

if (format === "text") {
  printText(next);
} else {
  console.log(JSON.stringify(next, null, 2));
}

process.exit(0);

// ─────────────────────────────────────────────────────────────────────────
function getRoadmapStatus() {
  const scriptPath = join(root, "scripts", "roadmap-status.mjs");
  if (!existsSync(scriptPath)) {
    return { phases: [], blockers: ["scripts/roadmap-status.mjs no existe — corre template:upgrade"] };
  }
  const result = spawnSync(process.execPath, [scriptPath, "--json", "--root", root], { encoding: "utf8", timeout: 15000 });
  if (result.status !== 0) {
    return { phases: [], blockers: [`roadmap-status fallo: ${result.stderr?.slice(0, 200)}`] };
  }
  try { return JSON.parse(result.stdout); } catch { return { phases: [], blockers: ["roadmap-status devolvio JSON invalido"] }; }
}

function enrichFeatures() {
  const slugs = listIncludedFeatures(root);
  return slugs.map((slug) => {
    const tracePath = join(root, "specs", slug, "traceability.md");
    const gates = {};
    if (existsSync(tracePath)) {
      const text = readFileSync(tracePath, "utf8");
      // Detectar gates con formato canonico v12.56 (5 cols) o legacy (3 cols).
      const gatesSection = text.match(/##\s+Gates\s*\n([\s\S]*?)(?=\n##\s|$)/i);
      if (gatesSection) {
        const rows = gatesSection[1].split(/\r?\n/).filter((l) => /^\s*\|/.test(l) && !/^\s*\|[\s-]+\|/.test(l));
        const dataRows = rows.slice(1);
        for (const row of dataRows) {
          const cells = row.split("|").map((c) => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
          if (cells.length < 2) continue;
          const gateName = cells[0];
          const status = cells[1].toLowerCase();
          // Normalizar: si es legacy ("Aprobado"/"Pendiente"), inferir.
          let canonicalStatus = status;
          if (!["approved", "pending", "rejected", "blocked"].includes(status)) {
            if (/aprob/i.test(status) || /complet/i.test(status)) canonicalStatus = "approved";
            else if (/pendiente|listo|en diseno/i.test(status)) canonicalStatus = "pending";
            else if (/recha/i.test(status) || /bloque/i.test(status)) canonicalStatus = "blocked";
            else canonicalStatus = "pending"; // fallback
          }
          gates[gateName] = canonicalStatus;
        }
      }
    }
    const missing = [];
    const REQUIRED = ["spec-funcional.md", "spec-tecnica.md", "traceability.md", "prototype.md", "prototype-validation.md", "product-design.md", "spdd-frontend.md", "api-contract.md", "ui-test-cases.md"];
    for (const r of REQUIRED) {
      if (!existsSync(join(root, "specs", slug, r))) missing.push(r);
    }
    const hasPrototype = existsSync(join(root, "specs", slug, "prototype-html5", "index.html"));
    // v12.62: estado visual del prototipo (ladder de 5 peldaños).
    const protoState = computePrototypeState(root, slug);
    // Inferir fase + readiness.
    let phase = 2;
    if (gates["gate-sdd-approved"] === "approved") phase = 4;
    if (gates["gate-build-ready"] === "approved") phase = 5;
    if (gates["gate-qa-passed"] === "approved") phase = 6;
    if (gates["gate-deploy-ready"] === "approved") phase = 7;
    if (gates["gate-operations-ready"] === "approved") phase = 8;
    const readiness = computeReadiness(slug, phase, gates, missing, hasPrototype);
    // v12.76: lock multiagente — feature tomada por OTRO agente activo => no disponible para mi.
    const owner = activeLockOwner(root, slug);
    const lockedBy = (owner && owner !== myAgent) ? owner : null;
    return { slug, phase, gates, missing, hasPrototype, prototype_state: protoState.state, prototype_blocked_by: protoState.blockedBy || null, agent_readiness: readiness, locked_by: lockedBy };
  });
}

/**
 * v12.63: parsea la seccion ## Dependencias de cada feature y marca como
 * bloqueada si una dependencia 'requires/funcional/uses-api/shares-bd/extends'
 * apunta a una feature que aun NO alcanzo el gate requerido (default
 * gate-sdd-approved). Reusa el formato de tabla "NNN-slug → NNN-slug | tipo | motivo".
 */
function attachDependencyBlockers(features) {
  const gateBySlug = {};
  for (const f of features) gateBySlug[f.slug] = f.gates || {};
  for (const f of features) {
    const deps = parseDependencies(root, f.slug);
    const blockers = [];
    for (const d of deps) {
      // Gate requerido en el target segun tipo de dependencia.
      const requiredGate = "gate-sdd-approved"; // umbral conservador: el target debe estar al menos SDD-aprobado
      const targetGates = gateBySlug[d.to];
      const met = targetGates && targetGates[requiredGate] === "approved";
      if (!met) blockers.push({ to: d.to, type: d.type, reason: d.reason, requiredGate });
    }
    f.dependency_blockers = blockers;
  }
}

function parseDependencies(rootDir, slug) {
  const tracePath = join(rootDir, "specs", slug, "traceability.md");
  if (!existsSync(tracePath)) return [];
  const text = readFileSync(tracePath, "utf8");
  const m = text.match(/##\s+Dependencias\s*\n([\s\S]*?)(?=\n##\s|\n$|$)/i);
  if (!m) return [];
  const rows = m[1].split(/\r?\n/).filter((l) => /^\s*\|/.test(l) && !/^\s*\|[\s-]+\|/.test(l));
  const deps = [];
  for (const row of rows.slice(1)) { // skip header
    const cells = row.split("|").map((c) => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
    if (cells.length < 2) continue;
    const arrow = cells[0].match(/(\d{3,}-[a-z0-9-]+)\s*(?:→|->|-->)\s*(\d{3,}-[a-z0-9-]+)/i);
    if (!arrow) continue;
    deps.push({ from: arrow[1], to: arrow[2], type: (cells[1] || "requires").toLowerCase(), reason: cells[2] || "" });
  }
  return deps;
}

function computeReadiness(slug, phase, gates, missing, hasPrototype) {
  if (missing.length > 0) return "blocked";
  // Si hay gate rechazado, blocked.
  for (const status of Object.values(gates)) {
    if (status === "rejected") return "blocked";
  }
  // Fase 2: si NO tiene prototipo, ready_for_ai (puede crearlo).
  // Si tiene prototipo pero gate-prototype-ready esta pending, needs_human.
  if (phase === 2) {
    if (!hasPrototype) return "ready_for_ai";
    if (gates["gate-prototype-ready"] === "pending" || !gates["gate-prototype-ready"]) return "needs_human";
    if (gates["gate-spdd-approved"] === "pending" || !gates["gate-spdd-approved"]) return "needs_human";
  }
  // Default: el agente puede trabajar.
  return "ready_for_ai";
}

function decideNextAction(status, allFeatures) {
  const blockers = status.blockers || [];
  // v12.76: solo recomendar features NO tomadas por otro agente (lock activo).
  const features = allFeatures.filter((f) => !f.locked_by);

  // 1. Bloqueador critico: package.json sin scripts v12.45+.
  if (blockers.some((b) => /package\.json.*scripts/i.test(b))) {
    return {
      next_action: "Sincronizar el proyecto con el template canonico (faltan scripts npm).",
      feature: null,
      phase: 0,
      agent_readiness: "ready_for_ai",
      allowed_actions: [
        "ejecutar npm run template:upgrade -- --apply",
        "ejecutar npm run template:upgrade -- --apply --force-scripts (para sobrescribir check:project)",
      ],
      forbidden_actions: [
        "NO editar package.json manualmente",
        "NO crear features nuevas hasta sincronizar",
      ],
      must_read: ["AGENTS.md", "docs/transversal/90.36-roadmap-metodologico.md"],
      commands_to_run: [
        "npm run template:upgrade -- --apply --force-scripts",
        "npm run memory:sync",
        "npm run check:project",
      ],
      exit_criteria: [
        "npm run template:upgrade ya no reporta scripts faltantes",
        "npm run check:project pasa todos los validadores",
      ],
      blockers,
    };
  }

  // 1b. v12.76: todas las features disponibles estan tomadas por otros agentes.
  if (allFeatures.length > 0 && features.length === 0) {
    const taken = allFeatures.map((f) => `${f.slug} (${f.locked_by})`).join(", ");
    return {
      next_action: "Todas las features estan tomadas por otros agentes. Espera a que liberen o crea una feature nueva.",
      feature: null,
      phase: -1,
      agent_readiness: "needs_human_input",
      reason: "todas las features tienen un lock activo de otro agente",
      allowed_actions: [
        "esperar a que un agente libere su feature (npm run roadmap:release)",
        "tomar una feature nueva del backlog con npm run scaffold:feature",
      ],
      forbidden_actions: [
        "NO trabajar una feature con lock activo de otro agente (rompe el paralelo)",
      ],
      must_read: ["AGENT_BOARD.md"],
      commands_to_run: [
        "npm run roadmap:sync                  # refresca AGENT_BOARD.md",
        "npm run roadmap:release -- --prune    # libera locks expirados",
      ],
      exit_criteria: ["una feature queda libre, o se crea una nueva"],
      blockers: [`Features tomadas: ${taken}`],
    };
  }

  // 2. Features con archivos canonicos faltantes.
  const incomplete = features.filter((f) => f.missing.length > 0);
  if (incomplete.length > 0) {
    const f = incomplete[0];
    return {
      next_action: `Completar los ${f.missing.length} archivos canonicos faltantes en specs/${f.slug}/`,
      feature: f.slug,
      phase: f.phase,
      agent_readiness: "ready_for_ai",
      allowed_actions: [
        `crear specs/${f.slug}/${f.missing[0]}`,
        ...f.missing.slice(1, 4).map((m) => `crear specs/${f.slug}/${m}`),
        `usar 'npm run scaffold:feature' si la estructura completa falta`,
      ],
      forbidden_actions: [
        "NO crear backend/ ni src/ hasta completar specs",
        "NO aprobar gates sin validacion humana",
      ],
      must_read: [
        "AGENTS.md",
        `specs/${f.slug}/spec-funcional.md (si existe)`,
        "plantillas/_full-feature-example/README.md",
      ],
      commands_to_run: [
        `# Si la feature aun no esta scaffoldada:`,
        `npm run scaffold:feature -- --slug ${f.slug} --titulo "Tu titulo" --rfs RF-NN --hus HU-NN --entidad mi_entidad --endpoint "GET /api/x"`,
        `# Despues:`,
        `npm run memory:sync`,
        `npm run check:project`,
      ],
      exit_criteria: [
        `Los 9 archivos canonicos existen en specs/${f.slug}/`,
        "check:instantiation no reporta archivos faltantes",
      ],
      blockers,
    };
  }

  // 2b. v12.63: Feature candidata (sin archivos faltantes) bloqueada por dependencia.
  const depBlocked = features.find((f) => f.missing.length === 0 && f.dependency_blockers && f.dependency_blockers.length > 0);
  if (depBlocked) {
    const db = depBlocked.dependency_blockers;
    return {
      next_action: `specs/${depBlocked.slug}/ esta bloqueada por ${db.length} dependencia(s) sin resolver. Avanza primero la(s) feature(s) de la que depende.`,
      feature: depBlocked.slug,
      phase: depBlocked.phase,
      agent_readiness: "blocked_by_dependency",
      reason: db.map((d) => `depende de ${d.to} (${d.type}) que aun no tiene ${d.requiredGate} approved`).join("; "),
      allowed_actions: [
        ...db.map((d) => `avanzar specs/${d.to}/ hasta ${d.requiredGate} (motivo: ${d.reason || "dependencia declarada"})`),
        "consultar 'npm run check:feature-dependencies' para ver el grafo completo",
      ],
      forbidden_actions: [
        `NO empezar a construir specs/${depBlocked.slug}/ hasta que sus dependencias esten resueltas`,
        "NO eliminar la dependencia de traceability.md para 'desbloquear' sin justificacion",
      ],
      must_read: [
        `specs/${depBlocked.slug}/traceability.md (seccion ## Dependencias)`,
        ...db.slice(0, 2).map((d) => `specs/${d.to}/traceability.md`),
      ],
      commands_to_run: [
        "npm run check:feature-dependencies",
        "npm run roadmap:status",
      ],
      exit_criteria: [
        ...db.map((d) => `${d.to} alcanza ${d.requiredGate} approved`),
        `recien entonces specs/${depBlocked.slug}/ queda desbloqueada`,
      ],
      blockers: db.map((d) => `Depende de ${d.to}, que no tiene ${d.requiredGate} approved`),
    };
  }

  // 3. Feature en fase 2 sin prototipo.
  const needsPrototype = features.find((f) => f.phase === 2 && !f.hasPrototype && (!f.dependency_blockers || f.dependency_blockers.length === 0));
  if (needsPrototype) {
    return {
      next_action: `Generar prototipo HTML5 para specs/${needsPrototype.slug}/`,
      feature: needsPrototype.slug,
      phase: 2,
      agent_readiness: "ready_for_ai",
      allowed_actions: [
        `ejecutar 'npm run scaffold:prototype -- --feature ${needsPrototype.slug} --domain <dominio> --titulo "X" --marca "Y"'`,
        `adaptar mock data del prototipo al dominio de specs/${needsPrototype.slug}/`,
        `actualizar specs/${needsPrototype.slug}/prototype.md con anatomia y tokens CSS`,
        `crear/actualizar specs/${needsPrototype.slug}/prototype-validation.md`,
      ],
      forbidden_actions: [
        "NO empezar a implementar backend/frontend",
        "NO aprobar gate-prototype-ready sin validacion humana",
        "NO copiar el prototipo de otra feature (rompe check:prototype-diversity)",
      ],
      must_read: [
        `specs/${needsPrototype.slug}/spec-funcional.md`,
        `specs/${needsPrototype.slug}/product-design.md`,
        `specs/${needsPrototype.slug}/spdd-frontend.md`,
        "ejemplos/fase-2-ux-ui/prototype-html5-golden/README.md",
        "docs/fase-2-ux-ui/02.16-rubrica-calidad-prototipo-html5.md",
      ],
      commands_to_run: [
        `npm run scaffold:prototype -- --feature ${needsPrototype.slug} --domain operativo --titulo "Tu titulo" --marca "TuMarca" --replace-mock`,
        `# (adapta mock data y editar prototype.md)`,
        `npm run prototype:hub`,
        `npm run check:prototype-html5`,
        `npm run check:project`,
      ],
      exit_criteria: [
        `specs/${needsPrototype.slug}/prototype-html5/index.html existe`,
        "check:prototype-html5 reporta nivel 2 o superior",
        "check:prototype-domain-mismatch no detecta mock del golden",
        "check:prototype-bidirectional-links pasa",
        "prototype-validation.md actualizado con participantes humanos",
        "gate-prototype-ready queda 'pending' hasta validacion humana",
      ],
      blockers,
    };
  }

  // 4a. v12.62: Feature en fase 2 con prototipo que aun NO alcanza producto visible
  //     (exists / auto-quality). El agente PUEDE mejorarlo (es trabajo de agente).
  const needsImprovement = features.find((f) => f.phase === 2 && f.hasPrototype && (f.prototype_state === "exists" || f.prototype_state === "auto-quality"));
  if (needsImprovement) {
    const why = needsImprovement.prototype_blocked_by || "no alcanza producto visible";
    return {
      next_action: `Mejorar el prototipo de specs/${needsImprovement.slug}/ hasta producto visible (estado actual: ${needsImprovement.prototype_state}).`,
      feature: needsImprovement.slug,
      phase: 2,
      agent_readiness: "ready_for_ai_with_constraints",
      reason: needsImprovement.prototype_blocked_by || "el prototipo no alcanza producto visible",
      prototype_state: needsImprovement.prototype_state,
      allowed_actions: [
        `enriquecer el HTML5 con mas vistas/datos/estados del dominio (motivo: ${why})`,
        "eliminar fixtures ocultos / clases .validation-only / bloques display:none con records",
        "hacer los estados UI interactivos (addEventListener/data-view), no solo texto",
        `declarar 'Golden de referencia' en specs/${needsImprovement.slug}/prototype-html5/decisiones-ux.md`,
      ],
      forbidden_actions: [
        "NO inflar metricas con fixtures ocultos (lo detecta check:prototype-visible-product)",
        "NO declarar nivel 3 ni avanzar a fase 3 sin revision visual humana aprobada",
        "NO copiar el prototipo de otra feature (rompe check:prototype-diversity)",
      ],
      must_read: [
        `specs/${needsImprovement.slug}/prototype-html5/index.html`,
        `specs/${needsImprovement.slug}/prototype-html5/decisiones-ux.md`,
        "docs/fase-2-ux-ui/02.16-rubrica-calidad-prototipo-html5.md",
        "ejemplos/fase-2-ux-ui/prototype-html5-golden/README.md",
      ],
      commands_to_run: [
        `npm run check:prototype-html5 -- --spec specs/${needsImprovement.slug}`,
        "npm run check:prototype-visible-product",
        "npm run check:project",
      ],
      exit_criteria: [
        "check:prototype-html5 reporta nivel 2 o superior",
        "check:prototype-visible-product no detecta fixtures/anti-trampa",
        "estado del prototipo avanza a 'visible-product'",
      ],
      blockers,
    };
  }

  // 4b. v12.62: Feature en fase 2 con prototipo visible-product/pendiente -> revision HUMANA.
  //     Esta es la regla de avance fase 2 → 3: requiere human-approved.
  const needsHumanReview = features.find((f) => f.phase === 2 && f.hasPrototype && (f.prototype_state === "visible-product" || f.prototype_state === "human-review-pending"));
  if (needsHumanReview) {
    const pending = needsHumanReview.prototype_state === "human-review-pending";
    return {
      next_action: pending
        ? `Esperar/registrar la decision de revision visual humana en specs/${needsHumanReview.slug}/prototype-validation.md.`
        : `Solicitar revision visual humana del prototipo de specs/${needsHumanReview.slug}/ (producto visible, falta firma humana).`,
      feature: needsHumanReview.slug,
      phase: 2,
      agent_readiness: "needs_human_approval",
      reason: pending ? "revision visual humana en curso (pending/blocked)" : "producto visible, falta firma humana de la revision visual",
      prototype_state: needsHumanReview.prototype_state,
      allowed_actions: [
        `completar la seccion '## Revision visual humana' en specs/${needsHumanReview.slug}/prototype-validation.md (Revisor humano + Fecha + Resultado + Evidencia revisada)`,
        "regenerar AI_CONTEXT.md con 'npm run memory:context'",
      ],
      forbidden_actions: [
        "NO firmar la revision humana como agente/IA (lo bloquea check:prototype-visible-product)",
        "NO marcar Resultado: approved sin un revisor humano real + evidencia",
        "NO avanzar a fase 3 (Arquitectura) hasta que el prototipo este human-approved",
        "NO empezar a implementar codigo",
      ],
      must_read: [
        `specs/${needsHumanReview.slug}/prototype-validation.md`,
        `specs/${needsHumanReview.slug}/prototype-html5/index.html`,
        "ai/commands/prototype-command.md",
      ],
      commands_to_run: [
        "# Abrir el prototipo en navegador y que un humano lo revise.",
        "npm run memory:sync",
        "npm run check:prototype-visible-product",
      ],
      exit_criteria: [
        "Un humano real firma '## Revision visual humana' con Resultado: approved + Fecha + Evidencia revisada",
        "El estado del prototipo avanza a 'human-approved'",
        "Recien entonces la feature puede avanzar de fase 2 a fase 3",
      ],
      blockers: pending ? ["Esperando decision de revision visual humana"] : ["Esperando revision visual humana del prototipo"],
    };
  }

  // 5. Features en fase 5 sin @trace.
  const phase5 = status.phases?.find((p) => p.id === 5);
  if (phase5 && phase5.status === "partial") {
    return {
      next_action: "Anotar @trace RF-XX en codigo existente + cosechar a la BD del agente.",
      feature: null,
      phase: 5,
      agent_readiness: "ready_for_ai",
      allowed_actions: [
        "agregar `// @trace RF-XX` en clases/funciones que implementan RFs",
        "agregar `// @covers RF-XX` en tests existentes",
        "ejecutar 'npm run memory:harvest-trace'",
      ],
      forbidden_actions: [
        "NO cambiar RFs sin actualizar spec-funcional.md primero",
        "NO marcar gate-build-ready sin tests verdes",
      ],
      must_read: [
        "docs/transversal/90.35-trace-annotations-por-stack.md",
        "AGENTS.md > 'Como debe trabajar un agente'",
      ],
      commands_to_run: [
        "# Anotar @trace en codigo",
        "npm run memory:harvest-trace",
        "npm run memory:sync",
        "npm run check:trace-coverage",
      ],
      exit_criteria: [
        "100% de archivos codigo con @trace RF-XX visible",
        "check:trace-coverage pasa sin huecos",
      ],
      blockers,
    };
  }

  // 6. Default: todo OK, sugerir check:all final.
  return {
    next_action: "El proyecto esta sano. Ejecuta validacion final completa.",
    feature: null,
    phase: -1,
    agent_readiness: "ready_for_ai",
    allowed_actions: [
      "ejecutar npm run check:all",
      "ejecutar npm run roadmap:status para confirmar fases completas",
      "regenerar AI_CONTEXT.md y SESSION_LOG.md",
    ],
    forbidden_actions: [
      "NO declarar el proyecto cerrado sin npm run check:all verde",
    ],
    must_read: [
      "AGENTS.md > 'Pre-flight checklist OBLIGATORIO'",
    ],
    commands_to_run: [
      "npm run memory:sync",
      "npm run check:all",
      "npm run roadmap:status",
    ],
    exit_criteria: [
      "check:all sin hallazgos",
      "roadmap:status muestra fases en 'complete' o 'partial' coherente",
    ],
    blockers,
  };
}

function printText(next) {
  console.log(`\nROADMAP NEXT (v12.63)`);
  console.log(`=====================`);
  console.log(`\nSiguiente accion: ${next.next_action}`);
  if (next.feature) console.log(`Feature target:   ${next.feature}`);
  if (next.phase >= 0) console.log(`Fase actual:      ${next.phase}`);
  console.log(`Agent readiness:  ${next.agent_readiness}${next.reason ? "  (" + next.reason + ")" : ""}`);
  if (next.recommended_agent) console.log(`Agente sugerido:  ${next.recommended_agent}  (permitidos: ${(next.allowed_agents || []).join(", ")})`);
  if (next.touch_policy) {
    console.log(`\nPuede TOCAR (touch_policy):`);
    for (const p of next.touch_policy.allowed_paths) console.log(`  ✓ ${p}`);
    console.log(`NO puede tocar:`);
    for (const p of next.touch_policy.forbidden_paths) console.log(`  ✗ ${p}`);
  }
  if (next.transition_request) {
    const t = next.transition_request;
    console.log(`\nTransicion de fase: puede SOLICITAR ${t.toGate} (aprobar: ${t.canApprove ? "si" : "NO — requiere " + t.approver})`);
  }
  if (next.definition_of_done) {
    console.log(`\nDefinition of Done:`);
    for (const d of next.definition_of_done.deliverables || []) console.log(`  📤 ${d}`);
    for (const c of next.definition_of_done.checks || []) console.log(`  🔍 ${c}`);
  }
  if (next.blockers.length > 0) {
    console.log(`\nBloqueadores:`);
    for (const b of next.blockers) console.log(`  ✗ ${b}`);
  }
  console.log(`\nPuedes hacer:`);
  for (const a of next.allowed_actions) console.log(`  ✓ ${a}`);
  console.log(`\nNO puedes hacer:`);
  for (const a of next.forbidden_actions) console.log(`  ✗ ${a}`);
  console.log(`\nLee primero:`);
  for (const r of next.must_read) console.log(`  📖 ${r}`);
  console.log(`\nComandos sugeridos (en orden):`);
  for (const c of next.commands_to_run) console.log(`  $ ${c}`);
  console.log(`\nCriterio de salida:`);
  for (const e of next.exit_criteria) console.log(`  ✓ ${e}`);
  console.log(``);
}

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

/**
 * v12.59: heuristica para sugerir fixes seguros segun la next_action.
 * NO ejecuta automaticamente — devuelve la lista para que el agente/humano
 * elija. Mantiene control humano sobre escrituras.
 */
function computeAutoFixes(next) {
  const fixes = [];
  // 1. Si blockers mencionan "scripts npm faltantes", sugerir template:upgrade.
  if ((next.blockers || []).some((b) => /package\.json.*scripts|scripts npm|template-upgrade|v12\.\d+/i.test(b))) {
    fixes.push({
      id: "template-upgrade",
      command: "npm run template:upgrade -- --apply --force-scripts",
      reason: "Sincroniza scripts npm faltantes con el template canonico (safe: solo agrega, no borra).",
    });
  }
  // 2. Si hay "broken-hub-link" o "bidirectional-links" en blockers, sugerir --fix-bidirectional.
  if ((next.blockers || []).some((b) => /hub.link|bidirectional|broken.link/i.test(b))) {
    fixes.push({
      id: "fix-bidirectional",
      command: "npm run template:upgrade -- --apply --fix-bidirectional",
      reason: "Corrige hrefs hub<->spec con depth incorrecta + agrega data-hub-link (idempotente).",
    });
  }
  // 3. Si la fase actual tiene fase 2 (UX) y hay prototipos sin generar.
  if (next.phase === 2 && /prototipo|prototype/i.test(next.next_action || "")) {
    fixes.push({
      id: "regenerate-hub",
      command: "npm run prototype:hub",
      reason: "Regenera prototype/index.html para incluir todas las features con prototipo (safe: idempotente).",
    });
  }
  // 4. Si la fase es 4+ y hay api-contract.md, sugerir generate:openapi.
  if (next.phase >= 4 && next.phase <= 5) {
    fixes.push({
      id: "generate-openapi",
      command: "npm run generate:openapi",
      reason: "Consolida contracts/api/openapi.yaml desde los api-contract.md de cada feature.",
    });
  }
  // 5. Memory sync siempre disponible y safe.
  fixes.push({
    id: "memory-sync",
    command: "npm run memory:sync",
    reason: "Re-sincroniza la BD del agente desde Markdown (safe: reconstruye desde fuente).",
  });
  // 6. Si auto-zones reportaron drift, sugerir memory:context.
  if ((next.blockers || []).some((b) => /auto.zone|auto:start/i.test(b))) {
    fixes.push({
      id: "regen-context",
      command: "npm run memory:context",
      reason: "Regenera zonas <!-- auto:start --> de AI_CONTEXT.md desde la BD (safe).",
    });
  }
  return fixes;
}
