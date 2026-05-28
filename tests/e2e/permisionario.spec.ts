import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // Seed localStorage via reset (click reset button or navigate directly)
  await page.evaluate(() => {
    // Trigger demo reset via localStorage clear so seed loads
    localStorage.clear();
  });
  await page.goto('/permisionario');
});

test('selector muestra permisionarios activos', async ({ page }) => {
  await expect(page.getByText('Rosa Martínez')).toBeVisible();
  await expect(page.getByText('Jorge Pérez')).toBeVisible();
  await expect(page.getByText('Ana Rodríguez')).toBeVisible();
});

test('seleccionar permisionario muestra dashboard', async ({ page }) => {
  await page.getByText('Rosa Martínez').click();
  await expect(page.getByText('Balcarce 400')).toBeVisible();
  await expect(page.getByText('Registrar pago efectivo')).toBeVisible();
  await expect(page.getByText('Registrar incumplimiento')).toBeVisible();
});

test('registrar pago efectivo genera ticket en actividad', async ({ page }) => {
  // Select permisionario
  await page.getByText('Rosa Martínez').click();

  // Go to register payment
  await page.getByText('Registrar pago efectivo').click();
  await expect(page).toHaveURL('/permisionario/registrar');

  // Fill plate via OCR simulation
  await page.getByTitle(/simulación/i).click();
  // Wait for OCR delay
  await page.waitForTimeout(1500);
  // Select 1 hour
  await page.getByText('1 hora').click();
  // Submit
  await page.getByRole('button', { name: /registrar pago efectivo/i }).click();

  // Should show success
  await expect(page.getByText('Ticket generado')).toBeVisible({ timeout: 3000 });
  await expect(page.getByText(/T-/)).toBeVisible();
});

test('registrar incumplimiento genera deuda', async ({ page }) => {
  await page.getByText('Rosa Martínez').click();
  await page.getByText('Registrar incumplimiento').click();
  await expect(page).toHaveURL('/permisionario/incumplimiento');

  // Use OCR to fill plate
  await page.getByTitle(/simulación/i).click();
  await page.waitForTimeout(1500);

  await page.getByRole('button', { name: /registrar incumplimiento/i }).click();
  await expect(page.getByText('Incumplimiento registrado')).toBeVisible({ timeout: 3000 });
});

test('botón de pánico no produce feedback visible', async ({ page }) => {
  await page.getByText('Rosa Martínez').click();

  // Click the panic button (aria-label="Ayuda")
  const panicBtn = page.getByRole('button', { name: 'Ayuda' });
  await panicBtn.click();

  // No toast, no modal, no text change should appear
  await expect(page.getByText(/pánico|alerta|emergencia|enviado/i)).not.toBeVisible();
  // Button still present and unchanged
  await expect(panicBtn).toBeVisible();
});

test('credencial muestra nombre y legajo', async ({ page }) => {
  await page.getByText('Rosa Martínez').click();
  await page.getByText('Ver credencial y QR').click();
  await expect(page).toHaveURL('/permisionario/credencial');
  await expect(page.getByText('P-0042')).toBeVisible();
  await expect(page.getByText('ACTIVO')).toBeVisible();
});

test('tab QR muestra código QR', async ({ page }) => {
  await page.getByText('Rosa Martínez').click();
  await page.getByText('Ver credencial y QR').click();
  await page.getByText('QR Fijo').click();
  // SVG QR should be rendered
  await expect(page.locator('svg')).toBeVisible();
  await expect(page.getByText('QR Fijo — SEM Digital')).toBeVisible();
});
