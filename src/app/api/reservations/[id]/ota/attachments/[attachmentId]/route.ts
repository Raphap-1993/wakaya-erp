import sharp from "sharp";

import {
  attachmentMediaKind,
  normalizeAttachmentContentType,
  shouldTranscodeAttachmentImage,
} from "@/lib/mail/attachment-media";
import { requirePermission } from "@/middleware/authn";
import { failureResponse, jsonResponse } from "@/lib/reservations/http";
import { reservationStore } from "@/lib/reservations/store";

function isResponse(value: Response | Awaited<ReturnType<typeof requirePermission>>): value is Response {
  return value instanceof Response;
}

async function readParams(
  context: {
    params:
      | { id: string; attachmentId: string }
      | Promise<{ id: string; attachmentId: string }>;
  },
): Promise<{ id: string; attachmentId: string }> {
  return await context.params;
}

export async function GET(
  request: Request,
  context: {
    params:
      | { id: string; attachmentId: string }
      | Promise<{ id: string; attachmentId: string }>;
  },
) {
  const auth = await requirePermission(request, "reservation:read");
  if (isResponse(auth)) return auth;

  try {
    const { id, attachmentId } = await readParams(context);
    const threadView = await reservationStore.getOperationThreadView(id);
    if (!threadView || threadView.kind !== "reservation") {
      return jsonResponse({ error: "reservation_not_found" }, 404);
    }

    const attachment = threadView.attachments.find((item) => item.id === attachmentId);
    if (!attachment) {
      return jsonResponse({ error: "attachment_not_found" }, 404);
    }

    if (!attachment.contentBase64) {
      return jsonResponse({ error: "attachment_content_unavailable" }, 409);
    }

    const kind = attachmentMediaKind(attachment);
    const normalizedContentType = normalizeAttachmentContentType(
      attachment.contentType,
      attachment.fileName,
    );
    let payload = Buffer.from(attachment.contentBase64, "base64");
    let responseContentType = normalizedContentType || "application/octet-stream";

    if (kind === "image" && shouldTranscodeAttachmentImage(attachment)) {
      try {
        payload = await sharp(payload).jpeg({ quality: 92 }).toBuffer();
        responseContentType = "image/jpeg";
      } catch {
        responseContentType = normalizedContentType;
      }
    }

    const filename = attachment.fileName.replace(/"/g, "");

    return new Response(payload, {
      status: 200,
      headers: {
        "content-type": responseContentType,
        "content-length": String(payload.length),
        "content-disposition": `inline; filename="${filename}"`,
        "cache-control": "private, max-age=60",
      },
    });
  } catch (error) {
    return failureResponse(error);
  }
}
