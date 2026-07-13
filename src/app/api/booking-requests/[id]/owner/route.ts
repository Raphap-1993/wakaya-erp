import { backofficeAuthStore } from "@/lib/backoffice-auth/store";
import { failureResponse, jsonResponse, readJsonBody } from "@/lib/reservations/http";
import { bookingRequestOwnerSchema } from "@/lib/reservations/schemas";
import { reservationStore } from "@/lib/reservations/store";
import { requirePermission } from "@/middleware/authn";

async function readId(context: { params: { id: string } | Promise<{ id: string }> }) {
  const params = await context.params;
  return params.id;
}

export async function POST(
  request: Request,
  context: { params: { id: string } | Promise<{ id: string }> },
) {
  const auth = await requirePermission(request, "reservation:assign");
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const payload = bookingRequestOwnerSchema.parse(await readJsonBody<unknown>(request));
    let ownerName: string | null = null;
    if (payload.ownerUserId) {
      const user = await backofficeAuthStore.getUser(payload.ownerUserId);
      if (!user || !user.active) {
        throw new Error("user_not_found");
      }
      ownerName = user.name;
    }

    const result = await reservationStore.assignBookingRequestOwner(await readId(context), {
      actorId: auth.subject ?? "system",
      ownerUserId: payload.ownerUserId,
      ownerName,
    });
    return jsonResponse(result, 200);
  } catch (error) {
    return failureResponse(error);
  }
}
