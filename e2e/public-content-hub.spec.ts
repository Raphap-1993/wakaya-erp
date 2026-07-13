import path from "node:path";

import { expect, test } from "@playwright/test";

test.describe("public content hub", () => {
  test.describe.configure({ mode: "serial" });

  test("starts from a five-module worklist and keeps secondary Home tools on demand", async ({ page }) => {
    await page.goto("/admin/content");

    await expect(page.getByRole("heading", { level: 2, name: "¿Qué quieres gestionar?" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Editar Home/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Gestionar páginas/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Editar experiencias/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Gestionar galería/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Editar fichas públicas/ })).toBeVisible();

    await page.getByRole("link", { name: /Editar Home/ }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Editor del home" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Desktop" })).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 3, name: "Menú público" })).toHaveCount(0);

    await page.getByRole("button", { name: /Configuración web/ }).click();
    await expect(page.getByRole("heading", { level: 3, name: "Menú público" })).toBeVisible();

    await page.getByRole("button", { name: "Vista previa" }).click();
    const preview = page.getByRole("dialog", { name: "Vista previa" });
    await expect(preview).toBeVisible();
    await expect(preview.getByRole("button", { name: "Desktop" })).toBeVisible();
    await preview.getByRole("button", { name: "Cerrar" }).click();
  });

  test("forces the crop dialog for bungalow hero uploads before any media can be applied", async ({
    page,
  }) => {
    await page.goto("/admin/content?tab=bungalows");

    await expect(page.getByRole("heading", { level: 1, name: "Contenido público" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Home" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Experiencias" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Galería" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Bungalows" })).toBeVisible();

    const heroUpload = page.locator('form input[type="file"]').first();
    await heroUpload.setInputFiles(path.join(process.cwd(), "public/images/wakaya/wakaya-logo-min.png"));

    const dialog = page.getByRole("dialog");
    const applyButton = page.getByRole("button", { name: "Aplicar recortes" });

    await expect(dialog).toBeVisible();
    await expect(page.getByText("Ajustar imagen")).toBeVisible();
    await expect(page.getByRole("tab", { name: "Desktop" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Mobile" })).toBeVisible();
    await expect(applyButton).toBeDisabled();

    await page.waitForFunction(() => {
      const image = document.querySelector('[role="dialog"] img') as HTMLImageElement | null;
      return Boolean(image && image.complete && image.naturalWidth > 0);
    });

    await page.getByRole("tab", { name: "Mobile" }).click();
    await expect(applyButton).toBeEnabled({ timeout: 5_000 });

    await page.getByRole("button", { name: "Cancelar" }).click();
    await expect(dialog).not.toBeVisible();
  });

  test("keeps the public experience dialog shareable and carries its CTA into the contact form", async ({
    page,
  }) => {
    await page.goto("/es/services");

    await page.getByRole("button", { name: "Ver detalle" }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();

    const selectedSlug = new URL(page.url()).searchParams.get("experience");
    expect(selectedSlug).toBeTruthy();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(page).toHaveURL(/\/es\/services$/);

    await page.goto(`/es/services?experience=${selectedSlug}`);
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByRole("link").last().click();
    await expect(page).toHaveURL(new RegExp(`/es/contact\\?experience=${selectedSlug}$`));
    await expect(page.getByText("Experiencia seleccionada")).toBeVisible();
  });
});
