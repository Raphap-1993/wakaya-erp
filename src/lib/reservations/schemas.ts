import { z } from "zod";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "invalid_date")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)), "invalid_date");

function blankToUndefined(value: unknown) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function blankToNull(value: unknown) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export const bookingRequestCreateSchema = z
  .object({
    guestName: z.string().trim().min(1, "required"),
    guestEmail: z.string().trim().email("invalid_email"),
    guestPhone: z.preprocess(blankToUndefined, z.string().min(7, "required").optional()),
    requestedCheckIn: isoDate,
    requestedCheckOut: isoDate,
    requestedGuests: z.coerce.number().int().positive(),
    requestedBungalowType: z.preprocess(blankToNull, z.string().min(1, "required").nullable().optional()),
    notes: z.preprocess(blankToUndefined, z.string().max(1000).optional()),
  })
  .refine((value) => value.requestedCheckIn <= value.requestedCheckOut, {
    message: "invalid_range",
    path: ["requestedCheckOut"],
  });

export const reservationCreateSchema = z
  .object({
    number: z.string().trim().min(1, "required"),
    channel: z.enum(["web", "ota"]),
    bungalowId: z.string().trim().min(1, "required"),
    responsibleId: z.union([z.string().trim().min(1), z.null()]).optional(),
    startDate: isoDate,
    endDate: isoDate,
    amountTotalCents: z.number().int().nonnegative().optional(),
    amountPaidCents: z.number().int().nonnegative().optional(),
  })
  .refine((value) => value.startDate <= value.endDate, {
    message: "invalid_range",
    path: ["endDate"],
  });

export const reservationAssignSchema = z.object({
  bungalowId: z.string().trim().min(1, "required"),
  actorId: z.string().trim().min(1).optional(),
  reason: z.string().trim().min(1, "required"),
});

export const reservationStatusSchema = z.object({
  action: z.enum(["confirm", "assign", "check_in", "check_out", "mark_paid", "cancel", "mark_no_show"]),
  actorId: z.string().trim().min(1).optional(),
  reason: z.string().trim().min(1, "required"),
});

export const reservationPaymentSchema = z.object({
  amountPaidCents: z.coerce.number().int().positive("required"),
  actorId: z.string().trim().min(1).optional(),
  reason: z.string().trim().min(1, "required"),
});

export type BookingRequestCreatePayload = z.infer<typeof bookingRequestCreateSchema>;
export type ReservationCreatePayload = z.infer<typeof reservationCreateSchema>;
export type ReservationAssignPayload = z.infer<typeof reservationAssignSchema>;
export type ReservationStatusPayload = z.infer<typeof reservationStatusSchema>;
export type ReservationPaymentPayload = z.infer<typeof reservationPaymentSchema>;
