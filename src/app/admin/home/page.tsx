import type { Route } from "next";
import { redirect } from "next/navigation";

import { requireAdminPageAccess } from "../require-admin-page-access";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  await requireAdminPageAccess("/admin/home", "content:write");
  redirect("/admin/content?tab=home" as Route);
}
