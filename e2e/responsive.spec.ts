import { test, expect, type Page } from "@playwright/test";

const WIDTHS = [320, 375, 414, 768, 1024, 1440, 1920];
const HEIGHTS: Record<number, number> = {
  320: 568, 375: 667, 414: 896, 768: 1024, 1024: 768, 1440: 900, 1920: 1080,
};

const PAGES: { path: string; name: string; markers: string[]; noHeader?: boolean }[] = [
  { path: "/", name: "home", markers: ["header", "#global-footer"] },
  { path: "/speakers", name: "speakers", markers: ["#global-footer"] },
  { path: "/team", name: "team", markers: ["#global-footer"] },
  { path: "/venue", name: "venue", markers: ["#global-footer"] },
  { path: "/activations", name: "activations", markers: ["#global-footer"] },
  { path: "/schedule", name: "schedule", markers: ["#global-footer"] },
  { path: "/apply", name: "apply", markers: ["#global-footer"] },
  { path: "/tickets", name: "tickets", markers: ["#global-footer"] },
  { path: "/faq", name: "faq", markers: ["#global-footer"] },
  { path: "/thank-you", name: "thank-you", markers: ["h1"], noHeader: true },
];

const AR_PAGES = ["/", "/team", "/faq", "/venue", "/tickets"];
const AR_WIDTHS = [320, 768, 1440];

async function gotoNoWait(page: Page, path: string) {
  await page.goto(`/en${path === "/" ? "" : path}`, { waitUntil: "load" });
}

async function checkOverflow(page: Page) {
  const result = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const docOverflow = document.documentElement.scrollWidth - vw;
    const offenders: { tag: string; cls: string; w: number; left: number }[] = [];
    document.querySelectorAll("body *").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (r.right > vw + 1 || r.left < -1)) {
        offenders.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.getAttribute("class") || "").slice(0, 80),
          w: Math.round(r.width),
          left: Math.round(r.left),
        });
      }
    });
    return { docOverflow, offenders: offenders.slice(0, 8) };
  });
  return result;
}

for (const pageDef of PAGES) {
  for (const width of WIDTHS) {
    test(`${pageDef.name} responsive at ${width}px (en)`, async ({ page }) => {
      await page.setViewportSize({ width, height: HEIGHTS[width] });
      await gotoNoWait(page, pageDef.path);
      await page.waitForTimeout(600);

      const { docOverflow, offenders } = await checkOverflow(page);
      expect(
        docOverflow,
        `doc overflow ${docOverflow}px; offenders: ${JSON.stringify(offenders)}`
      ).toBeLessThanOrEqual(0);

      for (const marker of pageDef.markers) {
        await expect(page.locator(marker)).toBeVisible();
      }

      if (!pageDef.noHeader) {
        if (width < 1024) {
          await expect(
            page.locator('button[aria-controls="mobile-menu"]')
          ).toBeVisible();
        } else {
          await expect(page.locator("nav")).toBeVisible();
        }
      }

      if (pageDef.markers.includes("#global-footer") && width < 640) {
        const ctas = page.locator(
          '#global-footer a[href*="/apply"], #global-footer a[href*="/tickets"]'
        );
        const count = await ctas.count();
        expect(count).toBeGreaterThan(0);
        let widest = 0;
        for (let i = 0; i < count; i++) {
          const bb = await ctas.nth(i).boundingBox();
          if (bb && bb.width > widest) widest = bb.width;
        }
        expect(
          widest,
          `footer CTA width ${widest}px should not touch screen edge at ${width}px`
        ).toBeLessThanOrEqual(width - 30);
      }

      await page.screenshot({
        path: `qa-screenshots/${pageDef.name}-${width}.png`,
        fullPage: true,
      });
    });
  }
}

for (const path of AR_PAGES) {
  for (const width of AR_WIDTHS) {
    test(`${path === "/" ? "home" : path.slice(1)} responsive at ${width}px (ar)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: HEIGHTS[width] });
      await page.goto(`/ar${path === "/" ? "" : path}`, { waitUntil: "load" });
      await page.waitForTimeout(600);

      await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

      const { docOverflow, offenders } = await checkOverflow(page);
      expect(
        docOverflow,
        `doc overflow ${docOverflow}px; offenders: ${JSON.stringify(offenders)}`
      ).toBeLessThanOrEqual(0);

      await page.screenshot({
        path: `qa-screenshots/${path === "/" ? "home" : path.slice(1)}-ar-${width}.png`,
        fullPage: true,
      });
    });
  }
}

test("404 page has no overflow at smallest width", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  const response = await page.goto("/en/this-page-does-not-exist", {
    waitUntil: "load",
  });
  expect(response?.status()).toBe(404);
  const { docOverflow, offenders } = await checkOverflow(page);
  expect(docOverflow, JSON.stringify(offenders)).toBeLessThanOrEqual(0);
  await page.screenshot({ path: "qa-screenshots/404-320.png", fullPage: true });
});
