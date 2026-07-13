import { requirePermission } from "@/middleware/authn";
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
  const auth = await requirePermission(request, "reservation:write");
  if (isResponse(auth)) return auth;

  try {
    const result = await reservationStore.syncBookingRequestThread(await readId(context));
    return jsonResponse({
      ...result,
      total: result.messages.length,
      thread: result.thread
        ? {
            ...result.thread,
            messageCount: result.messages.length,
          }
        : null,
    });
  } catch (error) {
    return failureResponse(error);
  }
}
