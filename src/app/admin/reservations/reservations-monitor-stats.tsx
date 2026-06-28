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
        { key: "total", label: "Reservas visibles", value: total },
        { key: "pending", label: "Pendientes", value: pending },
        { key: "balance", label: "Con saldo", value: withBalance },
        { key: "paid", label: "Pagadas", value: paid },
        { key: "due", label: "Saldo total", value: formatMoneyCents(balanceDueCents) },
      ]}
    />
  );
}
