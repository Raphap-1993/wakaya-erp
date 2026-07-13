import { createHash } from "node:crypto";

import { normalizeAttachmentContentType } from "@/lib/mail/attachment-media";

export interface ProviderAttachment {
  providerAttachmentId: string;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  contentBase64: string | null;
}

export interface ProviderThreadMessage {
  providerMessageId: string;
  providerThreadId: string | null;
  fromAddress: string;
  toAddresses: string[];
  ccAddresses: string[];
  subject: string;
  bodyText: string | null;
  bodyHtml: string | null;
  sentAt: string | null;
  receivedAt: string | null;
  attachments: ProviderAttachment[];
}

const SUPPORTED_ATTACHMENT_TYPES = new Set([
  "application/pdf",
  "image/avif",
  "image/bmp",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/tiff",
  "image/webp",
]);

export function dedupeProviderMessages<T extends { providerMessageId: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.providerMessageId)) {
      return false;
    }
    seen.add(item.providerMessageId);
    return true;
  });
}

export function isSupportedAttachment(contentType: string, fileName?: string | null): boolean {
  return SUPPORTED_ATTACHMENT_TYPES.has(normalizeAttachmentContentType(contentType, fileName));
}

export function hashAttachmentContent(input: {
  providerAttachmentId: string;
  fileName: string;
  contentBase64: string | null;
}): string {
  return createHash("sha256")
    .update(input.providerAttachmentId)
    .update(input.fileName)
    .update(input.contentBase64 ?? "")
    .digest("hex");
}
