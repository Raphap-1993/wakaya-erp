import { expect, test } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('reservations monitor', () => {
  test('keeps deep-link and row-driven selection synchronized', async ({ page }) => {
    await page.goto('/admin/reservations?selected=11111111-1111-4111-8111-111111111111');

    await page.locator('tbody tr', { hasText: 'RESERVATION-2026-9002' }).getByRole('link', { name: /abrir ficha/i }).click();
    await expect(page).toHaveURL(/\/admin\/reservations\/22222222-2222-4222-8222-222222222222$/);
    await expect(page.getByRole('heading', { level: 1, name: 'RESERVATION-2026-9002' })).toBeVisible();
    await expect(page.getByRole('link', { name: /editar reserva/i })).toBeVisible();

    await page.getByRole('link', { name: /volver al monitor/i }).click();
    await expect(page).toHaveURL(/\/admin\/reservations\?selected=22222222-2222-4222-8222-222222222222$/);
  });

  test('drops legacy filters without losing the active reservation', async ({ page }) => {
    await page.goto('/admin/reservations?selected=22222222-2222-4222-8222-222222222222&responsibleId=user-ota-1');

    await expect(page).not.toHaveURL(/responsibleId=/);
    await expect(page).toHaveURL(/selected=22222222-2222-4222-8222-222222222222/);
    await expect(page.getByText('RESERVATION-2026-9002')).toBeVisible();
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
    await page.locator('select[name="bungalowId"]').selectOption('bungalow-suite');
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

test.describe('wakaya seeded operational flow', () => {
  test.describe.configure({ mode: 'serial' });

  test('shows operational notifications for seeded conflicts and pending actions', async ({ page }) => {
    await page.goto('/admin');

    await page.getByRole('button', { name: /notificaciones/i }).click();

    await expect(page.getByText('Conflictos web vs OTA')).toBeVisible();
    await expect(page.getByText('Comprobantes por confirmar')).toBeVisible();
  });

  test('keeps the booking request coordination inside the unified inbox', async ({ page }) => {
    await page.goto('/admin/reservations/requests/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1');

    await expect(page).toHaveURL(/\/admin\/reservations\/requests\?selected=/);
    await expect(page.getByRole('heading', { level: 1, name: 'Inbox operativo' })).toBeVisible();
    await expect(page.getByText('WR-2026-9001', { exact: true }).last()).toBeVisible();
    await expect(page.getByText('comprobante-grace.pdf')).toBeVisible();
    await expect(page.getByLabel('Asunto')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Respuesta', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /responder desde ERP/i })).toBeVisible();
  });

  test('assigns a bungalow and advances seeded reservation through check-in and check-out', async ({ page }) => {
    test.skip(process.env.E2E_MUTATION_ALLOWED !== 'true', 'local mutation gate is required');

    const reservationId = '44444444-4444-4444-8444-444444444444';

    await page.goto(`/admin/reservations/${reservationId}`);

    await expect(page.getByRole('heading', { level: 1, name: 'RESERVATION-2026-9004' })).toBeVisible();
    await expect(page.getByText('Sin asignar')).toBeVisible();

    await page.getByRole('button', { name: 'Bungalow Doble' }).click();
    await expect(page.getByRole('button', { name: /registrar check-in/i })).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /registrar check-in/i }).click();
    await expect(page.getByRole('button', { name: /registrar check-out/i })).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /registrar check-out/i }).click();
    await expect(page.getByRole('button', { name: /marcar pago completo/i })).toBeVisible({ timeout: 10_000 });

    const detailResponse = await page.request.get(`/api/reservations/${reservationId}`);
    const detailBody = (await detailResponse.json()) as {
      reservation?: { status?: string; bungalow?: { name?: string | null } | null };
    };
    expect(detailBody.reservation?.status).toBe('checked_out');
    expect(detailBody.reservation?.bungalow?.name).toBe('Bungalow Doble');
  });
});
