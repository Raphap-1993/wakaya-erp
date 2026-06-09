export const ADMIN_MODULES = [
  { href: "/admin/reservations", label: "Reservas" },
  { href: "/admin/reservations/occupancy", label: "Ocupación" },
  { href: "/admin/payments", label: "Pagos" },
  { href: "/admin/reports", label: "Reportes" },
  { href: "/admin/settings", label: "Configuración" },
] as const;

export type AdminModule = (typeof ADMIN_MODULES)[number];
