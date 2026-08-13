import { test, expect, type Page } from "@playwright/test";

const MAIN_ROUTES = [
  "/",
  "/speakers",
  "/team",
  "/venue",
  "/activations",
  "/schedule",
  "/apply",
  "/tickets",
  "/faq",
  "/thank-you",
];

async function gotoOk(page: Page, path: string) {
  const response = await page.goto(path);
  expect(response?.status()).toBe(200);
}

test("home loads with hero and header nav", async ({ page }) => {
  await gotoOk(page, "/en");
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  await expect(page.locator("header")).toBeVisible();
  await expect(page.locator("nav")).toBeVisible();
});

test("countdown ticks every second", async ({ page }) => {
  await gotoOk(page, "/en");
  const clock = page.locator("span.sr-only").first();
  await expect(clock).toBeVisible();
  await expect.poll(async () => (await clock.textContent()) ?? "").toMatch(/^\d{2}:\d{2}:\d{2}$/);
  const first = await clock.textContent();
  await page.waitForTimeout(2500);
  const second = await clock.textContent();
  expect(second).not.toBe(first);
});

test("home shows no demo speakers and hidden sections stay hidden", async ({ page }) => {
  await gotoOk(page, "/en");
  const body = page.locator("body");
  await expect(body).not.toContainText("Ahmed");
  await expect(body).not.toContainText("Sara");
  await expect(page.getByText("Meet the Team", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Our Partners", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Speakers coming soon.", { exact: true })).toHaveCount(0);
});

test("JSON-LD event data is present on home", async ({ page }) => {
  await gotoOk(page, "/en");
  const ldJson = page.locator('script[type="application/ld+json"]');
  const count = await ldJson.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const content = (await ldJson.nth(i).textContent()) ?? "";
    if (content.includes('"@type":"Event"')) {
      expect(content).toContain("2026-12-19");
      expect(content).toContain('"name":"TEDxAlFalah Youth"');
      return;
    }
  }
  throw new Error("No Event JSON-LD block found");
});

test("unknown route returns styled 404 page", async ({ page }) => {
  const response = await page.goto("/en/this-page-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.locator("body")).toContainText("404");
});

test("all main routes return 200 in English and Arabic", async ({ page }) => {
  for (const locale of ["en", "ar"]) {
    for (const route of MAIN_ROUTES) {
      await gotoOk(page, `/${locale}${route}`);
      await expect(page.locator("body")).not.toContainText("Page Not Found");
    }
  }
});

test("language switcher navigates to Arabic with RTL", async ({ page }) => {
  await gotoOk(page, "/en");
  await page.getByRole("button", { name: "Switch to Arabic" }).click();
  await page.waitForURL("**/ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("nav")).toContainText("الرئيسية");
});

test("Arabic pages render RTL with translated content", async ({ page }) => {
  await gotoOk(page, "/ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
});
