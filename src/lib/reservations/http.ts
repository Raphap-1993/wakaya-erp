import { NextResponse } from "next/server";
import { ZodError } from "zod";

export interface ApiErrorDetails {
  error: string;
  message?: string;
  reason?: string;
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
    case "bungalow_not_found":
      return { body: { error: "bungalow_not_found" }, status: 404 };
    case "bungalow_inactive":
      return { body: { error: "bungalow_inactive" }, status: 409 };
    case "initial_email_failed":
      return { body: { error: "initial_email_failed" }, status: 502 };
    case "invalid_range":
      return { body: { error: "invalid_range" }, status: 422 };
    case "occupancy_conflict":
      return { body: { error: "occupancy_conflict" }, status: 409 };
    case "invalid_transition":
      return { body: { error: "invalid_transition" }, status: 409 };
    default:
      return { body: { error: message }, status: 500 };
  }
}

export function failureResponse(error: unknown): NextResponse {
  const mapped = mapApiError(error);
  return errorResponse(mapped.body, mapped.status);
}
