#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");

const sharp = require("sharp");
const ts = require("typescript");
const { Client } = require("pg");

const ROOT = process.cwd();

const VARIANT_DIMENSIONS = {
  heroDesktop: { width: 1920, height: 1080, quality: 88 },
  heroMobile: { width: 1080, height: 1350, quality: 88 },
  detail: { width: 1600, height: 1200, quality: 86 },
  card: { width: 960, height: 720, quality: 86 },
  thumb: { width: 480, height: 360, quality: 84 },
};

function parseArgs(argv) {
  return {
    apply: argv.includes("--apply"),
    force: argv.includes("--force"),
    verbose: argv.includes("--verbose"),
  };
}

function loadTsModuleExports(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: filePath,
  }).outputText;

  const module = { exports: {} };
  const sandbox = {
    module,
    exports: module.exports,
    require: (specifier) => {
      throw new Error(`Unsupported runtime import while loading ${filePath}: ${specifier}`);
    },
    console,
    structuredClone,
  };
  vm.runInNewContext(transpiled, sandbox, { filename: filePath });
  return module.exports;
}

function loadSeedData() {
  const experiencesModule = loadTsModuleExports(path.join(ROOT, "src/lib/content/default-experiences.ts"));
  const galleryModule = loadTsModuleExports(path.join(ROOT, "src/lib/content/default-gallery.ts"));
  const homeModule = loadTsModuleExports(path.join(ROOT, "src/lib/home-content/default-content.ts"));

  return {
    experiences: experiencesModule.DEFAULT_PUBLIC_EXPERIENCES,
    gallery: galleryModule.DEFAULT_PUBLIC_GALLERY,
    home: homeModule.DEFAULT_HOME_CONTENT,
  };
}

function resolveMediaRoot() {
  const configured = process.env.WAKAYA_MEDIA_STORAGE_PATH?.trim();
  return path.resolve(ROOT, configured || ".data/wakaya-media");
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function mimeTypeFor(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  switch (extension) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    default:
      throw new Error(`Unsupported image extension: ${extension}`);
  }
}

function urlPathCandidates(inputUrl) {
  const url = new URL(inputUrl, "https://wakayaecolodge.com");
  const decoded = decodeURIComponent(url.pathname);
  const normalized = decoded.replace(/^\/(es|en)\//, "/");
  const rawNormalized = url.pathname.replace(/^\/(es|en)\//, "/");

  return [normalized, rawNormalized].filter((value, index, list) => value && list.indexOf(value) === index);
}

function resolveLegacyImagePath(inputUrl) {
  const candidates = urlPathCandidates(inputUrl).map((value) => path.join(ROOT, "public", value));
  const existing = candidates.find((candidate) => fs.existsSync(candidate));
  if (!existing) {
    throw new Error(`Legacy image not found for ${inputUrl}`);
  }
  return existing;
}

function createCenteredCrop(sourceWidth, sourceHeight, targetWidth, targetHeight) {
  const sourceAspect = sourceWidth / sourceHeight;
  const targetAspect = targetWidth / targetHeight;

  if (sourceAspect > targetAspect) {
    const cropWidth = sourceHeight * targetAspect;
    return {
      x: (sourceWidth - cropWidth) / (2 * sourceWidth),
      y: 0,
      width: cropWidth / sourceWidth,
      height: 1,
      rotation: 0,
    };
  }

  const cropHeight = sourceWidth / targetAspect;
  return {
    x: 0,
    y: (sourceHeight - cropHeight) / (2 * sourceHeight),
    width: 1,
    height: cropHeight / sourceHeight,
    rotation: 0,
  };
}

function buildVariantCropMap(sourceWidth, sourceHeight, slot) {
  if (slot === "hero") {
    return {
      heroDesktop: createCenteredCrop(sourceWidth, sourceHeight, 1920, 1080),
      heroMobile: createCenteredCrop(sourceWidth, sourceHeight, 1080, 1350),
    };
  }

  if (slot === "card") {
    return {
      card: createCenteredCrop(sourceWidth, sourceHeight, 960, 720),
      thumb: createCenteredCrop(sourceWidth, sourceHeight, 480, 360),
    };
  }

  return {
    detail: createCenteredCrop(sourceWidth, sourceHeight, 1600, 1200),
    thumb: createCenteredCrop(sourceWidth, sourceHeight, 480, 360),
  };
}

function extractCropPixels(sourceWidth, sourceHeight, crop) {
  const left = Math.max(0, Math.round(crop.x * sourceWidth));
  const top = Math.max(0, Math.round(crop.y * sourceHeight));
  const width = Math.min(sourceWidth - left, Math.max(1, Math.round(crop.width * sourceWidth)));
  const height = Math.min(sourceHeight - top, Math.max(1, Math.round(crop.height * sourceHeight)));
  return { left, top, width, height };
}

async function createVariantArtifact(sourceBuffer, sourceMeta, variantKey, crop) {
  const target = VARIANT_DIMENSIONS[variantKey];
  const extract = extractCropPixels(sourceMeta.width, sourceMeta.height, crop);
  const output = await sharp(sourceBuffer, { failOn: "error" })
    .extract(extract)
    .resize({
      width: target.width,
      height: target.height,
      fit: "cover",
      withoutEnlargement: true,
    })
    .webp({
      quality: target.quality,
      effort: 6,
    })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: output.data,
    width: output.info.width,
    height: output.info.height,
    bytes: output.info.size,
    quality: target.quality,
    crop,
  };
}

async function createMasterArtifact(sourceBuffer) {
  const output = await sharp(sourceBuffer, { failOn: "error" })
    .resize({
      width: 3200,
      height: 3200,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      nearLossless: true,
      quality: 95,
      effort: 6,
    })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: output.data,
    width: output.info.width,
    height: output.info.height,
    bytes: output.info.size,
  };
}

function deterministicAssetId(slot, absolutePath) {
  const digest = crypto.createHash("sha1").update(`${slot}:${path.relative(ROOT, absolutePath)}`).digest("hex");
  return `asset_seed_${digest.slice(0, 24)}`;
}

function storageKey(assetId, fileName) {
  return `assets/${assetId}/${fileName}`;
}

function storagePath(mediaRoot, key) {
  return path.join(mediaRoot, ...key.split("/"));
}

function publicMediaUrl(key) {
  return `/media/${key}`;
}

function toAbsolutePublicUrl(value) {
  if (!value) return value;
  if (/^https?:\/\//i.test(value)) return value;
  return `https://wakayaecolodge.com${value.startsWith("/") ? value : `/${value}`}`;
}

async function ensureSeedAsset(client, mediaRoot, absolutePath, slot, options = {}) {
  const assetId = deterministicAssetId(slot, absolutePath);
  const sourceBuffer = fs.readFileSync(absolutePath);
  const sourceMeta = await sharp(sourceBuffer).metadata();
  if (!sourceMeta.width || !sourceMeta.height) {
    throw new Error(`Missing image dimensions for ${absolutePath}`);
  }

  const checksum = crypto.createHash("sha256").update(sourceBuffer).digest("hex");
  const mimeType = mimeTypeFor(absolutePath);
  const master = await createMasterArtifact(sourceBuffer);
  const crops = buildVariantCropMap(sourceMeta.width, sourceMeta.height, slot);
  const variants = {};

  for (const [variantKey, crop] of Object.entries(crops)) {
    variants[variantKey] = await createVariantArtifact(sourceBuffer, sourceMeta, variantKey, crop);
  }

  if (options.apply) {
    ensureDir(path.dirname(storagePath(mediaRoot, storageKey(assetId, "master.webp"))));
    fs.writeFileSync(storagePath(mediaRoot, storageKey(assetId, "master.webp")), master.buffer);

    for (const [variantKey, artifact] of Object.entries(variants)) {
      fs.writeFileSync(storagePath(mediaRoot, storageKey(assetId, `${variantKey}.webp`)), artifact.buffer);
    }

    await client.query(
      `
        insert into media_asset (
          id, storage_key, checksum_sha256, mime_type, format, width, height, byte_size, status, created_by
        )
        values ($1, $2, $3, $4, 'webp', $5, $6, $7, 'ready', null)
        on conflict (id) do update
        set storage_key = excluded.storage_key,
            checksum_sha256 = excluded.checksum_sha256,
            mime_type = excluded.mime_type,
            format = excluded.format,
            width = excluded.width,
            height = excluded.height,
            byte_size = excluded.byte_size,
            status = excluded.status,
            updated_at = now()
      `,
      [assetId, storageKey(assetId, "master.webp"), checksum, mimeType, master.width, master.height, master.bytes],
    );

    for (const [variantKey, artifact] of Object.entries(variants)) {
      await client.query(
        `
          insert into media_variant (
            id, asset_id, slot, storage_key, format, width, height, quality, crop_spec, byte_size
          )
          values ($1, $2, $3, $4, 'webp', $5, $6, $7, $8::jsonb, $9)
          on conflict (id) do update
          set slot = excluded.slot,
              storage_key = excluded.storage_key,
              width = excluded.width,
              height = excluded.height,
              quality = excluded.quality,
              crop_spec = excluded.crop_spec,
              byte_size = excluded.byte_size,
              updated_at = now()
        `,
        [
          `${assetId}_${variantKey}`,
          assetId,
          variantKey,
          storageKey(assetId, `${variantKey}.webp`),
          artifact.width,
          artifact.height,
          artifact.quality,
          JSON.stringify(artifact.crop),
          artifact.bytes,
        ],
      );
    }
  }

  return {
    assetId,
    absolutePath,
    slot,
    master,
    variants: Object.fromEntries(
      Object.entries(variants).map(([variantKey, artifact]) => [
        variantKey,
        {
          url: publicMediaUrl(storageKey(assetId, `${variantKey}.webp`)),
          width: artifact.width,
          height: artifact.height,
        },
      ]),
    ),
  };
}

async function listCurrentCounts(client) {
  const queries = {
    experiences: `select count(*)::int as count from content_experience where deleted_at is null`,
    gallery: `select count(*)::int as count from content_gallery_item where archived_at is null`,
    media: `select count(*)::int as count from media_asset`,
    homeRevisions: `select count(*)::int as count from home_content_revision`,
  };
  const result = {};
  for (const [key, sql] of Object.entries(queries)) {
    const res = await client.query(sql);
    result[key] = res.rows[0]?.count ?? 0;
  }
  return result;
}

async function upsertExperience(client, value) {
  await client.query(
    `
      insert into content_experience (
        id, slug, visible, featured_on_home, sort_order, icon_key, locale_content,
        card_asset_id, hero_asset_id, gallery_asset_ids, version, deleted_at
      )
      values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, 1, null)
      on conflict (id) do update
      set slug = excluded.slug,
          visible = excluded.visible,
          featured_on_home = excluded.featured_on_home,
          sort_order = excluded.sort_order,
          icon_key = excluded.icon_key,
          locale_content = excluded.locale_content,
          card_asset_id = excluded.card_asset_id,
          hero_asset_id = excluded.hero_asset_id,
          gallery_asset_ids = excluded.gallery_asset_ids,
          deleted_at = null
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
}

async function listNonCanonicalExperienceIds(client, canonicalIds) {
  const result = await client.query(
    `
      select id
      from content_experience
      where deleted_at is null
        and not (id = any($1::text[]))
      order by id
    `,
    [canonicalIds],
  );
  return result.rows.map((row) => row.id);
}

async function archiveNonCanonicalExperiences(client, canonicalIds) {
  await client.query(
    `
      update content_experience
      set visible = false,
          featured_on_home = false,
          deleted_at = coalesce(deleted_at, now()),
          version = version + 1
      where deleted_at is null
        and not (id = any($1::text[]))
    `,
    [canonicalIds],
  );
}

async function upsertGallery(client, galleryItems) {
  await client.query(
    `
      insert into content_gallery (id, version, updated_by)
      values ('global', 1, null)
      on conflict (id) do nothing
    `,
  );

  for (const item of galleryItems) {
    await client.query(
      `
        insert into content_gallery_item (
          id, gallery_id, asset_id, visible, sort_order, locale_content, archived_at
        )
        values ($1, 'global', $2, $3, $4, $5::jsonb, null)
        on conflict (id) do update
        set asset_id = excluded.asset_id,
            visible = excluded.visible,
            sort_order = excluded.sort_order,
            locale_content = excluded.locale_content,
            archived_at = null
      `,
      [item.id, item.assetId, item.visible, item.sortOrder, JSON.stringify(item.localeContent)],
    );
  }
}

async function ensureHomeRevision(client, document, shouldApply) {
  const countRes = await client.query(`select count(*)::int as count from home_content_revision`);
  const count = countRes.rows[0]?.count ?? 0;
  if (count > 0 && !shouldApply) {
    return { inserted: false, existingCount: count };
  }

  if (shouldApply) {
    await client.query(
      `
        insert into home_content_revision (
          document,
          published_by_user_id,
          restored_from_version
        )
        values ($1::jsonb, null, null)
      `,
      [JSON.stringify(document)],
    );
  }

  return { inserted: true, existingCount: count };
}

async function buildSeedHomeDocument(document, resolveAsset) {
  const seeded = structuredClone(document);

  for (const slide of seeded.slider.slides) {
    if (typeof slide.image !== "string" || !slide.image) continue;
    const asset = await resolveAsset(slide.image, "hero");
    slide.image = toAbsolutePublicUrl(asset.variants.heroDesktop?.url || slide.image);
  }

  for (const section of seeded.sections) {
    if (!section?.content || typeof section.content.image !== "string" || !section.content.image) {
      continue;
    }
    const asset = await resolveAsset(section.content.image, "detail");
    section.content.image = toAbsolutePublicUrl(asset.variants.detail?.url || section.content.image);
  }

  return seeded;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  const mediaRoot = resolveMediaRoot();
  const { experiences, gallery, home } = loadSeedData();
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const before = await listCurrentCounts(client);
    console.log("Before:", JSON.stringify(before, null, 2));

    const shouldSeedExperiences = args.force || before.experiences === 0;
    const shouldSeedGallery = args.force || before.gallery === 0;
    const shouldSeedHome = args.force || before.homeRevisions === 0;

    console.log(
      JSON.stringify(
        {
          apply: args.apply,
          force: args.force,
          shouldSeedExperiences,
          shouldSeedGallery,
          shouldSeedHome,
          mediaRoot,
        },
        null,
        2,
      ),
    );

    const assetCache = new Map();
    const canonicalExperienceIds = experiences.map((item) => item.id);
    const experienceIdsToArchive = shouldSeedExperiences
      ? await listNonCanonicalExperienceIds(client, canonicalExperienceIds)
      : [];
    console.log("Experience reconciliation:", JSON.stringify({
      canonicalIds: canonicalExperienceIds,
      archiveIds: experienceIdsToArchive,
    }, null, 2));
    const resolveAsset = async (inputUrl, slot) => {
      const absolutePath = resolveLegacyImagePath(inputUrl);
      const key = `${slot}:${absolutePath}`;
      if (assetCache.has(key)) {
        return assetCache.get(key);
      }

      const asset = await ensureSeedAsset(client, mediaRoot, absolutePath, slot, { apply: args.apply });
      assetCache.set(key, asset);
      return asset;
    };

    if (shouldSeedExperiences) {
      for (const item of experiences) {
        const heroAsset = await resolveAsset(item.heroImage, "hero");
        const cardAsset = await resolveAsset(item.cardImage, "card");
        const galleryAssets = [];
        for (const image of item.galleryImages) {
          galleryAssets.push(await resolveAsset(image, "gallery"));
        }

        const payload = {
          id: item.id,
          slug: item.slug,
          visible: item.visible,
          featuredOnHome: item.featuredOnHome,
          sortOrder: item.sortOrder,
          iconKey: item.icon,
          localeContent: {
            es: {
              title: item.localeContent.es.title,
              summary: item.localeContent.es.summary,
              body: item.localeContent.es.body,
              duration: item.localeContent.es.duration,
              priceLabel: item.localeContent.es.priceLabel,
              ctaLabel: item.localeContent.es.ctaLabel,
              included: item.included.es,
              recommendations: item.recommendations.es,
            },
            en: {
              title: item.localeContent.en.title,
              summary: item.localeContent.en.summary,
              body: item.localeContent.en.body,
              duration: item.localeContent.en.duration,
              priceLabel: item.localeContent.en.priceLabel,
              ctaLabel: item.localeContent.en.ctaLabel,
              included: item.included.en,
              recommendations: item.recommendations.en,
            },
          },
          cardAssetId: cardAsset.assetId,
          heroAssetId: heroAsset.assetId,
          galleryAssetIds: galleryAssets.map((asset) => asset.assetId),
        };

        if (args.verbose) {
          console.log("Experience seed", item.id, payload);
        }

        if (args.apply) {
          await upsertExperience(client, payload);
        }
      }
      if (args.apply) {
        await archiveNonCanonicalExperiences(client, canonicalExperienceIds);
      }
    }

    if (shouldSeedGallery) {
      const payload = [];
      for (const item of gallery) {
        const asset = await resolveAsset(item.image, "gallery");
        payload.push({
          id: item.id,
          assetId: asset.assetId,
          visible: item.visible,
          sortOrder: item.sortOrder,
          localeContent: {
            es: { alt: item.alt.es, caption: item.caption.es },
            en: { alt: item.alt.en, caption: item.caption.en },
          },
        });
      }

      if (args.verbose) {
        console.log("Gallery seed items", payload.length);
      }

      if (args.apply) {
        await upsertGallery(client, payload);
      }
    }

    let seededHomeDocument = home;
    if (shouldSeedHome || args.force) {
      seededHomeDocument = await buildSeedHomeDocument(home, resolveAsset);
    }

    const homeResult = await ensureHomeRevision(
      client,
      seededHomeDocument,
      args.apply && (shouldSeedHome || args.force),
    );
    console.log("Home seed:", JSON.stringify(homeResult, null, 2));

    const after = await listCurrentCounts(client);
    console.log("After:", JSON.stringify(after, null, 2));
    console.log("Assets planned:", assetCache.size);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
