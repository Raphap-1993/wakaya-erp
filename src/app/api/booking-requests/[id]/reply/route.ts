import { z } from "zod";

import { requirePermission } from "@/middleware/authn";
import { failureResponse, jsonResponse, readJsonBody } from "@/lib/reservations/http";
import { reservationStore } from "@/lib/reservations/store";

const replySchema = z.object({
  subject: z.string().trim().min(1).optional(),
  bodyText: z.string().trim().min(1).optional(),
  body: z.string().trim().min(1).optional(),
});

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
    const payload = replySchema.parse(await readJsonBody<unknown>(request));
    const bodyText = payload.bodyText ?? payload.body;
    if (!bodyText) {
      throw new Error("invalid_payload");
    }
    const result = await reservationStore.replyToBookingRequestThread(await readId(context), {
      actorId: auth.subject ?? "system",
      subject: payload.subject,
      bodyText,
    });
    return jsonResponse({ ...result, reply: { ...result.reply } }, 200);
  } catch (error) {
    return failureResponse(error);
  }
}
