import { test, expect } from "@playwright/test";

test("home map renders marker and opens Google Maps on click", async ({ page }) => {
  await page.goto("/en");
  const map = page.locator(".leaflet-container");
  await expect(map).toBeVisible({ timeout: 30_000 });
  const marker = page.locator(".custom-div-icon");
  await expect(marker).toBeVisible({ timeout: 30_000 });
  const [popup] = await Promise.all([
    page.waitForEvent("popup"),
    marker.click(),
  ]);
  await popup.waitForLoadState("domcontentloaded");
  expect(popup.url()).toContain("google.com/maps");
});

test("home map renders tile images above the base", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator(".leaflet-container")).toBeVisible({ timeout: 30_000 });
  const tiles = page.locator(".leaflet-tile-loaded");
  await expect(tiles.first()).toBeVisible({ timeout: 30_000 });
  const tileCount = await tiles.count();
  expect(tileCount).toBeGreaterThan(0);
});

test("venue page shows the same interactive Leaflet map with marker", async ({ page }) => {
  await page.goto("/en/venue");
  await expect(page.locator(".leaflet-container")).toBeVisible({ timeout: 30_000 });
  const marker = page.locator(".custom-div-icon");
  await expect(marker).toBeVisible({ timeout: 30_000 });
  const [popup] = await Promise.all([
    page.waitForEvent("popup"),
    marker.click(),
  ]);
  await popup.waitForLoadState("domcontentloaded");
  expect(popup.url()).toContain("google.com/maps");
});