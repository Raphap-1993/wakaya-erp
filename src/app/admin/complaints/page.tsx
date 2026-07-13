import Link from "next/link";
import type { ComponentProps } from "react";

import { ReservationMetricCards } from "@/app/admin/reservations/reservation-metric-cards";
import styles from "@/app/admin/reservations/reservations.module.css";
import { reservationStore } from "@/lib/reservations/store";

import { requireAdminPageAccess } from "../require-admin-page-access";

export const dynamic = "force-dynamic";

function statusLabel(status: string) {
  switch (status) {
    case "submitted":
      return "Recibido";
    case "in_review":
      return "En revisión";
    case "resolved":
      return "Resuelto";
    case "closed":
      return "Cerrado";
    default:
      return status;
  }
}

function statusTone(status: string) {
  switch (status) {
    case "submitted":
      return styles.statusPendingReview;
    case "in_review":
      return styles.paymentPartial;
    case "resolved":
      return styles.statusConfirmed;
    case "closed":
      return styles.statusCheckedOut;
    default:
      return "";
  }
}

function serviceLabel(value: string | null) {
  switch (value) {
    case "lodging":
      return "Hospedaje";
    case "food":
      return "Alimentos";
    case "event":
      return "Eventos";
    case "transport":
      return "Transporte";
    case "other":
      return "Otro";
    default:
      return "Sin categoría";
  }
}

export default async function ComplaintsAdminPage() {
  await requireAdminPageAccess("/admin/complaints", "complaint:read");
  const items = await reservationStore.listComplaints();
  const claimCount = items.filter((item) => item.type === "reclamo").length;
  const complaintCount = items.filter((item) => item.type === "queja").length;
  const openCount = items.filter((item) => item.status === "submitted" || item.status === "in_review").length;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Wakaya · atención al huésped</p>
          <h1 className={styles.title}>Libro de reclamaciones</h1>
          <p className={styles.lead}>
            Bandeja pública para revisar reclamos y quejas registrados desde la web, con constancia,
            contacto y detalle del servicio afectado.
          </p>

          <ReservationMetricCards
            items={[
              {
                key: "total",
                label: "Casos visibles",
                value: items.length,
                tone: items.length > 0 ? "info" : "neutral",
                meta: items.length > 0 ? "Bandeja activa" : "Sin ingresos",
              },
              {
                key: "claims",
                label: "Reclamos",
                value: claimCount,
                tone: claimCount > 0 ? "warning" : "neutral",
                meta: claimCount > 0 ? "Requieren respuesta" : "Sin reclamos",
              },
              {
                key: "complaints",
                label: "Quejas",
                value: complaintCount,
                tone: complaintCount > 0 ? "info" : "neutral",
                meta: complaintCount > 0 ? "Escucha activa" : "Sin quejas",
              },
              {
                key: "open",
                label: "Pendientes",
                value: openCount,
                tone: openCount > 0 ? "critical" : "success",
                meta: openCount > 0 ? "Seguimiento" : "Al día",
              },
            ]}
          />
        </header>

        <section className={styles.section}>
          <div className={styles.tableCard}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>Inbox operativo</h2>
                <p className={styles.cardCopy}>
                  Cada caso conserva su constancia pública `LRC-AAAA-NNNN` para seguimiento interno y
                  respuesta al huésped.
                </p>
              </div>
            </div>

            {items.length > 0 ? (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Constancia</th>
                      <th>Tipo</th>
                      <th>Consumidor</th>
                      <th>Servicio</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className={styles.rowMain}>{item.publicCode}</div>
                          <div className={styles.muted}>{item.documentType.toUpperCase()} · {item.documentNumber}</div>
                        </td>
                        <td>
                          <span className={styles.badge}>
                            {item.type === "reclamo" ? "Reclamo" : "Queja"}
                          </span>
                        </td>
                        <td>
                          <div className={styles.rowMain}>{item.fullName}</div>
                          <div className={styles.muted}>{item.email}</div>
                        </td>
                        <td>
                          <div className={styles.rowMain}>{serviceLabel(item.serviceType)}</div>
                          <div className={styles.muted}>{item.contractedService ?? "Sin detalle adicional"}</div>
                        </td>
                        <td>
                          <span className={`${styles.badge} ${statusTone(item.status)}`.trim()}>
                            {statusLabel(item.status)}
                          </span>
                        </td>
                        <td>{new Date(item.createdAt).toLocaleDateString("es-PE")}</td>
                        <td>
                          <Link
                            className={styles.link}
                            href={`/admin/complaints/${item.id}` as ComponentProps<typeof Link>["href"]}
                          >
                            Ver detalle
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={styles.emptyStateInline}>
                <strong>No hay reclamos visibles.</strong>
                <span>Cuando lleguen casos desde la web, esta bandeja mostrará la cola pública del lodge.</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
