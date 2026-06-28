#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const FASE4_TEMPLATE_FILES = [
  "api-contract.md",
  "product-design.md",
  "prototype-validation.md",
  "prototype.md",
  "spdd-frontend.md",
  "spec-funcional.md",
  "spec-tareas.md",
  "spec-tecnica.md",
  "traceability.md",
  "ui-test-cases.md",
];

// Project-local fallback source of truth for phase-4 templates.
// The original template builder is not present in this repo, so validation and
// sync operations use the checked-in canonical snapshot under plantillas/.
export function emitFase4Plantillas(root = ".") {
  const baseDir = resolve(root, "plantillas", "fase-4-sdd");
  const emitted = {};

  for (const name of FASE4_TEMPLATE_FILES) {
    const filePath = join(baseDir, name);
    if (!existsSync(filePath)) {
      throw new Error(`Falta plantilla canonica: ${filePath}`);
    }
    emitted[name] = readFileSync(filePath, "utf8");
  }

  return emitted;
}

export { FASE4_TEMPLATE_FILES };
