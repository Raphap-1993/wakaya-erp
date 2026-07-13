import type { ReactNode } from "react";
import { headers } from "next/headers";

import { authenticate } from "@/middleware/authn";

import { loadAdminNotifications } from "./admin-notifications";
import AdminShell from "./admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const requestHeaders = new Headers();
  const currentHeaders = await headers();
  currentHeaders.forEach((value, key) => requestHeaders.set(key, value));

  const auth = await authenticate(new Request("http://localhost/admin", { headers: requestHeaders }));
  const roles = auth.authenticated ? auth.roles : [];
  const operatorLabel =
    auth.authenticated && typeof auth.claims?.email === "string" && auth.claims.email.length > 0
      ? auth.claims.email
      : auth.authenticated
        ? auth.subject ?? null
        : null;
  const notifications = auth.authenticated ? await loadAdminNotifications() : { total: 0, items: [] };

  return (
    <AdminShell roles={roles} operatorLabel={operatorLabel} notifications={notifications}>
      {children}
    </AdminShell>
  );
}
