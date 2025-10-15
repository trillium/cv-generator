import { Page } from "puppeteer";
import { getPageErrors } from "./browser";

export function assertNoConsoleErrors(page: Page): void {
  const errors = getPageErrors(page);

  if (errors.length > 0) {
    throw new Error(`Page had console errors:\n${errors.join("\n")}`);
  }
}

export async function assertElementExists(
  page: Page,
  selector: string,
): Promise<void> {
  const element = await page.$(selector);
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }
}

export async function assertPageTitle(
  page: Page,
  expectedTitle: string,
): Promise<void> {
  const title = await page.title();
  if (title !== expectedTitle) {
    throw new Error(`Expected title "${expectedTitle}" but got "${title}"`);
  }
}
