import { Page } from "puppeteer";
import { getPageErrors } from "./browser";

const EXPECTED_ERRORS = [
  "useFileManager must be used within a FileManagerProvider",
  "useModal must be used within a ModalProvider",
  "useDirectoryManager must be used within a DirectoryManagerProvider",
];

function isExpectedError(error: string): boolean {
  return EXPECTED_ERRORS.some((expected) => error.includes(expected));
}

export function assertNoConsoleErrors(page: Page, allowExpected = true): void {
  const errors = getPageErrors(page);
  const unexpectedErrors = allowExpected
    ? errors.filter((err) => !isExpectedError(err))
    : errors;

  if (unexpectedErrors.length > 0) {
    throw new Error(
      `Page had unexpected console errors:\n${unexpectedErrors.join("\n")}`,
    );
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
