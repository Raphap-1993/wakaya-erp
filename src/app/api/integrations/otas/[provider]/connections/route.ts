import { requirePermission } from "@/middleware/authn";
import { failureResponse, jsonResponse, readJsonBody } from "@/lib/reservations/http";
import { otaConnectionSchema } from "@/lib/reservations/schemas";
import { reservationStore } from "@/lib/reservations/store";
import type { OtaConnection } from "@/lib/reservations/types";

function isResponse(value: Response | Awaited<ReturnType<typeof requirePermission>>): value is Response {
  return value instanceof Response;
}

async function readProvider(
  context: { params: { provider: string } | Promise<{ provider: string }> },
): Promise<OtaConnection["providerKey"]> {
  const params = await context.params;
  return params.provider as OtaConnection["providerKey"];
}

export async function GET(
  request: Request,
  context: { params: { provider: string } | Promise<{ provider: string }> },
) {
  const auth = await requirePermission(request, "reservation:read");
  if (isResponse(auth)) return auth;

  try {
    const provider = await readProvider(context);
    const connections = await reservationStore.listOtaConnections(provider);
    return jsonResponse({ connections });
  } catch (error) {
    return failureResponse(error);
  }
}

export async function POST(
  request: Request,
  context: { params: { provider: string } | Promise<{ provider: string }> },
) {
  const auth = await requirePermission(request, "reservation:approve");
  if (isResponse(auth)) return auth;

  try {
    const provider = await readProvider(context);
    const payload = otaConnectionSchema.parse(await readJsonBody<unknown>(request));
    const connection = await reservationStore.upsertOtaConnection(provider, payload);
    return jsonResponse({ connection }, 201);
  } catch (error) {
    return failureResponse(error);
  }
}
