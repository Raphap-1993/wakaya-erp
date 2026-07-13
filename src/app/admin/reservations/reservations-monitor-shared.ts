import type { ReservationPaymentStatus, ReservationStatus } from "@/lib/reservations/types";
import { hasPermission } from "@/lib/rbac";

export type MonitorFilterState = {
  status: string;
  channel: string;
};

export type MonitorPermissions = {
  canWrite: boolean;
  canAssign: boolean;
  canApprove: boolean;
};

export function buildMonitorPermissions(roles: readonly string[]): MonitorPermissions {
  return {
    canWrite: hasPermission(roles, "reservation:write"),
    canAssign: hasPermission(roles, "reservation:assign"),
    canApprove: hasPermission(roles, "reservation:approve"),
  };
}

export const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending_review: "Pendiente de revisión",
  ota_imported_confirmed: "OTA preaprobada",
  confirmed: "Confirmada",
  assigned: "Asignada",
  checked_in: "Check-in",
  checked_out: "Check-out",
  paid: "Pagada",
  cancelled: "Cancelada",
  no_show: "No show",
};

export const PAYMENT_STATUS_LABELS: Record<ReservationPaymentStatus, string> = {
  pending: "Pendiente",
  partial: "Parcial",
  paid: "Pagado",
};

export function paymentTone(paymentStatus: ReservationPaymentStatus): string {
  switch (paymentStatus) {
    case "pending":
      return "paymentPending";
    case "partial":
      return "paymentPartial";
    case "paid":
      return "paymentPaid";
    default:
      return "paymentPending";
  }
}

export const STATUS_FILTERS: Array<{ label: string; value: string }> = [
  { label: "Todas", value: "" },
  { label: "Pendientes", value: "pending_review" },
  { label: "OTA", value: "ota_imported_confirmed" },
  { label: "Confirmadas", value: "confirmed" },
  { label: "Asignadas", value: "assigned" },
  { label: "Check-in", value: "checked_in" },
  { label: "Check-out", value: "checked_out" },
  { label: "Pagadas", value: "paid" },
];

export const CHANNEL_FILTERS: Array<{ label: string; value: string }> = [
  { label: "Todos", value: "" },
  { label: "Web", value: "web" },
  { label: "OTA", value: "ota" },
];

export function statusTone(status: ReservationStatus): string {
  switch (status) {
    case "pending_review":
    case "ota_imported_confirmed":
      return "statusPendingReview";
    case "confirmed":
    case "assigned":
    case "checked_in":
      return "statusConfirmed";
    case "checked_out":
    case "paid":
      return "statusPaid";
    case "cancelled":
    case "no_show":
      return "statusCancelled";
    default:
      return "";
  }
}

export function formatMoneyCents(value: number, currency = "PEN"): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}
