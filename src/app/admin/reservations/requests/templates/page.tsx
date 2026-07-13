import { requireAdminPageAccess } from "@/app/admin/require-admin-page-access";
import { reservationStore } from "@/lib/reservations/store";

import { QuickReplyTemplateAdmin } from "./quick-reply-template-admin";

export const dynamic = "force-dynamic";

export default async function ReplyTemplatesAdminPage() {
  await requireAdminPageAccess("/admin/reservations/requests/templates", "reservation:approve");
  const items = await reservationStore.listQuickReplyTemplates();
  return <QuickReplyTemplateAdmin items={items} />;
}
