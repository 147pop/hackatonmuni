import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
});

test('admin dashboard loads with metric sections', async ({ page }) => {
  await page.goto('/admin');
  await expect(page.getByText('Dashboard · RF-ADM-01')).toBeVisible();
  await expect(page.getByText('Métricas en vivo')).toBeVisible();
  await expect(page.getByText('Indicadores de rendimiento · RF-ADM-10')).toBeVisible();
  await expect(page.getByText('Tiempo excedido')).toBeVisible();
});

test('admin dashboard shows non-zero debts from seed data', async ({ page }) => {
  await page.goto('/admin');
  // Seed has 2 deudas pendientes
  await expect(page.getByText('2')).toBeVisible(); // deudas pendientes metric
});

test('panic button creates alert visible in admin panel', async ({ page }) => {
  // Setup permisionario session
  await page.evaluate(() => localStorage.setItem('sem_permisionario_id', 'perm-1'));
  await page.goto('/permisionario');
  await page.getByText('Rosa Martínez').click();

  // Click panic (silent — no UI feedback)
  await page.getByRole('button', { name: 'Ayuda' }).click();

  // Navigate to admin alertas
  await page.goto('/admin/alertas');
  await expect(page.getByText('ALERTA DE PÁNICO')).toBeVisible();
  await expect(page.getByText('Balcarce 400')).toBeVisible();
});

test('dispute creates resolvable alert in admin', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('sem_permisionario_id', 'perm-1'));
  await page.goto('/permisionario');
  await page.getByText('Rosa Martínez').click();
  await page.getByRole('button', { name: /disputar/i }).click();
  await expect(page.getByText('Alerta enviada')).toBeVisible({ timeout: 2000 });

  await page.goto('/admin/alertas');
  await expect(page.getByText('Disputa')).toBeVisible();

  // Resolve the alert
  await page.getByRole('button', { name: /marcar como resuelta/i }).click();
  await expect(page.getByText('Disputa')).not.toBeVisible({ timeout: 2000 });
});

test('admin reportes — filters work and show data', async ({ page }) => {
  await page.goto('/admin/reportes');
  await expect(page.getByText('Filtros')).toBeVisible();
  await expect(page.getByText('Total recaudado')).toBeVisible();
  await expect(page.getByText('Transacciones')).toBeVisible();

  // Filter to "total" to see all time data
  await page.getByRole('button', { name: 'Total' }).click();
  await expect(page.getByText('Total recaudado')).toBeVisible();
});

test('admin pagos table loads', async ({ page }) => {
  await page.goto('/admin/pagos');
  await expect(page.getByText('Pagos · RF-ADM-02')).toBeVisible();
  await expect(page.getByText('0 exitosos')).toBeVisible(); // no payments yet
});

test('admin deudas shows seeded debts', async ({ page }) => {
  await page.goto('/admin/deudas');
  await expect(page.getByText('Deudas · RF-ADM-09')).toBeVisible();
  await expect(page.getByText('XYZ789')).toBeVisible();
  await expect(page.getByText('PQR123')).toBeVisible();
});

test('admin deudas filter by tipo — hora_extra separado', async ({ page }) => {
  // Inject a hora_extra debt
  await page.evaluate(() => {
    const deudas = [
      { id: 'test-he', dominio: 'AAA111', cuadra: 'Balcarce 400', permisionarioId: 'perm-1',
        monto: 700, fecha: new Date().toISOString(), estado: 'pendiente', tipo: 'hora_extra',
        ticketOriginalId: undefined, minutosExcedidos: 45 }
    ];
    const existing = JSON.parse(localStorage.getItem('sem_deudas') || '[]');
    localStorage.setItem('sem_deudas', JSON.stringify([...existing, ...deudas]));
  });
  await page.goto('/admin/deudas');

  // Filter by hora_extra
  await page.locator('select').nth(1).selectOption('hora_extra');
  await expect(page.getByText('AAA111')).toBeVisible();
  await expect(page.getByText('XYZ789')).not.toBeVisible();
});

test('admin auditoria shows audit events', async ({ page }) => {
  await page.goto('/admin/auditoria');
  await expect(page.getByText('Auditoría · RF-ADM-07')).toBeVisible();
  await expect(page.getByText('sistema_init')).toBeVisible();
});

test('admin alertas historial tab works', async ({ page }) => {
  await page.goto('/admin/alertas');
  await expect(page.getByText('Activas')).toBeVisible();
  await page.getByRole('button', { name: /historial/i }).click();
  await expect(page.getByText('Sin emergencias resueltas.')).toBeVisible();
});

test('liquidaciones muestra permisionarios y cuota 20%', async ({ page }) => {
  await page.goto('/admin/liquidaciones');
  await expect(page.getByText('Liquidaciones')).toBeVisible();
  await expect(page.getByText('Cuota 20%')).toBeVisible();
  await expect(page.getByText('Rosa Martínez')).toBeVisible();
});
