import { test, expect, devices, type Page } from "@playwright/test";

const LAT = "24.4356691";
const LNG = "54.7326539";

const PAGES: { path: string; name: string }[] = [
  { path: "/en", name: "home-en" },
  { path: "/ar", name: "home-ar" },
];

async function tapPinOpensMaps(page: Page, path: string) {
  await page.goto(path, { waitUntil: "load" });

  const marker = page.locator(".leaflet-marker-icon").first();
  await marker.waitFor({ state: "visible", timeout: 30_000 });

  await expect(marker.locator('[class*="animate-ping"]')).toBeVisible();
  await expect(marker.locator('[class*="E62B1E"]').first()).toBeVisible();

  const popupPromise = page.waitForEvent("popup", { timeout: 30_000 });
  await marker.click();
  const popup = await popupPromise;

  const url = popup.url();
  expect(url, `expected Google Maps link on ${path}`).toContain(
    "google.com/maps/place/"
  );
  expect(url, `expected venue coordinates on ${path}`).toContain(LAT);
  expect(url, `expected venue coordinates on ${path}`).toContain(LNG);

  await popup.close();
}

test.describe("map red pin opens event location link", () => {
  for (const { path, name } of PAGES) {
    test(`${name}: pin click opens Google Maps in new tab (desktop chromium)`, async ({
      page,
    }) => {
      await tapPinOpensMaps(page, path);
    });
  }
});

test.describe("map red pin on mobile (iPhone 13 emulation)", () => {
  const iPhone13 = { ...devices["iPhone 13"] } as Record<string, unknown>;
  delete iPhone13.defaultBrowserType;
  test.use(iPhone13 as unknown as Parameters<typeof test.use>[0]);

  for (const { path, name } of PAGES) {
    test(`${name}: pin tap opens Google Maps in new tab (mobile touch)`, async ({
      page,
    }) => {
      await tapPinOpensMaps(page, path);
    });
  }
});