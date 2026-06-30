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
