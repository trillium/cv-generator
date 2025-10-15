import { test } from "node:test";
import assert from "node:assert";
import { Browser, Page } from "puppeteer";
import { launchBrowser, createPage, navigateTo } from "../helpers/browser";
import { assertNoConsoleErrors } from "../helpers/assertions";

const STATIC_ROUTES = [
  "/",
  "/file-manager",
  "/linkedIn",
  "/playground",
  "/single-column",
  "/single-column/resume",
  "/single-column/cover-letter",
  "/two-column/resume",
  "/two-column/cover-letter",
];

test("navigation smoke tests", async (t) => {
  let browser: Browser | null = null;
  let page: Page | null = null;

  t.before(async () => {
    browser = await launchBrowser();
  });

  t.after(async () => {
    if (browser) await browser.close();
  });

  t.beforeEach(async () => {
    if (browser) {
      page = await createPage(browser);
    }
  });

  t.afterEach(async () => {
    if (page && !page.isClosed()) {
      await page.close().catch(() => {});
    }
  });

  for (const route of STATIC_ROUTES) {
    await t.test(`can navigate to ${route} without errors`, async () => {
      assert(page, "Page should be initialized");
      await navigateTo(page, route);
      assertNoConsoleErrors(page);
    });
  }

  await t.test("all routes return 200 status", async () => {
    assert(page, "Page should be initialized");

    for (const route of STATIC_ROUTES) {
      const response = await page.goto(`http://localhost:10301${route}`, {
        waitUntil: "networkidle0",
      });
      assert(response, `Response should exist for ${route}`);
      assert.strictEqual(
        response.status(),
        200,
        `Expected 200 status for ${route}, got ${response.status()}`,
      );
    }
  });
});
