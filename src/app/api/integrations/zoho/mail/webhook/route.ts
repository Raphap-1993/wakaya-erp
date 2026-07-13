import { createHmac, timingSafeEqual } from "node:crypto";

import { failureResponse, jsonResponse } from "@/lib/reservations/http";
import { reservationStore } from "@/lib/reservations/store";

export const dynamic = "force-dynamic";

function normalizeWebhookSecret(request: Request): string | null {
  const configured = process.env.ZOHO_WEBHOOK_SECRET?.trim();
  if (configured) {
    return configured;
  }

  const bootstrap = request.headers.get("x-hook-secret")?.trim();
  return bootstrap || null;
}

function isValidWebhookSignature(request: Request, rawBody: string, secret: string): boolean {
  const received = request.headers.get("x-hook-signature")?.trim();
  if (!received) {
    return false;
  }

  const hexDigest = createHmac("sha256", secret).update(rawBody).digest("hex");
  const base64Digest = createHmac("sha256", secret).update(rawBody).digest("base64");
  const candidates = [hexDigest, base64Digest];

  return candidates.some((candidate) => {
    const left = Buffer.from(candidate);
    const right = Buffer.from(received);
    return left.length === right.length && timingSafeEqual(left, right);
  });
}

function extractPublicRef(payload: Record<string, unknown>): string | null {
  const candidates = [
    payload.threadKey,
    payload.subject,
    payload.summary,
    payload.messageId,
    payload.content,
    payload.html,
  ]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ");

  const match = candidates.match(/WR-\d{4}-\d{4}/i);
  return match ? match[0].toUpperCase() : null;
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const secret = normalizeWebhookSecret(request);
    if (!secret || !isValidWebhookSignature(request, rawBody, secret)) {
      return jsonResponse({ error: "invalid_webhook_signature" }, 401);
    }

    const payload = (rawBody ? JSON.parse(rawBody) : {}) as Record<string, unknown>;
    const publicRef = extractPublicRef(payload);
    if (!publicRef) {
      return jsonResponse({ accepted: true, synced: false, reason: "public_ref_not_detected" }, 202);
    }

    const items = await reservationStore.listBookingRequests();
    const requestMatch = items.find(
      (item) => item.publicRef === publicRef || item.threadKey === `booking-request:${publicRef}`,
    );
    if (!requestMatch) {
      return jsonResponse({ accepted: true, synced: false, reason: "booking_request_not_found" }, 202);
    }

    await reservationStore.syncBookingRequestThread(requestMatch.id);
    return jsonResponse({ accepted: true, synced: true, bookingRequestId: requestMatch.id }, 202);
  } catch (error) {
    return failureResponse(error);
  }
}
