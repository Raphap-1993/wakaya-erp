import { bungalowCreateSchema } from "@/lib/reservations/schemas";
import { failureResponse, jsonResponse, readJsonBody } from "@/lib/reservations/http";
import { reservationStore } from "@/lib/reservations/store";
import { requirePermission } from "@/middleware/authn";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePermission(request, "reservation:read");
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const items = await reservationStore.listBungalows();
    return jsonResponse({ items });
  } catch (error) {
    return failureResponse(error);
  }
}

export async function POST(request: Request) {
  const auth = await requirePermission(request, "reservation:write");
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const payload = bungalowCreateSchema.parse(await readJsonBody<unknown>(request));
    const bungalow = await reservationStore.createBungalow(payload);
    return jsonResponse({ bungalow }, 201);
  } catch (error) {
    return failureResponse(error);
  }
}
