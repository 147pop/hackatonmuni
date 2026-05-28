import { expect, test } from "@playwright/test";

test("home exposes the four MVP operating areas", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "Centro operativo del estacionamiento medido"
    })
  ).toBeVisible();

  for (const label of [
    "Conductor",
    "Portal Publico",
    "Permisionario",
    "Admin Municipal"
  ]) {
    await expect(page.getByRole("heading", { name: label })).toBeVisible();
  }
});

test("role cards navigate to placeholder modules", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Demo Permisionario/ }).click();

  await expect(
    page.getByRole("heading", { name: "Operacion diaria del permisionario" })
  ).toBeVisible();
});
