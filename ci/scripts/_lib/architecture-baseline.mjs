/**
 * _lib/architecture-baseline.mjs (v12.68)
 *
 * Baseline minimo de arquitectura: el conjunto NO negociable de concerns que
 * todo proyecto debe abordar en fase 3 (seguridad, calidad, SOLID, DDD/capas,
 * observabilidad, performance/SLO, datos/PII). Es el "contrato de ejecucion"
 * a nivel arquitectura.
 *
 * Evidence-based: para cada concern busca evidencia en docs/fase-3-arquitectura/
 * (incl. adr/). Un concern esta "covered" si algun doc de fase 3 lo aborda.
 *
 * Consumido por:
 *   - ci/scripts/check-architecture-baseline.mjs (validador, en check:project)
 *   - ci/scripts/_lib/doc-autozones.mjs (auto-zone baseline-estado en 03.04)
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export const BASELINE_CONCERNS = [
  { id: "seguridad-authz",  label: "Seguridad: autenticacion + autorizacion (RBAC)", patterns: [/\bRBAC\b|autorizaci|authz|authn|autenticaci/i] },
  { id: "secretos",         label: "Gestion de secretos (no hardcode)",              patterns: [/secreto|secret|vault|\bkms\b|key management/i] },
  { id: "amenazas",         label: "Modelo de amenazas / OWASP",                     patterns: [/OWASP|threat model|STRIDE|vulnerabilidad|superficie de ataque/i] },
  { id: "calidad-tests",    label: "Calidad: testing + cobertura + lint",            patterns: [/cobertura|coverage|estrategia de (test|prueba)|lint|static analysis/i] },
  { id: "solid",            label: "SOLID / principios de diseno",                   patterns: [/\bSOLID\b|principios de diseno|clean code|inversion de dependencia/i] },
  { id: "ddd-capas",        label: "DDD / capas / bounded contexts",                 patterns: [/\bDDD\b|bounded context|agregad|capas|\blayer/i] },
  { id: "observabilidad",   label: "Observabilidad: logging + metricas + tracing",   patterns: [/logging|log estructurado|metric|tracing|observabilidad|correlation/i] },
  { id: "slo",              label: "Performance / SLO-SLI",                          patterns: [/\bSLO\b|\bSLI\b|p9[59]|disponibilidad|latencia|throughput/i] },
  { id: "datos-pii",        label: "Datos: modelo + PII / retencion",                patterns: [/modelo de datos|\bPII\b|dato sensible|retencion|privacidad|cifrado/i] },
];

function listMarkdown(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, e.name);
    if (e.isDirectory()) out.push(...listMarkdown(abs));
    else if (e.isFile() && e.name.endsWith(".md")) out.push(abs);
  }
  return out;
}

/**
 * Evalua el baseline contra docs/fase-3-arquitectura/. Devuelve un array de
 * { id, label, status: 'covered'|'absent', files: [rel] }.
 */
export function evaluateBaseline(root) {
  const fase3 = join(root, "docs", "fase-3-arquitectura");
  const files = listMarkdown(fase3);
  const corpus = files.map((f) => {
    let text = "";
    try { text = readFileSync(f, "utf8"); } catch { /* ignore */ }
    return { rel: f.substring(root.length + 1).replace(/\\/g, "/"), text };
  });
  return BASELINE_CONCERNS.map((c) => {
    const hits = corpus.filter((d) => c.patterns.some((re) => re.test(d.text))).map((d) => d.rel);
    return { id: c.id, label: c.label, status: hits.length > 0 ? "covered" : "absent", files: hits };
  });
}

export function summarizeBaseline(root) {
  const results = evaluateBaseline(root);
  const covered = results.filter((r) => r.status === "covered").length;
  const absent = results.filter((r) => r.status === "absent");
  return { results, covered, total: results.length, absent };
}
