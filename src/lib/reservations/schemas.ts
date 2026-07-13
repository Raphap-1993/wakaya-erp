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

function checkboxToBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "on";
  }
  return value;
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
    requestedExperienceId: z.preprocess(blankToNull, z.string().trim().min(1, "required").nullable().optional()),
    notes: z.preprocess(blankToUndefined, z.string().max(1000).optional()),
  })
  .refine((value) => value.requestedCheckIn < value.requestedCheckOut, {
    message: "invalid_range",
    path: ["requestedCheckOut"],
  });

export const bookingRequestUpdateSchema = z
  .object({
    actorId: z.string().trim().min(1).optional(),
    requestedCheckIn: isoDate,
    requestedCheckOut: isoDate,
    requestedBungalowType: z.preprocess(blankToNull, z.string().min(1, "required").nullable().optional()),
    requestedExperienceId: z.preprocess(blankToNull, z.string().trim().min(1, "required").nullable().optional()),
    notes: z.preprocess(blankToNull, z.string().max(1000).nullable().optional()),
    reason: z.string().trim().min(1, "required"),
  })
  .refine((value) => value.requestedCheckIn < value.requestedCheckOut, {
    message: "invalid_range",
    path: ["requestedCheckOut"],
  });

export const bookingRequestOwnerSchema = z.object({
  ownerUserId: z.preprocess(blankToNull, z.string().trim().min(1, "required").nullable()),
});

export const otaConnectionSchema = z.object({
  accountLabel: z.string().trim().min(1, "required"),
  externalPropertyId: z.preprocess(blankToNull, z.string().trim().min(1).nullable().optional()),
  isActive: z.preprocess(checkboxToBoolean, z.boolean()).optional(),
  messagesEnabled: z.preprocess(checkboxToBoolean, z.boolean()).optional(),
  ariEnabled: z.preprocess(checkboxToBoolean, z.boolean()).optional(),
  recoveryEnabled: z.preprocess(checkboxToBoolean, z.boolean()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const otaRoomMappingSchema = z.object({
  externalRoomTypeCode: z.string().trim().min(1, "required"),
  bungalowId: z.preprocess(blankToNull, z.string().trim().min(1).nullable().optional()),
});

export const otaRatePlanMappingSchema = z.object({
  externalRatePlanCode: z.string().trim().min(1, "required"),
  internalRatePlanCode: z.preprocess(blankToNull, z.string().trim().min(1).nullable().optional()),
});

export const otaConflictResolutionSchema = z.object({
  notes: z.string().trim().min(1, "required"),
});

export const quickReplyTemplateSchema = z.object({
  key: z.string().trim().min(1, "required"),
  label: z.string().trim().min(1, "required"),
  category: z.string().trim().min(1, "required"),
  subjectMode: z.enum(["keep_thread_subject", "custom_subject"]),
  bodyText: z.string().trim().min(1, "required"),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().nonnegative("required"),
});

const complaintServiceTypeSchema = z.enum(["lodging", "food", "event", "transport", "other"]);

export const complaintCreateSchema = z
  .object({
    type: z.enum(["queja", "reclamo"]),
    fullName: z.string().trim().min(1, "required"),
    documentType: z.enum(["dni", "ce", "passport", "ruc", "other"]),
    documentNumber: z.string().trim().min(6, "required").max(20, "invalid_document_number"),
    email: z.string().trim().email("invalid_email"),
    phone: z.preprocess(blankToUndefined, z.string().trim().min(7, "required").max(20).optional()),
    address: z.preprocess(blankToUndefined, z.string().trim().min(5, "required").max(255).optional()),
    serviceType: z.preprocess(blankToNull, complaintServiceTypeSchema.nullable().optional()),
    contractedService: z.preprocess(blankToUndefined, z.string().trim().min(3, "required").max(255).optional()),
    complaintDetail: z.string().trim().min(10, "required").max(4000),
    consumerRequest: z.string().trim().min(5, "required").max(2000),
    acceptedDeclaration: z.preprocess(checkboxToBoolean, z.boolean()).refine((value) => value, "acceptance_required"),
  })
  .refine((value) => Boolean(value.serviceType || value.contractedService), {
    message: "service_required",
    path: ["serviceType"],
  });

export const reservationCreateSchema = z
  .object({
    number: z.string().trim().min(1, "required"),
    channel: z.enum(["web", "ota"]),
    bungalowId: z.string().trim().min(1, "required"),
    startDate: isoDate,
    endDate: isoDate,
    amountTotalCents: z.number().int().nonnegative().optional(),
    amountPaidCents: z.number().int().nonnegative().optional(),
  })
  .refine((value) => value.startDate < value.endDate, {
    message: "invalid_range",
    path: ["endDate"],
  });

export const reservationUpdateSchema = z
  .object({
    channel: z.enum(["web", "ota"]),
    bungalowId: z.string().trim().min(1, "required"),
    startDate: isoDate,
    endDate: isoDate,
    amountTotalCents: z.number().int().nonnegative().optional(),
    amountPaidCents: z.number().int().nonnegative().optional(),
  })
  .refine((value) => value.startDate < value.endDate, {
    message: "invalid_range",
    path: ["endDate"],
  });

export const reservationAssignSchema = z.object({
  bungalowId: z.string().trim().min(1, "required"),
  actorId: z.string().trim().min(1).optional(),
  reason: z.string().trim().min(1, "required"),
}).strict();

export const bungalowCreateSchema = z.object({
  code: z.string().trim().min(1, "invalid_bungalow_code"),
  name: z.string().trim().min(1, "invalid_bungalow_name"),
  active: z.boolean().optional().default(true),
  capacity: z.coerce.number().int().positive("invalid_bungalow_capacity"),
});

const bungalowPublicLocaleContentSchema = z.object({
  displayName: z.string().trim().min(1, "invalid_public_display_name"),
  displayEyebrow: z.string().trim().min(1, "invalid_public_display_eyebrow"),
  displayDescription: z.string().trim().min(1, "invalid_public_display_description"),
  displayTagline: z.string().trim().min(1, "invalid_public_display_tagline"),
  displayLongDescription: z.string().trim().min(1, "invalid_public_display_long_description"),
  displayHighlights: z.array(z.string().trim().min(1, "invalid_public_display_highlight")).default([]),
  displayAmenities: z.array(z.string().trim().min(1, "invalid_public_display_amenity")).default([]),
  displayIncluded: z.array(z.string().trim().min(1, "invalid_public_display_included")).default([]),
});

export const bungalowPublicContentUpdateSchema = z.object({
  expectedVersion: z.coerce.number().int().nonnegative("invalid_public_expected_version").optional(),
  featuredOnHome: z.boolean().default(false),
  sortOrder: z.coerce.number().int().nonnegative("invalid_public_sort_order"),
  heroImageUrl: z.string().trim().min(1, "invalid_public_hero_image_url"),
  galleryUrls: z.array(z.string().trim().min(1, "invalid_public_gallery_image_url")).default([]),
  nightlyRatePen: z.coerce.number().int().positive("invalid_public_nightly_rate"),
  areaSqm: z.coerce.number().int().positive("invalid_public_area_sqm"),
  heroAssetId: z.preprocess(blankToNull, z.string().trim().min(1, "invalid_public_hero_asset_id").nullable().optional()),
  galleryAssetIds: z.array(z.string().trim().min(1, "invalid_public_gallery_asset_id")).optional().default([]),
  localeContent: z.object({
    es: bungalowPublicLocaleContentSchema,
    en: bungalowPublicLocaleContentSchema,
  }),
});

export const bungalowUpdateSchema = bungalowCreateSchema.extend({
  publicContent: bungalowPublicContentUpdateSchema.optional(),
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
export type BookingRequestUpdatePayload = z.infer<typeof bookingRequestUpdateSchema>;
export type BookingRequestOwnerPayload = z.infer<typeof bookingRequestOwnerSchema>;
export type OtaConnectionPayload = z.infer<typeof otaConnectionSchema>;
export type OtaRoomMappingPayload = z.infer<typeof otaRoomMappingSchema>;
export type OtaRatePlanMappingPayload = z.infer<typeof otaRatePlanMappingSchema>;
export type OtaConflictResolutionPayload = z.infer<typeof otaConflictResolutionSchema>;
export type QuickReplyTemplatePayload = z.infer<typeof quickReplyTemplateSchema>;
export type ComplaintCreatePayload = z.infer<typeof complaintCreateSchema>;
export type ReservationCreatePayload = z.infer<typeof reservationCreateSchema>;
export type ReservationUpdatePayload = z.infer<typeof reservationUpdateSchema>;
export type ReservationAssignPayload = z.infer<typeof reservationAssignSchema>;
export type BungalowCreatePayload = z.infer<typeof bungalowCreateSchema>;
export type BungalowUpdatePayload = z.infer<typeof bungalowUpdateSchema>;
export type BungalowPublicContentUpdatePayload = z.infer<typeof bungalowPublicContentUpdateSchema>;
export type ReservationStatusPayload = z.infer<typeof reservationStatusSchema>;
export type ReservationPaymentPayload = z.infer<typeof reservationPaymentSchema>;
