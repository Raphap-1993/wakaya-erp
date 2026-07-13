import { requirePermission } from "@/middleware/authn";
import { failureResponse, jsonResponse, readJsonBody } from "@/lib/reservations/http";
import { otaRoomMappingSchema } from "@/lib/reservations/schemas";
import { reservationStore } from "@/lib/reservations/store";

function isResponse(value: Response | Awaited<ReturnType<typeof requirePermission>>): value is Response {
  return value instanceof Response;
}

async function readConnectionId(
  context: { params: { id: string } | Promise<{ id: string }> },
): Promise<string> {
  const params = await context.params;
  return params.id;
}

export async function GET(
  request: Request,
  context: { params: { id: string } | Promise<{ id: string }> },
) {
  const auth = await requirePermission(request, "reservation:read");
  if (isResponse(auth)) return auth;

  try {
    const connectionId = await readConnectionId(context);
    const mappings = await reservationStore.listOtaRoomMappings(connectionId);
    return jsonResponse({ mappings });
  } catch (error) {
    return failureResponse(error);
  }
}

export async function POST(
  request: Request,
  context: { params: { id: string } | Promise<{ id: string }> },
) {
  const auth = await requirePermission(request, "reservation:approve");
  if (isResponse(auth)) return auth;

  try {
    const connectionId = await readConnectionId(context);
    const payload = otaRoomMappingSchema.parse(await readJsonBody<unknown>(request));
    const mapping = await reservationStore.upsertOtaRoomMapping(connectionId, payload);
    return jsonResponse({ mapping }, 201);
  } catch (error) {
    return failureResponse(error);
  }
}
