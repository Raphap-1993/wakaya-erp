import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

import type { GalleryPublication } from "@/lib/content/types";

const GALLERY_ROUTE = "/admin/content?tab=gallery";
const GALLERY_API = "/api/admin/content/gallery";

// Local-only command: E2E_BASE_URL=http://localhost:3212 E2E_MUTATION_ALLOWED=1 npx playwright test e2e/content-media-filename-preview.spec.ts --project=chromium

function assertLocalMutationTarget() {
  const rawBaseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3200";
  const target = new URL(rawBaseUrl);
  const allowedHosts = new Set(["localhost", "127.0.0.1"]);
  const allowedPorts = new Set(["3212"]);

  if (!allowedHosts.has(target.hostname) || !allowedPorts.has(target.port)) {
    throw new Error(
      `Refusing mutating Gallery E2E outside localhost/127.0.0.1:3212: ${rawBaseUrl}`,
    );
  }

  if (process.env.E2E_MUTATION_ALLOWED !== "1") {
    throw new Error(
      "Set E2E_MUTATION_ALLOWED=1 to authorize the local mutating Gallery E2E.",
    );
  }
}

function readLocalEnvValue(key: string) {
  const envLocal = fs.readFileSync(
    path.join(process.cwd(), ".env.local"),
    "utf8",
  );

  return (
    envLocal
      .match(new RegExp(`^${key}=(.+)$`, "m"))?.[1]
      ?.trim()
      .replace(/^['"]|['"]$/g, "") ?? ""
  );
}

async function authenticateAdmin(page: Page) {
  await page.goto(`/login?next=${encodeURIComponent(GALLERY_ROUTE)}`);
  if (new URL(page.url()).pathname !== "/login") {
    await expect(page).toHaveURL(/\/admin\/content\?tab=gallery$/);
    return;
  }

  const email = readLocalEnvValue("BACKOFFICE_BOOTSTRAP_EMAIL");
  const password = readLocalEnvValue("BACKOFFICE_BOOTSTRAP_PASSWORD");
  if (!email || !password) {
    throw new Error(
      "Local backoffice credentials are required for authenticated E2E",
    );
  }

  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/admin\/content\?tab=gallery$/);
}

async function readGallery(page: Page) {
  const response = await page.request.get(GALLERY_API);
  expect(response.status()).toBe(200);
  return (await response.json()) as GalleryPublication;
}

async function restoreGallery(page: Page, initial: GalleryPublication) {
  const current = await readGallery(page);
  const response = await page.request.put(GALLERY_API, {
    data: {
      expectedVersion: current.version,
      items: initial.items,
    },
  });
  expect(response.status()).toBe(200);

  const restored = await readGallery(page);
  expect(restored.items).toEqual(initial.items);
}

test("uploads, persists and previews a uniquely named global Gallery image", async ({
  page,
}) => {
  assertLocalMutationTarget();
  await page.setViewportSize({ width: 1600, height: 1000 });
  const runId = randomUUID();
  const originalFilename = `galeria-${runId}.jpg`;
  const copySuffix = runId.slice(0, 8);

  await authenticateAdmin(page);
  const initialGallery = await readGallery(page);
  let primaryError: unknown;

  try {
    expect(
      await page
        .getByRole("button", { name: originalFilename, exact: true })
        .count(),
    ).toBe(0);

    const newGalleryItem = page.getByRole("button", {
      name: /Imagen sin título Orden \d+/,
    });
    const galleryItemCountBefore = await newGalleryItem.count();
    await page.getByRole("button", { name: "Agregar imagen", exact: true }).click();
    await expect(newGalleryItem).toHaveCount(galleryItemCountBefore + 1);
    await newGalleryItem.last().click();

    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Subir imagen", exact: true }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: originalFilename,
      mimeType: "image/jpeg",
      buffer: fs.readFileSync(
        path.join(
          process.cwd(),
          "public/images/wakaya/gallery/gallery01.jpg",
        ),
      ),
    });

    const cropDialog = page.getByRole("dialog", {
      name: "Recorte fijo obligatorio",
    });
    await expect(cropDialog).toBeVisible();
    await page.waitForFunction(() => {
      const image = document.querySelector(
        '[role="dialog"] img',
      ) as HTMLImageElement | null;
      return Boolean(image && image.complete && image.naturalWidth > 0);
    });

    const applyCropButton = cropDialog.getByRole("button", {
      name: "Aplicar recortes",
    });
    await expect(applyCropButton).toBeEnabled();
    const uploadResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/admin/content/media") &&
        response.request().method() === "POST",
    );
    await applyCropButton.click();
    const uploadResponse = await uploadResponsePromise;
    expect(uploadResponse.status()).toBe(201);
    const uploadBody = await uploadResponse.json();
    expect(uploadBody.asset?.originalFilename).toBe(originalFilename);
    const previewUrl = uploadBody.asset?.variants?.detail?.url as
      | string
      | undefined;
    expect(previewUrl).toMatch(
      /^\/media\/assets\/[a-zA-Z0-9_-]+\/detail\.webp$/,
    );

    const filenameButton = page.getByRole("button", {
      name: originalFilename,
      exact: true,
    });
    await expect(filenameButton).toBeVisible();

    await page.getByLabel("Alt", { exact: true }).fill(`Río ${copySuffix}`);
    await page
      .getByLabel("Caption", { exact: true })
      .fill(`Galería río ${copySuffix}`);
    await page.getByRole("button", { name: "EN", exact: true }).click();
    await page.getByLabel("Alt", { exact: true }).fill(`River ${copySuffix}`);
    await page
      .getByLabel("Caption", { exact: true })
      .fill(`River gallery ${copySuffix}`);

    const publishResponsePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith(GALLERY_API) &&
        response.request().method() === "PUT",
    );
    await page
      .getByRole("button", { name: "Guardar y publicar", exact: true })
      .click();
    expect((await publishResponsePromise).status()).toBe(200);

    await page.reload();
    await page
      .getByRole("button", { name: new RegExp(`Galería río ${copySuffix}`) })
      .click();
    await page.getByRole("button", { name: "EN", exact: true }).click();
    await expect(page.getByLabel("Alt", { exact: true })).toHaveValue(
      `River ${copySuffix}`,
    );
    await expect(page.getByLabel("Caption", { exact: true })).toHaveValue(
      `River gallery ${copySuffix}`,
    );
    await page.getByRole("button", { name: "ES", exact: true }).click();
    const persistedFilenameButton = page.getByRole("button", {
      name: originalFilename,
      exact: true,
    });
    await expect(persistedFilenameButton).toBeVisible();
    await persistedFilenameButton.click();

    const dialog = page.getByRole("dialog", {
      name: "Vista previa de imagen",
    });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(originalFilename, { exact: true })).toBeVisible();
    const previewImage = dialog.getByRole("img", {
      name: originalFilename,
      exact: true,
    });
    await expect(previewImage).toBeVisible();
    await expect(previewImage).toHaveAttribute("src", previewUrl ?? "");

    await previewImage.click({ position: { x: 10, y: 10 } });
    await expect(dialog).toBeVisible();

    const screenshotDirectory = path.join(
      process.cwd(),
      "output",
      "playwright",
    );
    fs.mkdirSync(screenshotDirectory, { recursive: true });
    await page.screenshot({
      path: path.join(
        screenshotDirectory,
        "content-media-filename-preview.png",
      ),
      fullPage: true,
    });

    await page
      .getByTestId("media-preview-backdrop")
      .click({ position: { x: 5, y: 5 } });
    await expect(dialog).toHaveCount(0);
    await expect(persistedFilenameButton).toBeFocused();
  } catch (error) {
    primaryError = error;
    throw error;
  } finally {
    let cleanupError: unknown;
    try {
      await restoreGallery(page, initialGallery);
    } catch (error) {
      cleanupError = error;
    }

    try {
      await page.unrouteAll({ behavior: "wait" });
      await page.reload();
      await expect(page).toHaveURL(/\/admin\/content\?tab=gallery$/);
    } catch (error) {
      cleanupError ??= error;
    }

    if (cleanupError && !primaryError) {
      throw cleanupError;
    }
    if (cleanupError && primaryError) {
      console.error("Gallery E2E cleanup failed after the primary error", cleanupError);
    }
  }
});
