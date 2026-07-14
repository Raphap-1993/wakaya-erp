export type AdminMediaMetadata = {
  assetId: string;
  originalFilename: string;
};

export type AdminMediaMetadataMap = Record<string, AdminMediaMetadata>;

export type AdminMediaDescriptor = {
  assetId: string | null;
  originalFilename: string;
  previewUrl: string;
};

const MANAGED_MEDIA_PATTERN =
  /^\/media\/assets\/([a-zA-Z0-9_-]+)\/[a-zA-Z0-9._-]+$/;
const RAW_ASSET_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
const FALLBACK_FILENAME = "imagen.webp";

export function extractManagedAssetId(value: string): string | null {
  return MANAGED_MEDIA_PATTERN.exec(value)?.[1] ?? null;
}

export function fallbackMediaFilename(value: string): string {
  const path = value.split(/[?#]/, 1)[0] ?? "";
  const basename = path.split(/[\\/]/).at(-1) ?? "";

  try {
    return decodeURIComponent(basename).trim() || FALLBACK_FILENAME;
  } catch {
    return basename.trim() || FALLBACK_FILENAME;
  }
}

export function collectAdminMediaAssetIds(values: string[]): string[] {
  const assetIds = new Set<string>();

  for (const value of values) {
    const candidate = value.trim();
    const assetId = extractManagedAssetId(candidate) ??
      (RAW_ASSET_ID_PATTERN.test(candidate) ? candidate : null);
    if (assetId) {
      assetIds.add(assetId);
    }
  }

  return [...assetIds];
}

export function toAdminMediaMetadataMap(
  metadata: AdminMediaMetadata[],
): AdminMediaMetadataMap {
  return Object.fromEntries(metadata.map((item) => [item.assetId, item]));
}

export function resolveAdminMediaDescriptor(
  previewUrl: string,
  metadata: AdminMediaMetadataMap,
): AdminMediaDescriptor {
  const assetId = extractManagedAssetId(previewUrl);
  const originalFilename = assetId ? metadata[assetId]?.originalFilename : undefined;

  return {
    assetId,
    originalFilename:
      originalFilename && originalFilename.trim()
        ? originalFilename
        : fallbackMediaFilename(previewUrl),
    previewUrl,
  };
}
