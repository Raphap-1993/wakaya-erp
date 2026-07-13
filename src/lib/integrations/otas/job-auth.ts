import { timingSafeEqual } from "node:crypto";

import { requirePermission } from "@/middleware/authn";
import type { Permission } from "@/lib/rbac";

function secureEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function readJobToken(request: Request) {
  const headerToken = request.headers.get("x-wakaya-job-token")?.trim();
  if (headerToken) {
    return headerToken;
  }
  const authorization = request.headers.get("authorization")?.trim();
  if (!authorization?.toLowerCase().startsWith("bearer ")) {
    return null;
  }
  return authorization.slice(7).trim() || null;
}

export async function requireOtaJobPermission(
  request: Request,
  permission: Permission,
) {
  const configuredToken = process.env.OTA_JOB_TOKEN?.trim();
  const providedToken = readJobToken(request);

  if (configuredToken && providedToken && secureEquals(configuredToken, providedToken)) {
    return {
      authenticated: true as const,
      subject: "ota-job",
      roles: ["admin"] as const,
      claims: { authMethod: "ota_job_token" },
    };
  }

  return requirePermission(request, permission);
}
