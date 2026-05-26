// ci/scripts/_lib/project-config.mjs (v12.57)
//
// Helper unico que lee template.config.json (o template.config.example.json
// como fallback) y devuelve la config del proyecto con defaults sensatos.
//
// Schema esperado:
//   {
//     "roadmap": {
//       "source_dirs": ["src", "backend", "frontend", "apps", "libs", "services"],
//       "test_dirs":   ["tests", "qa/automated", "backend/src/test", "frontend/src"],
//       "ignore_dirs": ["stacks/**/template", "target", "dist", "build"],
//       "exclude_feature_globs": ["000-*"]
//     }
//   }
//
// Si template.config.json no existe, retorna defaults.
// Si existe pero falta algun campo, usa default para ese campo.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const DEFAULT_PROJECT_CONFIG = {
  roadmap: {
    source_dirs: ["src", "backend", "frontend", "apps", "libs", "services"],
    test_dirs: ["tests", "qa/automated", "backend/src/test", "frontend/src"],
    ignore_dirs: [], // adicional a DEFAULT_IGNORE_DIRS de _lib/ignore-paths.mjs
    exclude_feature_globs: ["000-*"],
  },
};

export function loadProjectConfig(rootDir) {
  const candidates = ["template.config.json", "template.config.example.json"];
  for (const name of candidates) {
    const p = join(rootDir, name);
    if (!existsSync(p)) continue;
    try {
      const raw = JSON.parse(readFileSync(p, "utf8"));
      return mergeWithDefaults(raw);
    } catch { /* parse error, fallback a defaults */ }
  }
  return { ...DEFAULT_PROJECT_CONFIG };
}

function mergeWithDefaults(userConfig) {
  const out = JSON.parse(JSON.stringify(DEFAULT_PROJECT_CONFIG));
  if (userConfig?.roadmap) {
    for (const key of Object.keys(DEFAULT_PROJECT_CONFIG.roadmap)) {
      if (Array.isArray(userConfig.roadmap[key])) {
        out.roadmap[key] = userConfig.roadmap[key];
      }
    }
  }
  return out;
}
