import { contentStore } from "@/lib/content/store";
import { failureResponse, jsonResponse } from "@/lib/reservations/http";
import { reservationStore } from "@/lib/reservations/store";
import { requirePermission } from "@/middleware/authn";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePermission(request, "content:write");
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const [experiences, gallery, bungalows] = await Promise.all([
      contentStore.listExperiences({ includeArchived: false }),
      contentStore.getGallery(),
      reservationStore.listBungalows(),
    ]);

    return jsonResponse({
      tabs: ["home", "experiences", "gallery", "bungalows", "company"],
      permissions: {
        canWrite: true,
      },
      counts: {
        experiences: experiences.length,
        galleryItems: gallery.items.length,
        bungalowTypes: bungalows.length,
      },
    });
  } catch (error) {
    return failureResponse(error);
  }
}
