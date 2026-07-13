import { backofficeUserUpdateSchema } from "@/lib/backoffice-auth/schemas";
import { backofficeAuthStore } from "@/lib/backoffice-auth/store";
import { failureResponse, jsonResponse, readJsonBody } from "@/lib/reservations/http";
import { requirePermission } from "@/middleware/authn";

export const dynamic = "force-dynamic";

async function readUserId(params: Promise<{ id: string }> | { id: string }) {
  const resolved = await params;
  return resolved.id;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  const auth = await requirePermission(request, "admin:users");
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const userId = await readUserId(context.params);
    const user = await backofficeAuthStore.getUser(userId);
    if (!user) {
      throw new Error("user_not_found");
    }
    return jsonResponse({ user });
  } catch (error) {
    return failureResponse(error);
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  const auth = await requirePermission(request, "admin:users");
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const userId = await readUserId(context.params);
    const payload = backofficeUserUpdateSchema.parse(await readJsonBody<unknown>(request));
    const user = await backofficeAuthStore.updateUser(userId, payload);
    return jsonResponse({ user });
  } catch (error) {
    return failureResponse(error);
  }
}
