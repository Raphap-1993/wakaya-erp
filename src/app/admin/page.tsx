import Link from "next/link";
import type { ComponentProps } from "react";

import { adminModulesForRoles } from "@/app/admin/admin-navigation";
import { ReservationMetricCards } from "@/app/admin/reservations/reservation-metric-cards";
import { formatMoneyCents } from "@/app/admin/reservations/reservations-monitor-shared";
import { permissionsForRoles } from "@/lib/rbac";
import { reservationStore } from "@/lib/reservations/store";

import { requireAdminPageAccess } from "./require-admin-page-access";
import styles from "./reservations/reservations.module.css";

export const dynamic = "force-dynamic";

type ModuleCard = {
  title: string;
  summary: string;
  href: string;
  badge: string;
  tone: "brand" | "mint" | "amber" | "rose" | "sky" | "slate";
};

const MODULE_CARD_MAP: Record<string, ModuleCard> = {
  "/admin": {
    title: "Dashboard operativo",
    summary: "Resumen persistido de cola, sync, saldo y permisos activos de la sesión interna.",
    href: "/admin",
    badge: "Control",
    tone: "brand",
  },
  "/admin/reservations": {
    title: "Reservas operativas",
    summary: "Monitor principal con estados, saldo, acciones y navegación hacia la ficha individual.",
    href: "/admin/reservations",
    badge: "Lista operativa",
    tone: "brand",
  },
  "/admin/bungalow-capacity": {
    title: "Cupos de bungalows",
    summary: "Totales físicos, reservas, bloqueos y disponibilidad por categoría y rango.",
    href: "/admin/bungalow-capacity",
    badge: "Cupos",
    tone: "sky",
  },
  "/admin/content": {
    title: "Centro editorial",
    summary: "Entrada única para Home, Experiencias, Galería y ficha pública de bungalows con media recortada y publicación estructurada.",
    href: "/admin/content",
    badge: "Contenido web",
    tone: "mint",
  },
  "/admin/reservations/requests": {
    title: "Solicitudes web",
    summary: "Cola de revisión humana con estado, sincronización del hilo y acceso a la gestión completa.",
    href: "/admin/reservations/requests",
    badge: "Inbox operativo",
    tone: "amber",
  },
  "/admin/complaints": {
    title: "Libro de reclamaciones",
    summary: "Bandeja pública de quejas y reclamos con constancia, contacto y detalle del servicio afectado.",
    href: "/admin/complaints",
    badge: "Atención al huésped",
    tone: "rose",
  },
  "/admin/reservations/occupancy": {
    title: "Ocupación",
    summary: "Vista semanal para detectar cruces, revisar asignaciones y verificar carga por bungalow.",
    href: "/admin/reservations/occupancy",
    badge: "Semanal",
    tone: "sky",
  },
  "/admin/reservations/flows": {
    title: "Flujos",
    summary: "Mapa operativo para ingreso, confirmación, estadía, caja y trazabilidad del equipo.",
    href: "/admin/reservations/flows",
    badge: "E2E",
    tone: "slate",
  },
  "/admin/users": {
    title: "Usuarios internos",
    summary: "Gestión persistida de accesos, roles, estado activo y trazabilidad básica del equipo.",
    href: "/admin/users",
    badge: "Auth / RBAC",
    tone: "sky",
  },
};

function buildModuleCards(roles: readonly string[]): ModuleCard[] {
  return adminModulesForRoles(roles)
    .map((module) => MODULE_CARD_MAP[module.href])
    .filter((module): module is ModuleCard => Boolean(module))
    .filter((module) => module.href !== "/admin");
}

export default async function AdminDashboardPage() {
  const auth = await requireAdminPageAccess("/admin", "reservation:read");
  const [reservations, bookingRequests] = await Promise.all([
    reservationStore.list(),
    reservationStore.listBookingRequests(),
  ]);

  const pendingRequests = bookingRequests.filter((item) => item.status !== "converted_to_reservation").length;
  const degradedSync = bookingRequests.filter((item) => item.syncStatus === "degraded").length;
  const pendingReview = reservations.filter((item) => item.status === "pending_review").length;
  const activeStays = reservations.filter((item) => item.status === "checked_in").length;
  const balanceDueCents = reservations.reduce(
    (sum, item) => sum + Math.max((item.amountTotalCents ?? 0) - (item.amountPaidCents ?? 0), 0),
    0,
  );
  const userEmail =
    typeof auth.claims?.email === "string" && auth.claims.email.length > 0
      ? auth.claims.email
      : auth.subject ?? "sesión interna";
  const permissions = permissionsForRoles(auth.roles);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Wakaya · panel operativo</p>
          <h1 className={styles.title}>Panel operativo</h1>
          <p className={styles.lead}>
            Backoffice compacto para ingreso, revisión, confirmación y seguimiento de reservas sin mezclar la cola operativa con los detalles profundos.
          </p>

          <div className={styles.heroActions}>
            <span className={`${styles.badge} ${styles.statusConfirmed}`}>{userEmail}</span>
            <span className={`${styles.badge} ${styles.paymentPending}`}>Rol: {auth.roles.join(", ")}</span>
          </div>

          <ReservationMetricCards
            items={[
              {
                key: "pending-requests",
                label: "Solicitudes pendientes",
                value: pendingRequests,
                tone: pendingRequests > 0 ? "warning" : "success",
                meta: pendingRequests > 0 ? "Seguimiento" : "Bandeja limpia",
              },
              {
                key: "degraded-sync",
                label: "Sync degradado",
                value: degradedSync,
                tone: degradedSync > 0 ? "critical" : "success",
                meta: degradedSync > 0 ? "Atención inmediata" : "Estable",
              },
              {
                key: "pending-review",
                label: "Reservas en revisión",
                value: pendingReview,
                tone: pendingReview > 0 ? "warning" : "success",
                meta: pendingReview > 0 ? "Seguimiento" : "Al día",
              },
              {
                key: "active-stays",
                label: "Estadías activas",
                value: activeStays,
                tone: activeStays > 0 ? "success" : "neutral",
                meta: activeStays > 0 ? "En curso" : "Sin huéspedes",
              },
              {
                key: "balance",
                label: "Saldo pendiente",
                value: formatMoneyCents(balanceDueCents),
                tone: balanceDueCents > 0 ? "warning" : "success",
                meta: balanceDueCents > 0 ? "Por cobrar" : "Cerrado",
              },
            ]}
          />

          <div className={styles.detailSummary}>
            <span className={styles.fieldLabel}>Permisos activos</span>
            <div className={styles.legendGrid}>
              {permissions.map((permission) => (
                <span key={permission} className={`${styles.badge} ${styles.statusConfirmed}`}>
                  {permission}
                </span>
              ))}
            </div>
          </div>
        </header>

        <section className={styles.section}>
          <div className={styles.sectionCard}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>Módulos reales</h2>
                <p className={styles.cardCopy}>
                  Solo se muestran superficies que hoy existen y sirven para operar el MVP.
                </p>
              </div>
            </div>

            <div className={styles.flowGrid}>
              {buildModuleCards(auth.roles).map((module) => (
                <article
                  key={module.href}
                  className={`${styles.flowCard} ${styles[`flowCard${module.tone[0].toUpperCase()}${module.tone.slice(1)}` as keyof typeof styles]}`.trim()}
                  data-module-tone={module.tone}
                >
                  <div className={styles.flowHeader}>
                    <div>
                      <p className={styles.flowTag}>{module.badge}</p>
                      <h3 className={styles.flowTitle}>{module.title}</h3>
                    </div>
                  </div>

                  <p className={styles.flowSummary}>{module.summary}</p>

                  <div className={styles.heroActions}>
                    <Link
                      className={styles.button}
                      href={module.href as ComponentProps<typeof Link>["href"]}
                    >
                      Abrir módulo
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
