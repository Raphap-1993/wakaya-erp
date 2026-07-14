import { mkdir, readFile, rm, rmdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";

import { DEFAULT_MEDIA_STORAGE_PATH, type MediaStorage, type StoredBinary } from "./media-storage";

function resolveRoot(rootPath?: string) {
  return resolve(rootPath?.trim() || process.env.WAKAYA_MEDIA_STORAGE_PATH?.trim() || DEFAULT_MEDIA_STORAGE_PATH);
}

function sanitizePathSegments(pathSegments: string[]) {
  if (
    pathSegments.length === 0 ||
    pathSegments.some((segment) => segment.trim().length === 0 || segment === "." || segment.includes(".."))
  ) {
    throw new Error("invalid_media_path");
  }

  return [...pathSegments];
}

class FilesystemMediaStorage implements MediaStorage {
  constructor(private readonly rootPath: string) {}

  async write(pathSegments: string[], buffer: Buffer): Promise<StoredBinary> {
    const safePath = sanitizePathSegments(pathSegments);
    const absolutePath = join(this.rootPath, ...safePath);
    await mkdir(join(this.rootPath, ...safePath.slice(0, -1)), { recursive: true });
    await writeFile(absolutePath, buffer);

    return {
      storageKey: safePath.join("/"),
      absolutePath,
    };
  }

  async read(pathSegments: string[]) {
    const safePath = sanitizePathSegments(pathSegments);
    return readFile(join(this.rootPath, ...safePath));
  }

  async remove(pathSegments: string[]) {
    const safePath = sanitizePathSegments(pathSegments);
    const absolutePath = join(this.rootPath, ...safePath);
    await rm(absolutePath, { force: true });

    let directory = dirname(absolutePath);
    while (directory !== this.rootPath && directory.startsWith(`${this.rootPath}${sep}`)) {
      try {
        await rmdir(directory);
      } catch (error) {
        const code =
          error && typeof error === "object" && "code" in error
            ? (error as { code?: string }).code
            : undefined;
        if (code === "ENOENT") {
          directory = dirname(directory);
          continue;
        }
        if (code === "ENOTEMPTY") {
          break;
        }
        throw error;
      }
      directory = dirname(directory);
    }
  }
}

export function createFilesystemMediaStorage(options?: { rootPath?: string }) {
  return new FilesystemMediaStorage(resolveRoot(options?.rootPath));
}
