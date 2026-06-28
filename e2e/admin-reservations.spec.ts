import { expect, test } from '@playwright/test';

test.describe('reservations monitor', () => {
  test('keeps deep-link and row-driven selection synchronized', async ({ page }) => {
    await page.goto('/admin/reservations?selected=reservation-demo-2');

    await page.locator('tbody tr', { hasText: 'RESERVATION-2026-0001' }).click();
    await expect(page).toHaveURL(/\/admin\/reservations\/reservation-demo-1$/);
    await expect(page.getByRole('heading', { level: 1, name: 'RESERVATION-2026-0001' })).toBeVisible();
    await expect(page.getByRole('link', { name: /editar reserva/i })).toBeVisible();

    await page.getByRole('link', { name: /volver al monitor/i }).click();
    await expect(page).toHaveURL(/\/admin\/reservations\?selected=reservation-demo-1$/);
  });

  test('canonicalizes selection when filtering removes the active reservation', async ({ page }) => {
    await page.goto('/admin/reservations?selected=reservation-demo-1&responsibleId=user-reception-99');

    await expect(page).toHaveURL(/responsibleId=user-reception-99/);
    await expect(page).not.toHaveURL(/selected=/);
    await expect(page.getByText(/No hay reservas con estos filtros/i)).toBeVisible();
  });
});

test.describe('reservations manual entry flow', () => {
  test('creates a reservation and opens edit from detail', async ({ page }) => {
    const reservationNumber = `E2E-${Date.now()}`;
    const toDateInput = (daysFromNow: number) => {
      const date = new Date(Date.UTC(2026, 5, 20 + daysFromNow));
      return date.toISOString().slice(0, 10);
    };
    const uniqueOffset = Date.now() % 180;
    const startDate = toDateInput(uniqueOffset);
    const endDate = toDateInput(uniqueOffset + 1);

    await page.goto('/admin/reservations/new');

    await expect(page.getByRole('heading', { level: 1, name: /nueva reserva manual/i })).toBeVisible();

    await page.getByLabel('Número').fill(reservationNumber);
    await page.getByLabel('Canal').selectOption('web');
    await page.getByLabel('Bungalow').selectOption('bungalow-suite');
    await page.getByLabel('Responsable').fill('user-reception-9');
    await page.getByLabel('Fecha de ingreso').fill(startDate);
    await page.getByLabel('Fecha de salida').fill(endDate);
    await page.getByLabel('Monto total').fill('240.00');
    await page.getByLabel('Monto pagado').fill('0.00');
    const createResponse = page.waitForResponse((response) => {
      return response.request().method() === 'POST' && response.url().endsWith('/api/reservations');
    });
    await page.getByRole('button', { name: /crear reserva/i }).click();

    await createResponse;
    await expect(page).toHaveURL(/\/admin\/reservations\/[a-f0-9-]+$/i);
    const reservationId = new URL(page.url()).pathname.split("/").pop();
    expect(reservationId).toBeTruthy();

    await expect(page).toHaveURL(new RegExp(`/admin/reservations/${reservationId}$`));
    await expect(page.getByRole('heading', { level: 1, name: reservationNumber })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('link', { name: /editar reserva/i })).toBeVisible();

    await page.getByRole('link', { name: /editar reserva/i }).click();
    await expect(page).toHaveURL(/\/admin\/reservations\/[a-z0-9-]+\/edit$/i);
    await expect(page.getByRole('heading', { level: 1, name: /editar reserva/i })).toBeVisible();

    await page.getByLabel('Monto pagado').fill('120.00');
    const updateResponse = page.waitForResponse((response) => {
      return response.request().method() === 'PUT' && response.url().endsWith(`/api/reservations/${reservationId}`);
    });
    await page.getByRole('button', { name: /guardar cambios/i }).click();
    await updateResponse;

    await expect(page).toHaveURL(new RegExp(`/admin/reservations/${reservationId}$`));
    await expect(page.getByRole('heading', { level: 1, name: reservationNumber })).toBeVisible({ timeout: 10_000 });

    const detailResponse = await page.request.get(`/api/reservations/${reservationId}`);
    const detailBody = (await detailResponse.json()) as { reservation?: { number?: string; amountPaidCents?: number } };
    expect(detailBody.reservation?.number).toBe(reservationNumber);
    expect(detailBody.reservation?.amountPaidCents).toBe(12000);
  });
});
