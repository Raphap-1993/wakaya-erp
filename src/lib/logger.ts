// Logger seguro por defecto.
// Envuelve console.* aplicando `redact()` a todo payload estructurado para evitar fugas de PII
// en stdout, lo que termina en stack drivers (loki, cloudwatch, datadog) sin filtros.
//
// Uso normal:
//   import { logger } from "@/lib/logger";
//   logger.info("resource_created", { id, ownerId, payload });
//
// Si necesitas omitir la redaccion (poco frecuente, solo para debug local), usa logger.unsafe.
// La salida es JSON line con shape: {"ts": "...", "level": "info", "event": "...", ...redactedPayload}.

import { redact, type RedactOptions } from "@/lib/pii-redact";

type Level = "debug" | "info" | "warn" | "error";

type Payload = Record<string, unknown> | undefined;

interface LoggerOptions {
  redactOptions?: RedactOptions;
  /** Stream destino para tests; default es process.stdout. */
  out?: { write: (s: string) => void };
  /** Nivel minimo emitido; default es "info". */
  level?: Level;
}

const LEVELS: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function envLevel(): Level {
  const raw = (typeof process !== "undefined" ? process.env?.LOG_LEVEL : undefined) ?? "info";
  if (raw in LEVELS) return raw as Level;
  return "info";
}

function emit(out: { write: (s: string) => void }, level: Level, event: string, payload: Payload, redactOptions?: RedactOptions) {
  const safePayload = payload ? redact(payload, redactOptions) : undefined;
  const line = {
    ts: new Date().toISOString(),
    level,
    event,
    ...(safePayload && typeof safePayload === "object" ? (safePayload as Record<string, unknown>) : {}),
  };
  out.write(JSON.stringify(line) + "\n");
}

function emitUnsafe(out: { write: (s: string) => void }, level: Level, event: string, payload: Payload) {
  const line = {
    ts: new Date().toISOString(),
    level,
    event,
    unsafe: true,
    ...(payload && typeof payload === "object" ? payload : {}),
  };
  out.write(JSON.stringify(line) + "\n");
}

export interface SafeLogger {
  debug(event: string, payload?: Payload): void;
  info(event: string, payload?: Payload): void;
  warn(event: string, payload?: Payload): void;
  error(event: string, payload?: Payload): void;
  /** Salida sin redaccion. Solo para debug puntual; no usar en handlers de produccion. */
  unsafe: {
    debug(event: string, payload?: Payload): void;
    info(event: string, payload?: Payload): void;
    warn(event: string, payload?: Payload): void;
    error(event: string, payload?: Payload): void;
  };
}

export function createLogger(options: LoggerOptions = {}): SafeLogger {
  const out = options.out ?? (typeof process !== "undefined" ? process.stdout : { write: () => {} });
  const minLevel = LEVELS[options.level ?? envLevel()];
  const guard = (lvl: Level) => LEVELS[lvl] >= minLevel;

  const safe = (lvl: Level) => (event: string, payload?: Payload) => {
    if (!guard(lvl)) return;
    emit(out, lvl, event, payload, options.redactOptions);
  };
  const unsafe = (lvl: Level) => (event: string, payload?: Payload) => {
    if (!guard(lvl)) return;
    emitUnsafe(out, lvl, event, payload);
  };

  return {
    debug: safe("debug"),
    info: safe("info"),
    warn: safe("warn"),
    error: safe("error"),
    unsafe: {
      debug: unsafe("debug"),
      info: unsafe("info"),
      warn: unsafe("warn"),
      error: unsafe("error"),
    },
  };
}

/** Singleton listo para importar en handlers. */
export const logger: SafeLogger = createLogger();
