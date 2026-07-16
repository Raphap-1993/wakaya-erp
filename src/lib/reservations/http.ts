import { NextResponse } from "next/server";
import { ZodError } from "zod";

export interface ApiErrorDetails {
  error: string;
  message?: string;
  reason?: string;
  minimumRequired?: number;
  conflictDates?: string[];
}

export function jsonResponse<T>(body: T, status = 200): NextResponse {
  return NextResponse.json(body, { status });
}

export function errorResponse(error: ApiErrorDetails, status: number): NextResponse {
  return NextResponse.json(error, { status });
}

export async function readJsonBody<T>(request: Request): Promise<T> {
  const contentType = request.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      return (await request.json()) as T;
    }
    if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const formData = await request.formData();
      return Object.fromEntries(formData.entries()) as T;
    }
    return (await request.json()) as T;
  } catch {
    throw new Error("invalid_json");
  }
}

export function mapApiError(error: unknown): { body: ApiErrorDetails; status: number } {
  if (error instanceof ZodError) {
    return {
      body: {
        error: "invalid_payload",
        message: error.issues.map((issue) => issue.message).join(", "),
      },
      status: 400,
    };
  }

  const message = error instanceof Error ? error.message : "unexpected_error";
  switch (message) {
    case "invalid_json":
      return { body: { error: "invalid_json" }, status: 400 };
    case "booking_request_not_found":
      return { body: { error: "booking_request_not_found" }, status: 404 };
    case "reservation_not_found":
      return { body: { error: "reservation_not_found" }, status: 404 };
    case "user_not_found":
      return { body: { error: "user_not_found" }, status: 404 };
    case "bungalow_not_found":
      return {
        body: {
          error: "bungalow_not_found",
          message: "El bungalow seleccionado no existe en la base operativa.",
        },
        status: 404,
      };
    case "bungalow_code_taken":
      return {
        body: {
          error: "bungalow_code_taken",
          message: "Ya existe un bungalow con ese código operativo.",
        },
        status: 409,
      };
    case "bungalow_inactive":
      return {
        body: {
          error: "bungalow_inactive",
          message: "El bungalow seleccionado está inactivo y no puede recibir reservas.",
        },
        status: 409,
      };
    case "bungalow_capacity_not_found":
      return { body: { error: "bungalow_capacity_not_found" }, status: 404 };
    case "capacity_version_conflict":
      return { body: { error: "capacity_version_conflict" }, status: 409 };
    case "capacity_below_commitments": {
      const details = error as Error & { minimumRequired?: number; conflictDates?: string[] };
      return {
        body: {
          error: "capacity_below_commitments",
          minimumRequired: details.minimumRequired ?? 0,
          conflictDates: details.conflictDates ?? [],
        },
        status: 409,
      };
    }
    case "bungalow_capacity_unavailable":
      return {
        body: {
          error: "bungalow_capacity_unavailable",
          message: "No hay cupos disponibles para esa categoría y rango.",
        },
        status: 409,
      };
    case "invalid_bungalow_code":
      return {
        body: {
          error: "invalid_bungalow_code",
          message: "El código del bungalow es obligatorio.",
        },
        status: 400,
      };
    case "invalid_bungalow_name":
      return {
        body: {
          error: "invalid_bungalow_name",
          message: "El nombre visible del bungalow es obligatorio.",
        },
        status: 400,
      };
    case "invalid_bungalow_capacity":
      return {
        body: {
          error: "invalid_bungalow_capacity",
          message: "La capacidad debe ser un entero positivo.",
        },
        status: 400,
      };
    case "invalid_media_payload":
      return {
        body: {
          error: "invalid_media_payload",
          message: "Debes adjuntar al menos una imagen válida.",
        },
        status: 400,
      };
    case "invalid_media_type":
      return {
        body: {
          error: "invalid_media_type",
          message: "Solo se permiten imágenes JPG, PNG o WebP.",
        },
        status: 400,
      };
    case "media_too_large":
      return {
        body: {
          error: "media_too_large",
          message: "La imagen supera el peso máximo permitido.",
        },
        status: 413,
      };
    case "media_dimensions_too_large":
      return {
        body: {
          error: "media_dimensions_too_large",
          message: "La imagen supera las dimensiones máximas permitidas.",
        },
        status: 422,
      };
    case "media_processing_failed":
      return {
        body: {
          error: "media_processing_failed",
          message: "No se pudo procesar la imagen subida.",
        },
        status: 422,
      };
    case "media_not_found":
      return {
        body: {
          error: "media_not_found",
          message: "No se encontró el archivo solicitado.",
        },
        status: 404,
      };
    case "media_persistence_failed":
      return { body: { error: "media_persistence_failed" }, status: 503 };
    case "initial_email_failed":
      return { body: { error: "initial_email_failed" }, status: 502 };
    case "zoho_sync_failed":
      return { body: { error: "zoho_sync_failed" }, status: 502 };
    case "ota_provider_not_supported":
      return {
        body: {
          error: "ota_provider_not_supported",
          message: "La integración OTA no está disponible en este entorno.",
        },
        status: 501,
      };
    case "booking_api_not_configured":
      return {
        body: {
          error: "booking_api_not_configured",
          message: "Faltan las credenciales oficiales de Booking.com en el entorno.",
        },
        status: 500,
      };
    case "booking_sync_failed":
      return {
        body: {
          error: "booking_sync_failed",
          message: "Booking.com devolvió un error al consultar el feed de reservas.",
        },
        status: 502,
      };
    case "booking_ack_failed":
      return {
        body: {
          error: "booking_ack_failed",
          message: "Booking.com no confirmó el acknowledge del lote importado.",
        },
        status: 502,
      };
    case "ota_sync_locked":
      return {
        body: {
          error: "ota_sync_locked",
          message: "Ya existe una sincronización OTA corriendo para este proveedor.",
        },
        status: 409,
      };
    case "attachment_not_found":
      return { body: { error: "attachment_not_found" }, status: 404 };
    case "attachment_content_unavailable":
      return { body: { error: "attachment_content_unavailable" }, status: 409 };
    case "invalid_payload":
      return { body: { error: "invalid_payload" }, status: 400 };
    case "service_required":
      return { body: { error: "service_required" }, status: 400 };
    case "acceptance_required":
      return { body: { error: "acceptance_required" }, status: 400 };
    case "invalid_email":
      return { body: { error: "invalid_email" }, status: 400 };
    case "invalid_name":
      return { body: { error: "invalid_name" }, status: 400 };
    case "invalid_password":
      return { body: { error: "invalid_password" }, status: 400 };
    case "invalid_roles":
      return { body: { error: "invalid_roles" }, status: 400 };
    case "invalid_range":
      return { body: { error: "invalid_range" }, status: 422 };
    case "invalid_stay_range":
      return { body: { error: "invalid_stay_range" }, status: 422 };
    case "content_not_found":
      return { body: { error: "content_not_found" }, status: 404 };
    case "content_store_not_ready":
      return { body: { error: "content_store_not_ready" }, status: 503 };
    case "media_persistence_not_configured":
      return {
        body: {
          error: "media_persistence_not_configured",
          message: "La persistencia de imágenes no está configurada en este entorno.",
        },
        status: 503,
      };
    case "media_storage_not_configured":
      return {
        body: {
          error: "media_storage_not_configured",
          message: "El almacenamiento persistente de imágenes no está configurado.",
        },
        status: 503,
      };
    case "media_not_found":
      return { body: { error: "media_not_found" }, status: 404 };
    case "asset_in_use":
      return { body: { error: "asset_in_use" }, status: 409 };
    case "content_version_conflict":
      return { body: { error: "content_version_conflict" }, status: 409 };
    case "invalid_slug":
      return { body: { error: "invalid_slug" }, status: 400 };
    case "email_taken":
      return { body: { error: "email_taken" }, status: 409 };
    case "last_admin_required":
      return { body: { error: "last_admin_required" }, status: 409 };
    case "occupancy_conflict":
      return { body: { error: "occupancy_conflict" }, status: 409 };
    case "availability_unavailable":
      return {
        body: {
          error: "availability_unavailable",
          message: "No se pudo confirmar la disponibilidad de forma segura.",
        },
        status: 503,
      };
    case "invalid_transition":
      return { body: { error: "invalid_transition" }, status: 409 };
    default:
      if (message.startsWith("missing_required_crop:")) {
        return { body: { error: "media_crop_required" }, status: 422 };
      }
      if (message === "invalid_crop_bounds") {
        return { body: { error: "media_crop_invalid" }, status: 422 };
      }
      if (message === "crop_source_too_small") {
        return { body: { error: "media_crop_too_small" }, status: 422 };
      }
      return { body: { error: message }, status: 500 };
  }
}

export function failureResponse(error: unknown): NextResponse {
  const mapped = mapApiError(error);
  return errorResponse(mapped.body, mapped.status);
}
