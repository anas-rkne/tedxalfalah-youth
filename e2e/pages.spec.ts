import { test, expect } from "@playwright/test";

test("team page shows team member cards in both languages", async ({ page }) => {
  await page.goto("/en/team");
  await expect(page.locator("body")).toContainText("Meet the Team");
  await expect(page.locator("body")).toContainText("Hamda Al Kaabi");
  await page.goto("/ar/team");
  await expect(page.locator("body")).toContainText("تعرّف على الفريق");
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
