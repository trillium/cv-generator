import assert from 'node:assert'
import { test } from 'node:test'
import type { Browser, Page } from 'puppeteer'
import { assertNoConsoleErrors } from '../helpers/assertions'
import { createPage, launchBrowser, navigateTo } from '../helpers/browser'

test('interaction smoke tests', async (t) => {
  let browser: Browser | null = null
  let page: Page | null = null

  t.before(async () => {
    browser = await launchBrowser()
  })

  t.after(async () => {
    if (browser) await browser.close()
  })

  t.beforeEach(async () => {
    if (browser) {
      page = await createPage(browser)
    }
  })

  t.afterEach(async () => {
    if (page && !page.isClosed()) {
      await page.close().catch(() => {})
    }
  })

  await t.test('can click all buttons on home page', async () => {
    assert(page, 'Page should be initialized')
    await navigateTo(page, '/')

    const buttons = await page.$$('button')
    assert(buttons.length > 0, 'Should have at least one button')

    for (const button of buttons) {
      const isVisible = await button.isVisible()
      if (isVisible) {
        await button.click()
        await page.waitForNetworkIdle({ timeout: 2000 }).catch(() => {})
        assertNoConsoleErrors(page)
      }
    }
  })

  await t.test('can click all links on home page', async () => {
    assert(page, 'Page should be initialized')
    await navigateTo(page, '/')

    const links = await page.$$('a[href]')
    assert(links.length > 0, 'Should have at least one link')

    for (let i = 0; i < Math.min(links.length, 10); i++) {
      const link = links[i]
      const href = await link.evaluate((el) => el.getAttribute('href'))

      if (href?.startsWith('/')) {
        await link.click()
        await page.waitForNetworkIdle({ timeout: 2000 }).catch(() => {})
        assertNoConsoleErrors(page)
        await page.goBack()
      }
    }
  })

  await t.test('can interact with file manager', async () => {
    assert(page, 'Page should be initialized')
    await navigateTo(page, '/file-manager')

    const buttons = await page.$$('button')
    for (const button of buttons) {
      const text = await button.evaluate((el) => el.textContent)
      const isVisible = await button.isVisible()

      if (isVisible && text && !text.toLowerCase().includes('delete')) {
        await button.click()
        await page.waitForNetworkIdle({ timeout: 2000 }).catch(() => {})
        assertNoConsoleErrors(page)
      }
    }
  })
})
