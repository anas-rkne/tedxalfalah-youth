import { test, expect } from "@playwright/test";

test("speakers page shows empty state in both languages", async ({ page }) => {
  await page.goto("/en/speakers");
  await expect(page.locator("body")).toContainText("Speakers coming soon.");
  await page.goto("/ar/speakers");
  await expect(page.locator("body")).toContainText("المتحدثون قادمون قريباً.");
});

test("team page shows empty state in both languages", async ({ page }) => {
  await page.goto("/en/team");
  await expect(page.locator("body")).toContainText("Meet our team soon.");
  await page.goto("/ar/team");
  await expect(page.locator("body")).toContainText("تعرف على فريقنا قريباً.");
});

test("schedule shows empty state and FilterBar tabs are interactive", async ({ page }) => {
  await page.goto("/en/schedule");
  await expect(page.locator("body")).toContainText("Full schedule coming soon.");
  const tabs = page.getByRole("tab");
  await expect(tabs).toHaveCount(4);
  await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
  await tabs.nth(1).click();
  await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
  await tabs.nth(3).click();
  await expect(tabs.nth(3)).toHaveAttribute("aria-selected", "true");
});

test("apply form renders client-side and validates empty submit", async ({ page }) => {
  await page.goto("/en/apply");
  await expect(page.getByRole("heading", { name: "Application Form" })).toBeVisible();
  const fullName = page.locator('input[name="fullName"]');
  await expect(fullName).toBeVisible();
  await page.getByRole("button", { name: "Submit Application" }).click();
  await expect(page.locator("body")).toContainText("Full name is required");
  await expect(page.locator("body")).toContainText("You must agree to the terms and conditions");
});

test("apply track switch toggles conditional fields", async ({ page }) => {
  await page.goto("/en/apply");
  await expect(page.locator('input[name="schoolName"]')).toBeVisible();
  await page.locator('input[value="expert"]').check({ force: true });
  await expect(page.locator('input[name="organizationAndRole"]')).toBeVisible();
  await expect(page.locator('textarea[name="areaOfWorkWithYouth"]')).toBeVisible();
  await expect(page.locator('input[name="schoolName"]')).toHaveCount(0);
});

test("faq accordion expands an answer", async ({ page }) => {
  await page.goto("/en/faq");
  const firstButton = page.locator("#faq-button-0");
  await expect(firstButton).toBeVisible();
  await expect(firstButton).toHaveAttribute("aria-expanded", "false");
  await firstButton.click();
  await expect(firstButton).toHaveAttribute("aria-expanded", "true");
  await expect(firstButton.locator("xpath=following-sibling::*[1]")).toBeVisible();
});

test("activations page shows empty state", async ({ page }) => {
  await page.goto("/en/activations");
  await expect(page.locator("body")).toContainText("No activations yet. Stay tuned!");
});
