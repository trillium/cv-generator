import puppeteer, { type Browser, type Page } from 'puppeteer'

const BASE_URL = process.env.BASE_URL || 'http://localhost:10301'
const HEADLESS = process.env.HEADLESS !== 'false'

export async function launchBrowser(): Promise<Browser> {
  return await puppeteer.launch({
    headless: HEADLESS,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
}

export async function createPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 720 })

  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })

  page.on('pageerror', (error) => {
    errors.push(error.message)
  })

  Object.assign(page, { errors })

  return page
}

export function getPageErrors(page: Page): string[] {
  return (page as Page & { errors?: string[] }).errors || []
}

export async function navigateTo(page: Page, path: string): Promise<void> {
  const url = `${BASE_URL}${path}`
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 10000 })
}

export { BASE_URL }
