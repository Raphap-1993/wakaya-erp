import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE_URL = "https://wakayaecolodge.com/es/";
const USER_AGENT = "WakayaLegacyCorporateScraper/1.0";

const PAGE_SPECS = [
  { slug: "aboutus", file: "aboutus.php", sectionClass: "about" },
  { slug: "terms", file: "terms.php", sectionClass: "terms" },
  { slug: "faq", file: "faq.php", sectionClass: "faq" },
  { slug: "testimonial", file: "testimonial.php", sectionClass: "testimonial" },
];

const CURATED_PUBLIC_ASSETS = [
  {
    key: "aboutReception",
    url: new URL("images/wakaya/aboutus/recepcion.jpg", BASE_URL).href,
    output: "public/images/wakaya/company/about-recepcion.jpg",
  },
  {
    key: "aboutNature",
    url: new URL("images/wakaya/aboutus/bg_acercade.jpg", BASE_URL).href,
    output: "public/images/wakaya/company/about-naturaleza.jpg",
  },
  {
    key: "reviewMichael",
    url: new URL("images/wakaya/review/review1.jpg", BASE_URL).href,
    output: "public/images/wakaya/company/review-michael.jpg",
  },
  {
    key: "reviewKetty",
    url: new URL("images/wakaya/review/review2.jpg", BASE_URL).href,
    output: "public/images/wakaya/company/review-ketty.jpg",
  },
  {
    key: "reviewGuest",
    url: new URL("images/wakaya/review/review3.jpg", BASE_URL).href,
    output: "public/images/wakaya/company/review-huesped.jpg",
  },
  {
    key: "quoteIcon",
    url: new URL("images/icons/quote.png", BASE_URL).href,
    output: "public/images/wakaya/company/quote.png",
  },
];

const ARCHIVE_ASSET_PATTERNS = [
  /images\/wakaya\/aboutus\//,
  /images\/wakaya\/review\//,
  /images\/wakaya\/services\//,
  /images\/icons\/quote\.png$/,
];

const HTML_ENTITY_MAP = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&aacute;": "á",
  "&eacute;": "é",
  "&iacute;": "í",
  "&oacute;": "ó",
  "&uacute;": "ú",
  "&Aacute;": "Á",
  "&Eacute;": "É",
  "&Iacute;": "Í",
  "&Oacute;": "Ó",
  "&Uacute;": "Ú",
  "&ntilde;": "ñ",
  "&Ntilde;": "Ñ",
  "&uuml;": "ü",
  "&Uuml;": "Ü",
  "&deg;": "°",
  "&iexcl;": "¡",
  "&iquest;": "¿",
  "&mdash;": "—",
  "&ndash;": "–",
  "&rsquo;": "’",
  "&lsquo;": "‘",
  "&ldquo;": "“",
  "&rdquo;": "”",
};

const REQUEST_TIMEOUT_MS = 30000;

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(repoRoot, "output", "wakaya-corporate-legacy");
const htmlRoot = path.join(outputRoot, "html");
const extractedRoot = path.join(outputRoot, "extracted");
const archiveAssetRoot = path.join(outputRoot, "assets");

async function ensureParent(filePath) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

function decodeHtml(source) {
  let decoded = source;

  for (const [entity, value] of Object.entries(HTML_ENTITY_MAP)) {
    decoded = decoded.split(entity).join(value);
  }

  decoded = decoded.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_, code) =>
    String.fromCharCode(Number.parseInt(code, 16)),
  );

  return decoded;
}

function stripTags(source) {
  return decodeHtml(
    source
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+\n/g, "\n")
      .replace(/\n\s+/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{2,}/g, "\n\n")
      .trim(),
  );
}

function sanitizeFileName(name) {
  return decodeURIComponent(name)
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function extractSectionHtml(html, sectionClass) {
  const match = html.match(
    new RegExp(`<section class="${sectionClass}"[\\s\\S]*?<\\/section>`, "i"),
  );
  return match?.[0] ?? "";
}

function extractPageTitle(html) {
  const breadcrumbTitle = html.match(/<div class="breadcrumb-content">[\s\S]*?<h2>([\s\S]*?)<\/h2>/i);
  if (breadcrumbTitle?.[1]) {
    return stripTags(breadcrumbTitle[1]);
  }

  const documentTitle = html.match(/<title>([\s\S]*?)<\/title>/i);
  return documentTitle?.[1] ? stripTags(documentTitle[1]) : "";
}

function extractHeadings(sectionHtml) {
  return [...sectionHtml.matchAll(/<h[2-5][^>]*>([\s\S]*?)<\/h[2-5]>/gi)]
    .map((match) => stripTags(match[1]))
    .filter(Boolean);
}

function extractParagraphs(sectionHtml) {
  return [...sectionHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => stripTags(match[1]))
    .filter(Boolean);
}

function extractAssets(html) {
  const matches = [...html.matchAll(/(?:src|href)="([^"]+)"/gi)];
  const urls = new Set();

  for (const match of matches) {
    const raw = match[1];
    if (!ARCHIVE_ASSET_PATTERNS.some((pattern) => pattern.test(raw))) {
      continue;
    }

    urls.add(new URL(raw, BASE_URL).href);
  }

  return [...urls];
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { "user-agent": USER_AGENT },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

async function fetchBinary(url) {
  const response = await fetch(url, {
    headers: { "user-agent": USER_AGENT },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function saveText(filePath, content) {
  await ensureParent(filePath);
  await writeFile(filePath, content, "utf8");
}

async function saveBinary(filePath, buffer) {
  await ensureParent(filePath);
  await writeFile(filePath, buffer);
}

async function downloadArchiveAsset(url) {
  const pathname = new URL(url).pathname.replace(/^\/+/, "");
  const pathSegments = pathname.split("/").map((segment, index, list) => {
    if (index !== list.length - 1) {
      return segment;
    }

    const extension = path.extname(segment);
    const baseName = segment.slice(0, extension.length ? -extension.length : undefined);
    return `${sanitizeFileName(baseName)}${extension.toLowerCase()}`;
  });

  const outputPath = path.join(archiveAssetRoot, ...pathSegments);
  const buffer = await fetchBinary(url);
  await saveBinary(outputPath, buffer);

  return {
    sourceUrl: url,
    outputPath: path.relative(repoRoot, outputPath),
  };
}

async function downloadCuratedAsset(asset) {
  const outputPath = path.join(repoRoot, asset.output);
  const buffer = await fetchBinary(asset.url);
  await saveBinary(outputPath, buffer);

  return {
    key: asset.key,
    sourceUrl: asset.url,
    outputPath: asset.output,
  };
}

async function main() {
  await mkdir(htmlRoot, { recursive: true });
  await mkdir(extractedRoot, { recursive: true });
  await mkdir(archiveAssetRoot, { recursive: true });

  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceBaseUrl: BASE_URL,
    pages: [],
    curatedPublicAssets: [],
    errors: [],
  };

  const archiveAssetUrls = new Set();

  for (const page of PAGE_SPECS) {
    const url = new URL(page.file, BASE_URL).href;
    const html = await fetchText(url);
    const htmlPath = path.join(htmlRoot, `${page.slug}.html`);
    const sectionHtml = extractSectionHtml(html, page.sectionClass);
    const pageAssets = extractAssets(html);

    pageAssets.forEach((assetUrl) => archiveAssetUrls.add(assetUrl));

    await saveText(htmlPath, html);
    await saveText(
      path.join(extractedRoot, `${page.slug}.json`),
      JSON.stringify(
        {
          slug: page.slug,
          url,
          title: extractPageTitle(html),
          headings: extractHeadings(sectionHtml),
          paragraphs: extractParagraphs(sectionHtml),
          assetUrls: pageAssets,
        },
        null,
        2,
      ),
    );

    manifest.pages.push({
      slug: page.slug,
      url,
      htmlPath: path.relative(repoRoot, htmlPath),
      extractedPath: path.relative(repoRoot, path.join(extractedRoot, `${page.slug}.json`)),
      assetCount: pageAssets.length,
    });
  }

  const archivedAssets = [];
  for (const assetUrl of [...archiveAssetUrls]) {
    try {
      archivedAssets.push(await downloadArchiveAsset(assetUrl));
    } catch (error) {
      manifest.errors.push({
        phase: "archive-asset",
        assetUrl,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const curatedAssets = [];
  for (const asset of CURATED_PUBLIC_ASSETS) {
    try {
      curatedAssets.push(await downloadCuratedAsset(asset));
    } catch (error) {
      manifest.errors.push({
        phase: "curated-asset",
        assetKey: asset.key,
        assetUrl: asset.url,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  manifest.archivedAssets = archivedAssets;
  manifest.curatedPublicAssets = curatedAssets;

  await saveText(path.join(outputRoot, "manifest.json"), JSON.stringify(manifest, null, 2));

  console.log(
    JSON.stringify(
      {
        pages: manifest.pages.length,
        archivedAssets: archivedAssets.length,
        curatedPublicAssets: curatedAssets.length,
        errors: manifest.errors.length,
        manifest: path.relative(repoRoot, path.join(outputRoot, "manifest.json")),
      },
      null,
      2,
    ),
  );

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
