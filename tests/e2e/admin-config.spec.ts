import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
});

test('admin home shows all sections', async ({ page }) => {
  await page.goto('/admin');
  await expect(page.getByText('Dashboard')).toBeVisible();
  await expect(page.getByText('Permisionarios')).toBeVisible();
  await expect(page.getByText('Liquidaciones')).toBeVisible();
  await expect(page.getByText('Tarifas')).toBeVisible();
  await expect(page.getByText('Zonas')).toBeVisible();
  await expect(page.getByText('Feriados')).toBeVisible();
});

test('rol consulta — tarifas muestra banner solo lectura y oculta guardar', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('sem_admin_role', 'consulta'));
  await page.goto('/admin/configuracion/tarifas');
  await expect(page.getByText(/solo lectura/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /guardar tarifas/i })).not.toBeVisible();
});

test('rol administrador puede guardar tarifas', async ({ page }) => {
  await page.goto('/admin/configuracion/tarifas');
  await expect(page.getByRole('button', { name: /guardar tarifas/i })).toBeVisible();
});

test('editar tarifa actualiza preview en vivo', async ({ page }) => {
  await page.goto('/admin/configuracion/tarifas');
  // The first number input is autoHora
  const inputs = page.locator('input[type="number"]');
  await inputs.first().fill('900');
  // Preview shows $900 for 1h efectivo
  await expect(page.getByText('$900')).toBeVisible();
});

test('guardar tarifa persiste en localStorage', async ({ page }) => {
  await page.goto('/admin/configuracion/tarifas');
  await page.locator('input[type="number"]').first().fill('850');
  await page.getByRole('button', { name: /guardar tarifas/i }).click();
  await expect(page.getByText('Tarifas actualizadas')).toBeVisible({ timeout: 2000 });

  const stored = await page.evaluate(() => {
    const t = JSON.parse(localStorage.getItem('sem_tarifa') || 'null');
    return t?.autoHora;
  });
  expect(stored).toBe(850);
});

test('agregar feriado aparece en la lista', async ({ page }) => {
  await page.goto('/admin/configuracion/feriados');
  const count = await page.locator('[class*="border-orange"]').count();

  await page.locator('input[type="date"]').fill('2026-12-25');
  await page.locator('input[type="text"]').last().fill('Navidad');
  await page.getByRole('button', { name: /agregar feriado/i }).click();

  await expect(page.getByText('Navidad')).toBeVisible({ timeout: 2000 });
  const newCount = await page.locator('[class*="border-orange"]').count();
  expect(newCount).toBeGreaterThan(count);
});

test('normativa muestra campos de horario editables', async ({ page }) => {
  await page.goto('/admin/configuracion/normativa');
  await expect(page.getByText('Inicio turno diurno')).toBeVisible();
  await expect(page.getByText('Fin turno diurno (Lunes a Viernes)')).toBeVisible();
  const timeInputs = page.locator('input[type="time"]');
  await expect(timeInputs).toHaveCount(5);
});

test('permisionarios lista con search', async ({ page }) => {
  await page.goto('/admin/permisionarios');
  await expect(page.getByText('Rosa Martínez')).toBeVisible();
  await expect(page.getByText('Jorge Pérez')).toBeVisible();

  await page.getByPlaceholder(/buscar/i).fill('Rosa');
  await expect(page.getByText('Rosa Martínez')).toBeVisible();
  await expect(page.getByText('Jorge Pérez')).not.toBeVisible();
});

test('crear nuevo permisionario desde admin', async ({ page }) => {
  await page.goto('/admin/permisionarios/nuevo');
  await page.getByLabel('Nombre *').fill('Luis');
  await page.getByLabel('Apellido *').fill('García');
  await page.getByLabel('Legajo *').fill('P-0200');
  await page.getByLabel('Cuadra asignada *').fill('Mitre 300');
  await page.locator('select').first().selectOption({ index: 1 });
  await page.getByRole('button', { name: /guardar/i }).click();
  await expect(page.getByText('Guardado correctamente.')).toBeVisible({ timeout: 2000 });
});

test('zonas permite toggle nocturno', async ({ page }) => {
  await page.goto('/admin/configuracion/zonas');
  await expect(page.getByText('Centro')).toBeVisible();
  await expect(page.getByText('Nocturna Norte')).toBeVisible();
  // Toggle nocturno on "Centro" (currently disabled)
  const centroSection = page.locator('div').filter({ hasText: 'Centro' }).first();
  const toggleBtn = centroSection.getByRole('button', { name: /solo diurno/i });
  if (await toggleBtn.isVisible()) {
    await toggleBtn.click();
    await expect(page.getByText('Nocturno activo').first()).toBeVisible({ timeout: 1500 });
  }
});
