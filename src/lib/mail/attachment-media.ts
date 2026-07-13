type AttachmentMediaInput = {
  contentType: string | null | undefined;
  fileName?: string | null;
};

const IMAGE_TYPE_BY_EXTENSION: Record<string, string> = {
  ".avif": "image/avif",
  ".bmp": "image/bmp",
  ".gif": "image/gif",
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".jfif": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
  ".webp": "image/webp",
};

const BROWSER_SAFE_IMAGE_TYPES = new Set([
  "image/avif",
  "image/bmp",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const IMAGE_TYPES_REQUIRING_TRANSCODE = new Set([
  "image/heic",
  "image/heif",
  "image/tiff",
]);

function normalizedExtension(fileName: string | null | undefined) {
  const normalized = (fileName ?? "").trim().toLowerCase();
  if (!normalized.includes(".")) {
    return null;
  }

  return normalized.slice(normalized.lastIndexOf("."));
}

export function guessAttachmentContentType(fileName: string | null | undefined): string | null {
  const extension = normalizedExtension(fileName);
  return extension ? IMAGE_TYPE_BY_EXTENSION[extension] ?? null : null;
}

export function normalizeAttachmentContentType(
  contentType: string | null | undefined,
  fileName?: string | null,
): string {
  const normalized = (contentType ?? "").trim().toLowerCase();

  if (normalized === "image/jpg") {
    return "image/jpeg";
  }

  if (normalized && normalized !== "application/octet-stream") {
    return normalized;
  }

  const guessed = guessAttachmentContentType(fileName);
  if (guessed) {
    return guessed;
  }

  return normalized || "application/octet-stream";
}

export function attachmentMediaKind(input: AttachmentMediaInput): "pdf" | "image" | "file" {
  const normalized = normalizeAttachmentContentType(input.contentType, input.fileName);
  if (normalized === "application/pdf") {
    return "pdf";
  }
  if (normalized.startsWith("image/")) {
    return "image";
  }
  return "file";
}

export function isPreviewableAttachment(input: AttachmentMediaInput): boolean {
  const kind = attachmentMediaKind(input);
  return kind === "pdf" || kind === "image";
}

export function isBrowserSafeImageType(contentType: string): boolean {
  return BROWSER_SAFE_IMAGE_TYPES.has(contentType);
}

export function shouldTranscodeAttachmentImage(input: AttachmentMediaInput): boolean {
  const normalized = normalizeAttachmentContentType(input.contentType, input.fileName);
  return IMAGE_TYPES_REQUIRING_TRANSCODE.has(normalized);
}
