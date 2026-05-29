import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
});

test('conductor selector shows seeded profiles', async ({ page }) => {
  await page.goto('/conductor');
  await expect(page.getByText('Carlos')).toBeVisible();
  await expect(page.getByText('María')).toBeVisible();
  await expect(page.getByText('Registrarme')).toBeVisible();
});

test('conductor selects profile and sees dashboard', async ({ page }) => {
  await page.goto('/conductor');
  await page.getByText('Carlos').click();
  await expect(page.getByText('Hola, Carlos')).toBeVisible();
  await expect(page.getByText('Estacionar')).toBeVisible();
  await expect(page.getByText('Historial')).toBeVisible();
  await expect(page.getByText('Consultar deudas')).toBeVisible();
});

test('conductor completes digital payment — ≤3 user steps (RNF-15)', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('sem_conductor_id', 'cond-1'));
  await page.goto('/conductor/pagar');

  // Step 1: Select permisionario (simulated QR scan)
  await expect(page.getByText('Rosa Martínez')).toBeVisible();
  await page.getByText('Rosa Martínez').click();

  // Step 2: Vehicle data — dominio pre-filled from conductor profile
  await expect(page.getByDisplayValue('AB123CD')).toBeVisible();
  await page.getByText('1 hora').click();
  await page.getByRole('button', { name: /continuar al pago/i }).click();

  // Step 3: MercadoPago simulation
  await expect(page.getByText(/pagar con mercadopago/i)).toBeVisible();
  await expect(page.getByText('[SIMULACION]')).toBeVisible();
  await page.getByRole('button', { name: /pagar con mercadopago/i }).click();

  // Verify ticket created
  await expect(page.getByText('¡Ticket generado!')).toBeVisible({ timeout: 4000 });
  await expect(page.getByText(/T-\d+/)).toBeVisible();
});

test('ticket page shows live countdown', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('sem_conductor_id', 'cond-1'));
  await page.goto('/conductor/pagar');
  await page.getByText('Rosa Martínez').click();
  await page.getByText('1 hora').click();
  await page.getByRole('button', { name: /continuar al pago/i }).click();
  await page.getByRole('button', { name: /pagar con mercadopago/i }).click();
  await expect(page.getByText('¡Ticket generado!')).toBeVisible({ timeout: 4000 });
  await page.getByRole('link', { name: /ver ticket activo/i }).click();

  // Ticket page shows countdown and RF-EST-05 transfer notice
  await expect(page.getByText('Tiempo restante')).toBeVisible();
  await expect(page.getByText(/\d+:\d+/)).toBeVisible(); // mm:ss format
  await expect(page.getByText(/RF-EST-05/)).toBeVisible();
});

test('conductor historial shows payment after paying', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('sem_conductor_id', 'cond-1'));
  await page.goto('/conductor/pagar');
  await page.getByText('Rosa Martínez').click();
  await page.getByText('30 min').click();
  await page.getByRole('button', { name: /continuar al pago/i }).click();
  await page.getByRole('button', { name: /pagar con mercadopago/i }).click();
  await expect(page.getByText('¡Ticket generado!')).toBeVisible({ timeout: 4000 });

  await page.goto('/conductor/historial');
  await expect(page.getByText('AB123CD')).toBeVisible();
  await expect(page.getByText('Balcarce 400')).toBeVisible();
});

test('conductor registro crea cuenta nueva', async ({ page }) => {
  await page.goto('/conductor/registro');
  await page.getByPlaceholder('Tu nombre completo').fill('Ernesto Test');
  // Select plate via plate input
  await page.getByPlaceholder('AB123CD').fill('MN456OP');
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: /crear cuenta/i }).click();
  await expect(page).toHaveURL('/conductor');
  await expect(page.getByText('Hola, Ernesto Test')).toBeVisible();
});

test('conductor deudas muestra deuda seeded XYZ789', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('sem_conductor_id', 'cond-2'));
  await page.goto('/conductor/deudas');
  await expect(page.getByText('XYZ789')).toBeVisible();
  await expect(page.getByText('Pendientes')).toBeVisible();
});
