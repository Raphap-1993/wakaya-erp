import fs from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

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

test("crops, optimizes and publishes a Home hero through managed media", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });

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

  await authenticateAdmin(page);
  await expect(page.getByRole("heading", { level: 1, name: "Editor del home" })).toBeVisible();

  const imageInput = page.locator("#home-editor-fields input[type=file]").first();
  await imageInput.setInputFiles(path.join(process.cwd(), "public/images/wakaya/gallery/gallery01.jpg"));

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
  expect(uploadBody.asset?.originalFilename).toBe("gallery01.jpg");
  const heroDesktopUrl = uploadBody.asset?.variants?.heroDesktop?.url as string | undefined;
  expect(heroDesktopUrl).toMatch(/^\/media\/assets\/.+\/heroDesktop\.webp$/);
  const storedMediaResponse = await page.request.get(heroDesktopUrl ?? "");
  expect(storedMediaResponse.status()).toBe(200);
  expect(storedMediaResponse.headers()["content-type"]).toContain("image/webp");
  await expect(page.getByText("Imagen optimizada y lista para publicar en el home.")).toBeVisible();

  const filenameButton = page.getByRole("button", { name: "gallery01.jpg" });
  await expect(filenameButton).toBeVisible();
  await filenameButton.click();
  const previewDialog = page.getByRole("dialog", { name: "Vista previa de imagen" });
  await expect(previewDialog).toBeVisible();
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
  await expect(page.getByRole("button", { name: "gallery01.jpg" })).toBeVisible();

  const screenshotDirectory = path.join(process.cwd(), "output", "playwright");
  fs.mkdirSync(screenshotDirectory, { recursive: true });
  await page.screenshot({
    path: path.join(screenshotDirectory, "home-media-crop-publication.png"),
    fullPage: true,
  });

  await page.goto("/es");
  await expect(page.locator(`img[src="${heroDesktopUrl}"]`).first()).toBeVisible();
});
