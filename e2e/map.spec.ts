import { test, expect } from "@playwright/test";

const DARK_OVERLAY = 'div[class*="bg-slate-900/20"]';

test("home map renders marker and popup with venue label", async ({ page }) => {
  await page.goto("/en");
  const map = page.locator(".leaflet-container");
  await expect(map).toBeVisible({ timeout: 30_000 });
  const marker = page.locator(".custom-div-icon");
  await expect(marker).toBeVisible({ timeout: 30_000 });
  await marker.click();
  await expect(page.locator(".leaflet-popup")).toBeVisible();
  await expect(page.locator(".leaflet-popup")).toContainText("TEDxAlFalah Youth");
  await expect(page.locator(".leaflet-popup")).toContainText("Nabd AlFalah");
});

test("home map has dark overlay above tiles", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator(".leaflet-container")).toBeVisible({ timeout: 30_000 });
  const overlay = page.locator(DARK_OVERLAY).last();
  await expect(overlay).toBeVisible();
  await expect(overlay).toHaveCSS("pointer-events", "none");
  const zIndex = await overlay.evaluate((el) => getComputedStyle(el).zIndex);
  expect(Number(zIndex)).toBeGreaterThanOrEqual(450);
});

test("venue page embeds Google Maps in English with dark overlay", async ({ page }) => {
  await page.goto("/en/venue");
  const iframe = page.locator('iframe[src*="google.com/maps"]');
  await expect(iframe).toBeVisible({ timeout: 30_000 });
  const src = await iframe.getAttribute("src");
  expect(src).toContain("hl=en");
  const overlay = page.locator(DARK_OVERLAY).last();
  await expect(overlay).toBeVisible();
  await expect(overlay).toHaveCSS("pointer-events", "none");
});
