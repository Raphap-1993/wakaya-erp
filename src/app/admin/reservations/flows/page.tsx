import Link from "next/link";
import type { ComponentProps } from "react";
import { reservationStore } from "@/lib/reservations/store";
import { requireAdminPageAccess } from "@/app/admin/require-admin-page-access";
import { ReservationMetricCards } from "@/app/admin/reservations/reservation-metric-cards";
import { buildMonitorPermissions } from "@/app/admin/reservations/reservations-monitor-shared";
import styles from "../reservations.module.css";

export const dynamic = "force-dynamic";

type FlowThread = {
  id: string;
  title: string;
  status: string;
  summary: string;
  steps: string[];
  links: Array<{ label: string; href: string; primary?: boolean }>;
};

function getSampleReservationId(items: Awaited<ReturnType<typeof reservationStore.list>>, preferredStatus?: string): string | null {
  if (preferredStatus) {
    const match = items.find((item) => item.status === preferredStatus);
    if (match) return match.id;
  }

  return items[0]?.id ?? null;
}

export default async function ReservationFlowsPage() {
  const auth = await requireAdminPageAccess("/admin/reservations/flows", "reservation:read");
  const permissions = buildMonitorPermissions(auth.roles);

  const items = await reservationStore.list();
  const pendingId = getSampleReservationId(items, "pending_review");
  const confirmedId = getSampleReservationId(items, "confirmed") ?? getSampleReservationId(items, "ota_imported_confirmed");
  const assignedId = getSampleReservationId(items, "assigned");
  const checkedInId = getSampleReservationId(items, "checked_in");

  const threads: FlowThread[] = [
    {
      id: "intake",
      title: "Hilo 1 · Ingreso y edición",
      status: "Crear / modificar",
      summary:
        "Cubre la recepción manual, la validación básica y la corrección de datos antes de confirmar la estancia.",
      steps: [
        "Nueva reserva manual",
        "Número de reserva automático o ingresado",
        "Selección de bungalow y fechas",
        "Edición inmediata tras crear",
      ],
      links: [
        ...(permissions.canWrite
          ? [{ label: "Abrir nueva reserva", href: "/admin/reservations/new", primary: true }]
          : []),
        ...(permissions.canWrite && pendingId
          ? [{ label: "Editar reserva pendiente", href: `/admin/reservations/${pendingId}/edit` }]
          : []),
      ],
    },
    {
      id: "confirm",
      title: "Hilo 2 · Confirmación y asignación",
      status: "Operación diaria",
      summary:
        "Representa el trabajo de recepción cuando una reserva entra, se valida y se deja lista para ocupación.",
      steps: [
        "Confirmar una reserva pendiente",
        "Asignar bungalow desde el monitor",
        "Abrir detalle operativo",
        "Ver el cambio en la ocupación semanal",
      ],
      links: [
        { label: "Abrir monitor de reservas", href: "/admin/reservations", primary: true },
        { label: "Ver ocupación semanal", href: "/admin/reservations/occupancy" },
        ...(confirmedId ? [{ label: "Abrir reserva confirmada", href: `/admin/reservations/${confirmedId}` }] : []),
        ...(pendingId ? [{ label: "Abrir reserva pendiente", href: `/admin/reservations/${pendingId}` }] : []),
      ],
    },
    {
      id: "stay",
      title: "Hilo 3 · Estancia y movimientos",
      status: "Check-in / check-out",
      summary:
        "Agrupa el paso por recepción durante la estadía: ingreso, salida, no-show y cambios operativos.",
      steps: [
        "Registrar check-in",
        "Registrar check-out",
        "Marcar no show cuando no llega el huésped",
        "Ver el impacto en el estado operativo",
      ],
      links: [
        ...(assignedId ? [{ label: "Abrir reserva asignada", href: `/admin/reservations/${assignedId}` , primary: true }] : []),
        ...(checkedInId ? [{ label: "Abrir reserva en estancia", href: `/admin/reservations/${checkedInId}` }] : []),
      ],
    },
      {
        id: "billing",
        title: "Hilo 4 · Caja y saldo",
        status: "Cobro y cierre",
      summary:
        "Cobertura de pagos parciales, registro de saldos y cierre administrativo cuando la reserva ya salió.",
      steps: [
        "Registrar pago parcial",
        "Registrar pago completo",
        "Calcular saldo pendiente",
        "Marcar pago final después del check-out",
      ],
      links: [
        { label: "Ver monitor financiero", href: "/admin/reservations", primary: true },
        { label: "Exportar reporte CSV", href: "/api/reservations/reports/financial?format=csv" },
      ],
    },
    {
      id: "control",
      title: "Hilo 5 · Control y auditoría",
      status: "Trazabilidad",
      summary:
        "Permite revisar por qué cambió una reserva, quién actuó y qué quedó bloqueado en ocupación.",
      steps: [
        "Abrir auditoría por reserva",
        "Cruzar el estado con la grilla de ocupación",
        "Inspeccionar filtros del monitor",
        "Revisar reporte financiero",
      ],
      links: [
        { label: "Ir al monitor", href: "/admin/reservations", primary: true },
        { label: "Ir a ocupación", href: "/admin/reservations/occupancy" },
      ],
    },
  ];

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Wakaya · roster operativo</p>
          <h1 className={styles.title}>Flujos diarios de reservas</h1>
          <p className={styles.lead}>
            Este tablero organiza el trabajo en hilos paralelos para cubrir el ciclo real de una
            reserva: ingreso, edición, confirmación, operación, caja y cierre.
          </p>

          <ReservationMetricCards
            items={[
              {
                key: "threads",
                label: "Hilos activos",
                value: threads.length,
                tone: "success",
                meta: "Cobertura operativa",
              },
              {
                key: "reservations",
                label: "Reservas activas",
                value: items.length,
                tone: items.length > 0 ? "info" : "neutral",
                meta: items.length > 0 ? "Con movimiento" : "Sin carga viva",
              },
              {
                key: "coverage",
                label: "Cobertura",
                value: "E2E",
                tone: "success",
                meta: "Ingreso a cierre",
              },
            ]}
          />

          <div className={styles.heroActions}>
            <Link className={styles.button} href="/admin/reservations">
              Abrir monitor
            </Link>
            <Link className={`${styles.button} ${styles.buttonSecondary}`} href="/admin/reservations/occupancy">
              Abrir ocupación
            </Link>
            {permissions.canWrite ? (
              <Link className={`${styles.button} ${styles.buttonSecondary}`} href="/admin/reservations/new">
                Nueva reserva
              </Link>
            ) : null}
          </div>
        </header>

        <section className={styles.section}>
          <div className={styles.sectionCard}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>Roster de hilos</h2>
                <p className={styles.cardCopy}>
                  Cada tarjeta resume el flujo, las pantallas involucradas y el recorrido esperado
                  para el equipo de operaciones.
                </p>
              </div>
            </div>

            <div className={styles.flowGrid}>
              {threads.map((thread) => (
                <article key={thread.id} className={styles.flowCard}>
                  <div className={styles.flowHeader}>
                    <div>
                      <p className={styles.flowTag}>{thread.status}</p>
                      <h3 className={styles.flowTitle}>{thread.title}</h3>
                    </div>
                  </div>

                  <p className={styles.flowSummary}>{thread.summary}</p>

                  <ul className={styles.flowList}>
                    {thread.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>

                  <div className={styles.buttonRow}>
                    {thread.links.map((link) => (
                      link.href.startsWith("/api/") ? (
                        <a
                          key={`${thread.id}:${link.href}:${link.label}`}
                          className={`${styles.button} ${link.primary ? "" : styles.buttonSecondary}`}
                          href={link.href}
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          key={`${thread.id}:${link.href}:${link.label}`}
                          className={`${styles.button} ${link.primary ? "" : styles.buttonSecondary}`}
                          href={link.href as ComponentProps<typeof Link>["href"]}
                        >
                          {link.label}
                        </Link>
                      )
                    ))}
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
