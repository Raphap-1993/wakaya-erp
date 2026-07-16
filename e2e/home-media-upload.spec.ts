import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";
import type { HomeContentDocument } from "@/lib/home-content/types";

type HomeContentApiBody = {
  item: {
    revisionVersion: number;
    document: HomeContentDocument;
  };
};

// Local-only command: E2E_BASE_URL=http://localhost:3212 E2E_MUTATION_ALLOWED=1 npx playwright test e2e/home-media-upload.spec.ts --project=chromium

function assertLocalMutationTarget() {
  const rawBaseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3200";
  let target: URL;
  try {
    target = new URL(rawBaseUrl);
  } catch {
    throw new Error(
      `Refusing mutating Home E2E with invalid E2E_BASE_URL: ${rawBaseUrl}`,
    );
  }

  const allowedHosts = new Set(["localhost", "127.0.0.1"]);
  const allowedPorts = new Set(["3212"]);
  if (
    !allowedHosts.has(target.hostname) ||
    !allowedPorts.has(target.port)
  ) {
    throw new Error(
      `Refusing mutating Home E2E outside localhost/127.0.0.1:3212: ${rawBaseUrl}`,
    );
  }

  if (process.env.E2E_MUTATION_ALLOWED !== "1") {
    throw new Error(
      "Set E2E_MUTATION_ALLOWED=1 to authorize the local mutating Home E2E.",
    );
  }
}

function readLocalEnvValue(key: string) {
  const envLocal = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
  return envLocal.match(new RegExp(`^${key}=(.+)$`, "m"))?.[1]?.trim().replace(/^['"]|['"]$/g, "") ?? "";
}

async function authenticateAdmin(
  page: import("@playwright/test").Page,
  next = "/admin/content?tab=home",
) {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  if (new URL(page.url()).pathname !== "/login") return;

  const email = readLocalEnvValue("BACKOFFICE_BOOTSTRAP_EMAIL");
  const password = readLocalEnvValue("BACKOFFICE_BOOTSTRAP_PASSWORD");
  if (!email || !password) throw new Error("Local backoffice credentials are required for authenticated E2E");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(new RegExp(`${next.replace(/[?]/g, "\\?")}$`));
}

async function readHomeContent(page: import("@playwright/test").Page) {
  const response = await page.request.get("/api/admin/home-content");
  expect(response.status()).toBe(200);
  return (await response.json()) as HomeContentApiBody;
}

async function restoreHomeContent(
  page: import("@playwright/test").Page,
  initial: HomeContentApiBody,
  testAssetUrl?: string,
) {
  const current = await readHomeContent(page);
  const response = await page.request.put("/api/admin/home-content", {
    data: {
      expectedVersion: current.item.revisionVersion,
      document: initial.item.document,
    },
  });
  expect(response.status()).toBe(200);

  const restored = await readHomeContent(page);
  expect(restored.item.document).toEqual(initial.item.document);

  if (testAssetUrl) {
    await page.goto("/es");
    await expect(page.locator(`img[src="${testAssetUrl}"]`)).toHaveCount(0);
  }
}

test("crops, optimizes and publishes a Home hero through managed media", async ({ page }) => {
  assertLocalMutationTarget();
  await page.setViewportSize({ width: 1600, height: 1000 });
  const originalFilename = `home-${randomUUID()}.jpg`;
  await authenticateAdmin(page);
  const initialHome = await readHomeContent(page);
  let heroDesktopUrl: string | undefined;

  try {
    let legacyUploadCount = 0;
    await page.route("**/api/admin/home-content/media", async (route) => {
      legacyUploadCount += 1;
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          media: { url: "/media/assets/legacy/heroDesktop.webp" },
        }),
      });
    });

    await expect(page.getByRole("heading", { level: 1, name: "Editor del home" })).toBeVisible();
    expect(
      await page.getByRole("button", { name: originalFilename, exact: true }).count(),
    ).toBe(0);

    const imageInput = page.locator("#home-editor-fields input[type=file]").first();
    await imageInput.setInputFiles({
      name: originalFilename,
      mimeType: "image/jpeg",
      buffer: fs.readFileSync(
        path.join(process.cwd(), "public/images/wakaya/gallery/gallery01.jpg"),
      ),
    });

    const dialog = page.getByRole("dialog", { name: "Recortes obligatorios" });
    await expect(dialog).toBeVisible();
    expect(legacyUploadCount).toBe(0);

    await expect(dialog.getByRole("tab", { name: "Desktop" })).toBeVisible();
    await expect(dialog.getByRole("tab", { name: "Mobile" })).toBeVisible();
    const applyButton = dialog.getByRole("button", { name: "Aplicar recortes" });
    await expect(applyButton).toBeDisabled();

    await dialog.getByRole("tab", { name: "Mobile" }).click();
    await expect(applyButton).toBeEnabled();

    const uploadResponsePromise = page.waitForResponse(
      (response) => response.url().includes("/api/admin/content/media") && response.request().method() === "POST",
    );
    await applyButton.click();
    const uploadResponse = await uploadResponsePromise;
    expect(uploadResponse.status()).toBe(201);
    const uploadBody = await uploadResponse.json();
    expect(uploadBody.asset?.originalFilename).toBe(originalFilename);
    heroDesktopUrl = uploadBody.asset?.variants?.heroDesktop?.url as string | undefined;
    expect(heroDesktopUrl).toMatch(/^\/media\/assets\/.+\/heroDesktop\.webp$/);
    const storedMediaResponse = await page.request.get(heroDesktopUrl ?? "");
    expect(storedMediaResponse.status()).toBe(200);
    expect(storedMediaResponse.headers()["content-type"]).toContain("image/webp");
    await expect(page.getByText("Imagen optimizada y lista para publicar en el home.")).toBeVisible();

    const filenameButton = page.getByRole("button", { name: originalFilename, exact: true });
    await expect(filenameButton).toBeVisible();
    await filenameButton.click();
    const previewDialog = page.getByRole("dialog", { name: "Vista previa de imagen" });
    await expect(previewDialog).toBeVisible();
    await expect(
      previewDialog.getByRole("img", { name: originalFilename, exact: true }),
    ).toHaveAttribute("src", heroDesktopUrl ?? "");
    await previewDialog.getByRole("button", { name: "Cerrar", exact: true }).click();

    const publishResponsePromise = page.waitForResponse(
      (response) => response.url().endsWith("/api/admin/home-content") && response.request().method() === "PUT",
    );
    await page.getByRole("button", { name: "Publicar cambios" }).click();
    const publishResponse = await publishResponsePromise;
    expect(publishResponse.status()).toBe(200);
    await expect(page.getByText(/^Home publicado como versión /)).toBeVisible();
    await expect(page.locator("#home-validation-feedback").getByRole("alert")).toHaveCount(0);

    await page.reload();
    await expect(page).toHaveURL(/\/admin\/content\?tab=home$/);
    await expect(
      page.getByRole("button", { name: originalFilename, exact: true }),
    ).toBeVisible();

    const screenshotDirectory = path.join(process.cwd(), "output", "playwright");
    fs.mkdirSync(screenshotDirectory, { recursive: true });
    await page.screenshot({
      path: path.join(screenshotDirectory, "home-media-crop-publication.png"),
      fullPage: true,
    });

    await page.goto("/es");
    await expect(page.locator(`img[src="${heroDesktopUrl}"]`).first()).toBeVisible();
  } finally {
    await restoreHomeContent(page, initialHome, heroDesktopUrl);
  }
});
