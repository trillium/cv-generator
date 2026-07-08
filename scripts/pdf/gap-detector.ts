import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

/**
 * A suspicious vertical whitespace gap found between two consecutive lines of
 * text on the same page. This catches the "page-break straddle" failure mode
 * where the print engine pushes an atomic block (e.g. a subhead + its bullets)
 * to the bottom of a page, reserving a large blank band above it.
 */
export interface PageGap {
  page: number
  pageCount: number
  gap: number
  aboveText: string
  belowText: string
  yAbove: number
  yBelow: number
}

/**
 * Maximum legitimate vertical gap (in PDF user-space units) between two lines
 * of text within a page. Normal body line spacing is ~18; item/section
 * transitions run up to ~31. An observed layout failure produced a ~78 unit
 * band of whitespace. 45 sits comfortably above every legitimate transition
 * measured across the resume templates and well below the failure signal.
 */
export const DEFAULT_GAP_THRESHOLD = 45

interface TextItemLike {
  str: string
  transform: number[]
}

/**
 * Group a page's text items into lines keyed by their rounded Y position, then
 * return the lines sorted top-to-bottom (descending Y in PDF space).
 */
function linesForPage(items: TextItemLike[]): { y: number; text: string }[] {
  const lineMap = new Map<number, string[]>()
  for (const item of items) {
    if (typeof item.str !== 'string' || item.str.trim().length === 0) continue
    const y = Math.round(item.transform[5] * 10) / 10
    const chars = lineMap.get(y)
    if (chars) chars.push(item.str)
    else lineMap.set(y, [item.str])
  }
  return Array.from(lineMap.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([y, chars]) => ({ y, text: chars.join('') }))
}

/**
 * Scan every page of a rendered PDF for intra-page vertical whitespace gaps
 * that exceed `threshold`. Only gaps strictly inside a page are reported —
 * the transition between the last line of one page and the first line of the
 * next is a page break, not a gap, and is never flagged.
 */
export async function detectPageGaps(
  pdfBuffer: Buffer,
  threshold: number = DEFAULT_GAP_THRESHOLD,
): Promise<PageGap[]> {
  const loadingTask = getDocument({ data: new Uint8Array(pdfBuffer) })
  const pdfDoc = await loadingTask.promise
  const pageCount = pdfDoc.numPages
  const gaps: PageGap[] = []

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await pdfDoc.getPage(pageNum)
    const textContent = await page.getTextContent()
    const lines = linesForPage(textContent.items as TextItemLike[])

    for (let i = 0; i < lines.length - 1; i++) {
      const gap = Math.round((lines[i].y - lines[i + 1].y) * 10) / 10
      if (gap > threshold) {
        gaps.push({
          page: pageNum,
          pageCount,
          gap,
          aboveText: lines[i].text,
          belowText: lines[i + 1].text,
          yAbove: lines[i].y,
          yBelow: lines[i + 1].y,
        })
      }
    }
  }

  return gaps
}

/**
 * Format detected gaps into a human-readable failure report for the console.
 */
export function formatGapReport(gaps: PageGap[], threshold: number): string {
  const clip = (s: string) => (s.length > 60 ? `${s.slice(0, 57)}...` : s)
  const lines = [
    `❌ Whitespace gap check FAILED: ${gaps.length} gap(s) over ${threshold}u`,
    ...gaps.map(
      (g) =>
        `   • page ${g.page}/${g.pageCount}: ${g.gap}u between ` +
        `"${clip(g.aboveText)}" and "${clip(g.belowText)}"`,
    ),
    '   This usually means a multi-subhead entry straddles a page break.',
    '   Reorder work items or trim content so the boundary falls between whole entries.',
  ]
  return lines.join('\n')
}
