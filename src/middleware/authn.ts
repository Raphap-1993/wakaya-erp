// Middleware de autenticacion para Next.js (App Router).
// Valida JWT del header Authorization: Bearer <token> contra el JWKS del IdP.
//
// Uso desde un route handler:
//   const ctx = await authenticate(request);
//   if (!ctx.authenticated) return new Response("unauthorized", { status: 401 });
//   if (!hasPermission(ctx.roles, "reservation:read")) return new Response("forbidden", { status: 403 });
//
// Alternativa: encapsular en un higher-order handler `withAuth(handler, required)`.

import type { NextRequest } from "next/server";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { hasPermission, type Permission } from "@/lib/rbac";

const JWKS_URL = process.env.OIDC_JWKS_URL;
const ISSUER = process.env.OIDC_ISSUER;
const AUDIENCE = process.env.OIDC_AUDIENCE;

if (!JWKS_URL || !ISSUER || !AUDIENCE) {
  // Intencionalmente permisivo en dev (no throw) para que el scaffolding arranque.
  // En produccion el pipeline debe detectar la ausencia via config-validation.
  console.warn("authn: falta configuracion OIDC (OIDC_JWKS_URL, OIDC_ISSUER, OIDC_AUDIENCE)");
}

const jwks = JWKS_URL ? createRemoteJWKSet(new URL(JWKS_URL)) : null;

export interface AuthContext {
  authenticated: boolean;
  subject?: string;
  roles: readonly string[];
  claims?: JWTPayload;
  reason?: string;
}

export async function authenticate(request: NextRequest | Request): Promise<AuthContext> {
  const auth = request.headers.get("authorization");
  if (!auth || !auth.toLowerCase().startsWith("bearer ")) {
    return { authenticated: false, roles: [], reason: "missing_bearer" };
  }
  const token = auth.slice(7).trim();
  if (!jwks) {
    return { authenticated: false, roles: [], reason: "jwks_not_configured" };
  }
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    const roles = Array.isArray(payload.roles) ? (payload.roles as string[]) : [];
    return {
      authenticated: true,
      subject: typeof payload.sub === "string" ? payload.sub : undefined,
      roles,
      claims: payload,
    };
  } catch (error) {
    return {
      authenticated: false,
      roles: [],
      reason: error instanceof Error ? error.message : "verify_failed",
    };
  }
}

export async function requirePermission(
  request: NextRequest | Request,
  permission: Permission,
): Promise<AuthContext | Response> {
  const ctx = await authenticate(request);
  if (!ctx.authenticated) {
    return new Response(JSON.stringify({ error: "unauthorized", reason: ctx.reason }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  if (!hasPermission(ctx.roles, permission)) {
    return new Response(JSON.stringify({ error: "forbidden", required: permission }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }
  return ctx;
}
