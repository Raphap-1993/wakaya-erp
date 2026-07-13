import { notFound } from "next/navigation";

import { requireAdminPageAccess } from "@/app/admin/require-admin-page-access";
import { backofficeAuthStore } from "@/lib/backoffice-auth/store";
import type { Role } from "@/lib/rbac";

import { BackofficeUserForm } from "../backoffice-user-form";

export const dynamic = "force-dynamic";

async function readUserId(params: Promise<{ id: string }> | { id: string }) {
  const resolved = await params;
  return resolved.id;
}

export default async function AdminUserEditPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const userId = await readUserId(params);
  await requireAdminPageAccess(`/admin/users/${userId}`, "admin:users");
  const user = await backofficeAuthStore.getUser(userId);
  if (!user) {
    notFound();
  }

  return (
    <BackofficeUserForm
      mode="edit"
      actionHref={`/api/admin/users/${user.id}`}
      backHref="/admin/users"
      initialValues={{
        email: user.email,
        name: user.name,
        roles: user.roles as Role[],
        active: user.active,
      }}
    />
  );
}
