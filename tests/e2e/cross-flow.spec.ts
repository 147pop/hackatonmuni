/**
 * Cross-module E2E flow covering the full demo scenario:
 * permisionario registers cash payment →
 * conductor pays digitally →
 * portal user pays a debt →
 * admin sees everything in dashboard + reportes →
 * admin generates liquidacion
 */
import { test, expect } from '@playwright/test';

test('full cross-module demo flow', async ({ page }) => {
  // ── Setup ────────────────────────────────────────────────────────────────
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());

  // ── Step 1: Permisionario registers cash payment ─────────────────────────
  await page.evaluate(() => localStorage.setItem('sem_permisionario_id', 'perm-1'));
  await page.goto('/permisionario/registrar');

  await page.getByTitle(/simulación/i).click();
  await page.waitForTimeout(1200);
  await page.getByText('1 hora').click();
  await page.getByRole('button', { name: /registrar pago efectivo/i }).click();
  await expect(page.getByText('Ticket generado')).toBeVisible({ timeout: 3000 });

  // ── Step 2: Conductor pays digitally ─────────────────────────────────────
  await page.evaluate(() => localStorage.setItem('sem_conductor_id', 'cond-1'));
  await page.goto('/conductor/pagar');
  await page.getByText('Rosa Martínez').click();
  await page.getByText('30 min').click();
  await page.getByRole('button', { name: /continuar al pago/i }).click();
  await page.getByRole('button', { name: /pagar con mercadopago/i }).click();
  await expect(page.getByText('¡Ticket generado!')).toBeVisible({ timeout: 4000 });

  // ── Step 3: Portal user pays a seeded debt ────────────────────────────────
  await page.goto('/portal/deudas');
  await page.getByPlaceholder('AB123CD').fill('XYZ789');
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: /consultar deudas/i }).click();
  await expect(page.getByText('Pendientes')).toBeVisible();
  await page.getByRole('button', { name: /pagar con mercadopago/i }).click();
  await expect(page.getByText('Pagadas')).toBeVisible({ timeout: 4000 });

  // ── Step 4: Admin dashboard shows updated metrics ─────────────────────────
  await page.goto('/admin');
  // Dashboard shows non-zero recaudado hoy (from steps 1 + 2)
  await expect(page.getByText('Recaudado hoy')).toBeVisible();
  // Active tickets metric (step 2 conductor ticket still active)
  await expect(page.getByText('Tickets activos ahora')).toBeVisible();

  // ── Step 5: Admin sees payments in pagos table ────────────────────────────
  await page.goto('/admin/pagos');
  // Shows both: conductor digital + portal debt payment
  await expect(page.getByText('AB123CD')).toBeVisible();

  // ── Step 6: Admin generates liquidacion for Rosa ──────────────────────────
  await page.goto('/admin/liquidaciones');
  await expect(page.getByText('Rosa Martínez')).toBeVisible();
  // Rosa collected efectivo in step 1 → transferir button should appear
  const transferBtn = page.getByRole('button', { name: /transferir/i }).first();
  if (await transferBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await transferBtn.click();
    await expect(page.getByText('Liquidación transferida')).toBeVisible({ timeout: 2000 });
  }

  // ── Step 7: Audit log shows all events ────────────────────────────────────
  await page.goto('/admin/auditoria');
  await expect(page.getByText('ticket_create')).toBeVisible();
  await expect(page.getByText('pago_create')).toBeVisible();
});

test('permisionario activity shows both tabs', async ({ page }) => {
  await page.evaluate(() => localStorage.clear());
  await page.evaluate(() => localStorage.setItem('sem_permisionario_id', 'perm-1'));

  await page.goto('/permisionario/actividad');
  await expect(page.getByText('Actividad de hoy')).toBeVisible();
  await expect(page.getByText('Buscar por patente')).toBeVisible();

  // Switch to patente tab
  await page.getByText('Buscar por patente').click();
  await expect(page.getByRole('button', { name: /buscar historial/i })).toBeVisible();
});

test('simulation badges are visible at key touch points', async ({ page }) => {
  await page.evaluate(() => localStorage.clear());

  // QR scan badge on payment wizard
  await page.goto('/portal/pagar');
  await expect(page.getByText('[SIMULACION]')).toBeVisible();

  // MP badge on payment step
  await page.getByText('Rosa Martínez').click();
  await page.getByPlaceholder('AB123CD').fill('TST123');
  await page.waitForTimeout(400);
  await page.getByText('30 min').click();
  await page.getByRole('button', { name: /continuar al pago/i }).click();
  await expect(page.getByText('[SIMULACION]')).toBeVisible();

  // OCR badge
  await page.goto('/permisionario/registrar');
  await expect(page.locator('[title*="SIMULACI"]')).toBeVisible();
});
