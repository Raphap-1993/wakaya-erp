import fs from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

function readLocalEnvValue(key: string) {
  const envLocal = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
  return envLocal.match(new RegExp(`^${key}=(.+)$`, "m"))?.[1]?.trim().replace(/^['"]|['"]$/g, "") ?? "";
}

async function authenticateAdmin(page: import("@playwright/test").Page, next = "/admin/bungalow-capacity") {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  if (new URL(page.url()).pathname !== "/login") return;

  const email = readLocalEnvValue("BACKOFFICE_BOOTSTRAP_EMAIL");
  const password = readLocalEnvValue("BACKOFFICE_BOOTSTRAP_PASSWORD");
  if (!email || !password) throw new Error("Local backoffice credentials are required for authenticated E2E");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(new RegExp(`${next.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
}

test.describe("bungalow capacity", () => {
  test.describe.configure({ mode: "serial" });

  test("shows aggregate capacity with a single edit action and no block operations", async ({ page }) => {
    await authenticateAdmin(page);
    await page.goto("/admin/bungalow-capacity?checkIn=2026-07-13&checkOut=2026-07-14");

    await expect(page.getByRole("heading", { level: 1, name: "Cupos de bungalows" })).toBeVisible();
    await expect(page.getByText("17").first()).toBeVisible();
    await expect(page.getByRole("row")).toHaveCount(6);
    await expect(page.getByRole("button", { name: "Bloquear cupos" })).toHaveCount(0);
    await expect(page.getByText("Bloqueos activos")).toHaveCount(0);

    const doubleRow = page.getByRole("row").filter({ hasText: "Bungalow Doble" });
    await doubleRow.getByRole("button", { name: "Editar total" }).click();
    const drawer = page.getByLabel("Editar total");
    await expect(drawer.getByRole("spinbutton", { name: "Total físico" })).toHaveValue("2");
    await drawer.getByRole("button", { name: "Cerrar" }).click();
  });

  test("keeps removed block endpoints inactive and public availability aggregate", async ({ page }) => {
    await authenticateAdmin(page);

    const removedBlockResponse = await page.request.post("/api/admin/bungalow-capacity/blocks", {
      data: {},
    });
    expect(removedBlockResponse.status()).toBe(405);

    const availabilityResponse = await page.request.post("/api/public/availability", {
      data: {
        bungalowTypeId: "bungalow-suite",
        checkIn: "2026-07-13",
        checkOut: "2026-07-14",
        guests: 2,
      },
    });
    expect(availabilityResponse.ok()).toBeTruthy();
    const body = await availabilityResponse.json();
    expect(body).toMatchObject({ available: true, bungalowTypeId: "bungalow-suite" });
    expect(JSON.stringify(body)).not.toMatch(/FAM-01|unitId|suggestedUnitId|totalUnits|blockedUnits|maintenance/);
  });
});
