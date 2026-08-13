import { test, expect } from "@playwright/test";

test("contact form submits successfully end-to-end", async ({ page }) => {
  await page.goto("/en");
  await page.locator("#contact-box-form").scrollIntoViewIfNeeded();
  await page.locator("#contact-box-name").fill("E2E Tester");
  await page.locator("#contact-box-email").fill("e2e-contact@example.com");
  await page.locator("#contact-box-message").fill("This is a valid test message for the contact form.");
  await page.getByRole("button", { name: "Send Message" }).click();
  await page.waitForURL("**/thank-you?type=contact", { timeout: 30_000 });
  await expect(page.locator("body")).toContainText("Your message has been received");
});

test("apply form submits successfully end-to-end (young speaker)", async ({ page }) => {
  await page.goto("/en/apply");
  await expect(page.locator('input[name="fullName"]')).toBeVisible();
  await page.locator('input[name="fullName"]').fill("E2E Young Speaker");
  await page.locator('input[name="age"]').fill("15");
  await page.locator('input[name="email"]').fill("e2e-apply@example.com");
  await page.locator('input[name="phone"]').fill("0501234567");
  await page.locator('input[name="city"]').fill("Abu Dhabi");
  await page.locator('input[name="talkIdeaTitle"]').fill("My Spark of Tomorrow");
  await page.locator('textarea[name="ideaSummary"]').fill(
    "A talk about how young people can turn small ideas into community impact with simple steps anyone can follow."
  );
  await page.locator('textarea[name="whyItMatters"]').fill(
    "It matters because it empowers young voices to shape the future."
  );
  await page.locator('input[name="schoolName"]').fill("E2E Test School");
  await page.locator('input[name="guardianName"]').fill("E2E Guardian");
  await page.locator('input[name="guardianContact"]').fill("0509999999");
  await page.locator('input[name="parentalConsent"]').check();
  await page.locator('input[name="consentToTerms"]').check();
  await page.getByRole("button", { name: "Submit Application" }).click();
  await page.waitForURL("**/thank-you?type=apply", { timeout: 30_000 });
  await expect(page.locator("body")).toContainText("Thank you for applying to join us");
});
