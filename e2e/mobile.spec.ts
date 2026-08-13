import { test, expect } from "@playwright/test";

test("mobile menu opens, shows links and navigates", async ({ page }) => {
  await page.goto("/en");
  const toggle = page.locator('button[aria-controls="mobile-menu"]');
  await expect(toggle).toBeVisible();
  await toggle.click();
  const menu = page.locator("#mobile-menu");
  await expect(menu).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("menuitem", { name: "Team" }).click();
  await page.waitForURL("**/en/team");
  await expect(page.locator("body")).toContainText("Meet our team soon.");
});

test("homepage renders on mobile viewport", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  await expect(page.locator("span.sr-only").first()).toBeVisible();
  await page.goto("/ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});
