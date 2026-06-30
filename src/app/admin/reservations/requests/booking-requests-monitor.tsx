import styles from "../reservations.module.css";
import type { BookingRequest } from "@/lib/reservations/types";
import { BookingRequestDetailPanel } from "./booking-request-detail-panel";

type Props = {
  items: BookingRequest[];
  selectedId: string | null;
};

export function BookingRequestsMonitor({ items, selectedId }: Props) {
  const activeItem = items.find((item) => item.id === selectedId) ?? items[0] ?? null;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Wakaya · solicitudes</p>
          <h1 className={styles.title}>Solicitudes web</h1>
          <p className={styles.lead}>
            Cola operativa para revisar solicitudes, continuar el hilo del cliente y confirmar la
            transferencia antes de crear la reserva real.
          </p>

          <div className={styles.stats}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Solicitudes visibles</span>
              <span className={styles.statValue}>{items.length}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Pendientes</span>
              <span className={styles.statValue}>
                {items.filter((item) => item.status !== "converted_to_reservation").length}
              </span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Alias operativo</span>
              <span className={styles.statValue}>reservas@</span>
            </div>
          </div>
        </header>

        <section className={styles.detailGrid}>
          <div className={styles.sectionCard}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>Inbox operativo</h2>
                <p className={styles.cardCopy}>
                  Cada tarjeta resume el estado de la solicitud y la siguiente acción del back office.
                </p>
              </div>
            </div>

            <div className={styles.flowGrid}>
              {items.map((item) => (
                <article key={item.id} className={styles.flowCard}>
                  <div className={styles.flowHeader}>
                    <div>
                      <p className={styles.flowTag}>{item.status}</p>
                      <h3 className={styles.flowTitle}>{item.publicRef}</h3>
                    </div>
                    <a className={`${styles.button} ${styles.buttonSecondary}`} href={`/admin/reservations/requests?selected=${item.id}`}>
                      Abrir
                    </a>
                  </div>

                  <p className={styles.flowSummary}>
                    {item.guestName} · {item.requestedCheckIn} a {item.requestedCheckOut}
                  </p>

                  <ul className={styles.flowList}>
                    <li>{item.guestEmail}</li>
                    <li>{item.requestedGuests} huésped(es)</li>
                    <li>{item.requestedBungalowType ?? "Sin categoría preferida"}</li>
                  </ul>
                </article>
              ))}
            </div>
          </div>

          <BookingRequestDetailPanel request={activeItem} />
        </section>
      </div>
    </main>
  );
}
