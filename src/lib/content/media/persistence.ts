import { isAbsolute, relative, resolve } from "node:path";

export type ContentPersistenceHealth = {
  database: "configured" | "missing";
  mediaStorage: "configured" | "missing" | "unsafe";
  contentWrites: "durable" | "not-durable";
};

function hasDurableMediaStoragePath() {
  const configuredPath = process.env.WAKAYA_MEDIA_STORAGE_PATH?.trim();
  if (!configuredPath) {
    return { configured: false, state: "missing" as const };
  }
  if (!isAbsolute(configuredPath)) {
    return { configured: false, state: "unsafe" as const };
  }

  const storagePath = resolve(configuredPath);
  const relationToRelease = relative(process.cwd(), storagePath);
  const insideRelease =
    relationToRelease === "" ||
    (!relationToRelease.startsWith("..") && !isAbsolute(relationToRelease));
  return insideRelease
    ? { configured: false, state: "unsafe" as const }
    : { configured: true, state: "configured" as const };
}

export function getContentPersistenceHealth(): ContentPersistenceHealth {
  const databaseConfigured = Boolean(process.env.DATABASE_URL?.trim());
  const mediaStorage = hasDurableMediaStoragePath();

  return {
    database: databaseConfigured ? "configured" : "missing",
    mediaStorage: mediaStorage.state,
    contentWrites:
      databaseConfigured && mediaStorage.configured ? "durable" : "not-durable",
  };
}

export function assertDurableMediaWriteConfiguration(options?: {
  injectedStorage?: boolean;
}) {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("media_persistence_not_configured");
  }

  if (!options?.injectedStorage && !hasDurableMediaStoragePath().configured) {
    throw new Error("media_storage_not_configured");
  }
}
