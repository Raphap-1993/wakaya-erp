import type { ReservationListItem } from "@/lib/reservations/store";
import type {
  Bungalow,
  ReservationAudit,
  ReservationPaymentStatus,
  ReservationStatus,
} from "@/lib/reservations/types";
import { addDays, compareDateOnly } from "@/lib/reservations/date-utils";
import { canPerformAction } from "@/lib/reservations/state-machine";

export type OccupancyCellState = "free" | "occupied" | "blocked" | "attention-needed";

export type OccupancyAction = "confirm" | "assign" | "check_in" | "check_out" | "mark_paid" | "cancel" | "mark_no_show";

export interface OccupancyDay {
  date: string;
  label: string;
  weekday: string;
}

export interface OccupancyMonthWeek {
  anchorDate: string;
  weekLabel: string;
  rangeLabel: string;
}

export interface OccupancyCell {
  key: string;
  bungalowId: string;
  date: string;
  state: OccupancyCellState;
  reservations: ReservationListItem[];
  primaryReservation: ReservationListItem | null;
}

export interface OccupancyRow {
  bungalow: Bungalow;
  cells: OccupancyCell[];
}

export interface OccupancySelection {
  bungalowId: string;
  date: string;
  reservationId: string | null;
}

export interface OccupancyModel {
  anchorDate: string;
  weekLabel: string;
  days: OccupancyDay[];
  rows: OccupancyRow[];
  selected: OccupancySelection | null;
}

export type OccupancyGroup = Record<string, Record<string, OccupancyCell>>;

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTH_LABELS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];
const MONTH_SHORT_LABELS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function isDateOnly(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function normalizeDateOnly(value?: string): string | null {
  if (!value || !isDateOnly(value)) {
    return null;
  }
  return value;
}

export function getCurrentWeekAnchor(): string {
  const today = new Date();
  const day = today.getUTCDay() || 7;
  today.setUTCDate(today.getUTCDate() - day + 1);
  return today.toISOString().slice(0, 10);
}

export function getCurrentIsoWeekLabel(): string {
  return formatIsoWeekLabel(getCurrentWeekAnchor());
}

export function isoWeekToMonday(week: string): string | null {
  const match = /^(\d{4})-W(\d{2})$/.exec(week);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const weekNumber = Number(match[2]);
  if (!Number.isInteger(year) || !Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > 53) {
    return null;
  }

  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setUTCDate(jan4.getUTCDate() - jan4Day + 1);
  mondayWeek1.setUTCHours(0, 0, 0, 0);
  mondayWeek1.setUTCDate(mondayWeek1.getUTCDate() + (weekNumber - 1) * 7);

  return mondayWeek1.toISOString().slice(0, 10);
}

export function getMondayForDate(date: string): string | null {
  if (!isDateOnly(date)) {
    return null;
  }

  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const day = parsed.getUTCDay() || 7;
  parsed.setUTCDate(parsed.getUTCDate() - day + 1);
  return parsed.toISOString().slice(0, 10);
}

function getMonthStart(date: string): string {
  if (!isDateOnly(date)) {
    return getCurrentWeekAnchor();
  }

  return `${date.slice(0, 7)}-01`;
}

function getMonthEnd(date: string): string {
  if (!isDateOnly(date)) {
    return getCurrentWeekAnchor();
  }

  const parsed = new Date(`${date.slice(0, 7)}-01T00:00:00.000Z`);
  parsed.setUTCMonth(parsed.getUTCMonth() + 1, 0);
  return parsed.toISOString().slice(0, 10);
}

function formatDateShortLabel(date: string): string {
  if (!isDateOnly(date)) {
    return date;
  }

  const monthIndex = Number(date.slice(5, 7)) - 1;
  return `${date.slice(8, 10)} ${MONTH_SHORT_LABELS[monthIndex] ?? date.slice(5, 7)}`;
}

export function formatMonthYearLabel(date: string): string {
  if (!isDateOnly(date)) {
    return date;
  }

  const monthIndex = Number(date.slice(5, 7)) - 1;
  return `${MONTH_LABELS[monthIndex] ?? date.slice(5, 7)} de ${date.slice(0, 4)}`;
}

export function buildMonthWeekOptions(anchorDate: string): OccupancyMonthWeek[] {
  const monthStart = getMonthStart(anchorDate);
  const monthEnd = getMonthEnd(anchorDate);
  const firstAnchor = getMondayForDate(monthStart) ?? monthStart;
  const lastAnchor = getMondayForDate(monthEnd) ?? monthEnd;
  const options: OccupancyMonthWeek[] = [];

  for (let current = firstAnchor; compareDateOnly(current, lastAnchor) <= 0; current = addDays(current, 7)) {
    options.push({
      anchorDate: current,
      weekLabel: formatIsoWeekLabel(current),
      rangeLabel: `${formatDateShortLabel(current)} - ${formatDateShortLabel(addDays(current, 6))}`,
    });
  }

  return options;
}

export function resolveWeekAnchor(week?: string, date?: string): string {
  return isoWeekToMonday(week ?? "") ?? getMondayForDate(date ?? "") ?? getCurrentWeekAnchor();
}

export function getIsoWeekDates(anchor: string): string[] {
  const anchorDate = isoWeekToMonday(anchor) ?? getMondayForDate(anchor) ?? getCurrentWeekAnchor();
  return Array.from({ length: 7 }, (_, index) => addDays(anchorDate, index));
}

export function buildWeekDays(anchorDate: string): OccupancyDay[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(anchorDate, index);
    const weekdayIndex = index % WEEKDAY_LABELS.length;
    return {
      date,
      label: date.slice(8, 10),
      weekday: WEEKDAY_LABELS[weekdayIndex] ?? "",
    };
  });
}

function isActiveReservation(status: ReservationStatus): boolean {
  return !["cancelled", "no_show"].includes(status);
}

function isAttentionNeeded(item: ReservationListItem): boolean {
  return (
    item.status === "pending_review" ||
    item.status === "ota_imported_confirmed" ||
    (item.paymentStatus === "pending" && (item.amountTotalCents ?? 0) > 0) ||
    item.paymentStatus === "partial"
  );
}

export function deriveCellState(reservations: ReservationListItem[]): OccupancyCellState {
  if (reservations.length === 0) {
    return "free";
  }
  if (reservations.length > 1) {
    return "blocked";
  }
  return isAttentionNeeded(reservations[0]) ? "attention-needed" : "occupied";
}

export function groupOccupancyByBungalowAndDate(
  items: ReservationListItem[],
  weekDates: string[],
): OccupancyGroup {
  const grouped: OccupancyGroup = {};

  for (const item of items) {
    if (!item.bungalowId) {
      continue;
    }
    if (!grouped[item.bungalowId]) {
      grouped[item.bungalowId] = {};
    }

    for (const date of weekDates) {
      if (compareDateOnly(item.startDate, date) <= 0 && compareDateOnly(item.endDate, date) >= 0 && isActiveReservation(item.status)) {
        const bucket = grouped[item.bungalowId][date] ?? {
          key: `${item.bungalowId}:${date}`,
          bungalowId: item.bungalowId,
          date,
          state: "free" as OccupancyCellState,
          reservations: [],
          primaryReservation: null,
        };
        bucket.reservations.push(item);
        bucket.primaryReservation = bucket.primaryReservation ?? item;
        grouped[item.bungalowId][date] = bucket;
      }
    }
  }

  for (const bungalowId of Object.keys(grouped)) {
    for (const date of weekDates) {
      const cell = grouped[bungalowId][date];
      if (cell) {
        cell.state = deriveCellState(cell.reservations);
      }
    }
  }

  return grouped;
}

export function buildOccupancyModel(
  items: ReservationListItem[],
  bungalows: Bungalow[],
  query: { week?: string; date?: string; selected?: string },
): OccupancyModel {
  const anchorDate = resolveWeekAnchor(query.week, query.date);
  const weekDates = getIsoWeekDates(anchorDate);
  const days = buildWeekDays(anchorDate);
  const grouped = groupOccupancyByBungalowAndDate(items, weekDates);

  const rows = bungalows.map((bungalow) => {
    const cells = days.map((day) => {
      const cell = grouped[bungalow.id]?.[day.date];
      return (
        cell ?? {
          key: `${bungalow.id}:${day.date}`,
          bungalowId: bungalow.id,
          date: day.date,
          state: "free" as OccupancyCellState,
          reservations: [],
          primaryReservation: null,
        }
      );
    });

    return { bungalow, cells };
  });

  const selectedCellByKey =
    query.selected ? rows.flatMap((row) => row.cells).find((cell) => cell.key === query.selected) ?? null : null;
  const selectedReservation = selectedCellByKey ? null : query.selected ? items.find((item) => item.id === query.selected) ?? null : null;
  const selectedDate = normalizeDateOnly(query.date) ?? selectedCellByKey?.date ?? selectedReservation?.startDate ?? null;
  const selectedCell =
    selectedCellByKey ??
    (selectedReservation && selectedReservation.bungalowId && selectedDate
      ? rows
          .find((row) => row.bungalow.id === selectedReservation.bungalowId)
          ?.cells.find((cell) => cell.date === selectedDate && cell.reservations.some((item) => item.id === selectedReservation.id)) ??
        null
      : null);

  return {
    anchorDate,
    weekLabel: formatIsoWeekLabel(anchorDate),
    days,
    rows,
    selected: selectedCell
      ? {
          bungalowId: selectedCell.bungalowId,
          date: selectedCell.date,
          reservationId: selectedCell.primaryReservation?.id ?? null,
        }
      : selectedReservation
        ? {
            bungalowId: selectedReservation.bungalowId ?? "",
            date: selectedReservation.startDate,
            reservationId: selectedReservation.id,
          }
        : null,
  };
}

function statePriority(state: OccupancyCellState): number {
  switch (state) {
    case "blocked":
      return 0;
    case "attention-needed":
      return 1;
    case "occupied":
      return 2;
    default:
      return 3;
  }
}

export function getDefaultOccupancyCell(rows: OccupancyRow[], preferredDate?: string): OccupancyCell | null {
  const cells = rows.flatMap((row) => row.cells);
  if (preferredDate) {
    const matchingDate = cells
      .filter((cell) => cell.date === preferredDate)
      .sort((left, right) => statePriority(left.state) - statePriority(right.state));
    if (matchingDate.length > 0) {
      return matchingDate[0] ?? null;
    }
  }

  return cells.find((cell) => cell.state !== "free") ?? cells[0] ?? null;
}

export function getOccupancySelectionValue(cell: OccupancyCell | null): string | undefined {
  if (!cell) {
    return undefined;
  }

  return cell.reservations.length === 1 ? cell.primaryReservation?.id ?? cell.key : cell.key;
}

export function isOccupancyCellState(value: string | null | undefined): value is OccupancyCellState {
  return value === "free" || value === "occupied" || value === "blocked" || value === "attention-needed";
}

function getIsoWeek(date: string): number {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  const target = new Date(parsed.valueOf());
  const dayNumber = (parsed.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNumber + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const diff = target.valueOf() - firstThursday.valueOf();
  return 1 + Math.round(diff / 604800000);
}

function getIsoWeekYear(date: string): number {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  const target = new Date(parsed.valueOf());
  const dayNumber = (parsed.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNumber + 3);
  return target.getUTCFullYear();
}

export function formatIsoWeekLabel(anchorDate: string): string {
  return `${getIsoWeekYear(anchorDate)}-W${String(getIsoWeek(anchorDate)).padStart(2, "0")}`;
}

export function statusLabel(status: ReservationStatus): string {
  switch (status) {
    case "pending_review":
      return "Pendiente";
    case "ota_imported_confirmed":
      return "OTA";
    case "confirmed":
      return "Confirmada";
    case "assigned":
      return "Asignada";
    case "checked_in":
      return "Check-in";
    case "checked_out":
      return "Check-out";
    case "paid":
      return "Pagada";
    case "cancelled":
      return "Cancelada";
    case "no_show":
      return "No show";
    default:
      return status;
  }
}

export function paymentLabel(status: ReservationPaymentStatus | undefined): string {
  switch (status) {
    case "pending":
      return "Pendiente";
    case "partial":
      return "Parcial";
    case "paid":
      return "Pagado";
    default:
      return "Sin dato";
  }
}

export function auditSummary(audits: ReservationAudit[]): string {
  if (audits.length === 0) {
    return "Sin eventos registrados.";
  }
  const latest = audits[0];
  return `${audits.length} eventos. Último: ${latest.action} por ${latest.actorId}.`;
}

export function validOccupancyActions(item: ReservationListItem | null): OccupancyAction[] {
  if (!item) {
    return [];
  }

  return (["confirm", "assign", "check_in", "check_out", "mark_paid", "cancel", "mark_no_show"] as OccupancyAction[]).filter(
    (action) => canPerformAction(item.status, action),
  );
}
