/**
 * _lib/agent-locks.mjs (v12.76)
 *
 * Orquestacion multiagente: locks por feature para correr varios agentes IA en
 * paralelo sin que dos tomen la misma tarea. Cada lock es un archivo en
 * ai/locks/<feature>.lock.json (gitignored) con TTL.
 *
 * Consumido por:
 *   - scripts/roadmap-claim.mjs / roadmap-release.mjs (CLI)
 *   - scripts/roadmap-next.mjs (salta features tomadas por OTRO agente)
 *   - scripts/roadmap-audit.mjs (reporta locks expirados/huerfanos)
 *   - scripts/roadmap-sync.mjs (AGENT_BOARD.md)
 *
 * Un lock NO es seguridad fuerte (el filesystem local no da exclusion atomica
 * perfecta); es coordinacion cooperativa entre agentes que respetan el protocolo:
 * claim antes de trabajar, release al terminar, TTL para auto-liberar si un
 * agente muere.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

export const DEFAULT_TTL_MIN = 240; // 4 horas

function locksDir(root) { return join(root, "ai", "locks"); }
function lockPath(root, feature) { return join(locksDir(root), feature + ".lock.json"); }

export function readLock(root, feature) {
  const p = lockPath(root, feature);
  if (!existsSync(p)) return null;
  try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; }
}

export function isExpired(lock) {
  return !lock || !lock.expires_at || Date.parse(lock.expires_at) < Date.now();
}

/** Todos los locks (incluye expirados, con flag `expired`). */
export function listLocks(root) {
  const dir = locksDir(root);
  if (!existsSync(dir)) return [];
  const out = [];
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".lock.json")) continue;
    try {
      const l = JSON.parse(readFileSync(join(dir, f), "utf8"));
      out.push({ ...l, expired: isExpired(l) });
    } catch { /* lock corrupto: ignorar */ }
  }
  return out;
}

/** Dueño ACTIVO (no expirado) de una feature, o null si esta libre. */
export function activeLockOwner(root, feature) {
  const l = readLock(root, feature);
  if (!l || isExpired(l)) return null;
  return l.agent || null;
}

/** Reclama una feature para un agente. Falla si ya esta tomada por OTRO (salvo --force). */
export function claim(root, feature, agent, opts = {}) {
  if (!feature || !agent) return { ok: false, error: "feature y agent son obligatorios" };
  const existing = readLock(root, feature);
  if (existing && !isExpired(existing) && existing.agent !== agent && !opts.force) {
    return { ok: false, error: `feature ya tomada por '${existing.agent}' (expira ${existing.expires_at}). Usa --force para forzar.`, lock: existing };
  }
  const ttl = Number(opts.ttlMin || DEFAULT_TTL_MIN);
  const now = new Date();
  const lock = {
    feature, agent,
    task: opts.task || null,
    phase: typeof opts.phase === "number" ? opts.phase : null,
    created_at: (existing && existing.agent === agent && existing.created_at) ? existing.created_at : now.toISOString(),
    expires_at: new Date(now.getTime() + ttl * 60000).toISOString(),
    ttl_min: ttl,
  };
  mkdirSync(locksDir(root), { recursive: true });
  writeFileSync(lockPath(root, feature), JSON.stringify(lock, null, 2) + "\n", "utf8");
  return { ok: true, lock, refreshed: !!(existing && existing.agent === agent && !isExpired(existing)) };
}

/** Libera una feature. Falla si el lock pertenece a OTRO agente (salvo --force). */
export function release(root, feature, agent, opts = {}) {
  const p = lockPath(root, feature);
  if (!existsSync(p)) return { ok: true, noop: true };
  const l = readLock(root, feature);
  if (l && l.agent && agent && l.agent !== agent && !opts.force && !isExpired(l)) {
    return { ok: false, error: `la feature esta tomada por '${l.agent}', no por '${agent}'. Usa --force para liberar igualmente.` };
  }
  rmSync(p, { force: true });
  return { ok: true, released: true, was: l || null };
}

/** Borra todos los locks expirados (huerfanos). Devuelve cuantos. */
export function pruneExpired(root) {
  let n = 0;
  for (const l of listLocks(root)) {
    if (l.expired) { try { rmSync(lockPath(root, l.feature), { force: true }); n += 1; } catch { /* ignore */ } }
  }
  return n;
}
