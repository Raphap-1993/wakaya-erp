// Utilidades de redaccion de PII para logs y telemetria.
// Aplicar a TODA salida estructurada antes de emitir a stdout, OTLP o sinks.
//
// Politica:
//   - Campos claves (email, phone, dni, ssn, password, token) se reemplazan por "[REDACTED]".
//   - Strings que matchean patrones globales (correo, tarjeta, JWT) se redactan parcialmente.
//   - Estructuras profundas se recorren con limite de profundidad para evitar logs gigantes.
//
// Esta utilidad es complementaria al ROPA (`90.16-privacidad-compliance.md`) y al threat
// modeling (`90.25-threat-modeling.md`). No sustituye una pasada de revision manual de
// trazas en QA.

const DEFAULT_KEY_DENYLIST = new Set([
  "password", "pass", "passwd", "secret", "token", "access_token", "refresh_token",
  "id_token", "authorization", "auth", "cookie", "session", "session_id",
  "email", "mail", "phone", "telefono", "celular",
  "dni", "rut", "nif", "cuit", "ssn", "passport",
  "credit_card", "card_number", "cvv", "cvc", "iban",
  "ip", "ip_address", "remote_addr",
  "address", "direccion", "lat", "lng", "geo",
]);

type PatternReplacement = readonly [
  pattern: RegExp,
  replacer:
    | ((match: string, ...args: [offset: number, input: string]) => string)
    | ((
      match: string,
      ...args: [head: string, domain: string, offset: number, input: string]
    ) => string),
];

const PATTERN_REPLACEMENTS: PatternReplacement[] = [
  // Email: deja primer caracter + dominio.
  [
    /\b([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*@([A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/g,
    (_match: string, head: string, domain: string) => `${head}***@${domain}`,
  ],
  // Visa/Mastercard/Amex (16 digitos con o sin separador).
  [
    /\b(?:\d[ -]?){13,19}\b/g,
    (match: string) => `[REDACTED:CARD:${match.replace(/\D/g, "").slice(-4)}]`,
  ],
  // JWT (3 segmentos base64url separados por puntos).
  [
    /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
    () => "[REDACTED:JWT]",
  ],
];

export interface RedactOptions {
  /** Profundidad maxima recorrida; objetos mas profundos se cortan en "[REDACTED:DEPTH]". */
  maxDepth?: number;
  /** Anadir nombres de campos extra al denylist (case-insensitive). */
  extraKeys?: readonly string[];
  /** Reemplazo a usar para valores redactados. */
  replacement?: string;
}

const DEFAULT_OPTIONS: Required<RedactOptions> = {
  maxDepth: 8,
  extraKeys: [],
  replacement: "[REDACTED]",
};

/**
 * Devuelve una copia profunda del valor con campos sensibles redactados.
 * Es seguro de pasar al logger sin temor a fuga de PII en stack traces o telemetria.
 */
export function redact<T>(value: T, options: RedactOptions = {}): T {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const denylist = new Set([
    ...DEFAULT_KEY_DENYLIST,
    ...opts.extraKeys.map((k) => k.toLowerCase()),
  ]);
  return walk(value, denylist, opts, 0) as T;
}

function walk(
  value: unknown,
  denylist: Set<string>,
  opts: Required<RedactOptions>,
  depth: number,
): unknown {
  if (depth > opts.maxDepth) {
    return "[REDACTED:DEPTH]";
  }
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === "string") {
    return redactString(value);
  }
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((v) => walk(v, denylist, opts, depth + 1));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (denylist.has(key.toLowerCase())) {
        out[key] = opts.replacement;
        continue;
      }
      out[key] = walk(child, denylist, opts, depth + 1);
    }
    return out;
  }
  return String(value);
}

function redactString(input: string): string {
  let out = input;
  for (const [pattern, replacer] of PATTERN_REPLACEMENTS) {
    out = out.replace(pattern, replacer);
  }
  return out;
}

/**
 * Helper para usar como adaptador de console.log:
 *   const log = (event, payload) => console.log(JSON.stringify({ event, ...redact(payload) }));
 */
export function safeStringify(value: unknown, options?: RedactOptions): string {
  return JSON.stringify(redact(value, options));
}
