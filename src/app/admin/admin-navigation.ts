export const ADMIN_MODULES = [
  { href: "/admin/reservations", label: "Reservas", icon: "reservations" },
  { href: "/admin/reservations/occupancy", label: "Ocupación", icon: "occupancy" },
  { href: "/admin/payments", label: "Pagos", icon: "payments" },
  { href: "/admin/reports", label: "Reportes", icon: "reports" },
  { href: "/admin/settings", label: "Configuración", icon: "settings" },
] as const;

export type AdminModule = (typeof ADMIN_MODULES)[number];
