import { corporateContentStore } from "@/lib/corporate-content/store";
import { requirePermission } from "@/middleware/authn";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePermission(request, "content:write");
  if (auth instanceof Response) return auth;
  return Response.json({ revisions: await corporateContentStore.listRevisions(20) });
}
