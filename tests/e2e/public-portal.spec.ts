import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
});

test('portal home shows pay and debt options', async ({ page }) => {
  await page.goto('/portal');
  await expect(page.getByText('Portal Público')).toBeVisible();
  await expect(page.getByText('Pagar estacionamiento')).toBeVisible();
  await expect(page.getByText('Consultar deuda por patente')).toBeVisible();
});

test('portal pays without account (no conductorId)', async ({ page }) => {
  await page.goto('/portal/pagar');

  // Step 1: Select permisionario
  await page.getByText('Rosa Martínez').click();

  // Step 2: Enter plate manually
  await page.getByPlaceholder('AB123CD').fill('PQR123');
  await page.waitForTimeout(400);
  await page.getByText('30 min').click();
  await page.getByRole('button', { name: /continuar al pago/i }).click();

  // Step 3: MP payment
  await page.getByRole('button', { name: /pagar con mercadopago/i }).click();
  await expect(page.getByText('¡Ticket generado!')).toBeVisible({ timeout: 4000 });
  // No "ver ticket activo" link since portal has no account
  await expect(page.getByRole('button', { name: /nuevo pago/i })).toBeVisible();
});

test('portal deudas — lookup finds seeded XYZ789 debt', async ({ page }) => {
  await page.goto('/portal/deudas');
  await page.getByPlaceholder('AB123CD').fill('XYZ789');
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: /consultar deudas/i }).click();

  await expect(page.getByText('Resultados para')).toBeVisible();
  await expect(page.getByText('XYZ789')).toBeVisible();
  await expect(page.getByText('Pendientes')).toBeVisible();
});

test('portal deudas — pagar deuda actualiza a pagada', async ({ page }) => {
  await page.goto('/portal/deudas');
  await page.getByPlaceholder('AB123CD').fill('XYZ789');
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: /consultar deudas/i }).click();
  await expect(page.getByText('Pendientes')).toBeVisible();

  await page.getByRole('button', { name: /pagar con mercadopago/i }).click();
  await expect(page.getByText('Pagadas')).toBeVisible({ timeout: 4000 });
});

test('portal deudas — no result for unknown plate', async ({ page }) => {
  await page.goto('/portal/deudas');
  await page.getByPlaceholder('AB123CD').fill('ZZZ999');
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: /consultar deudas/i }).click();
  await expect(page.getByText(/sin deudas registradas/i)).toBeVisible();
});

test('portal link to create account', async ({ page }) => {
  await page.goto('/portal');
  await page.getByRole('link', { name: /creá tu cuenta/i }).click();
  await expect(page).toHaveURL('/conductor/registro');
});
