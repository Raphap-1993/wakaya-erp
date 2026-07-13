import { requirePermission } from "@/middleware/authn";
import { failureResponse, jsonResponse, readJsonBody } from "@/lib/reservations/http";
import { otaRatePlanMappingSchema } from "@/lib/reservations/schemas";
import { reservationStore } from "@/lib/reservations/store";

function isResponse(value: Response | Awaited<ReturnType<typeof requirePermission>>): value is Response {
  return value instanceof Response;
}

async function readParams(
  context:
    | { params: { id: string; mappingId: string } | Promise<{ id: string; mappingId: string }> },
): Promise<{ connectionId: string; mappingId: string }> {
  const params = await context.params;
  return {
    connectionId: params.id,
    mappingId: params.mappingId,
  };
}

export async function PUT(
  request: Request,
  context: { params: { id: string; mappingId: string } | Promise<{ id: string; mappingId: string }> },
) {
  const auth = await requirePermission(request, "reservation:approve");
  if (isResponse(auth)) return auth;

  try {
    const { connectionId, mappingId } = await readParams(context);
    const payload = otaRatePlanMappingSchema.parse(await readJsonBody<unknown>(request));
    const mapping = await reservationStore.upsertOtaRatePlanMapping(connectionId, payload, mappingId);
    return jsonResponse({ mapping });
  } catch (error) {
    return failureResponse(error);
  }
}
