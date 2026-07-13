import { requireAdminPageAccess } from "@/app/admin/require-admin-page-access";
import { ContentHub } from "@/app/admin/content/content-hub";
import { contentStore } from "@/lib/content/store";
import { corporateContentStore } from "@/lib/corporate-content/store";
import { homeContentStore } from "@/lib/home-content/store";
import { reservationStore } from "@/lib/reservations/store";
import { createBlankBungalowPublicContent } from "@/lib/reservations/wakaya-bungalow-public-content";

export const dynamic = "force-dynamic";

type SearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

async function readTab(searchParams: SearchParams) {
  const resolved = await searchParams;
  const value = Array.isArray(resolved.tab) ? resolved.tab[0] : resolved.tab;
  return value === "home" || value === "experiences" || value === "gallery" || value === "bungalows" || value === "company" ? value : "overview";
}

async function readBungalowId(searchParams: SearchParams) {
  const resolved = await searchParams;
  const value = Array.isArray(resolved.bungalowId) ? resolved.bungalowId[0] : resolved.bungalowId;
  return typeof value === "string" && value.trim() ? value : "";
}

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdminPageAccess("/admin/content", "content:write");

  const [initialTab, initialBungalowId, homeItem, homeRevisions, corporateItem, corporateRevisions, experiences, gallery, bungalows] = await Promise.all([
    readTab(searchParams),
    readBungalowId(searchParams),
    homeContentStore.getPublished(),
    homeContentStore.listRevisions(10),
    corporateContentStore.getPublished(),
    corporateContentStore.listRevisions(10),
    contentStore.listExperiences({ includeArchived: true }).catch(() => []),
    contentStore.getGallery().catch(() => ({
      id: "global" as const,
      version: 0,
      updatedBy: null,
      updatedAt: new Date(0).toISOString(),
      items: [],
    })),
    reservationStore.listBungalows(),
  ]);

  const bungalowItems = await Promise.all(
    bungalows.map(async (bungalow) => ({
      bungalow,
      publicContent:
        (await reservationStore.getBungalowPublicContent(bungalow.id)) ??
        createBlankBungalowPublicContent(bungalow.id, bungalow.name),
    })),
  );

  const selectedBungalowId = initialBungalowId || bungalowItems[0]?.bungalow.id || "";

  return (
    <ContentHub
      key={`${initialTab}:${selectedBungalowId}`}
      initialTab={initialTab}
      initialHomeItem={homeItem}
      initialHomeRevisions={homeRevisions}
      initialCorporateItem={corporateItem}
      initialCorporateRevisions={corporateRevisions}
      initialExperiences={experiences}
      initialGallery={gallery}
      initialBungalows={bungalowItems}
      initialBungalowId={selectedBungalowId}
    />
  );
}
