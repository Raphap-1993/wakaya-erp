export type BungalowMediaState = {
  heroAssetId: string | null;
  galleryAssetIds: string[];
};

export function replaceBungalowHero(
  current: BungalowMediaState,
  assetId: string,
): BungalowMediaState {
  return { ...current, heroAssetId: assetId };
}

export function removeBungalowHero(current: BungalowMediaState): BungalowMediaState {
  return { ...current, heroAssetId: null };
}

export function reorderBungalowGallery(
  current: BungalowMediaState,
  fromIndex: number,
  toIndex: number,
): BungalowMediaState {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= current.galleryAssetIds.length ||
    toIndex >= current.galleryAssetIds.length ||
    fromIndex === toIndex
  ) {
    return { ...current, galleryAssetIds: [...current.galleryAssetIds] };
  }

  const galleryAssetIds = [...current.galleryAssetIds];
  const [moved] = galleryAssetIds.splice(fromIndex, 1);
  galleryAssetIds.splice(toIndex, 0, moved);
  return { ...current, galleryAssetIds };
}
