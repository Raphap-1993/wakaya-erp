import { requirePermission } from "@/middleware/authn";
import { failureResponse, jsonResponse, readJsonBody } from "@/lib/reservations/http";
import { reservationCreateSchema } from "@/lib/reservations/schemas";
import { reservationStore } from "@/lib/reservations/store";

function isResponse(value: Response | Awaited<ReturnType<typeof requirePermission>>): value is Response {
  return value instanceof Response;
}

async function readId(context: { params: { id: string } | Promise<{ id: string }> }): Promise<string> {
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
    const id = await readId(context);
    const detail = reservationStore.get(id);
    if (!detail) {
      return jsonResponse({ error: "reservation_not_found" }, 404);
    }

    return jsonResponse({ reservation: detail });
  } catch (error) {
    return failureResponse(error);
  }
}

export async function PUT(
  request: Request,
  context: { params: { id: string } | Promise<{ id: string }> },
) {
  const auth = await requirePermission(request, "reservation:write");
  if (isResponse(auth)) return auth;

  try {
    const id = await readId(context);
    const rawBody = await readJsonBody<unknown>(request);
    const parsed = reservationCreateSchema.parse(rawBody);
    const reservation = reservationStore.update(id, {
      ...parsed,
      responsibleId: parsed.responsibleId ?? auth.subject ?? null,
      actorId: auth.subject ?? "system",
      reason: "manual reservation edit",
    });

    return jsonResponse({ reservation });
  } catch (error) {
    return failureResponse(error);
  }
}
