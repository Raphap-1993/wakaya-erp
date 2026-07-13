import { requireAdminPageAccess } from "@/app/admin/require-admin-page-access";

import { BungalowForm } from "../bungalow-form";

export const dynamic = "force-dynamic";

export default async function NewAdminBungalowPage() {
  await requireAdminPageAccess("/admin/bungalows/new", "reservation:write");

  return (
    <BungalowForm
      mode="create"
      actionHref="/api/bungalows"
      backHref="/admin/bungalows"
      initialValues={{
        code: "",
        name: "",
        capacity: "2",
        active: true,
      }}
    />
  );
}
