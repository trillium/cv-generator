import { PDFDocument } from 'pdf-lib'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

export interface TrailingWordInfo {
  lineIndex: number
  lineText: string
  wordCount: number
  isOrphan: boolean
}

export async function countPdfPages(pdfBuffer: Buffer): Promise<number> {
  const pdfDoc = await PDFDocument.load(pdfBuffer)
  return pdfDoc.getPageCount()
}

function analyzeTrailingWords(lines: string[]): TrailingWordInfo[] {
  return lines.map((lineText, lineIndex) => {
    const trimmed = lineText.trim()
    const wordCount = trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length
    const isOrphan = wordCount > 0 && wordCount < 4

    return {
      lineIndex,
      lineText,
      wordCount,
      isOrphan,
    }
  })
}

export async function extractLastPageText(pdfBuffer: Buffer): Promise<{
  text: string
  lineBreaks: number
  lines: string[]
  trailingWords: TrailingWordInfo[]
}> {
  const loadingTask = getDocument({ data: new Uint8Array(pdfBuffer) })
  const pdfDoc = await loadingTask.promise
  const pageCount = pdfDoc.numPages

  if (pageCount === 0) {
    return { text: '', lineBreaks: 0, lines: [], trailingWords: [] }
  }

  const lastPage = await pdfDoc.getPage(pageCount)
  const textContent = await lastPage.getTextContent()

  interface TextItem {
    str: string
    transform: number[]
  }

  const lineMap = new Map<number, string[]>()

  for (const item of textContent.items) {
    if (!('str' in item)) continue

    const textItem = item as TextItem
    const y = Math.round(textItem.transform[5] * 10) / 10

    if (!lineMap.has(y)) {
      lineMap.set(y, [])
    }
    lineMap.get(y)?.push(textItem.str)
  }

  const lines = Array.from(lineMap.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([, chars]) => chars.join(''))

  const text = lines.join('\n')
  const lineBreaks = lines.length - 1
  const trailingWords = analyzeTrailingWords(lines)

  return { text, lineBreaks, lines, trailingWords }
}
