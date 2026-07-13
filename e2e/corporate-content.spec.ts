import { expect, test } from "@playwright/test";

test.describe("corporate content source of truth", () => {
  test.describe.configure({ mode: "serial" });
  test("renders detailed policies without internal source notes", async ({ page }) => {
    await page.goto("/es/hotel-policies");

    await expect(page.getByRole("heading", { level: 1, name: "Políticas del hotel" })).toBeVisible();
    await expect(page.getByText("Toda reserva debe pagarse por adelantado dentro de las 24 horas")).toBeVisible();
    await expect(page.getByText("Las cancelaciones o modificaciones deben solicitarse al menos 48 horas")).toBeVisible();
    await expect(page.getByText("Ley N.º 29733")).toBeVisible();
    await expect(page.getByText("Decreto Supremo N.º 016-2024-JUS")).toBeVisible();
    await expect(page.getByText("derecho de retención y prenda")).toHaveCount(0);
    await expect(page.getByText("requiere revisión legal periódica")).toHaveCount(0);
  });

  test("uses managed address, phones and hours in contact", async ({ page }) => {
    await page.goto("/es/contact");

    await expect(
      page.locator('[class*="contactDetailValue"]').filter({ hasText: "Carretera Federico Basadre km 7.200" }),
    ).toBeVisible();
    await expect(page.getByText("+51 961 508 813 / +51 977 419 468")).toBeVisible();
    await expect(page.getByText("Lun–Dom · 7:00 — 20:00", { exact: true })).toHaveCount(2);
  });

  test("exposes every corporate area and historical source in the ERP", async ({ page }) => {
    await page.goto("/admin/content?tab=company");

    await expect(page.getByRole("tab", { name: "Páginas" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("button", { name: "Nosotros" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Preguntas frecuentes" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Testimonios" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Términos y estadía" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Privacidad" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Contacto y horarios" })).toBeVisible();
    await page.getByText("Contenido histórico", { exact: true }).click();
    await expect(page.getByText("Términos y condiciones · texto histórico original")).toBeVisible();
    await expect(page.getByRole("button", { name: "Guardar y publicar" })).toBeVisible();
  });

  test("preserves bilingual drafts and completes publish to public to restore", async ({ page }) => {
    test.skip(process.env.E2E_MUTATION_ALLOWED !== "true", "local mutation gate is required");

    const initialResponse = await page.request.get("/api/admin/corporate-content");
    expect(initialResponse.ok()).toBeTruthy();
    const initial = await initialResponse.json();
    const initialVersion = initial.item.revisionVersion as number;
    const originalHours = initial.item.document.contact.hours.es as string;
    const temporaryHours = "Lun–Dom · 7:00 — 20:01";
    let restored = false;

    try {
      await page.goto("/admin/content?tab=company");
      await page.getByRole("button", { name: "Contacto y horarios" }).click();
      const hours = page.getByLabel("Horario de atención", { exact: true });
      await hours.fill(temporaryHours);
      await page.getByRole("button", { name: "Inglés" }).click();
      await page.getByRole("button", { name: "Español" }).click();
      await expect(hours).toHaveValue(temporaryHours);

      await page.getByRole("button", { name: "Guardar y publicar" }).click();
      await expect(page.getByText(`Versión ${initialVersion + 1} publicada.`)).toBeVisible();

      await page.goto("/es/contact");
      await expect(page.getByText(temporaryHours, { exact: true })).toHaveCount(2);

      await page.goto("/admin/content?tab=company");
      const sourceRevision = page
        .locator('div[class*="listItem"]')
        .filter({ hasText: `Versión ${initialVersion}` });
      await expect(sourceRevision).toHaveCount(1);
      await sourceRevision.getByRole("button", { name: "Restaurar" }).click();
      await expect(
        page.getByText(
          `Versión ${initialVersion} restaurada como versión ${initialVersion + 2}.`,
        ),
      ).toBeVisible();
      restored = true;

      await page.goto("/es/contact");
      await expect(page.getByText(originalHours, { exact: true })).toHaveCount(2);
      await expect(page.getByText(temporaryHours, { exact: true })).toHaveCount(0);
    } finally {
      if (!restored) {
        const currentResponse = await page.request.get("/api/admin/corporate-content");
        if (currentResponse.ok()) {
          const current = await currentResponse.json();
          if (current.item.document.contact.hours.es === temporaryHours) {
            await page.request.post(
              `/api/admin/corporate-content/revisions/${initialVersion}/restore`,
              { data: { expectedVersion: current.item.revisionVersion } },
            );
          }
        }
      }
    }
  });
});
