import Link from "next/link";

import { ReservationMetricCards } from "@/app/admin/reservations/reservation-metric-cards";
import styles from "@/app/admin/reservations/reservations.module.css";
import { requireAdminPageAccess } from "@/app/admin/require-admin-page-access";
import { backofficeAuthStore } from "@/lib/backoffice-auth/store";
import { ROLE_LABELS, type Role } from "@/lib/rbac";

export const dynamic = "force-dynamic";

function roleTone(role: Role) {
  switch (role) {
    case "viewer":
      return styles.statusConfirmed;
    case "editor":
      return styles.paymentPending;
    case "approver":
      return styles.paymentPartial;
    case "admin":
      return styles.statusPaid;
    default:
      return styles.statusConfirmed;
  }
}

function formatTimestamp(value?: string | null) {
  if (!value) return "Sin ingreso";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function AdminUsersPage() {
  await requireAdminPageAccess("/admin/users", "admin:users");
  const items = await backofficeAuthStore.listUsers();

  const activeUsers = items.filter((item) => item.active).length;
  const inactiveUsers = items.length - activeUsers;
  const adminUsers = items.filter((item) => item.active && item.roles.includes("admin")).length;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Wakaya · acceso interno</p>
          <h1 className={styles.title}>Usuarios internos</h1>
          <p className={styles.lead}>
            Gestión persistida de accesos, roles y estado del equipo operativo sin mezclar permisos dentro de la bandeja diaria.
          </p>

          <div className={styles.heroActions}>
            <Link className={styles.button} href={"/admin/users/new" as never}>
              Nuevo usuario
            </Link>
          </div>

          <ReservationMetricCards
            items={[
              {
                key: "total",
                label: "Usuarios visibles",
                value: items.length,
                tone: "info",
                meta: "Base interna",
              },
              {
                key: "active",
                label: "Activos",
                value: activeUsers,
                tone: activeUsers > 0 ? "success" : "warning",
                meta: activeUsers > 0 ? "Con acceso" : "Sin operadores",
              },
              {
                key: "inactive",
                label: "Inactivos",
                value: inactiveUsers,
                tone: inactiveUsers > 0 ? "warning" : "success",
                meta: inactiveUsers > 0 ? "Revisar" : "Limpio",
              },
              {
                key: "admins",
                label: "Admins activos",
                value: adminUsers,
                tone: adminUsers > 0 ? "success" : "critical",
                meta: adminUsers > 0 ? "Cobertura" : "Riesgo",
              },
            ]}
          />
        </header>

        <section className={styles.section}>
          <div className={styles.tableCard}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>Roster persistido</h2>
                <p className={styles.cardCopy}>
                  Cada usuario conserva correo, roles y estado activo en la misma capa persistida del back office.
                </p>
              </div>
            </div>

            {items.length === 0 ? (
              <div className={styles.emptyStateInline}>
                <strong>No hay usuarios internos cargados.</strong>
                <span>Crea el primer operador para distribuir el trabajo del panel.</span>
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Roles</th>
                      <th>Estado</th>
                      <th>Último ingreso</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className={styles.rowMain}>{item.name}</div>
                          <div className={styles.muted}>{item.email}</div>
                        </td>
                        <td>
                          <div className={styles.legendGrid}>
                            {item.roles.map((role) => (
                              <span key={`${item.id}:${role}`} className={`${styles.badge} ${roleTone(role as Role)}`}>
                                {role}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span className={`${styles.badge} ${item.active ? styles.statusConfirmed : styles.statusCancelled}`}>
                            {item.active ? "Activa" : "Inactiva"}
                          </span>
                        </td>
                        <td>{formatTimestamp(item.lastLoginAt)}</td>
                        <td>
                          <div className={styles.inlineActionRow}>
                            <Link className={styles.button} href={`/admin/users/${item.id}` as never}>
                              Editar usuario
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
