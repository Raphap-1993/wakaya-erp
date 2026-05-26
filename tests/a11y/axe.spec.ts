// Axe + Playwright smoke de accesibilidad.
// Uso: npx playwright test tests/a11y
// Requiere: npm install -D @axe-core/playwright

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('A11y smoke', () => {
  test('home page no tiene violaciones serias', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    const serious = results.violations.filter((v) =>
      ['serious', 'critical'].includes(v.impact || ''),
    );
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
});
