// ci/scripts/_lib/strict-mode.mjs (v12.59)
//
// Resuelve el modo "strict" de un validador desde 3 fuentes, en orden de
// prioridad descendente:
//   1. --warn          (flag explicito) -> SIEMPRE false (override duro)
//   2. --strict        (flag explicito) -> true
//   3. CHECK_STRICT=1  (variable de entorno) -> true
//   4. defaultStrict   (valor por defecto del validador)
//
// Cierra el gap real reportado: antes los validadores solo leian --strict y
// CHECK_STRICT=1 no tenia efecto (exit 0 aunque hubiera hallazgos). Ahora
// CHECK_STRICT=1 funciona en TODOS los validadores que usan este helper.
//
// Uso en cada validador:
//   import { resolveStrict } from "./_lib/strict-mode.mjs";
//   const strict = resolveStrict(args);                  // default false
//   const strict = resolveStrict(args, true);            // default true (bloqueante)

export function resolveStrict(args, defaultStrict = false) {
  // --warn fuerza no-strict (override duro para CI de aprendizaje).
  if (args && args.warn) return false;
  // --strict flag.
  if (args && args.strict) return true;
  // CHECK_STRICT env var (1, true, yes).
  const env = (process.env.CHECK_STRICT || "").toLowerCase();
  if (env === "1" || env === "true" || env === "yes") return true;
  return defaultStrict;
}

/**
 * Helper para imprimir el modo activo de forma consistente.
 */
export function strictLabel(strict) {
  return strict ? "[STRICT — exit 1 si hay hallazgos]" : "[WARN — exit 0, solo reporta]";
}
