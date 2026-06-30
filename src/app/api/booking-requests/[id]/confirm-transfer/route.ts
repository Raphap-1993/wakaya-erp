import { z } from "zod";

import { requirePermission } from "@/middleware/authn";
import { failureResponse, jsonResponse, readJsonBody } from "@/lib/reservations/http";
import { reservationStore } from "@/lib/reservations/store";

const confirmTransferSchema = z.object({
  actorId: z.string().trim().min(1).optional(),
  reason: z.string().trim().min(1, "required"),
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
  const auth = await requirePermission(request, "reservation:approve");
  if (isResponse(auth)) return auth;

  try {
    const payload = confirmTransferSchema.parse(await readJsonBody<unknown>(request));
    const result = await reservationStore.confirmBookingRequestTransfer(
      await readId(context),
      payload.actorId ?? auth.subject ?? "system",
      payload.reason,
    );

    return jsonResponse(result, 200);
  } catch (error) {
    return failureResponse(error);
  }
}
