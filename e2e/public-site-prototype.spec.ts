import { expect, test } from '@playwright/test';

test.describe('public site prototype route', () => {
  test('navigates from home search to results and detail', async ({ page }) => {
    await page.goto('/prototype/public-site');

    await expect(
      page.getByRole('heading', { level: 1, name: /un encuentro con lo mágico/i }),
    ).toBeVisible();

    await page.getByLabel('Habitación').selectOption('bungalow-familiar');
    await page.getByRole('button', { name: /consultar disponibilidad/i }).click();

    await expect(page).toHaveURL(/\/prototype\/public-site\/bungalows/);
    await expect(
      page.getByRole('heading', { level: 1, name: /resultados de búsqueda/i }),
    ).toBeVisible();

    await page
      .getByRole('link', { name: /ver detalle de bungalow familiar/i })
      .click();
    await expect(page).toHaveURL(/\/prototype\/public-site\/bungalows\//);
    await expect(
      page.getByRole('heading', { level: 1, name: /bungalow familiar/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('navigation', { name: /navegación pública wakaya/i }),
    ).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
  });
});
