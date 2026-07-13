import { requirePermission } from "@/middleware/authn";
import { failureResponse, jsonResponse, readJsonBody } from "@/lib/reservations/http";
import { otaConflictResolutionSchema } from "@/lib/reservations/schemas";
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
  const auth = await requirePermission(request, "reservation:approve");
  if (isResponse(auth)) return auth;

  try {
    const payload = otaConflictResolutionSchema.parse(await readJsonBody<unknown>(request));
    const result = await reservationStore.resolveOtaReservationConflict(
      await readId(context),
      auth.subject ?? "system",
      payload.notes,
    );
    return jsonResponse(result);
  } catch (error) {
    return failureResponse(error);
  }
}
