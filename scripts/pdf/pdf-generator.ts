import { exec } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import type { Browser, Page } from 'puppeteer'
import { PDF_CONFIG } from '@/components/PrintPageSize/PrintPageSize.constants'
import type { CVData } from '@/types'
import { ensureDirectoryExists, getOutputFilename } from './file-utils'
import { readMetadata } from './metadata-writer'
import { countPdfPages, extractLastPageText, type TrailingWordInfo } from './page-counter'

export async function generatePdf(url: string, pdfOptions: object, page: Page) {
  await page.goto(url, { waitUntil: 'networkidle2' })
  const pdf = await page.pdf(pdfOptions)
  return pdf
}

export async function generateAndSavePdf({
  url,
  dataObj,
  type,
  outDir,
  browser,
}: {
  url: string
  dataObj: CVData
  type: 'Resume' | 'CoverLetter'
  outDir: string
  browser: Browser
}): Promise<{
  path: string
  pageCount: number
  lastPageText: string
  lineBreaks: number
  lastPageLines: string[]
  trailingWords: TrailingWordInfo[]
}> {
  const page = await browser.newPage()
  const { margins, scale } = PDF_CONFIG
  const pdf = await generatePdf(
    url,
    {
      format: 'letter',
      margin: {
        top: `${margins.top}in`,
        bottom: `${margins.bottom}in`,
        left: `${margins.left}in`,
        right: `${margins.right}in`,
      },
      printBackground: true,
      scale,
      tagged: true,
      displayHeaderFooter: false,
    },
    page,
  )

  const pdfBuffer = Buffer.from(pdf)
  const pageCount = await countPdfPages(pdfBuffer)

  let lastPageText = ''
  let lineBreaks = 0
  let lastPageLines: string[] = []
  let trailingWords: TrailingWordInfo[] = []

  if (pageCount > 1) {
    const lastPageData = await extractLastPageText(pdfBuffer)
    lastPageText = lastPageData.text
    lineBreaks = lastPageData.lineBreaks
    lastPageLines = lastPageData.lines
    trailingWords = lastPageData.trailingWords
  }

  ensureDirectoryExists(outDir)
  const outPath = path.join(outDir, getOutputFilename({ data: dataObj, type }))
  writeFileSync(outPath, pdf)

  const metadata = readMetadata(outDir)
  const shouldOpen = !metadata?.noBrowserOpen

  if (shouldOpen) {
    if (process.platform === 'darwin') {
      exec(`open '${outPath}'`)
    } else if (process.platform === 'win32') {
      exec(`start "" "${outPath}"`)
    } else {
      exec(`xdg-open '${outPath}'`)
    }
  } else {
    console.log(`📄 PDF saved (browser open skipped by noBrowserOpen flag)`)
  }

  return {
    path: outPath,
    pageCount,
    lastPageText,
    lineBreaks,
    lastPageLines,
    trailingWords,
  }
}
