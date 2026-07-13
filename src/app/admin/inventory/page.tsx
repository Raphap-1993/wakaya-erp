import { redirect } from "next/navigation";

import { requireAdminPageAccess } from "@/app/admin/require-admin-page-access";

export const dynamic = "force-dynamic";

export default async function LegacyInventoryPage() {
  await requireAdminPageAccess("/admin/inventory", "inventory:manage");
  type AdminRedirectHref = Parameters<typeof redirect>[0];
  redirect("/admin/bungalow-capacity" as AdminRedirectHref);
}
