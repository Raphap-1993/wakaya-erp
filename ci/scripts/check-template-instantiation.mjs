#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const DEFAULT_MODE = "instantiated";
const TEXT_EXTENSIONS = new Set([
  ".md",
  ".json",
  ".yml",
  ".yaml",
  ".tf",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".ps1",
  ".sh",
  ".properties",
  ".xml",
  ".gradle",
  ".kts",
  ".sql",
  ".java",
  ".html",
  ".css",
  ".scss",
]);
const IGNORED_DIRS = new Set([
  ".git",
  ".gradle",
  "node_modules",
  ".next",
  ".angular",
  ".cache",
  "dist",
  "build",
  "bin",
  "target",
  "out",
  "coverage",
  "playwright-report",
  "test-results",
  ".tmp",
  "__pycache__",
  ".venv",
  "revisiones",
]);
const IGNORED_PATHS = new Set([
  "ci/scripts/check-template-instantiation.mjs",
  "scripts/init-project.mjs",
  "scripts/init-project.ps1",
  "scripts/init-project.sh",
]);
const SENSITIVE_PREFIXES = [
  ".github/",
  "ops/",
  "stacks/",
  "scripts/",
  "ci/",
  "template.config.example.json",
];
const LEGACY_PATTERNS = [
  { pattern: /CAMBIAR/g, label: "CAMBIAR" },
  { pattern: /ghcr\.io\/cambiar/g, label: "ghcr.io/cambiar" },
  { pattern: /github\.com\/CAMBIAR/g, label: "github.com/CAMBIAR" },
  { pattern: /https:\/\/example\.com\/soporte/g, label: "example.com/soporte" },
];
const CANONICAL_RUNTIME_PATTERNS = [
  { pattern: /Gestion de expedientes/g, label: "Gestion de expedientes" },
  { pattern: /expedientes-web/g, label: "expedientes-web" },
  { pattern: /expedientes-angular/g, label: "expedientes-angular" },
  { pattern: /localhost:5432\/expedientes/g, label: "localhost:5432/expedientes" },
  { pattern: /\/api\/expedientes/g, label: "/api/expedientes" },
  { pattern: /listar expedientes/g, label: "listar expedientes" },
  { pattern: /existen expedientes/g, label: "existen expedientes" },
  { pattern: /expediente:/g, label: "expediente:" },
  { pattern: /expedientes\.busqueda_v2\.enabled/g, label: "expedientes.busqueda_v2.enabled" },
  { pattern: /portal de expedientes/g, label: "portal de expedientes" },
];
const GENERATED_STACK_ROOT_MARKERS = [
  "package.json",
  "pom.xml",
  "build.gradle.kts",
  "settings.gradle.kts",
  ".env.example",
  "frontend",
  "backend",
];
const CANONICAL_RUNTIME_PREFIXES = [
  ".github/",
  "ops/",
  "stacks/",
  "scripts/",
  "ci/",
  "catalog/",
  "contracts/",
  "src/",
  "tests/",
  "qa/",
  "specs/",
  "likec4/",
];

function parseArgs(argv) {
  const args = { mode: DEFAULT_MODE, root: process.cwd() };
  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (current === "--mode") {
      args.mode = argv[i + 1];
      i += 1;
      continue;
    }
    if (current === "--root") {
      args.root = argv[i + 1];
      i += 1;
      continue;
    }
    if (current === "-h" || current === "--help") {
      args.help = true;
      continue;
    }
    throw new Error(`Argumento desconocido: ${current}`);
  }
  return args;
}

function usage() {
  console.log(`Uso:
  node ci/scripts/check-template-instantiation.mjs [--mode template|instantiated] [--root <path>]

Modos:
  template       permite tokens estructurados pero rechaza placeholders legacy ambiguos.
  instantiated   exige que no queden tokens estructurados ni placeholders legacy.
`);
}

function collectFiles(rootDir) {
  const files = [];
  const visit = (currentDir) => {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(currentDir, entry.name);
      const relative = path.relative(rootDir, absolute).replace(/\\/g, "/");
      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) {
          continue;
        }
        visit(absolute);
        continue;
      }
      if (!TEXT_EXTENSIONS.has(path.extname(entry.name))) {
        continue;
      }
      if (IGNORED_PATHS.has(relative)) {
        continue;
      }
      files.push({ absolute, relative });
    }
  };
  visit(rootDir);
  return files.sort((a, b) => a.relative.localeCompare(b.relative));
}

function isSensitivePath(relative) {
  return SENSITIVE_PREFIXES.some((prefix) => relative === prefix || relative.startsWith(prefix));
}

function findStructuredTokens(text) {
  return [...text.matchAll(/__[A-Z0-9_]+__/g)].map((match) => ({
    token: match[0],
    index: match.index ?? 0,
  }));
}

function lineNumberForIndex(text, index) {
  return text.slice(0, index).split("\n").length;
}

function detectRootProfile(rootDir) {
  const entries = new Set(fs.readdirSync(rootDir));
  return {
    generatedStackRoot: GENERATED_STACK_ROOT_MARKERS.some((entry) => entries.has(entry)),
  };
}

function shouldCheckCanonicalRuntime(relative, rootProfile) {
  if (path.extname(relative) === ".md") {
    return false;
  }
  if (rootProfile.generatedStackRoot) {
    return true;
  }
  return CANONICAL_RUNTIME_PREFIXES.some((prefix) => relative.startsWith(prefix));
}

function shouldCheckCanonicalRuntimePath(relative, rootProfile) {
  if (path.extname(relative) === ".md") {
    return false;
  }
  return shouldCheckCanonicalRuntime(relative, rootProfile);
}

function detectAngularWorkspace(rootDir) {
  const packageJsonPath = path.join(rootDir, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    return { angular: false, nxWorkspace: false };
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    const dependencies = {
      ...(packageJson.dependencies ?? {}),
      ...(packageJson.devDependencies ?? {}),
    };
    return {
      angular: typeof dependencies["@angular/core"] === "string",
      nxWorkspace: fs.existsSync(path.join(rootDir, "nx.json")),
    };
  } catch {
    return { angular: false, nxWorkspace: false };
  }
}

// v12.46: reglas strict adicionales para instanciacion real.
// Detectan los 9 patrones reales vistos en opencode/codex/gemini.
const REQUIRED_V1245_SCRIPTS = [
  "check:gates-mentioned",
  "check:status-coherence",
  "check:orphan-evidence",
  "check:evidence-exists",
];
const REQUIRED_AI_CONTEXT_AUTO_ZONES = [
  "stack",
  "version",
  "features",
  "gates-pendientes",
  "sesiones-recientes",
  "decisiones-recientes",
  "ultima-actualizacion",
];
const REQUIRED_FEATURE_FILES = [
  "spec-funcional.md",
  "spec-tecnica.md",
  "traceability.md",
  "prototype.md",
  "prototype-validation.md",
  "product-design.md",
  "spdd-frontend.md",
  "api-contract.md",
  "ui-test-cases.md",
];
// v12.95 — REGLA DE ORO de los terminos residuales (NO la rompas):
//   Un termino residual debe matchear SOLO residuo REAL del scaffold:
//     - terminos del DOMINIO-ejemplo (bandeja, expediente, el slug 001-bandeja-...),
//     - placeholders con sintaxis explicita: `<feature>`, `<slug>`, `<org>`, `$(date)`,
//       `${ctx.x}` (template-literals sin expandir; se cazan en el patron de abajo).
//       findStructuredTokens cubre ademas tokens estilo `__FOO__` (otra sintaxis).
//   NUNCA agregues palabras COMUNES sueltas como `feature`, `slug`, `module`, `gate`,
//   `prototype`, `spec`: son vocabulario legitimo de metodologia en un proyecto real
//   y ademas chocan con las auto-zonas requeridas (p.ej. `features` en AI_CONTEXT).
//   Drift real visto en un proyecto: ampliar a `\bfeature\b` bloqueaba la auto-zona
//   obligatoria `features`, contradiciendo el contrato del propio validador.
//   El meta-check checkResidualPatternSafety() abajo HACE FALLAR este validador si
//   algun patron viola esta regla (matchea vocabulario protegido).
const FORBIDDEN_RESIDUAL_TERMS = [
  // Generados en specs/ AI_CONTEXT.md SESSION_LOG.md README.md TRACEABILITY_MATRIX.md.
  // NO se aplica a docs/ o plantillas/ (que SON el template).
  { pattern: /\b(bandeja|bandejas)\b/gi, label: "termino del template ejemplo: bandeja" },
  { pattern: /\b(expediente|expedientes)\b/gi, label: "termino del template ejemplo: expediente" },
  { pattern: /001-bandeja-trabajo-expedientes/g, label: "slug del template ejemplo" },
  { pattern: /\$\(date\)/g, label: "shell var $(date) no expandido" },
  { pattern: /<feature>|<slug>|<org>|\$\{ctx\.[\w.]+\}/g, label: "placeholder sin expandir" },
];

// v12.95: vocabulario GENERICO de metodologia que un proyecto instanciado usa
// legitimamente y que NINGUN patron residual puede tratar como residuo. Incluye las
// auto-zonas requeridas de AI_CONTEXT (features, etc.) + terminos estructurales.
const PROTECTED_VOCAB = [
  "feature", "features", "slug", "spec", "specs", "module", "modulo",
  "gate", "gates", "prototype", "prototipo", "roadmap", "project", "proyecto",
];

// v12.95 meta-check: el validador se auto-protege. Si algun FORBIDDEN_RESIDUAL_TERMS
// matchea una palabra del vocabulario protegido, el patron quedo demasiado amplio
// (residuo real vs palabra comun): falla con mensaje claro, en CUALQUIER modo.
function checkResidualPatternSafety() {
  const findings = [];
  for (const rule of FORBIDDEN_RESIDUAL_TERMS) {
    const safe = new RegExp(rule.pattern.source, rule.pattern.flags.replace("g", "")); // sin estado /g
    for (const word of PROTECTED_VOCAB) {
      if (safe.test(word)) {
        findings.push(`ci/scripts/check-template-instantiation.mjs:1: patron residual demasiado amplio — "${rule.label}" matchea la palabra protegida "${word}". Usa el placeholder explicito (p.ej. <feature>), no la palabra comun (rompe la auto-zona requerida "features").`);
        break;
      }
    }
  }
  return findings;
}
const FORBIDDEN_RESIDUAL_PATH_PREFIXES = [
  "specs/",
  "AI_CONTEXT.md",
  "SESSION_LOG.md",
  "TRACEABILITY_MATRIX.md",
  "PROJECT_MAP.md",
  "README.md",
];

function checkRequiredScriptsInPackageJson(rootDir) {
  const pkgPath = path.join(rootDir, "package.json");
  if (!fs.existsSync(pkgPath)) return [];
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    const scripts = pkg.scripts || {};
    const missing = REQUIRED_V1245_SCRIPTS.filter((s) => !(s in scripts));
    return missing.map((s) => `package.json:1: script v12.45 faltante: "${s}"`);
  } catch {
    return ["package.json:1: no se pudo parsear como JSON"];
  }
}

function checkAiContextAutoZones(rootDir) {
  const aiPath = path.join(rootDir, "AI_CONTEXT.md");
  if (!fs.existsSync(aiPath)) return ["AI_CONTEXT.md:1: archivo no existe"];
  const text = fs.readFileSync(aiPath, "utf8");
  const findings = [];
  for (const zone of REQUIRED_AI_CONTEXT_AUTO_ZONES) {
    const re = new RegExp(`<!--\\s*auto:start\\s+name=${zone}\\s*-->`);
    if (!re.test(text)) {
      findings.push(`AI_CONTEXT.md:1: falta zona auto-regenerable <!-- auto:start name=${zone} -->`);
    }
  }
  return findings;
}

function checkFeatureCompleteness(rootDir) {
  const specsDir = path.join(rootDir, "specs");
  if (!fs.existsSync(specsDir)) return [];
  const findings = [];
  let entries;
  try { entries = fs.readdirSync(specsDir, { withFileTypes: true }); } catch { return []; }
  // Saltar README.md, _attic, slugs no NNN-
  const features = entries
    .filter((e) => e.isDirectory() && /^\d{3,}-[a-z0-9-]+/i.test(e.name) && !e.name.startsWith("000-"));
  // Slugs duplicados (prefijo NNN- repetido).
  const prefixCount = new Map();
  for (const f of features) {
    const prefix = f.name.match(/^(\d{3,})-/)[1];
    prefixCount.set(prefix, (prefixCount.get(prefix) || 0) + 1);
  }
  for (const [prefix, n] of prefixCount) {
    if (n > 1) {
      findings.push(`specs/:1: prefijo NNN- duplicado: "${prefix}-" aparece en ${n} features (slugs deben ser unicos)`);
    }
  }
  // Archivos canonicos por feature.
  for (const f of features) {
    const featureDir = path.join(specsDir, f.name);
    let presentFiles;
    try { presentFiles = new Set(fs.readdirSync(featureDir)); } catch { continue; }
    for (const req of REQUIRED_FEATURE_FILES) {
      if (!presentFiles.has(req)) {
        findings.push(`specs/${f.name}/${req}:1: archivo canonico faltante`);
      }
    }
    // Verificar matriz de traceability con 10 columnas canonicas.
    const tracePath = path.join(featureDir, "traceability.md");
    if (fs.existsSync(tracePath)) {
      const tText = fs.readFileSync(tracePath, "utf8");
      // Buscar tabla con encabezado canonico (10 columnas).
      const canonicalHeader = /\|\s*RF\s*\|\s*HU\s*\|\s*UX\/SPDD\s*\|\s*Prototipo\s*\|\s*API\s*\|\s*BD\s*\|\s*Codigo\s*\|\s*Test\s*\|\s*Estado\s*\|\s*Evidencia\s*\|/i;
      if (!canonicalHeader.test(tText)) {
        findings.push(`specs/${f.name}/traceability.md:1: matriz sin encabezado canonico (10 cols: RF|HU|UX/SPDD|Prototipo|API|BD|Codigo|Test|Estado|Evidencia)`);
      }
      // Verificar seccion ## Gates.
      if (!/^##\s+Gates\b/m.test(tText)) {
        findings.push(`specs/${f.name}/traceability.md:1: falta seccion '## Gates'`);
      }
    }
  }
  return findings;
}

function checkResidualTerms(rootDir) {
  const findings = [];
  for (const prefix of FORBIDDEN_RESIDUAL_PATH_PREFIXES) {
    const candidate = path.join(rootDir, prefix);
    if (!fs.existsSync(candidate)) continue;
    const stat = fs.statSync(candidate);
    const collect = stat.isDirectory()
      ? collectFiles(candidate).map((f) => ({ ...f, relative: path.posix.join(prefix.replace(/\/$/, ""), f.relative) }))
      : [{ absolute: candidate, relative: prefix }];
    for (const file of collect) {
      // Solo .md / .yaml / .yml / .json / .html para esta validacion.
      const ext = path.extname(file.relative).toLowerCase();
      if (![".md", ".yaml", ".yml", ".json", ".html"].includes(ext)) continue;
      const text = fs.readFileSync(file.absolute, "utf8");
      for (const rule of FORBIDDEN_RESIDUAL_TERMS) {
        for (const match of text.matchAll(rule.pattern)) {
          findings.push(`${file.relative}:${lineNumberForIndex(text, match.index ?? 0)}: ${rule.label} ("${match[0]}")`);
        }
      }
    }
  }
  return findings;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  if (!["template", "instantiated"].includes(args.mode)) {
    throw new Error(`Modo invalido: ${args.mode}`);
  }

  const rootDir = path.resolve(args.root);
  const rootProfile = detectRootProfile(rootDir);
  const angularWorkspace = detectAngularWorkspace(rootDir);
  const findings = [];

  // v12.95: meta-check de auto-consistencia (corre en ambos modos): los patrones
  // residuales no pueden bloquear vocabulario generico/auto-zonas requeridas.
  findings.push(...checkResidualPatternSafety());

  // v12.46: reglas strict para modo instantiated.
  if (args.mode === "instantiated") {
    findings.push(...checkRequiredScriptsInPackageJson(rootDir));
    findings.push(...checkAiContextAutoZones(rootDir));
    findings.push(...checkFeatureCompleteness(rootDir));
    findings.push(...checkResidualTerms(rootDir));
  }

  if (angularWorkspace.angular && !angularWorkspace.nxWorkspace) {
    findings.push("package.json:1: proyecto Angular sin nx.json; el estandar del template exige workspace Nx");
  }
  if (angularWorkspace.angular && angularWorkspace.nxWorkspace) {
    if (!fs.existsSync(path.join(rootDir, "apps"))) {
      findings.push("nx.json:1: workspace Angular sin directorio apps/");
    }
    if (!fs.existsSync(path.join(rootDir, "libs"))) {
      findings.push("nx.json:1: workspace Angular sin directorio libs/");
    }
    if (!fs.existsSync(path.join(rootDir, "apps", "web", "project.json"))) {
      findings.push("apps/web/project.json:1: falta configuracion Nx de la app principal Angular");
    }
  }

  for (const file of collectFiles(rootDir)) {
    const text = fs.readFileSync(file.absolute, "utf8");

    if (args.mode === "instantiated" && shouldCheckCanonicalRuntimePath(file.relative, rootProfile)) {
      for (const canonical of CANONICAL_RUNTIME_PATTERNS) {
        for (const match of file.relative.matchAll(canonical.pattern)) {
          findings.push(
            `${file.relative}:1: referencia canonica en ruta ${canonical.label}`,
          );
        }
      }
    }

    if (args.mode === "instantiated") {
      for (const token of findStructuredTokens(text)) {
        findings.push(
          `${file.relative}:${lineNumberForIndex(text, token.index)}: token sin instanciar ${token.token}`,
        );
      }
    }

    if (!isSensitivePath(file.relative)) {
      continue;
    }

    for (const legacy of LEGACY_PATTERNS) {
      for (const match of text.matchAll(legacy.pattern)) {
        findings.push(
          `${file.relative}:${lineNumberForIndex(text, match.index ?? 0)}: placeholder legacy ${legacy.label}`,
        );
      }
    }

    if (args.mode !== "instantiated" || !shouldCheckCanonicalRuntime(file.relative, rootProfile)) {
      continue;
    }

    for (const canonical of CANONICAL_RUNTIME_PATTERNS) {
      for (const match of text.matchAll(canonical.pattern)) {
        findings.push(
          `${file.relative}:${lineNumberForIndex(text, match.index ?? 0)}: referencia canonica ${canonical.label}`,
        );
      }
    }
  }

  if (findings.length > 0) {
    for (const finding of findings) {
      console.error(finding);
    }
    console.error(`\nTotal hallazgos: ${findings.length}`);
    return 1;
  }

  console.log(`OK. Validacion de instanciacion (${args.mode}) sin hallazgos.`);
  return 0;
}

try {
  process.exit(main());
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  usage();
  process.exit(1);
}
