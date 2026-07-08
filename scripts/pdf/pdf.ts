import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'
import puppeteer, { type Browser } from 'puppeteer'
import type { CVData } from '@/types'
import { parseCliArgs } from './cli-args'
import { loadAndProcessData } from './data-loader'
import { DEFAULT_GAP_THRESHOLD, detectPageGaps, formatGapReport } from './gap-detector'
import { saveMetadata } from './metadata-writer'
import { generateAndSavePdf } from './pdf-generator'
import { buildUrls } from './url-builder'

config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..', '..')

async function main(
  dataObj: CVData,
  resumeType: string,
  resumePath: string,
  printOptions: Array<'resume' | 'cover'>,
  mode: 'dev' | 'prod',
) {
  console.log('📊 Data structure:', {
    hasHeader: !!dataObj.header,
    hasInfo: !!dataObj.info,
    headerName: dataObj.header?.name,
    infoName: dataObj.info ? `${dataObj.info.firstName} ${dataObj.info.lastName}` : undefined,
    topLevelKeys: Object.keys(dataObj),
  })

  let browser: Browser | null = null

  try {
    const serverUrl =
      mode === 'dev'
        ? `http://localhost:${process.env.PORT_DEV || 10300}`
        : `http://localhost:${process.env.PORT_PROD || 10301}`

    const piiPath = process.env.PII_PATH || path.join(projectRoot, 'pii')
    const baseDir = path.join(piiPath, resumePath)
    let version = (dataObj as Record<string, unknown>).version as string | undefined
    if (!version) {
      version = '0.0.1'
      const manifestPath = path.join(baseDir, 'manifest.yml')
      try {
        const content = readFileSync(manifestPath, 'utf-8')
        if (!content.includes('version:')) {
          writeFileSync(manifestPath, `${content.trimEnd()}\nversion: ${version}\n`)
          console.log(`📌 Added default version ${version} to manifest`)
        }
      } catch {
        // No manifest file — version stays as default
      }
    }
    const outDir = path.join(baseDir, version)

    if (version) console.log(`📌 Version: ${version}`)
    console.log(`🔗 Connecting to ${mode} server at ${serverUrl}`)

    await fetch(serverUrl).catch(() => {
      throw new Error(
        `Server not running at ${serverUrl}. Start it first with bun ${mode === 'dev' ? 'dev' : 'start'}`,
      )
    })

    console.log('🐾 Opening Puppeteer and generating PDF')

    const { resumeUrl, coverLetterUrl } = buildUrls(serverUrl, resumeType, resumePath)

    console.log(`📄 Resume URL: ${resumeUrl}`)
    console.log(`📄 Cover Letter URL: ${coverLetterUrl}`)

    browser = await puppeteer.launch()

    const results: Array<{
      type: string
      pageCount: number
      lastPageText: string
      lineBreaks: number
    }> = []

    const gapFailures: string[] = []

    if (printOptions.includes('resume')) {
      const {
        path: resumePdfPath,
        pageCount,
        lastPageText,
        lineBreaks,
        lastPageLines,
        trailingWords,
      } = await generateAndSavePdf({
        url: resumeUrl,
        dataObj,
        type: 'Resume',
        outDir,
        browser,
      })
      results.push({ type: 'resume', pageCount, lastPageText, lineBreaks })

      const resumeGaps = await detectPageGaps(readFileSync(resumePdfPath))
      if (resumeGaps.length > 0) {
        const report = formatGapReport(resumeGaps, DEFAULT_GAP_THRESHOLD)
        console.error(`\n${report}\n`)
        gapFailures.push(`resume (${resumePdfPath})`)
      } else {
        console.log('✅ Whitespace gap check passed (resume)')
      }

      const orphanCount = trailingWords.filter((w) => w.isOrphan).length

      saveMetadata(outDir, 'resume', {
        pages: pageCount,
        lastPageText: pageCount > 1 ? lastPageText : undefined,
        lastPageLines: pageCount > 1 ? lastPageLines : undefined,
        lineBreaks: pageCount > 1 ? lineBreaks : undefined,
        trailingWords: pageCount > 1 ? trailingWords : undefined,
        orphanCount: pageCount > 1 ? orphanCount : undefined,
        generatedAt: new Date().toISOString(),
      })

      if (pageCount > 1) {
        console.log(
          `📄 Resume generated: ${pageCount} page(s), ${lineBreaks} line breaks on last page`,
        )
      } else {
        console.log(`📄 Resume generated: ${pageCount} page`)
      }
    }
    if (printOptions.includes('cover')) {
      const {
        path: coverPdfPath,
        pageCount,
        lastPageText,
        lineBreaks,
        lastPageLines,
        trailingWords,
      } = await generateAndSavePdf({
        url: coverLetterUrl,
        dataObj,
        type: 'CoverLetter',
        outDir,
        browser,
      })
      results.push({ type: 'cover', pageCount, lastPageText, lineBreaks })

      const coverGaps = await detectPageGaps(readFileSync(coverPdfPath))
      if (coverGaps.length > 0) {
        const report = formatGapReport(coverGaps, DEFAULT_GAP_THRESHOLD)
        console.error(`\n${report}\n`)
        gapFailures.push(`cover letter (${coverPdfPath})`)
      } else {
        console.log('✅ Whitespace gap check passed (cover letter)')
      }

      const orphanCount = trailingWords.filter((w) => w.isOrphan).length

      saveMetadata(outDir, 'coverLetter', {
        pages: pageCount,
        lastPageText: pageCount > 1 ? lastPageText : undefined,
        lastPageLines: pageCount > 1 ? lastPageLines : undefined,
        lineBreaks: pageCount > 1 ? lineBreaks : undefined,
        trailingWords: pageCount > 1 ? trailingWords : undefined,
        orphanCount: pageCount > 1 ? orphanCount : undefined,
        generatedAt: new Date().toISOString(),
      })

      if (pageCount > 1) {
        console.log(
          `📄 Cover letter generated: ${pageCount} page(s), ${lineBreaks} line breaks on last page`,
        )
      } else {
        console.log(`📄 Cover letter generated: ${pageCount} page`)
      }
    }

    for (const { type, pageCount, lastPageText, lineBreaks } of results) {
      await fetch(`${serverUrl}/api/page-count`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumePath,
          type,
          pageCount,
          lastPageText,
          lineBreaks,
        }),
      }).catch((err) => {
        console.warn(`⚠️  Failed to report page count: ${err.message}`)
      })
    }

    console.log('💾 PDF saved')

    if (gapFailures.length > 0) {
      throw new Error(
        `Whitespace gap check failed for: ${gapFailures.join(', ')}. ` +
          'PDF was written for inspection but the render is a failure.',
      )
    }

    console.log('🏁 Done')
  } catch (error) {
    console.error('💥 Error during PDF generation:', error)
    throw error
  } finally {
    if (browser) {
      try {
        await browser.close()
        console.log('🔒 Browser closed')
      } catch (err) {
        console.error('⚠️  Error closing browser:', err)
      }
    }
  }
}

;(async () => {
  const { mode, resumePath, isAnon, skipPdf, resumeType, printOptions } = await parseCliArgs()

  console.log(
    `Mode: ${mode}
Resume path: ${resumePath}${isAnon ? ' (anonymized)' : ''}${skipPdf ? ' (no PDF)' : ''}
Resume type: ${resumeType}`,
  )

  const dataObj = await loadAndProcessData(resumePath, isAnon)

  if (!skipPdf) {
    try {
      await main(dataObj, resumeType, resumePath, printOptions, mode)
    } catch (error) {
      console.error('💥 PDF generation failed:', error)
      process.exit(1)
    }
  } else {
    console.log('⏩ Skipping PDF generation due to --no-pdf flag.')
  }
})().catch((error) => {
  console.error('💥 Script execution failed:', error)
  process.exit(1)
})
