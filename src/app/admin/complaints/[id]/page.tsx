import Link from "next/link";
import { notFound } from "next/navigation";
import type { ComponentProps } from "react";

import styles from "@/app/admin/reservations/reservations.module.css";
import { reservationStore } from "@/lib/reservations/store";

import { requireAdminPageAccess } from "../../require-admin-page-access";

export const dynamic = "force-dynamic";

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

export default async function ComplaintDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await params;

  await requireAdminPageAccess(`/admin/complaints/${resolvedParams.id}`, "complaint:read");
  const complaint = await reservationStore.getComplaint(resolvedParams.id);

  if (!complaint) {
    notFound();
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Wakaya · caso público</p>
          <h1 className={styles.title}>{complaint.publicCode}</h1>
          <p className={styles.lead}>
            Revisa la información registrada por el huésped y responde dentro del plazo operativo del
            Libro de Reclamaciones.
          </p>

          <div className={styles.heroActions}>
            <Link
              className={`${styles.button} ${styles.buttonSecondary}`}
              href={"/admin/complaints" as ComponentProps<typeof Link>["href"]}
            >
              Volver a la bandeja
            </Link>
            <a className={styles.button} href={`mailto:${complaint.email}`}>
              Responder por correo
            </a>
          </div>
        </header>

        <section className={styles.section}>
          <div className={styles.detailGrid}>
            <article className={styles.sectionCard}>
              <div className={styles.cardHeader}>
                <div>
                  <h2 className={styles.cardTitle}>Datos del consumidor</h2>
                  <p className={styles.cardCopy}>Contacto y referencia para responder el caso.</p>
                </div>
              </div>

              <div className={styles.kvGrid}>
                <div className={styles.kv}>
                  <span className={styles.kvLabel}>Nombre</span>
                  <span className={styles.kvValue}>{complaint.fullName}</span>
                </div>
                <div className={styles.kv}>
                  <span className={styles.kvLabel}>Documento</span>
                  <span className={styles.kvValue}>
                    {complaint.documentType.toUpperCase()} · {complaint.documentNumber}
                  </span>
                </div>
                <div className={styles.kv}>
                  <span className={styles.kvLabel}>Correo</span>
                  <span className={styles.kvValue}>{complaint.email}</span>
                </div>
                <div className={styles.kv}>
                  <span className={styles.kvLabel}>Teléfono</span>
                  <span className={styles.kvValue}>{complaint.phone ?? "No consignado"}</span>
                </div>
                <div className={styles.kv}>
                  <span className={styles.kvLabel}>Dirección</span>
                  <span className={styles.kvValue}>{complaint.address ?? "No consignada"}</span>
                </div>
                <div className={styles.kv}>
                  <span className={styles.kvLabel}>Fecha de ingreso</span>
                  <span className={styles.kvValue}>
                    {new Date(complaint.createdAt).toLocaleString("es-PE")}
                  </span>
                </div>
              </div>
            </article>

            <article className={styles.sectionCard}>
              <div className={styles.cardHeader}>
                <div>
                  <h2 className={styles.cardTitle}>Detalle del servicio</h2>
                  <p className={styles.cardCopy}>Información declarada por el huésped en el formulario público.</p>
                </div>
              </div>

              <div className={styles.stack}>
                <div className={styles.kv}>
                  <span className={styles.kvLabel}>Tipo</span>
                  <span className={styles.kvValue}>
                    {complaint.type === "reclamo" ? "Reclamo" : "Queja"}
                  </span>
                </div>
                <div className={styles.kv}>
                  <span className={styles.kvLabel}>Categoría del servicio</span>
                  <span className={styles.kvValue}>{serviceLabel(complaint.serviceType)}</span>
                </div>
                <div className={styles.kv}>
                  <span className={styles.kvLabel}>Servicio contratado</span>
                  <span className={styles.kvValue}>{complaint.contractedService ?? "No consignado"}</span>
                </div>
                <div className={styles.kv}>
                  <span className={styles.kvLabel}>Qué ocurrió</span>
                  <span className={styles.kvValue}>{complaint.complaintDetail}</span>
                </div>
                <div className={styles.kv}>
                  <span className={styles.kvLabel}>Solicitud del consumidor</span>
                  <span className={styles.kvValue}>{complaint.consumerRequest}</span>
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
