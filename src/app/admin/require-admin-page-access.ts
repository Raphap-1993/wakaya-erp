import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { hasPermission, type Permission } from "@/lib/rbac";
import { authenticate, type AuthContext } from "@/middleware/authn";

export async function requireAdminPageAccess(
  currentPath: string,
  permission: Permission,
): Promise<AuthContext> {
  const requestHeaders = new Headers();
  const currentHeaders = await headers();
  currentHeaders.forEach((value, key) => requestHeaders.set(key, value));

  const auth = await authenticate(new Request(`http://localhost${currentPath}`, { headers: requestHeaders }));
  if (!auth.authenticated) {
    redirect(`/login?next=${encodeURIComponent(currentPath)}`);
  }
  if (!hasPermission(auth.roles, permission)) {
    type AdminRedirectHref = Parameters<typeof redirect>[0];
    redirect(`/admin/forbidden?from=${encodeURIComponent(currentPath)}` as AdminRedirectHref);
  }

  return auth;
}
