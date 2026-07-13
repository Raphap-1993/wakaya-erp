import { requirePermission } from "@/middleware/authn";
import { failureResponse, jsonResponse, readJsonBody } from "@/lib/reservations/http";
import { otaConnectionSchema } from "@/lib/reservations/schemas";
import { reservationStore } from "@/lib/reservations/store";
import type { OtaConnection } from "@/lib/reservations/types";

function isResponse(value: Response | Awaited<ReturnType<typeof requirePermission>>): value is Response {
  return value instanceof Response;
}

async function readParams(
  context:
    | { params: { provider: string; id: string } | Promise<{ provider: string; id: string }> },
): Promise<{ provider: OtaConnection["providerKey"]; id: string }> {
  const params = await context.params;
  return {
    provider: params.provider as OtaConnection["providerKey"],
    id: params.id,
  };
}

export async function PUT(
  request: Request,
  context: { params: { provider: string; id: string } | Promise<{ provider: string; id: string }> },
) {
  const auth = await requirePermission(request, "reservation:approve");
  if (isResponse(auth)) return auth;

  try {
    const { provider, id } = await readParams(context);
    const payload = otaConnectionSchema.parse(await readJsonBody<unknown>(request));
    const connection = await reservationStore.upsertOtaConnection(provider, payload, id);
    return jsonResponse({ connection });
  } catch (error) {
    return failureResponse(error);
  }
}
