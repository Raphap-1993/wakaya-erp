const MAX_ORIGINAL_FILENAME_LENGTH = 180;

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

function sliceWithoutSplittingUnicode(value: string, maxLength: number) {
  const sliced = value.slice(0, maxLength);
  const lastCodeUnit = sliced.charCodeAt(sliced.length - 1);

  if (lastCodeUnit >= 0xd800 && lastCodeUnit <= 0xdbff) {
    return sliced.slice(0, -1);
  }

  return sliced;
}

function preserveExtensionWithinLimit(filename: string) {
  if (filename.length <= MAX_ORIGINAL_FILENAME_LENGTH) {
    return filename;
  }

  const extensionMatch = filename.match(/\.([a-z0-9]{1,10})$/i);
  if (!extensionMatch) {
    return sliceWithoutSplittingUnicode(filename, MAX_ORIGINAL_FILENAME_LENGTH);
  }

  const extension = extensionMatch[0];
  const stem = filename.slice(0, -extension.length);
  return `${sliceWithoutSplittingUnicode(
    stem,
    MAX_ORIGINAL_FILENAME_LENGTH - extension.length,
  )}${extension}`;
}

export function normalizeOriginalFilename(filename: string, mimeType: string) {
  const basename = filename.split(/[\\/]/u).at(-1) ?? "";
  const normalized = basename
    .normalize("NFC")
    .replace(/[\u0000-\u001f\u007f]/gu, "")
    .replace(/\s+/gu, " ")
    .trim();

  return preserveExtensionWithinLimit(normalized || fallbackFilename(mimeType));
}
