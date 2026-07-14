import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { expect, test, type Page, type Route } from "@playwright/test";
import type { HomeContentDocument } from "@/lib/home-content/types";

const HOME_ROUTE = "/admin/content?tab=home";

type HomeContentApiBody = {
  item: {
    revisionVersion: number;
    document: HomeContentDocument;
  };
};

function readLocalEnvValue(key: string) {
  const envLocal = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
  return envLocal.match(new RegExp(`^${key}=(.+)$`, "m"))?.[1]?.trim().replace(/^['"]|['"]$/g, "") ?? "";
}

async function authenticateAdmin(page: Page) {
  await page.goto(`/login?next=${encodeURIComponent(HOME_ROUTE)}`);
  if (new URL(page.url()).pathname !== "/login") return;

  const email = readLocalEnvValue("BACKOFFICE_BOOTSTRAP_EMAIL");
  const password = readLocalEnvValue("BACKOFFICE_BOOTSTRAP_PASSWORD");
  if (!email || !password) throw new Error("Local backoffice credentials are required for authenticated E2E");

  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/admin\/content\?tab=home$/);
}

async function readHomeContent(page: Page) {
  const response = await page.request.get("/api/admin/home-content");
  expect(response.status()).toBe(200);
  return (await response.json()) as HomeContentApiBody;
}

async function restoreHomeContent(
  page: Page,
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

async function uploadAndPublishHomeImage(page: Page, originalFilename: string) {
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

  const cropDialog = page.getByRole("dialog", { name: "Recortes obligatorios" });
  await expect(cropDialog).toBeVisible();
  const applyButton = cropDialog.getByRole("button", { name: "Aplicar recortes" });
  await cropDialog.getByRole("tab", { name: "Mobile" }).click();
  await expect(applyButton).toBeEnabled();

  const uploadResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/admin/content/media") &&
      response.request().method() === "POST",
  );
  await applyButton.click();
  const uploadResponse = await uploadResponsePromise;
  expect(uploadResponse.status()).toBe(201);
  const uploadBody = await uploadResponse.json();
  expect(uploadBody.asset?.originalFilename).toBe(originalFilename);
  const previewUrl = uploadBody.asset?.variants?.heroDesktop?.url as string | undefined;
  expect(previewUrl).toMatch(/^\/media\/assets\/.+\/heroDesktop\.webp$/);

  const filenameButton = page.getByRole("button", { name: originalFilename, exact: true });
  await expect(filenameButton).toBeVisible();

  const publishResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/admin/home-content") &&
      response.request().method() === "PUT",
  );
  await page.getByRole("button", { name: "Publicar cambios" }).click();
  expect((await publishResponsePromise).status()).toBe(200);

  await page.reload();
  await expect(
    page.getByRole("button", { name: originalFilename, exact: true }),
  ).toBeVisible();
  return previewUrl ?? "";
}

test("keeps the Home media preview accessible across close and error paths", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  const originalFilename = `preview-${randomUUID()}.jpg`;
  await authenticateAdmin(page);
  const initialHome = await readHomeContent(page);
  let previewUrl: string | undefined;
  let previewRouteInstalled = false;
  const previewUrlMatcher = (url: URL) =>
    Boolean(previewUrl) && url.pathname === previewUrl;
  const preview404Handler = async (route: Route) =>
    route.fulfill({ status: 404, body: "missing preview" });

  try {
    previewUrl = await uploadAndPublishHomeImage(page, originalFilename);

    let filenameButton = page.getByRole("button", { name: originalFilename, exact: true });
    await filenameButton.click();
    let dialog = page.getByRole("dialog", { name: "Vista previa de imagen" });
    const closeButton = dialog.getByRole("button", { name: "Cerrar", exact: true });
    const previewImage = dialog.getByRole("img", { name: originalFilename, exact: true });
    await expect(dialog).toBeVisible();
    await expect(previewImage).toBeVisible();
    await expect(previewImage).toHaveAttribute("src", previewUrl);
    await expect(closeButton).toBeFocused();

    const screenshotDirectory = path.join(process.cwd(), "output", "playwright");
    fs.mkdirSync(screenshotDirectory, { recursive: true });
    await page.screenshot({
      path: path.join(screenshotDirectory, "home-media-filename-preview-success.png"),
      fullPage: true,
    });

    await page.keyboard.press("Tab");
    await expect(closeButton).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(closeButton).toBeFocused();

    await closeButton.click();
    await expect(dialog).toHaveCount(0);
    await expect(filenameButton).toBeFocused();

    await filenameButton.click();
    dialog = page.getByRole("dialog", { name: "Vista previa de imagen" });
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(filenameButton).toBeFocused();

    await filenameButton.click();
    dialog = page.getByRole("dialog", { name: "Vista previa de imagen" });
    await dialog.click({ position: { x: 80, y: 180 } });
    await expect(dialog).toBeVisible();
    const backdrop = page.getByTestId("media-preview-backdrop");
    await backdrop.click({ position: { x: 4, y: 4 } });
    await expect(dialog).toHaveCount(0);
    await expect(filenameButton).toBeFocused();

    await page.route(previewUrlMatcher, preview404Handler);
    previewRouteInstalled = true;
    await page.reload();
    filenameButton = page.getByRole("button", { name: originalFilename, exact: true });
    await expect(filenameButton).toBeVisible();
    await filenameButton.click();
    dialog = page.getByRole("dialog", { name: "Vista previa de imagen" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("No se pudo cargar la imagen")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Cerrar", exact: true })).toBeFocused();
    await expect(filenameButton).toHaveAttribute("aria-expanded", "true");

    await page.screenshot({
      path: path.join(screenshotDirectory, "home-media-filename-preview-error.png"),
      fullPage: true,
    });
  } finally {
    if (previewRouteInstalled) {
      await page.unroute(previewUrlMatcher, preview404Handler);
    }
    await restoreHomeContent(page, initialHome, previewUrl);
  }
});
