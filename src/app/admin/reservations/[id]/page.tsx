import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "../reservations.module.css";
import { reservationStore } from "@/lib/reservations/store";
import { ReservationInfoChipsView } from "../reservation-info-chips-view";
import { MonitorDetailPanel } from "../reservations-monitor-detail-panel";
import { buildReservationsMonitorHref } from "../reservations-query";

async function readReservationId(params: { id: string } | Promise<{ id: string }>): Promise<string> {
  const resolved = await params;
  return resolved.id;
}

export default async function ReservationDetailPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const detail = await reservationStore.get(await readReservationId(params));
  if (!detail) {
    notFound();
  }

  const activeBungalows = (await reservationStore.listBungalows()).filter((bungalow) => bungalow.active);
  const paymentStatus = detail.paymentStatus ?? "pending";

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Wakaya · detalle de reserva</p>
            <h1 className={styles.title}>{detail.number}</h1>

            <ReservationInfoChipsView
              status={detail.status}
              paymentStatus={paymentStatus}
              channel={detail.channel}
              amountTotalCents={detail.amountTotalCents}
              amountPaidCents={detail.amountPaidCents}
              bungalowName={detail.bungalow?.name}
            />
          </div>

          <div className={styles.heroActions}>
            <Link className={`${styles.button} ${styles.buttonSecondary}`} href={`/admin/reservations/${detail.id}/edit` as never}>
              Editar reserva
            </Link>
            <Link
              className={`${styles.button} ${styles.buttonSecondary}`}
              href={buildReservationsMonitorHref({ selected: detail.id }) as never}
            >
              Volver al monitor
            </Link>
          </div>
        </div>

        <section className={styles.detailStack}>
          <MonitorDetailPanel
            activeItem={detail}
            bungalows={activeBungalows}
            permissions={{ canAssign: true, canApprove: true }}
          />
        </section>
      </div>
    </main>
  );
}
