import Link from "next/link";
import { nextReservationNumber } from "@/lib/reservations/numbering";
import { reservationStore } from "@/lib/reservations/store";
import { requireAdminPageAccess } from "@/app/admin/require-admin-page-access";
import { ReservationEditorForm } from "../reservation-editor-form";
import { createReservationEditorValues } from "../reservation-editor-values";
import styles from "../reservations.module.css";

export const dynamic = "force-dynamic";

type NewReservationSearchParams = Partial<
  Record<"bungalowId" | "startDate" | "endDate" | "returnTo", string | string[] | undefined>
>;

function readQueryValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]?.trim() || undefined;
  }

  return value?.trim() || undefined;
}

function readDateValue(value: string | string[] | undefined): string | undefined {
  const normalized = readQueryValue(value);
  return normalized && /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : undefined;
}

function readInternalReturnTo(value: string | string[] | undefined): string | undefined {
  const normalized = readQueryValue(value);
  return normalized?.startsWith("/admin/") ? normalized : undefined;
}

export default async function NewReservationPage({
  searchParams,
}: {
  searchParams?: Promise<NewReservationSearchParams> | NewReservationSearchParams;
} = {}) {
  await requireAdminPageAccess("/admin/reservations/new", "reservation:write");
  const query = (await searchParams) ?? {};

  const [bungalows, reservations] = await Promise.all([
    reservationStore.listBungalows(),
    reservationStore.list(),
  ]);
  const activeBungalows = bungalows.filter((bungalow) => bungalow.active);
  const activeBungalowIds = new Set(activeBungalows.map((bungalow) => bungalow.id));
  const prefilledStartDate = readDateValue(query.startDate);
  const prefilledEndDate = readDateValue(query.endDate) ?? prefilledStartDate;
  const prefilledBungalowId = readQueryValue(query.bungalowId);
  const backHref = readInternalReturnTo(query.returnTo) ?? "/admin/reservations";

  if (activeBungalows.length === 0) {
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <section className={styles.hero}>
            <p className={styles.eyebrow}>Wakaya · alta manual</p>
            <h1 className={styles.title}>Nueva reserva manual</h1>
            <div className={styles.heroActions}>
              <Link className={`${styles.button} ${styles.buttonSecondary}`} href={backHref as never}>
                Volver al monitor
              </Link>
            </div>
          </section>

          <section className={styles.section}>
            <article className={styles.sectionCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>No hay bungalows activos configurados.</h2>
              </div>
              <div className={styles.emptyStateInline}>
                <strong>Carga el inventario real en PostgreSQL antes de abrir reservas manuales.</strong>
                <span>La pantalla evita crear reservas con catálogos incompletos para no romper la operación.</span>
              </div>
            </article>
          </section>
        </div>
      </main>
    );
  }

  const initialValues = {
    ...createReservationEditorValues(),
    number: nextReservationNumber(reservations),
    bungalowId: prefilledBungalowId && activeBungalowIds.has(prefilledBungalowId) ? prefilledBungalowId : "",
    startDate: prefilledStartDate ?? "",
    endDate: prefilledEndDate ?? "",
  };

  return (
    <ReservationEditorForm
      mode="create"
      actionHref="/api/reservations"
      backHref={backHref}
      bungalows={bungalows}
      initialValues={initialValues}
    />
  );
}
