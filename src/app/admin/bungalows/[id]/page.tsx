import type { Route } from "next";
import { redirect } from "next/navigation";

import { requireAdminPageAccess } from "@/app/admin/require-admin-page-access";

export const dynamic = "force-dynamic";

async function readBungalowId(params: Promise<{ id: string }> | { id: string }) {
  const resolved = await params;
  return resolved.id;
}

export default async function AdminBungalowEditPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const bungalowId = await readBungalowId(params);
  await requireAdminPageAccess(`/admin/bungalows/${bungalowId}`, "content:write");
  redirect(`/admin/content?tab=bungalows&bungalowId=${bungalowId}` as Route);
}
