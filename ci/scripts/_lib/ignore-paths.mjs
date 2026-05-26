// ci/scripts/_lib/ignore-paths.mjs (v12.56)
//
// Modulo compartido: lista canonica de directorios/extensiones que TODOS los
// validadores deben ignorar (build artifacts, vendor, etc.). Antes cada
// validador definia su propia lista, causando inconsistencias.
//
// Soporta override desde template.config.json:
//   {
//     "roadmap": {
//       "ignore_dirs": ["mi-dir-extra", "out/extra"]
//     }
//   }
//
// Los overrides se SUMAN a los defaults (no los reemplazan). Para 90% de
// proyectos los defaults bastan; los overrides son para frameworks exoticos.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Defaults canonicos: cubre Java/Maven/Gradle, Node/npm, Python, Rust, Go, .NET, C++.
export const DEFAULT_IGNORE_DIRS = new Set([
  // VCS y herramientas
  ".git", ".gradle", ".vs", ".vscode", ".idea", ".cache", ".tmp",
  // Node
  "node_modules",
  // Java / Maven / Gradle / Kotlin
  "target", "bin", "build", "out",
  // .NET
  "obj", "Debug", "Release",
  // Python
  "__pycache__", ".venv", "venv", "env", ".tox", ".pytest_cache", ".mypy_cache",
  // Rust
  // (target ya incluido arriba)
  // Web
  "dist", "next", ".next", ".nuxt", ".angular", ".svelte-kit",
  // Tests output
  "coverage", "playwright-report", "test-results",
  // Generated docs
  "site", "_site",
  // Template-specific
  "revisiones",
]);

// Extensiones de archivos siempre ignoradas (artefactos de compilacion).
export const DEFAULT_IGNORE_EXTENSIONS = new Set([
  ".class",     // Java/Kotlin
  ".pyc",       // Python
  ".o", ".obj", // C/C++
  ".so", ".dylib", ".dll", ".exe", // Binarios
  ".jar", ".war", ".ear", // Java packaged
  ".min.js", ".min.css", // Web minificado generado
  ".map",       // Source maps
]);

// Archivos sin extension en raiz que son artefactos de invocaciones erroneas.
// Patron real visto en codex case: archivos vacios `node` y `npm` en root.
export const DEFAULT_IGNORE_ROOT_NOEXT = new Set([
  "node", "npm", "npx", "yarn", "pnpm",
]);

// Patrones de path completos (no solo nombre de dir).
export const DEFAULT_IGNORE_PATH_PATTERNS = [
  /[\\/]target[\\/]/,
  /[\\/]bin[\\/](main|test)[\\/]/,    // Gradle bin/main/, bin/test/
  /[\\/]build[\\/]classes[\\/]/,
  /[\\/]\.gradle[\\/]/,
  /[\\/]node_modules[\\/]/,
  /[\\/]coverage[\\/]/,
  /[\\/]dist[\\/]/,
  /[\\/]out[\\/]/,
  /[\\/]stacks[\\/][^\\/]+[\\/]template[\\/]/,  // template scaffolding, no es codigo del proyecto
];

/**
 * Lee config del proyecto y devuelve sets combinados (defaults + overrides).
 * Si template.config.json no existe, retorna defaults.
 */
export function loadIgnoreConfig(rootDir) {
  const result = {
    dirs: new Set(DEFAULT_IGNORE_DIRS),
    extensions: new Set(DEFAULT_IGNORE_EXTENSIONS),
    rootNoExt: new Set(DEFAULT_IGNORE_ROOT_NOEXT),
    pathPatterns: [...DEFAULT_IGNORE_PATH_PATTERNS],
  };
  // Intentar leer template.config.json del proyecto.
  const configCandidates = ["template.config.json", "template.config.example.json"];
  for (const name of configCandidates) {
    const p = join(rootDir, name);
    if (!existsSync(p)) continue;
    try {
      const cfg = JSON.parse(readFileSync(p, "utf8"));
      const overrideDirs = cfg?.roadmap?.ignore_dirs;
      if (Array.isArray(overrideDirs)) {
        for (const d of overrideDirs) result.dirs.add(d);
      }
      const overrideExt = cfg?.roadmap?.ignore_extensions;
      if (Array.isArray(overrideExt)) {
        for (const e of overrideExt) result.extensions.add(e.startsWith(".") ? e : "." + e);
      }
      break; // primera config encontrada gana
    } catch { /* parse error, ignorar */ }
  }
  return result;
}

/**
 * Predicado: dado un path relativo al root, devuelve true si debe ignorarse.
 * Combina los 4 criterios: dirs, extensions, rootNoExt, pathPatterns.
 */
export function shouldIgnorePath(relativePath, ignoreConfig) {
  const cfg = ignoreConfig || loadIgnoreConfig(".");
  const segments = relativePath.split(/[\\/]/);
  // 1. Algun segmento es un dir ignorado.
  for (const seg of segments) {
    if (cfg.dirs.has(seg)) return true;
  }
  // 2. Extension ignorada.
  const lastDot = relativePath.lastIndexOf(".");
  if (lastDot > 0) {
    const ext = relativePath.slice(lastDot);
    if (cfg.extensions.has(ext)) return true;
  }
  // 3. Archivo sin extension en raiz con nombre prohibido.
  if (segments.length === 1 && cfg.rootNoExt.has(segments[0])) return true;
  // 4. Patrones de path completos.
  const normalized = "/" + relativePath.replace(/\\/g, "/") + "/";
  for (const re of cfg.pathPatterns) {
    if (re.test(normalized)) return true;
  }
  return false;
}

/**
 * Recolecta archivos recursivamente, filtrando los ignorados.
 * Helper que reemplaza walkDir custom en cada validador.
 */
export async function collectFilesFiltered(rootDir, ignoreConfig) {
  const { readdir, stat } = await import("node:fs/promises");
  const { join: pjoin, relative } = await import("node:path");
  const cfg = ignoreConfig || loadIgnoreConfig(rootDir);
  const out = [];
  const walk = async (dir) => {
    let entries;
    try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const abs = pjoin(dir, e.name);
      const rel = relative(rootDir, abs).replace(/\\/g, "/");
      if (shouldIgnorePath(rel, cfg)) continue;
      if (e.isDirectory()) await walk(abs);
      else out.push({ abs, rel });
    }
  };
  await walk(rootDir);
  return out;
}
