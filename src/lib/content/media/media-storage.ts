export const DEFAULT_MEDIA_STORAGE_PATH = ".data/wakaya-media";

export type StoredBinary = {
  storageKey: string;
  absolutePath: string;
};

export interface MediaStorage {
  write(pathSegments: string[], buffer: Buffer): Promise<StoredBinary>;
  read(pathSegments: string[]): Promise<Buffer>;
}
