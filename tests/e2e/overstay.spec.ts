import { test, expect } from '@playwright/test';

const EXPIRED_TICKET = {
  id: 'overstay-e2e-1',
  numero: 'T-9001',
  dominio: 'TST123',
  tipo: 'auto',
  cuadra: 'Balcarce 400',
  permisionarioId: 'perm-1',
  inicio: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  duracionMinutos: 60,
  vencimiento: new Date(Date.now() - 3600 * 1000).toISOString(),
  monto: 700,
  metodoPago: 'efectivo',
  descuentoAplicado: false,
  activo: true,
};

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
});

test('expired ticket appears in cuadra monitor with vencidos section', async ({ page }) => {
  await page.evaluate((ticket) => {
    localStorage.setItem('sem_tickets', JSON.stringify([ticket]));
  }, EXPIRED_TICKET);

  await page.goto('/permisionario');
  await page.getByText('Rosa Martínez').click();

  // Monitor shows expired ticket
  await expect(page.getByText('Vencidos')).toBeVisible();
  await expect(page.getByText('TST123')).toBeVisible();
  await expect(page.getByText('Ya se fue')).toBeVisible();
  await expect(page.getByText('Hora extra')).toBeVisible();
});

test('"Ya se fue" closes the ticket without creating debt', async ({ page }) => {
  await page.evaluate((ticket) => {
    localStorage.setItem('sem_tickets', JSON.stringify([ticket]));
    localStorage.setItem('sem_permisionario_id', 'perm-1');
  }, EXPIRED_TICKET);

  await page.goto('/permisionario');
  await page.getByText('Rosa Martínez').click();

  await page.getByRole('button', { name: 'Ya se fue' }).click();

  // Ticket disappears from monitor
  await expect(page.getByText('TST123')).not.toBeVisible({ timeout: 2000 });

  // No debts created
  const deudas = await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('sem_deudas') || '[]');
    return d.filter((x: { dominio: string }) => x.dominio === 'TST123');
  });
  expect(deudas).toHaveLength(0);
});

test('"Hora extra" navigates to form pre-filled with ticket data', async ({ page }) => {
  await page.evaluate((ticket) => {
    localStorage.setItem('sem_tickets', JSON.stringify([ticket]));
    localStorage.setItem('sem_permisionario_id', 'perm-1');
  }, EXPIRED_TICKET);

  await page.goto('/permisionario');
  await page.getByText('Rosa Martínez').click();
  await page.getByRole('link', { name: 'Hora extra' }).click();

  await expect(page).toHaveURL(/hora-extra/);
  await expect(page.getByText('T-9001')).toBeVisible();
  await expect(page.getByText('Ticket original vinculado')).toBeVisible();
});

test('cobrar hora extra creates deuda with tipo hora_extra', async ({ page }) => {
  await page.evaluate((ticket) => {
    localStorage.setItem('sem_tickets', JSON.stringify([ticket]));
    localStorage.setItem('sem_permisionario_id', 'perm-1');
  }, EXPIRED_TICKET);

  await page.goto(`/permisionario/hora-extra?dominio=TST123&ticketId=overstay-e2e-1`);
  await expect(page.getByText('T-9001')).toBeVisible();
  await page.getByRole('button', { name: /registrar hora extra/i }).click();

  await expect(page.getByText('Hora extra registrada')).toBeVisible({ timeout: 2000 });
  await expect(page.getByText('Hora extra')).toBeVisible();

  // Verify debt in localStorage has tipo=hora_extra
  const deuda = await page.evaluate(() => {
    const d: Array<{ tipo?: string; dominio: string }> = JSON.parse(localStorage.getItem('sem_deudas') || '[]');
    return d.find((x) => x.dominio === 'TST123');
  });
  expect(deuda?.tipo).toBe('hora_extra');
});

test('hora extra deuda visible in actividad tab patente', async ({ page }) => {
  await page.evaluate((ticket) => {
    localStorage.setItem('sem_tickets', JSON.stringify([ticket]));
    localStorage.setItem('sem_permisionario_id', 'perm-1');
  }, EXPIRED_TICKET);

  // Register hora extra
  await page.goto('/permisionario/hora-extra?dominio=TST123&ticketId=overstay-e2e-1');
  await page.getByRole('button', { name: /registrar hora extra/i }).click();
  await expect(page.getByText('Hora extra registrada')).toBeVisible({ timeout: 2000 });

  // Check in actividad
  await page.goto('/permisionario/actividad');
  await page.getByText('Buscar por patente').click();
  await page.getByPlaceholder('AB123CD').fill('TST123');
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: /buscar historial/i }).click();

  await expect(page.getByText('TST123')).toBeVisible();
  await expect(page.getByText('Hora extra')).toBeVisible();
});
