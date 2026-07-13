import { backofficeUserCreateSchema } from "@/lib/backoffice-auth/schemas";
import { backofficeAuthStore } from "@/lib/backoffice-auth/store";
import { failureResponse, jsonResponse, readJsonBody } from "@/lib/reservations/http";
import { requirePermission } from "@/middleware/authn";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePermission(request, "admin:users");
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const items = await backofficeAuthStore.listUsers();
    return jsonResponse({ items });
  } catch (error) {
    return failureResponse(error);
  }
}

export async function POST(request: Request) {
  const auth = await requirePermission(request, "admin:users");
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const payload = backofficeUserCreateSchema.parse(await readJsonBody<unknown>(request));
    const user = await backofficeAuthStore.createUser(payload);
    return jsonResponse({ user }, 201);
  } catch (error) {
    return failureResponse(error);
  }
}
