import { formatMoneyCents } from "./reservations-monitor-shared";
import { ReservationMetricCards } from "./reservation-metric-cards";

export function MonitorStats({
  total,
  pending,
  withBalance,
  paid,
  balanceDueCents,
}: {
  total: number;
  pending: number;
  withBalance: number;
  paid: number;
  balanceDueCents: number;
}) {
  return (
    <ReservationMetricCards
      items={[
        { key: "total", label: "Reservas visibles", value: total, tone: "info", meta: "Vista operativa" },
        {
          key: "pending",
          label: "Pendientes",
          value: pending,
          tone: pending > 0 ? "warning" : "success",
          meta: pending > 0 ? "Seguimiento" : "Al día",
        },
        {
          key: "balance",
          label: "Con saldo",
          value: withBalance,
          tone: withBalance > 0 ? "warning" : "success",
          meta: withBalance > 0 ? "Cobranza" : "Saldado",
        },
        {
          key: "paid",
          label: "Pagadas",
          value: paid,
          tone: paid > 0 ? "success" : "neutral",
          meta: paid > 0 ? "Cerradas" : "Sin cierres",
        },
        {
          key: "due",
          label: "Saldo total",
          value: formatMoneyCents(balanceDueCents),
          tone: balanceDueCents > 0 ? "warning" : "success",
          meta: balanceDueCents > 0 ? "Por cobrar" : "Cerrado",
        },
      ]}
    />
  );
}
