import { test, expect } from "@playwright/test";

test("service worker file is served correctly", async ({ page }) => {
  const response = await page.goto("/sw.js");
  expect(response?.status()).toBe(200);
  const contentType = response?.headers()["content-type"] ?? "";
  expect(contentType.toLowerCase()).toContain("javascript");
});

test("service worker registers and controls the page", async ({ page }) => {
  await page.goto("/en");
  const registration = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    return Boolean(reg.active);
  });
  expect(registration).toBe(true);
  const controlled = await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    return Boolean(navigator.serviceWorker.controller);
  });
  expect(controlled).toBe(true);
});

test("page keeps working after going offline", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("h1").first()).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  const context = page.context();
  await context.setOffline(true);
  await page.reload({ timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const title = await page.title();
  const hasHeading = (await page.locator("h1").count()) > 0;
  expect(title.toLowerCase().includes("offline") || hasHeading).toBe(true);
  await context.setOffline(false);
});
