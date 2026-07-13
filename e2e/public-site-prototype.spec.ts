import { expect, test } from '@playwright/test';

test.describe('public site prototype route', () => {
  test('navigates from home search to results and detail', async ({ page }) => {
    await page.goto('/prototype/public-site');

    await page.getByRole('button', { name: 'Go to slide 1' }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: /wakaya ecolodge/i }),
    ).toBeVisible();
    await expect(page.getByText(/un encuentro con lo magico/i)).toBeVisible();

    await page.getByLabel('Personas').selectOption('4');
    await page.getByLabel('Habitacion').selectOption('bungalow-familiar');
    await page.getByRole('button', { name: /ver opciones/i }).click();

    await expect(page).toHaveURL(/\/es\/bungalows/);
    await expect(
      page.getByRole('heading', { level: 1, name: /nuestros bungalows/i }),
    ).toBeVisible();

    await page
      .getByRole('link', { name: /ver detalles y reservar/i })
      .first()
      .click();
    await expect(
      page,
    ).toHaveURL(
      /\/es\/bungalows\/bungalow-familiar\?category=bungalow-familiar&checkIn=2026-07-20&checkOut=2026-07-22&guests=4/,
    );
    await expect(
      page.getByRole('heading', { level: 1, name: /bungalow familiar/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('navigation', { name: /navegación pública wakaya/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /volver a resultados/i }),
    ).toHaveAttribute(
      'href',
      '/es/bungalows?category=bungalow-familiar&checkIn=2026-07-20&checkOut=2026-07-22&guests=4',
    );
  });
});
