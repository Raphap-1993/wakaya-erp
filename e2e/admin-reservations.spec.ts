import { expect, test } from '@playwright/test';

test.describe('reservations monitor', () => {
  test('keeps deep-link and row-driven selection synchronized', async ({ page }) => {
    await page.goto('/admin/reservations?selected=reservation-demo-2');

    await expect(page.getByText(/selected=reservation-demo-2/i)).toBeVisible();

    await page.locator('tbody tr').first().click();
    await expect(page).toHaveURL(/selected=reservation-demo-1/);
    await expect(page.getByText(/selected=reservation-demo-1/i)).toBeVisible();

    const secondRow = page.locator('tbody tr').nth(1);
    await secondRow.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/selected=reservation-demo-2/);
    await expect(page.getByText(/selected=reservation-demo-2/i)).toBeVisible();
  });

  test('canonicalizes selection when filtering removes the active reservation', async ({ page }) => {
    await page.goto('/admin/reservations?selected=reservation-demo-1&responsibleId=user-reception-9');

    await expect(page).toHaveURL(/responsibleId=user-reception-9/);
    await expect(page).not.toHaveURL(/selected=/);
    await expect(page.getByText(/contexto seleccionado/i)).toBeVisible();
  });
});
