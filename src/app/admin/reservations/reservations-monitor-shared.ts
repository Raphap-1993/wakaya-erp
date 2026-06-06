import type { ReservationStatus } from "@/lib/reservations/types";

export type MonitorFilterState = {
  status: string;
  channel: string;
  responsibleId: string;
  date: string;
  startDate: string;
  endDate: string;
};

export type MonitorPermissions = {
  canAssign: boolean;
  canApprove: boolean;
};

export const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending_review: "Pending review",
  ota_imported_confirmed: "OTA imported confirmed",
  confirmed: "Confirmed",
  assigned: "Assigned",
  checked_in: "Checked in",
  checked_out: "Checked out",
  paid: "Paid",
  cancelled: "Cancelled",
  no_show: "No show",
};

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
