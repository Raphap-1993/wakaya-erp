// ci/scripts/_lib/phase-contracts.mjs (v12.63)
//
// FUENTE UNICA DE VERDAD del contrato de ejecucion por fase.
//
// Cada fase (0-8) define que puede/no puede hacer un agente IA, que debe
// leer, actualizar, validar y entregar. Se consume desde:
//   - docs/transversal/90.37-contrato-por-fase.md (autogenerado)
//   - scripts/roadmap-next.mjs (incluye contract en su output)
//   - scripts/roadmap-prompt.mjs (renderiza el contrato como prompt p/ agente)
//   - scripts/roadmap-audit.mjs (verifica git diff vs touch_policy + gates)
//   - ci/scripts/check-phase-contract.mjs (valida feature cumple contrato)
//   - Panel embebido > pestaña Roadmap > click phase-card
//
// v12.63: cada fase ademas declara role/allowedAgents (quien puede tomarla),
// touchAllow/touchForbid (que rutas puede/no puede tocar — enforzable por
// roadmap:audit) y transition (que gate puede SOLICITAR, no aprobar). Esto
// convierte el roadmap de "sugerencia" a "contrato de ejecucion" auditable.
//
// Si cambias una regla, la verdad esta AQUI. Doc y UI se regeneran/refrescan.

export const PHASE_CONTRACTS = [
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 0,
    name: "Iniciacion",
    objective: "Definir vision, alcance, equipo y plan base del proyecto.",
    puede: [
      "Editar docs/fase-0-iniciacion/00.01-vision-proyecto.md y demas docs de la fase 0",
      "Generar bootstrap con 'npm run scaffold:project'",
      "Inicializar BD del agente con 'npm run memory:bootstrap'",
      "Editar template.config.json (o template.config.example.json)",
    ],
    noPuede: [
      "Crear features bajo specs/ (es fase 0, todavia no hay backlog priorizado)",
      "Crear codigo bajo src/, backend/, frontend/",
      "Aprobar gate-0-1 (requiere sponsor humano)",
    ],
    debeLeer: [
      "AGENTS.md",
      "docs/transversal/90.10-entregables-minimos-por-fase.md",
      "docs/transversal/90.36-roadmap-metodologico.md",
      "template.config.example.json",
    ],
    debeActualizar: [
      "docs/fase-0-iniciacion/00.01-vision-proyecto.md",
      "docs/fase-0-iniciacion/00.02-roadmap.md",
      "docs/fase-0-iniciacion/00.03-estimacion-tiempo-costo.md",
      "docs/fase-0-iniciacion/00.04-roles-y-responsabilidades.md",
      "AI_CONTEXT.md (zonas auto se regeneran solas con memory:context)",
    ],
    debeValidar: [
      "npm run check:docs",
      "npm run check:instantiation",
      "npm run check:auto-zones",
    ],
    debeEntregar: [
      "Los 4 documentos canonicos de fase 0",
      "template.config.json con datos reales del proyecto",
      "AI_CONTEXT.md con las 7 zonas auto-regenerables",
    ],
    gates: ["gate-0-1"],
    role: "product_owner",
    allowedAgents: ["product_agent", "analyst_agent"],
    touchAllow: ["docs/fase-0-iniciacion/**", "template.config.json", "template.config.example.json", "AI_CONTEXT.md", "SESSION_LOG.md", "CHANGELOG.md"],
    touchForbid: ["specs/**", "src/**", "backend/**", "frontend/**", "db/**", "contracts/**"],
    transition: { from: "phase-0", toGate: "gate-0-1", canRequest: true, canApprove: false, approver: "sponsor (humano)" },
  },

  // ──────────────────────────────────────────────────────────────────────
  {
    id: 1,
    name: "Requerimientos",
    objective: "Extraer RF/RNF, definir HU, completar matriz de huecos.",
    puede: [
      "Crear y editar docs/fase-1-analisis-requerimientos/*.md",
      "Editar TRACEABILITY_MATRIX.md raiz",
      "Definir RFs, RNFs, HUs con codigo canonico (RF-NN, RNF-NN, HU-NN)",
    ],
    noPuede: [
      "Crear features bajo specs/ hasta gate-1-2 aprobado",
      "Disenar UX (es responsabilidad de fase 2)",
      "Inventar requerimientos sin sponsor humano que los valide",
    ],
    debeLeer: [
      "docs/fase-0-iniciacion/00.01-vision-proyecto.md (fase previa)",
      "docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md",
      "docs/fase-1-analisis-requerimientos/01.01-matriz-huecos-fase-1.md",
    ],
    debeActualizar: [
      "docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md",
      "docs/fase-1-analisis-requerimientos/01.01-matriz-huecos-fase-1.md",
      "TRACEABILITY_MATRIX.md (matriz consolidada)",
    ],
    debeValidar: [
      "npm run check:trace-drift",
      "npm run check:status-coherence",
      "npm run memory:sync",
    ],
    debeEntregar: [
      "Matriz RF/RNF/HU priorizada",
      "Matriz de huecos completada",
      "TRACEABILITY_MATRIX.md raiz actualizada",
    ],
    gates: ["gate-1-2"],
    role: "business_analyst",
    allowedAgents: ["analyst_agent", "product_agent"],
    touchAllow: ["docs/fase-1-analisis-requerimientos/**", "TRACEABILITY_MATRIX.md", "specs/<feature>/spec-funcional.md", "AI_CONTEXT.md", "SESSION_LOG.md"],
    touchForbid: ["src/**", "backend/**", "frontend/**", "specs/<feature>/prototype-html5/**", "db/**", "contracts/**"],
    transition: { from: "phase-1", toGate: "gate-1-2", canRequest: true, canApprove: false, approver: "product_owner (humano)" },
  },

  // ──────────────────────────────────────────────────────────────────────
  {
    id: 2,
    name: "UX/UI (HTML5-first + SPDD)",
    objective: "Validar experiencia con prototipos navegables antes de construir.",
    puede: [
      "Generar features con 'npm run scaffold:feature -- --slug NNN-...'",
      "Crear prototipo desde golden (referencia): 'npm run scaffold:prototype -- --feature NNN-... --domain ...'",
      "O DISENAR LIBRE: 'npm run scaffold:prototype -- --feature NNN-... --freeform' (starter neutro, el agente propone la mejor UX del dominio)",
      "Proponer la mejor solucion de prototipo: el golden es REFERENCIA de nivel, no plantilla obligatoria. Lo que cuenta es pasar el rubric + contrato por riqueza real",
      "ADAPTAR/declarar mock data del dominio real en mock-data.json (CRITICO — no dejar mock del golden)",
      "Editar specs/<feature>/prototype.md, spdd-frontend.md, ui-test-cases.md",
      "Declarar complexity: simple|standard|rich en spec-funcional.md para ajustar el umbral de riqueza",
      "Generar hub con 'npm run prototype:hub'",
    ],
    noPuede: [
      "Aprobar gate-prototype-ready, gate-spdd-approved ni gate-prototype-human-visual-review (requieren humano)",
      "Empezar a implementar backend/frontend productivo",
      "Crear prototipos fuera de specs/<feature>/prototype-html5/",
      "Copiar el prototipo de otra feature (rompe check:prototype-diversity)",
      "Dejar varias features con el MISMO esqueleto del golden (aunque varies color): recolorear NO pasa diversity (es ciego al color). Cada feature necesita estructura propia (layout/componentes/jerarquia) manteniendo la misma marca del producto",
      "Usar Tailwind CDN o frameworks externos en el HTML5 (debe ser autocontenido)",
      "Usar fixtures ocultos (<template hidden>, .validation-only, display:none con records) para pasar validadores",
      "Declarar nivel 3 sin revision visual humana real (anti self-approval — el script no aprueba UX por si solo)",
      "Usar un renderer generico unico para distintos dominios (solo se permiten helpers de bajo nivel: tokens/toast/modal/mock-api/app-state/nav)",
    ],
    debeLeer: [
      "specs/<feature>/spec-funcional.md",
      "specs/<feature>/product-design.md",
      "specs/<feature>/spdd-frontend.md",
      "ejemplos/fase-2-ux-ui/prototype-html5-golden/README.md (elegir Golden por dominio)",
      "docs/fase-2-ux-ui/02.16-rubrica-calidad-prototipo-html5.md",
      "plantillas/transversal/PROTOTYPE_HUB.md (convencion cross-spec ?param)",
    ],
    debeActualizar: [
      "specs/<feature>/prototype.md (anatomia + tokens CSS)",
      "specs/<feature>/prototype-html5/index.html (autocontenido nivel 2+, producto VISIBLE)",
      "specs/<feature>/prototype-html5/decisiones-ux.md (Golden de referencia + patrones copiados/no-copiados)",
      "specs/<feature>/prototype-validation.md (## Revision visual humana: pending hasta humano)",
      "specs/<feature>/traceability.md (gates en pending)",
      "prototype/index.html (regenerar con npm run prototype:hub)",
    ],
    debeValidar: [
      "npm run check:prototype-html5 -- --strict --spec specs/<feature>",
      "npm run check:prototype-visible-product -- --strict  (ANTI-TRAMPA: sin fixtures ocultos + revision humana)",
      "npm run check:prototype-contract -- --strict  (CONTRATO: implementa estados/roles + cubre RF/actores del spec)",
      "npm run check:prototype-coverage -- --strict  (cada feature visual TIENE su prototipo en specs/<slug>/prototype-html5/)",
      "npm run check:prototype-location -- --strict  (prototipo en ubicacion canonica; prototype/ es solo el hub)",
      "npm run check:prototype-spa-coherence -- --strict  (SPA: sidebar comun sin duplicados + manifiesto en sintonia)",
      "npm run check:prototype-mock-data -- --strict  (datos reales: sin placeholders <<...>> + mock-data.json consumido)",
      "npm run check:prototype-domain-mismatch  (CRITICO — sin mock del golden)",
      "npm run check:prototype-bidirectional-links",
      "npm run check:prototype-cross-links",
      "npm run check:prototype-diversity",
      "npm run check:gates-mentioned",
    ],
    debeEntregar: [
      "Los 9 archivos canonicos de cada feature visual",
      "prototype-html5/index.html nivel 2+ y producto VISIBLE (no fixtures ocultos)",
      "decisiones-ux.md con Golden de referencia + '## Contrato del prototipo' (Estados/Roles/Entidades/RF que cubren el spec)",
      "prototype-validation.md con '## Revision visual humana' (pending hasta que un humano confirme)",
      "Hub regenerado con link bidireccional a cada feature",
    ],
    gates: ["gate-prototype-ready", "gate-html5-product-quality", "gate-prototype-human-visual-review", "gate-spdd-approved", "gate-2-3"],
    role: "ux_frontend",
    allowedAgents: ["ux_agent", "frontend_spdd_agent", "product_agent"],
    touchAllow: ["specs/<feature>/product-design.md", "specs/<feature>/spdd-frontend.md", "specs/<feature>/prototype.md", "specs/<feature>/prototype-validation.md", "specs/<feature>/ui-test-cases.md", "specs/<feature>/prototype-html5/**", "specs/<feature>/traceability.md", "specs/_shared/**", "prototype/index.html", "AI_CONTEXT.md", "SESSION_LOG.md"],
    touchForbid: ["src/**", "backend/**", "frontend/**", "apps/**", "services/**", "libs/**", "db/migration/**", "contracts/api/openapi.yaml", "specs/<feature>/spec-tecnica.md"],
    transition: { from: "phase-2", toGate: "gate-prototype-human-visual-review", canRequest: true, canApprove: false, approver: "product_designer / product_owner (humano)" },
  },

  // ──────────────────────────────────────────────────────────────────────
  {
    id: 3,
    name: "Arquitectura",
    objective: "Definir arquitectura tecnica, ADRs, threat model, plan de despliegue.",
    puede: [
      "Crear y editar ADRs en docs/fase-3-arquitectura/adr/ADR-NNN-*.md",
      "Modelar arquitectura en likec4/ o diagramas/",
      "Crear specs/<feature>/threat-model.md (STRIDE)",
      "Documentar decisiones de tecnologia con justificacion",
    ],
    noPuede: [
      "Aprobar gate-3-4 sin sponsor tecnico",
      "Cambiar tecnologia ya aprobada en ADR sin nuevo ADR de superseding",
      "Empezar SDD (fase 4) sin gate-3-4 aprobado",
    ],
    debeLeer: [
      "docs/fase-3-arquitectura/03.00-arquitectura.md",
      "docs/fase-3-arquitectura/03.01-decisiones-tecnologia.md",
      "ADRs existentes (docs/fase-3-arquitectura/adr/*)",
      "docs/transversal/90.04-stacks-de-referencia.md",
    ],
    debeActualizar: [
      "docs/fase-3-arquitectura/03.00-arquitectura.md",
      "docs/fase-3-arquitectura/03.01-decisiones-tecnologia.md",
      "docs/fase-3-arquitectura/03.03-plan-despliegue.md",
      "docs/fase-3-arquitectura/03.08-auth-authz.md",
      "ADRs en docs/fase-3-arquitectura/adr/",
      "likec4/ con modelo C4 navegable",
    ],
    debeValidar: [
      "npm run check:architecture-baseline -- --strict  (BASELINE: seguridad/calidad/SOLID/DDD/observabilidad/SLO/datos)",
      "npm run check:ai-artifacts",
      "npm run check:bd-documented",
      "npm run check:api-documented",
    ],
    debeEntregar: [
      "Baseline minimo de arquitectura cubierto (9 concerns) — ver 03.04 > Baseline minimo",
      "ADRs por cada decision arquitectonica significativa",
      "Modelo C4 navegable o equivalente",
      "Plan de despliegue base",
      "Matriz RBAC (03.08-auth-authz.md)",
      "Threat model por feature donde aplique",
    ],
    gates: ["gate-3-4"],
    role: "architect",
    allowedAgents: ["architect_agent"],
    touchAllow: ["docs/fase-3-arquitectura/**", "likec4/**", "diagramas/**", "specs/<feature>/threat-model.md", "AI_CONTEXT.md", "SESSION_LOG.md"],
    touchForbid: ["src/**", "backend/**", "frontend/**", "specs/<feature>/prototype-html5/**", "db/migration/**"],
    transition: { from: "phase-3", toGate: "gate-3-4", canRequest: true, canApprove: false, approver: "tech_lead (humano)" },
  },

  // ──────────────────────────────────────────────────────────────────────
  {
    id: 4,
    name: "SDD (Spec-Driven Development)",
    objective: "Traducir features aprobadas a specs tecnicas ejecutables.",
    puede: [
      "Completar specs/<feature>/spec-tecnica.md con modelo BD canonico (Tabla `<entidad>` + columnas + PK + indices)",
      "Completar specs/<feature>/api-contract.md con OpenAPI inline",
      "Crear specs/<feature>/spec-tareas.md (tareas concretas)",
      "Regenerar contracts/api/openapi.yaml con 'npm run generate:openapi'",
    ],
    noPuede: [
      "Empezar fase 5 (construccion) sin gate-sdd-approved",
      "Cambiar RFs sin actualizar TRACEABILITY_MATRIX.md",
      "Aprobar gate-sdd-approved (requiere tech lead humano)",
    ],
    debeLeer: [
      "specs/<feature>/spec-funcional.md",
      "specs/<feature>/spdd-frontend.md (UX aprobado en fase 2)",
      "plantillas/fase-4-sdd/spec-tecnica.md",
      "plantillas/fase-4-sdd/api-contract.md",
      "docs/transversal/90.34-product-design-y-spdd-frontend.md",
    ],
    debeActualizar: [
      "specs/<feature>/spec-tecnica.md (modelo BD completo)",
      "specs/<feature>/api-contract.md (endpoints + OpenAPI snippets)",
      "specs/<feature>/spec-tareas.md (tareas)",
      "contracts/api/openapi.yaml (consolidado)",
    ],
    debeValidar: [
      "npm run check:bd-documented",
      "npm run check:api-documented",
      "npm run check:openapi-coverage",
      "npm run generate:openapi:check",
    ],
    debeEntregar: [
      "spec-tecnica.md con Tabla `<entidad>` + columnas + PK + indices",
      "api-contract.md con METHOD /path + OpenAPI snippet por endpoint",
      "openapi.yaml consolidado al 100% coverage",
    ],
    gates: ["gate-sdd-approved"],
    role: "spec_author",
    allowedAgents: ["backend_agent", "spec_agent"],
    touchAllow: ["specs/<feature>/spec-tecnica.md", "specs/<feature>/api-contract.md", "specs/<feature>/spec-tareas.md", "specs/<feature>/traceability.md", "contracts/**", "AI_CONTEXT.md", "SESSION_LOG.md"],
    touchForbid: ["src/**", "backend/**", "frontend/**", "db/migration/**", "specs/<feature>/prototype-html5/**"],
    transition: { from: "phase-4", toGate: "gate-sdd-approved", canRequest: true, canApprove: false, approver: "tech_lead (humano)" },
  },

  // ──────────────────────────────────────────────────────────────────────
  {
    id: 5,
    name: "Construccion",
    objective: "Implementar codigo real con @trace RF-XX en cada artefacto.",
    puede: [
      "Crear codigo en src/, backend/, frontend/, apps/, libs/, services/",
      "Crear tests basicos por feature",
      "Anotar @trace RF-XX en cada clase/funcion que implementa un RF",
      "Anotar @covers RF-XX en cada test",
      "Cosechar @trace con 'npm run memory:harvest-trace'",
    ],
    noPuede: [
      "Cambiar RFs sin actualizar spec-funcional.md PRIMERO",
      "Aprobar gate-build-ready (requiere CI verde + humano)",
      "Marcar RF como 'validado' sin tests pasando",
      "Implementar features que no tengan gate-sdd-approved",
    ],
    debeLeer: [
      "specs/<feature>/spec-tecnica.md (modelo BD)",
      "specs/<feature>/api-contract.md (endpoints)",
      "docs/transversal/90.35-trace-annotations-por-stack.md (convencion @trace)",
      "ADRs de fase 3 (decisiones tecnologicas)",
    ],
    debeActualizar: [
      "Archivos en src/, backend/, frontend/, etc.",
      "Tests en tests/ o equivalente del stack",
      "specs/<feature>/traceability.md (columna Codigo con archivo real)",
    ],
    debeValidar: [
      "npm run memory:harvest-trace",
      "npm run memory:sync",
      "npm run check:trace-coverage",
      "npm run check:trace-drift",
    ],
    debeEntregar: [
      "Codigo real con @trace RF-XX en cada artefacto significativo",
      "Tests basicos con @covers RF-XX",
      "traceability.md columna Codigo con nombres de archivo REALES (no placeholders)",
      "CI verde (build sin errores)",
    ],
    gates: ["gate-build-ready"],
    role: "builder",
    allowedAgents: ["backend_agent", "frontend_agent", "build_agent"],
    touchAllow: ["src/**", "backend/**", "frontend/**", "apps/**", "services/**", "libs/**", "db/migration/**", "tests/**", "specs/<feature>/traceability.md", "AI_CONTEXT.md", "SESSION_LOG.md"],
    touchForbid: ["docs/fase-0-iniciacion/**", "specs/<feature>/prototype-html5/**", "specs/<feature>/spec-funcional.md"],
    transition: { from: "phase-5", toGate: "gate-build-ready", canRequest: true, canApprove: false, approver: "tech_lead (humano) + CI verde" },
  },

  // ──────────────────────────────────────────────────────────────────────
  {
    id: 6,
    name: "QA",
    objective: "Validar con tests automatizados + UAT manual + cobertura.",
    puede: [
      "Crear/ampliar tests en tests/, qa/automated/, backend/src/test/",
      "Documentar casos UAT en qa/uat/",
      "Generar reportes de cobertura (lcov.info)",
      "Anotar @covers RF-XX en tests con cobertura demostrable",
    ],
    noPuede: [
      "Aprobar gate-qa-passed (requiere QA humano)",
      "Reducir scope de tests sin justificacion en spec-funcional.md",
      "Marcar tests como 'skipped' sin documentar razon",
    ],
    debeLeer: [
      "specs/<feature>/ui-test-cases.md",
      "qa/uat/*.md (casos manuales)",
      "docs/transversal/90.18-definiciones-operativas.md",
    ],
    debeActualizar: [
      "tests/<feature>/, qa/automated/",
      "qa/coverage/lcov.info (o equivalente)",
      "specs/<feature>/traceability.md (columna Test con archivo real)",
    ],
    debeValidar: [
      "npm run check:test-documented",
      "npm run check:trace-coverage",
      "Tests del stack (npm test, mvn test, etc.)",
    ],
    debeEntregar: [
      "Tests automatizados con @covers RF-XX por cada RF productivo",
      "Cobertura medible >= umbral del proyecto (default 70%)",
      "Casos UAT manuales documentados",
      "lcov.info o equivalente actualizado",
    ],
    gates: ["gate-qa-passed"],
    role: "qa",
    allowedAgents: ["qa_agent"],
    touchAllow: ["tests/**", "qa/**", "specs/<feature>/ui-test-cases.md", "specs/<feature>/traceability.md", "AI_CONTEXT.md", "SESSION_LOG.md"],
    touchForbid: ["db/migration/**", "contracts/api/openapi.yaml", "specs/<feature>/spec-funcional.md", "specs/<feature>/prototype-html5/**"],
    transition: { from: "phase-6", toGate: "gate-qa-passed", canRequest: true, canApprove: false, approver: "qa_lead (humano)" },
  },

  // ──────────────────────────────────────────────────────────────────────
  {
    id: 7,
    name: "Despliegue",
    objective: "Preparar release controlado con vinculacion a features/RFs.",
    puede: [
      "Crear release notes en releases/vX.Y.Z.md o ops/release-notes/",
      "Vincular release notes a RF/HU/feature explicito",
      "Crear runbook preliminar de despliegue en ops/runbooks/",
      "Preparar checklist pre-release",
    ],
    noPuede: [
      "Aprobar gate-deploy-ready (requiere release manager humano)",
      "Saltar pasos del runbook por urgencia (debe documentarse)",
      "Crear release sin vinculacion a feature/RF (rompe check:release-binding)",
    ],
    debeLeer: [
      "docs/fase-3-arquitectura/03.03-plan-despliegue.md",
      "ops/runbooks/ existentes",
      "releases/ historico",
    ],
    debeActualizar: [
      "releases/vX.Y.Z.md con vinculacion a RF/HU/feature",
      "ops/release-notes/ si aplica",
      "ops/runbooks/<NNN-feature-slug>-runbook.md (preliminar)",
      "CHANGELOG.md",
    ],
    debeValidar: [
      "npm run check:release-binding",
      "npm run check:project",
      "Tests de smoke pre-release",
    ],
    debeEntregar: [
      "Release notes con cobertura explicita de features",
      "Runbook preliminar por feature",
      "CHANGELOG actualizado",
      "Checklist pre-release completado",
    ],
    gates: ["gate-deploy-ready"],
    role: "release_manager",
    allowedAgents: ["devops_agent", "release_agent"],
    touchAllow: ["releases/**", "ops/release-notes/**", "ops/runbooks/**", "CHANGELOG.md", "ci/**", ".github/**", "AI_CONTEXT.md", "SESSION_LOG.md"],
    touchForbid: ["src/**", "backend/**", "frontend/**", "specs/<feature>/spec-funcional.md", "db/migration/**"],
    transition: { from: "phase-7", toGate: "gate-deploy-ready", canRequest: true, canApprove: false, approver: "release_manager (humano)" },
  },

  // ──────────────────────────────────────────────────────────────────────
  {
    id: 8,
    name: "Operacion",
    objective: "Runbook completo + SLO/SLI numericos + monitoring activo.",
    puede: [
      "Completar runbooks en ops/runbooks/<NNN-feature-slug>-runbook.md",
      "Definir SLO/SLI numericos por feature (p95, disponibilidad, throughput)",
      "Configurar monitoreo en ops/monitoring/",
      "Documentar plan de DR en ops/dr/",
    ],
    noPuede: [
      "Aprobar gate-operations-ready (requiere SRE/ops humano)",
      "Marcar runbook completo sin SLO numerico medible",
      "Tener runbooks transversales sin marcar 'kind: transversal' (rompe check:runbook-binding)",
    ],
    debeLeer: [
      "docs/fase-3-arquitectura/03.03-plan-despliegue.md",
      "docs/transversal/90.15-seguridad-dependencias.md",
      "docs/transversal/90.18-definiciones-operativas.md",
    ],
    debeActualizar: [
      "ops/runbooks/<NNN-feature-slug>-runbook.md con 4 secciones (procedimiento normal, fallo, SLO/SLI, contactos)",
      "ops/monitoring/ (alertas + dashboards)",
      "ops/dr/ (plan disaster recovery)",
      "specs/<feature>/traceability.md (gate-operations-ready: pending hasta aprobacion humana)",
    ],
    debeValidar: [
      "npm run check:runbook-documented",
      "npm run check:runbook-binding",
      "npm run check:project",
    ],
    debeEntregar: [
      "Runbook por feature con: procedimiento normal, fallo, SLO numerico (p95 <= Xms o disponib >= Y%), contactos",
      "Monitoring activo con alertas configuradas",
      "Plan de DR documentado",
    ],
    gates: ["gate-operations-ready"],
    role: "sre_ops",
    allowedAgents: ["sre_agent", "ops_agent", "devops_agent"],
    touchAllow: ["ops/runbooks/**", "ops/monitoring/**", "ops/dr/**", "ops/**", "specs/<feature>/traceability.md", "AI_CONTEXT.md", "SESSION_LOG.md"],
    touchForbid: ["src/**", "backend/**", "frontend/**", "specs/<feature>/spec-funcional.md", "db/migration/**"],
    transition: { from: "phase-8", toGate: "gate-operations-ready", canRequest: true, canApprove: false, approver: "sre_lead (humano)" },
  },
];

/**
 * Devuelve el contrato de una fase especifica (0-8).
 */
export function getPhaseContract(phaseId) {
  return PHASE_CONTRACTS.find((p) => p.id === phaseId) || null;
}

/**
 * Devuelve TODOS los contratos. Util para regenerar doc completa o exponer en API.
 */
export function getAllPhaseContracts() {
  return PHASE_CONTRACTS;
}

/**
 * v12.63: politica de rutas (touch_policy) de una fase, con `<feature>`
 * interpolado al slug real si se provee. Sin slug, conserva el placeholder.
 * Es la base enforzable por roadmap:audit (git diff vs allowed/forbidden).
 */
export function getTouchPolicy(phaseId, slug) {
  const c = getPhaseContract(phaseId);
  if (!c) return { allowed_paths: [], forbidden_paths: [] };
  const interp = (arr) => (arr || []).map((p) => (slug ? p.replace(/<feature>/g, slug) : p));
  return {
    allowed_paths: interp(c.touchAllow),
    forbidden_paths: interp(c.touchForbid),
  };
}

/**
 * v12.63: perfil de agente recomendado/permitido para la fase.
 */
export function getAgentProfile(phaseId) {
  const c = getPhaseContract(phaseId);
  if (!c) return { recommended_agent: null, allowed_agents: [] };
  return { recommended_agent: c.role || null, allowed_agents: c.allowedAgents || [] };
}

/**
 * v12.63: Definition of Done de la fase, DERIVADA de debeEntregar (deliverables)
 * + debeValidar (checks). No se duplica: es la verdad del contrato reusada.
 */
export function getDefinitionOfDone(phaseId) {
  const c = getPhaseContract(phaseId);
  if (!c) return { deliverables: [], checks: [] };
  return { deliverables: c.debeEntregar || [], checks: c.debeValidar || [] };
}

/**
 * v12.63: contrato de transicion de fase. El agente puede SOLICITAR el gate
 * (canRequest) pero NO aprobarlo (canApprove:false) — lo firma un humano.
 */
export function getTransitionRequest(phaseId) {
  const c = getPhaseContract(phaseId);
  if (!c) return null;
  return c.transition || null;
}

/**
 * Render compacto del contrato como markdown (para incluir en roadmap-next output).
 */
export function renderContractMarkdown(phaseId) {
  const c = getPhaseContract(phaseId);
  if (!c) return null;
  return [
    `## Contrato de ejecucion — Fase ${c.id} ${c.name}`,
    ``,
    `**Objetivo**: ${c.objective}`,
    ``,
    `### ✓ Puede hacer`,
    ...c.puede.map((x) => `- ${x}`),
    ``,
    `### ✗ NO puede hacer`,
    ...c.noPuede.map((x) => `- ${x}`),
    ``,
    `### 📖 Debe leer`,
    ...c.debeLeer.map((x) => `- \`${x}\``),
    ``,
    `### ✏ Debe actualizar`,
    ...c.debeActualizar.map((x) => `- ${x}`),
    ``,
    `### 🔍 Debe validar`,
    ...c.debeValidar.map((x) => `- \`${x}\``),
    ``,
    `### 📤 Debe entregar`,
    ...c.debeEntregar.map((x) => `- ${x}`),
    ``,
    `**Gates de la fase**: ${c.gates.join(", ")}`,
  ].join("\n");
}
