import fs from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

function readLocalEnvValue(key: string) {
  const envLocal = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
  return envLocal.match(new RegExp(`^${key}=(.+)$`, "m"))?.[1]?.trim().replace(/^['"]|['"]$/g, "") ?? "";
}

async function authenticateAdmin(page: import("@playwright/test").Page, next = "/admin/home") {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  if (new URL(page.url()).pathname !== "/login") return;

  const email = readLocalEnvValue("BACKOFFICE_BOOTSTRAP_EMAIL");
  const password = readLocalEnvValue("BACKOFFICE_BOOTSTRAP_PASSWORD");
  if (!email || !password) throw new Error("Local backoffice credentials are required for authenticated E2E");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(new RegExp(`${next}$`));
}

test("guides the editor to the exact invalid Home field before sending a publish request", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  let homePutCount = 0;
  await page.route("**/api/admin/home-content", async (route) => {
    if (route.request().method() === "PUT") homePutCount += 1;
    await route.continue();
  });

  await authenticateAdmin(page);
  await expect(page.getByRole("heading", { level: 1, name: "Editor del home" })).toBeVisible();

  const sidebar = page.locator("aside");
  await sidebar.getByRole("button", { name: /^Historia/ }).click();
  const title = page.getByLabel("Título", { exact: true });
  const originalTitle = await title.inputValue();
  await title.fill("");

  await sidebar.getByRole("button", { name: /^Wakaya Ecolodge/ }).click();
  await page.getByRole("button", { name: "Publicar cambios" }).click();

  expect(homePutCount).toBe(0);
  const alert = page.locator("#home-validation-feedback").getByRole("alert");
  await expect(alert).toContainText("No se puede publicar. Corrige 1 campo.");
  await expect(alert).toContainText("Historia · Español · Título");
  await expect(sidebar.getByRole("button", { name: /^Historia.*Revisar · 1 campo/ })).toBeVisible();

  const invalidTitle = page.getByLabel("Título", { exact: true });
  await expect(page.getByRole("heading", { level: 2, name: "Historia" })).toBeVisible();
  await expect(invalidTitle).toHaveValue("");
  await expect(invalidTitle).toBeFocused();
  await expect(invalidTitle).toHaveAttribute("aria-invalid", "true");

  const screenshotDirectory = path.join(process.cwd(), "output", "playwright");
  fs.mkdirSync(screenshotDirectory, { recursive: true });
  await page.screenshot({
    path: path.join(screenshotDirectory, "guided-home-validation.png"),
    fullPage: true,
  });

  await page.getByRole("button", { name: "Ir al campo: Historia · Español · Título" }).click();
  await expect(invalidTitle).toBeFocused();

  await invalidTitle.fill(originalTitle);
  await expect(page.locator("#home-validation-feedback").getByRole("alert")).toHaveCount(0);
});
