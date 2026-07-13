import { homeContentStore } from "@/lib/home-content/store";
import { requirePermission } from "@/middleware/authn";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePermission(request, "content:write");
  if (auth instanceof Response) {
    return auth;
  }

  const revisions = await homeContentStore.listRevisions(20);
  return Response.json({ revisions });
}
