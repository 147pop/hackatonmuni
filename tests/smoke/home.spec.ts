import { test, expect } from '@playwright/test';

test('home renderiza 4 roles', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Conductor')).toBeVisible();
  await expect(page.getByText('Portal Público')).toBeVisible();
  await expect(page.getByText('Permisionario')).toBeVisible();
  await expect(page.getByText('Administración Municipal')).toBeVisible();
});

test('navegacion a conductor', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Conductor').click();
  await expect(page).toHaveURL('/conductor');
});

test('navegacion a portal', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Portal Público').click();
  await expect(page).toHaveURL('/portal');
});

test('navegacion a permisionario', async ({ page }) => {
  await page.goto('/');
  // Use the card link
  await page.locator('a[href="/permisionario"]').click();
  await expect(page).toHaveURL('/permisionario');
});

test('navegacion a admin', async ({ page }) => {
  await page.goto('/');
  await page.locator('a[href="/admin"]').click();
  await expect(page).toHaveURL('/admin');
});
