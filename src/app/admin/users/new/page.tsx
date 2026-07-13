import { requireAdminPageAccess } from "@/app/admin/require-admin-page-access";

import { BackofficeUserForm } from "../backoffice-user-form";

export const dynamic = "force-dynamic";

export default async function NewAdminUserPage() {
  await requireAdminPageAccess("/admin/users/new", "admin:users");

  return (
    <BackofficeUserForm
      mode="create"
      actionHref="/api/admin/users"
      backHref="/admin/users"
      initialValues={{
        email: "",
        name: "",
        roles: ["editor"],
        active: true,
      }}
    />
  );
}
