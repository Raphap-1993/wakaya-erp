// Tabla de roles y permisos canonica del dominio de referencia.
// Debe alinearse con docs/fase-3-arquitectura/03.08-auth-authz.md.

export type Permission =
  | "complaint:read"
  | "complaint:write"
  | "content:write"
  | "reservation:read"
  | "reservation:write"
  | "reservation:assign"
  | "reservation:approve"
  | "inventory:manage"
  | "admin:users";

export type Role = "viewer" | "editor" | "approver" | "admin";

export const ROLE_VALUES: readonly Role[] = ["viewer", "editor", "approver", "admin"] as const;

export const ROLE_LABELS: Record<Role, string> = {
  viewer: "Solo lectura",
  editor: "Edición operativa",
  approver: "Aprobación",
  admin: "Administrador",
};

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  viewer: ["reservation:read", "complaint:read"],
  editor: ["reservation:read", "reservation:write", "reservation:assign", "complaint:read", "complaint:write", "content:write"],
  approver: [
    "complaint:read",
    "complaint:write",
    "content:write",
    "reservation:read",
    "reservation:write",
    "reservation:assign",
    "reservation:approve",
  ],
  admin: [
    "complaint:read",
    "complaint:write",
    "content:write",
    "reservation:read",
    "reservation:write",
    "reservation:assign",
    "reservation:approve",
    "inventory:manage",
    "admin:users",
  ],
};

export function isRole(value: string): value is Role {
  return value in ROLE_PERMISSIONS;
}

export function sanitizeRoles(roles: readonly string[]): Role[] {
  return roles.filter((role): role is Role => isRole(role));
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
