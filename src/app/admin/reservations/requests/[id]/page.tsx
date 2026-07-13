import { redirect } from "next/navigation";

async function readRequestId(params: { id: string } | Promise<{ id: string }>) {
  const resolved = await params;
  return resolved.id;
}

export const dynamic = "force-dynamic";

export default async function BookingRequestDetailPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const requestId = await readRequestId(params);
  redirect(`/admin/reservations/requests?selected=${encodeURIComponent(requestId)}`);
}
