import { test, expect, type Page } from '@playwright/test';

/** Bypass RF-NOR-01 business-hours block so payment tests pass at any time of day. */
async function bypassBusinessHours(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem('sem_config', JSON.stringify({
      horarioDiurnoInicio: '00:00',
      horarioDiurnoFinSemana: '23:59',
      horarioDiurnoFinSabado: '23:59',
      horarioNocturnoInicio: '22:00',
      horarioNocturnoFin: '05:00',
    }));
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => { localStorage.clear(); });
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
  // Bypass RF-NOR-01 so this test passes regardless of time of day
  await bypassBusinessHours(page);
  await page.reload();

  await page.getByText('Rosa Martínez').click();
  await page.getByText('Registrar pago efectivo').click();
  await expect(page).toHaveURL('/permisionario/registrar');

  await page.getByTitle(/simulaci/i).click();
  await page.waitForTimeout(1500);
  await page.getByText('1 hora').click();
  await page.getByRole('button', { name: /registrar pago efectivo/i }).click();

  await expect(page.getByText('Ticket generado')).toBeVisible({ timeout: 3000 });
  await expect(page.getByText(/T-/)).toBeVisible();
});

test('registrar incumplimiento genera deuda', async ({ page }) => {
  await page.getByText('Rosa Martínez').click();
  await page.getByText('Registrar incumplimiento').click();
  await expect(page).toHaveURL('/permisionario/incumplimiento');

  await page.getByTitle(/simulaci/i).click();
  await page.waitForTimeout(1500);

  await page.getByRole('button', { name: /registrar incumplimiento/i }).click();
  await expect(page.getByText('Incumplimiento registrado')).toBeVisible({ timeout: 3000 });
});

test('botón de pánico no produce feedback visible', async ({ page }) => {
  await page.getByText('Rosa Martínez').click();

  const panicBtn = page.getByRole('button', { name: 'Ayuda' });
  await panicBtn.click();

  // RF-EME-06: zero visible feedback — no toast, no modal, no text change
  // Note: "Emergencias" section label is always visible — we check for FEEDBACK text only
  await expect(page.getByText('Alerta enviada')).not.toBeVisible();
  await expect(page.getByText('Alerta de pánico')).not.toBeVisible();
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
  await page.getByRole('button', { name: 'QR Fijo' }).click();
  // QRCodeSVG renders with width="180" — unique among all icons (lucide icons are 24x24)
  await expect(page.locator('svg[width="180"]')).toBeVisible();
  await expect(page.getByText('QR Fijo — SEM Digital')).toBeVisible();
});
