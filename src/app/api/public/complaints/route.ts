import { complaintCreateSchema } from "@/lib/reservations/schemas";
import { failureResponse, jsonResponse, readJsonBody } from "@/lib/reservations/http";
import { reservationStore } from "@/lib/reservations/store";

export async function POST(request: Request) {
  try {
    const parsed = complaintCreateSchema.parse(await readJsonBody<unknown>(request));
    const created = await reservationStore.createComplaint(parsed);

    return jsonResponse(
      {
        complaint: created.complaint,
        trackingCode: created.complaint.publicCode,
      },
      201,
    );
  } catch (error) {
    return failureResponse(error);
  }
}
