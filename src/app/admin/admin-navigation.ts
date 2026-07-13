import { hasPermission, type Permission } from "@/lib/rbac";

export const ADMIN_MODULES = [
  { href: "/admin", label: "Dashboard", icon: "dashboard", permission: "reservation:read" },
  { href: "/admin/content", label: "Contenido público", icon: "dashboard", permission: "content:write" },
  { href: "/admin/reservations", label: "Reservas", icon: "reservations", permission: "reservation:read" },
  { href: "/admin/bungalow-capacity", label: "Cupos de bungalows", icon: "occupancy", permission: "inventory:manage" },
  {
    href: "/admin/reservations/requests",
    label: "Solicitudes web",
    icon: "reservations",
    permission: "reservation:read",
  },
  { href: "/admin/complaints", label: "Reclamos", icon: "reports", permission: "complaint:read" },
  { href: "/admin/reservations/occupancy", label: "Ocupación", icon: "occupancy", permission: "reservation:read" },
  { href: "/admin/reservations/flows", label: "Flujos", icon: "reports", permission: "reservation:read" },
  { href: "/admin/users", label: "Usuarios", icon: "users", permission: "admin:users" },
] as const;

export type AdminModule = (typeof ADMIN_MODULES)[number];

export function adminModulesForRoles(roles: readonly string[]): AdminModule[] {
  return ADMIN_MODULES.filter((module) => hasPermission(roles, module.permission as Permission));
}
