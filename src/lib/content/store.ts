import type { Pool, PoolClient } from "pg";

import { getPool } from "@/lib/reservations/postgres";

import {
  bungalowContentUpdateSchema,
  experienceSchema,
  galleryItemSchema,
} from "./schema";
import type {
  BungalowContentRecord,
  BungalowContentUpdateInput,
  ExperienceInput,
  ExperienceRecord,
  GalleryItemInput,
  GalleryPublication,
  PublishGalleryInput,
} from "./types";

type ExperienceRow = {
  id: string;
  slug: string;
  visible: boolean;
  featured_on_home: boolean;
  sort_order: number;
  icon_key: string;
  locale_content: ExperienceRecord["localeContent"];
  card_asset_id: string | null;
  hero_asset_id: string | null;
  gallery_asset_ids: string[] | null;
  version: number;
  deleted_at: string | null;
};

type GalleryRow = {
  id: "global";
  version: number;
  updated_by: string | null;
  updated_at: string;
};

type GalleryItemRow = {
  id: string;
  asset_id: string;
  visible: boolean;
  sort_order: number;
  locale_content: GalleryItemInput["localeContent"];
};

type BungalowContentRow = {
  bungalow_id: string;
  featured_on_home: boolean;
  sort_order: number;
  hero_image_url: string;
  gallery_urls: string[];
  nightly_rate_pen: number;
  area_sqm: number;
  locale_content: BungalowContentRecord["localeContent"];
  hero_asset_id: string | null;
  gallery_asset_ids: string[] | null;
  revision_version: number;
  updated_at: string;
};

function hasDuplicatedSortOrder(items: GalleryItemInput[]) {
  return new Set(items.map((item) => item.sortOrder)).size !== items.length;
}

function mapExperienceRow(row: ExperienceRow): ExperienceRecord {
  return {
    id: row.id,
    slug: row.slug,
    visible: row.visible,
    featuredOnHome: row.featured_on_home,
    sortOrder: row.sort_order,
    iconKey: row.icon_key,
    localeContent: structuredClone(row.locale_content),
    cardAssetId: row.card_asset_id,
    heroAssetId: row.hero_asset_id,
    galleryAssetIds: Array.isArray(row.gallery_asset_ids) ? [...row.gallery_asset_ids] : [],
    version: row.version,
    deletedAt: row.deleted_at,
  };
}

function mapBungalowContentRow(row: BungalowContentRow): BungalowContentRecord {
  return {
    bungalowId: row.bungalow_id,
    revisionVersion: row.revision_version,
    featuredOnHome: row.featured_on_home,
    sortOrder: row.sort_order,
    heroImageUrl: row.hero_image_url,
    galleryUrls: Array.isArray(row.gallery_urls) ? [...row.gallery_urls] : [],
    nightlyRatePen: row.nightly_rate_pen,
    areaSqm: row.area_sqm,
    localeContent: structuredClone(row.locale_content),
    heroAssetId: row.hero_asset_id,
    galleryAssetIds: Array.isArray(row.gallery_asset_ids) ? [...row.gallery_asset_ids] : [],
    updatedAt: row.updated_at,
  };
}

function mapGalleryItemRow(row: GalleryItemRow): GalleryItemInput {
  return {
    id: row.id,
    assetId: row.asset_id,
    visible: row.visible,
    sortOrder: row.sort_order,
    localeContent: structuredClone(row.locale_content),
  };
}

export class PostgresContentStore {
  constructor(private readonly pool: Pool) {}

  private async withTransaction<T>(operation: (client: Pick<PoolClient, "query">) => Promise<T>): Promise<T> {
    if (typeof this.pool.connect !== "function") {
      return operation(this.pool as unknown as Pick<PoolClient, "query">);
    }

    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const result = await operation(client);
      await client.query("commit");
      return result;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async createExperience(input: ExperienceInput): Promise<ExperienceRecord> {
    const value = experienceSchema.parse(input);
    const result = await this.pool.query<ExperienceRow>(
      `
        insert into content_experience (
          id, slug, visible, featured_on_home, sort_order, icon_key, locale_content,
          card_asset_id, hero_asset_id, gallery_asset_ids
        )
        values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10)
        returning
          id, slug, visible, featured_on_home, sort_order, icon_key, locale_content,
          card_asset_id, hero_asset_id, gallery_asset_ids, version, deleted_at
      `,
      [
        value.id,
        value.slug,
        value.visible,
        value.featuredOnHome,
        value.sortOrder,
        value.iconKey,
        JSON.stringify(value.localeContent),
        value.cardAssetId,
        value.heroAssetId,
        value.galleryAssetIds,
      ],
    );

    return mapExperienceRow(result.rows[0]);
  }

  async listExperiences(options?: {
    includeArchived?: boolean;
    visibleOnly?: boolean;
  }): Promise<ExperienceRecord[]> {
    const includeArchived = options?.includeArchived ?? false;
    const visibleOnly = options?.visibleOnly ?? false;

    const filters = [];
    const values: Array<boolean> = [];

    if (!includeArchived) {
      filters.push("deleted_at is null");
    }

    if (visibleOnly) {
      filters.push("visible = true");
    }

    const whereClause = filters.length > 0 ? `where ${filters.join(" and ")}` : "";
    const result = await this.pool.query<ExperienceRow>(
      `
        select
          id, slug, visible, featured_on_home, sort_order, icon_key, locale_content,
          card_asset_id, hero_asset_id, gallery_asset_ids, version, deleted_at
        from content_experience
        ${whereClause}
        order by sort_order asc, slug asc
      `,
      values,
    );

    return result.rows.map((row) => mapExperienceRow(row));
  }

  async getExperienceById(id: string): Promise<ExperienceRecord | null> {
    const result = await this.pool.query<ExperienceRow>(
      `
        select
          id, slug, visible, featured_on_home, sort_order, icon_key, locale_content,
          card_asset_id, hero_asset_id, gallery_asset_ids, version, deleted_at
        from content_experience
        where id = $1
        limit 1
      `,
      [id],
    );

    return result.rows[0] ? mapExperienceRow(result.rows[0]) : null;
  }

  async getExperienceBySlug(slug: string): Promise<ExperienceRecord | null> {
    const result = await this.pool.query<ExperienceRow>(
      `
        select
          id, slug, visible, featured_on_home, sort_order, icon_key, locale_content,
          card_asset_id, hero_asset_id, gallery_asset_ids, version, deleted_at
        from content_experience
        where slug = $1
          and deleted_at is null
        limit 1
      `,
      [slug],
    );

    return result.rows[0] ? mapExperienceRow(result.rows[0]) : null;
  }

  async updateExperience(id: string, input: ExperienceInput & { expectedVersion: number }): Promise<ExperienceRecord> {
    const { expectedVersion } = input;
    const value = experienceSchema.parse(input);

    return this.withTransaction(async (client) => {
      const current = await client.query<{ version: number }>(
        `
          select version
          from content_experience
          where id = $1
            and deleted_at is null
          limit 1
          for update
        `,
        [id],
      );

      const currentVersion = current.rows[0]?.version;
      if (!currentVersion) {
        throw new Error("content_not_found");
      }
      if (expectedVersion !== currentVersion) {
        throw new Error("content_version_conflict");
      }

      const result = await client.query<ExperienceRow>(
        `
          update content_experience
          set slug = $2,
              visible = $3,
              featured_on_home = $4,
              sort_order = $5,
              icon_key = $6,
              locale_content = $7::jsonb,
              card_asset_id = $8,
              hero_asset_id = $9,
              gallery_asset_ids = $10,
              version = version + 1
          where id = $1
          returning
            id, slug, visible, featured_on_home, sort_order, icon_key, locale_content,
            card_asset_id, hero_asset_id, gallery_asset_ids, version, deleted_at
        `,
        [
          id,
          value.slug,
          value.visible,
          value.featuredOnHome,
          value.sortOrder,
          value.iconKey,
          JSON.stringify(value.localeContent),
          value.cardAssetId,
          value.heroAssetId,
          value.galleryAssetIds,
        ],
      );

      return mapExperienceRow(result.rows[0]);
    });
  }

  async archiveExperience(id: string, expectedVersion: number): Promise<ExperienceRecord> {
    return this.withTransaction(async (client) => {
      const current = await client.query<{ version: number }>(
        `
          select version
          from content_experience
          where id = $1
            and deleted_at is null
          limit 1
          for update
        `,
        [id],
      );

      const currentVersion = current.rows[0]?.version;
      if (!currentVersion) {
        throw new Error("content_not_found");
      }
      if (expectedVersion !== currentVersion) {
        throw new Error("content_version_conflict");
      }

      const result = await client.query<ExperienceRow>(
        `
          update content_experience
          set visible = false,
              featured_on_home = false,
              deleted_at = now(),
              version = version + 1
          where id = $1
          returning
            id, slug, visible, featured_on_home, sort_order, icon_key, locale_content,
            card_asset_id, hero_asset_id, gallery_asset_ids, version, deleted_at
        `,
        [id],
      );

      return mapExperienceRow(result.rows[0]);
    });
  }

  async publishGallery(input: PublishGalleryInput): Promise<GalleryPublication> {
    const items = input.items.map((item) => galleryItemSchema.parse(item));
    if (hasDuplicatedSortOrder(items)) {
      throw new Error("content_order_invalid");
    }

    return this.withTransaction(async (client) => {
      const current = await client.query<{ version: number }>(
        `
          select version
          from content_gallery
          where id = 'global'
          limit 1
          for update
        `,
      );
      const currentVersion = current.rows[0]?.version ?? 0;
      if (input.expectedVersion !== currentVersion) {
        throw new Error("content_version_conflict");
      }

      const updatedAt = new Date().toISOString();
      const saved = await client.query<GalleryRow>(
        `
          insert into content_gallery (id, version, updated_by, updated_at)
          values ('global', $1, $2, $3)
          on conflict (id) do update
          set version = excluded.version,
              updated_by = excluded.updated_by,
              updated_at = excluded.updated_at
          returning id, version, updated_by, updated_at
        `,
        [currentVersion + 1, input.actorId, updatedAt],
      );

      await client.query(`delete from content_gallery_item where gallery_id = 'global'`);

      for (const item of items) {
        await client.query(
          `
            insert into content_gallery_item (
              id, gallery_id, asset_id, visible, sort_order, locale_content
            )
            values ($1, 'global', $2, $3, $4, $5::jsonb)
          `,
          [item.id, item.assetId, item.visible, item.sortOrder, JSON.stringify(item.localeContent)],
        );
      }

      return {
        id: "global",
        version: saved.rows[0].version,
        updatedBy: saved.rows[0].updated_by,
        updatedAt: saved.rows[0].updated_at,
        items,
      };
    });
  }

  async getGallery(): Promise<GalleryPublication> {
    const current = await this.pool.query<GalleryRow>(
      `
        select id, version, updated_by, updated_at
        from content_gallery
        where id = 'global'
        limit 1
      `,
    );
    const items = await this.pool.query<GalleryItemRow>(
      `
        select id, asset_id, visible, sort_order, locale_content
        from content_gallery_item
        where gallery_id = 'global'
          and archived_at is null
        order by sort_order asc, id asc
      `,
    );

    return {
      id: "global",
      version: current.rows[0]?.version ?? 0,
      updatedBy: current.rows[0]?.updated_by ?? null,
      updatedAt: current.rows[0]?.updated_at ?? new Date(0).toISOString(),
      items: items.rows.map((row) => mapGalleryItemRow(row)),
    };
  }

  async updateBungalowContent(bungalowId: string, input: BungalowContentUpdateInput): Promise<BungalowContentRecord> {
    const value = bungalowContentUpdateSchema.parse(input);
    return this.withTransaction(async (client) => {
      const current = await client.query<{ revision_version: number }>(
        `
          select revision_version
          from bungalow_public_content
          where bungalow_id = $1
          limit 1
          for update
        `,
        [bungalowId],
      );

      const currentVersion = current.rows[0]?.revision_version ?? 0;
      if (value.expectedVersion !== currentVersion) {
        throw new Error("content_version_conflict");
      }

      const updatedAt = new Date().toISOString();
      const result = await client.query<BungalowContentRow>(
        `
          insert into bungalow_public_content (
            bungalow_id, featured_on_home, sort_order, hero_image_url, gallery_urls,
            nightly_rate_pen, area_sqm, locale_content, hero_asset_id, gallery_asset_ids,
            revision_version, updated_at
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11, $12)
          on conflict (bungalow_id) do update
          set featured_on_home = excluded.featured_on_home,
              sort_order = excluded.sort_order,
              hero_image_url = excluded.hero_image_url,
              gallery_urls = excluded.gallery_urls,
              nightly_rate_pen = excluded.nightly_rate_pen,
              area_sqm = excluded.area_sqm,
              locale_content = excluded.locale_content,
              hero_asset_id = excluded.hero_asset_id,
              gallery_asset_ids = excluded.gallery_asset_ids,
              revision_version = excluded.revision_version,
              updated_at = excluded.updated_at
          returning
            bungalow_id, featured_on_home, sort_order, hero_image_url, gallery_urls,
            nightly_rate_pen, area_sqm, locale_content, hero_asset_id, gallery_asset_ids,
            revision_version, updated_at
        `,
        [
          bungalowId,
          value.featuredOnHome,
          value.sortOrder,
          value.heroImageUrl,
          value.galleryUrls,
          value.nightlyRatePen,
          value.areaSqm,
          JSON.stringify(value.localeContent),
          value.heroAssetId ?? null,
          value.galleryAssetIds ?? [],
          currentVersion + 1,
          updatedAt,
        ],
      );

      return mapBungalowContentRow(result.rows[0]);
    });
  }
}

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function activeStore() {
  if (!hasDatabaseUrl()) {
    throw new Error("content_store_not_ready");
  }

  return new PostgresContentStore(getPool());
}

export const contentStore = {
  createExperience(input: ExperienceInput) {
    return activeStore().createExperience(input);
  },
  listExperiences(options?: { includeArchived?: boolean; visibleOnly?: boolean }) {
    return activeStore().listExperiences(options);
  },
  getExperienceById(id: string) {
    return activeStore().getExperienceById(id);
  },
  getExperienceBySlug(slug: string) {
    return activeStore().getExperienceBySlug(slug);
  },
  updateExperience(id: string, input: ExperienceInput & { expectedVersion: number }) {
    return activeStore().updateExperience(id, input);
  },
  archiveExperience(id: string, expectedVersion: number) {
    return activeStore().archiveExperience(id, expectedVersion);
  },
  publishGallery(input: PublishGalleryInput) {
    return activeStore().publishGallery(input);
  },
  getGallery() {
    return activeStore().getGallery();
  },
  updateBungalowContent(bungalowId: string, input: BungalowContentUpdateInput) {
    return activeStore().updateBungalowContent(bungalowId, input);
  },
};
