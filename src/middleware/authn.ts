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
import { hasPermission, type Permission } from "@/lib/rbac";

const JWKS_URL = process.env.OIDC_JWKS_URL;
const ISSUER = process.env.OIDC_ISSUER;
const AUDIENCE = process.env.OIDC_AUDIENCE;
const ROLES_CLAIM = process.env.OIDC_ROLES_CLAIM ?? "roles";

if (!JWKS_URL || !ISSUER || !AUDIENCE) {
  // Intencionalmente permisivo en dev (no throw) para que el scaffolding arranque.
  // En produccion el pipeline debe detectar la ausencia via config-validation.
  console.warn("authn: falta configuracion OIDC (OIDC_JWKS_URL, OIDC_ISSUER, OIDC_AUDIENCE)");
}

const AUTH_COOKIE_NAMES = ["wakaya_access_token", "oidc_access_token", "access_token"] as const;

function getCookieHeader(request: NextRequest | Request): string | null {
  return request.headers.get("cookie");
}

function parseCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const segments = cookieHeader.split(";").map((segment) => segment.trim());
  for (const segment of segments) {
    const index = segment.indexOf("=");
    if (index < 0) continue;
    const key = segment.slice(0, index).trim();
    if (key !== name) continue;
    return decodeURIComponent(segment.slice(index + 1));
  }
  return null;
}

function getTokenFromRequest(request: NextRequest | Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth && auth.toLowerCase().startsWith("bearer ")) {
    const token = auth.slice(7).trim();
    if (token) return token;
  }

  const cookieHeader = getCookieHeader(request);
  for (const cookieName of AUTH_COOKIE_NAMES) {
    const token = parseCookieValue(cookieHeader, cookieName);
    if (token) return token;
  }

  return null;
}

function getClaimValue(payload: Record<string, unknown>, claimPath: string): unknown {
  return claimPath.split(".").reduce<unknown>((value, segment) => {
    if (value && typeof value === "object" && segment in value) {
      return (value as Record<string, unknown>)[segment];
    }
    return undefined;
  }, payload);
}

export interface AuthContext {
  authenticated: boolean;
  subject?: string;
  roles: readonly string[];
  claims?: Record<string, unknown>;
  reason?: string;
}

export async function authenticate(request: NextRequest | Request): Promise<AuthContext> {
  if (process.env.AUTH_DEV_BYPASS === "true" && process.env.NODE_ENV !== "production") {
    return {
      authenticated: true,
      subject: "dev-admin",
      roles: ["admin"],
      claims: { bypass: true },
    };
  }

  const token = getTokenFromRequest(request);
  if (!token) {
    return { authenticated: false, roles: [], reason: "missing_bearer" };
  }
  if (!JWKS_URL) {
    return { authenticated: false, roles: [], reason: "jwks_not_configured" };
  }
  try {
    const { createRemoteJWKSet, jwtVerify } = await import("jose");
    const jwks = createRemoteJWKSet(new URL(JWKS_URL));
    const { payload } = await jwtVerify(token, jwks, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    const claimValue = getClaimValue(payload as Record<string, unknown>, ROLES_CLAIM);
    const roles = Array.isArray(claimValue) ? (claimValue as string[]) : [];
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
