import Link from "next/link";

import { adminModulesForRoles } from "@/app/admin/admin-navigation";
import { requireAdminPageAccess } from "@/app/admin/require-admin-page-access";
import styles from "@/app/admin/reservations/reservations.module.css";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

function readSingleValue(value: string | string[] | undefined): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function sanitizeFromPath(value: string | null): string | null {
  if (!value || !value.startsWith("/admin") || value.startsWith("//")) {
    return null;
  }
  return value;
}

export default async function AdminForbiddenPage({ searchParams }: PageProps) {
  const auth = await requireAdminPageAccess("/admin/forbidden", "reservation:read");
  const resolvedSearchParams =
    await (searchParams ?? {});
  const from = sanitizeFromPath(readSingleValue(resolvedSearchParams.from));
  const visibleModules = adminModulesForRoles(auth.roles);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Wakaya · permisos internos</p>
          <h1 className={styles.title}>Acceso denegado</h1>
          <p className={styles.lead}>
            Tu sesión está activa, pero este módulo requiere un permiso que tu rol actual no tiene habilitado.
          </p>

          <div className={styles.heroActions}>
            <span className={`${styles.badge} ${styles.statusCancelled}`}>Permiso insuficiente</span>
            {from ? <span className={`${styles.badge} ${styles.paymentPending}`}>Origen: {from}</span> : null}
          </div>
        </header>

        <section className={styles.section}>
          <div className={styles.sectionCard}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>Qué puedes hacer ahora</h2>
                <p className={styles.cardCopy}>
                  Usa uno de los módulos que sí están habilitados para tu sesión o solicita elevación de permisos si esta tarea es parte de tu operación.
                </p>
              </div>
            </div>

            <div className={styles.flowGrid}>
              {visibleModules.map((module) => (
                <article key={module.href} className={styles.flowCard}>
                  <div className={styles.flowHeader}>
                    <div>
                      <p className={styles.flowTag}>Disponible</p>
                      <h3 className={styles.flowTitle}>{module.label}</h3>
                    </div>
                  </div>

                  <div className={styles.heroActions}>
                    <Link className={styles.button} href={module.href as never}>
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
