import type { Route } from "next";
import { redirect } from "next/navigation";

import { requireAdminPageAccess } from "@/app/admin/require-admin-page-access";

export const dynamic = "force-dynamic";

export default async function AdminBungalowsPage() {
  await requireAdminPageAccess("/admin/bungalows", "content:write");
  redirect("/admin/content?tab=bungalows" as Route);
}
