// Tabla de roles y permisos canonica del dominio de referencia.
// Debe alinearse con docs/fase-3-arquitectura/03.08-auth-authz.md.

export type Permission =
  | "reservation:read"
  | "reservation:write"
  | "reservation:approve"
  | "admin:users";

export type Role = "viewer" | "editor" | "approver" | "admin";

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  viewer: ["reservation:read"],
  editor: ["reservation:read", "reservation:write"],
  approver: ["reservation:read", "reservation:write", "reservation:approve"],
  admin: [
    "reservation:read",
    "reservation:write",
    "reservation:approve",
    "admin:users",
  ],
};

export function isRole(value: string): value is Role {
  return value in ROLE_PERMISSIONS;
}

export function hasPermission(roles: readonly string[], permission: Permission): boolean {
  for (const role of roles) {
    if (!isRole(role)) continue;
    if (ROLE_PERMISSIONS[role].includes(permission)) return true;
  }
  return false;
}

export function permissionsForRoles(roles: readonly string[]): readonly Permission[] {
  const set = new Set<Permission>();
  for (const role of roles) {
    if (!isRole(role)) continue;
    for (const permission of ROLE_PERMISSIONS[role]) {
      set.add(permission);
    }
  }
  return Array.from(set);
}
