import { requirePermission } from "@/middleware/authn";
import { dedupeProviderMessages } from "@/lib/mail/thread-sync";
import { listThreadMessages } from "@/lib/mail/zoho-client";
import { failureResponse, jsonResponse } from "@/lib/reservations/http";
import { reservationStore } from "@/lib/reservations/store";

function isResponse(value: Response | Awaited<ReturnType<typeof requirePermission>>): value is Response {
  return value instanceof Response;
}

async function readId(context: { params: { id: string } | Promise<{ id: string }> }): Promise<string> {
  const params = await context.params;
  return params.id;
}

export async function POST(
  request: Request,
  context: { params: { id: string } | Promise<{ id: string }> },
) {
  const auth = await requirePermission(request, "reservation:read");
  if (isResponse(auth)) return auth;

  try {
    const bookingRequest = await reservationStore.getBookingRequest(await readId(context));
    if (!bookingRequest) {
      return jsonResponse({ error: "booking_request_not_found" }, 404);
    }

    if (!bookingRequest.threadId) {
      return jsonResponse({ bookingRequest, messages: [], total: 0 });
    }

    const providerMessages = await listThreadMessages(bookingRequest.threadId);
    const messages = dedupeProviderMessages(
      providerMessages.map((item, index) => ({
        providerMessageId:
          typeof item === "object" &&
          item !== null &&
          "providerMessageId" in item &&
          typeof (item as { providerMessageId?: unknown }).providerMessageId === "string"
            ? (item as { providerMessageId: string }).providerMessageId
            : `${bookingRequest.threadId}:${index}`,
        raw: item,
      })),
    );

    return jsonResponse({ bookingRequest, messages, total: messages.length });
  } catch (error) {
    return failureResponse(error);
  }
}
