const MAX_ORIGINAL_FILENAME_LENGTH = 180;
const graphemeSegmenter = new Intl.Segmenter("es", { granularity: "grapheme" });

const MIME_EXTENSIONS: Readonly<Record<string, string>> = {
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/heic": "heic",
  "image/heif": "heif",
};

function fallbackFilename(mimeType: string) {
  const normalizedMimeType = mimeType.split(";", 1)[0]?.trim().toLowerCase() ?? "";
  const extension = MIME_EXTENSIONS[normalizedMimeType];
  return extension ? `imagen.${extension}` : "imagen";
}

function truncateAtGraphemeBoundary(value: string, maxLength: number) {
  let truncated = "";
  for (const { segment } of graphemeSegmenter.segment(value)) {
    if (truncated.length + segment.length > maxLength) {
      break;
    }
    truncated += segment;
  }

  return truncated;
}

function preserveExtensionWithinLimit(filename: string) {
  if (filename.length <= MAX_ORIGINAL_FILENAME_LENGTH) {
    return filename;
  }

  const extensionMatch = filename.match(/\.([a-z0-9]{1,10})$/i);
  if (!extensionMatch) {
    return truncateAtGraphemeBoundary(filename, MAX_ORIGINAL_FILENAME_LENGTH);
  }

  const extension = extensionMatch[0];
  const stem = filename.slice(0, -extension.length);
  return `${truncateAtGraphemeBoundary(
    stem,
    MAX_ORIGINAL_FILENAME_LENGTH - extension.length,
  )}${extension}`;
}

export function normalizeOriginalFilename(filename: string, mimeType: string) {
  const basename = filename.split(/[\\/]/u).at(-1) ?? "";
  const normalized = basename
    .replace(/[\p{Cc}\p{Cs}]/gu, "")
    .replace(/[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/gu, "")
    .replace(/\s+/gu, " ")
    .trim()
    .normalize("NFC");

  return preserveExtensionWithinLimit(normalized || fallbackFilename(mimeType));
}
