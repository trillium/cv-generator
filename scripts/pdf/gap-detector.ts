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
 * A heading (work-experience position/subhead, project name, or technical
 * category) left stranded as the last line of a non-final page while its body
 * content flows onto the next page. Reads as a dangling header with nothing
 * under it. There is no whitespace gap here, so `detectPageGaps` cannot see it.
 */
export interface OrphanHeading {
  page: number
  pageCount: number
  headingText: string
  y: number
}

/**
 * A non-final page whose content stops well short of the bottom margin,
 * leaving a large trailing void. Happens when the next entry is an atomic
 * block (break-inside: avoid) too tall for the remaining space, so the print
 * engine moves the whole block to the next page.
 */
export interface UnderfilledPage {
  page: number
  pageCount: number
  bottomY: number
  void: number
}

/**
 * Maximum legitimate vertical gap (in PDF user-space units) between two lines
 * of text within a page. Normal body line spacing is ~18; item/section
 * transitions run up to ~31. An observed layout failure produced a ~78 unit
 * band of whitespace. 45 sits comfortably above every legitimate transition
 * measured across the resume templates and well below the failure signal.
 */
export const DEFAULT_GAP_THRESHOLD = 45

/**
 * Maximum trailing void (in PDF user-space units) allowed at the bottom of a
 * NON-final page — the distance from the lowest line of text to the page's
 * bottom edge. Well-filled pages reach within ~70-80u of the bottom (margin +
 * one line). An observed underfilled page left ~156u of void. 110 sits above
 * healthy pages and below the failure signal.
 */
export const DEFAULT_MAX_TRAILING_VOID = 110

interface TextItemLike {
  str: string
  transform: number[]
}

/**
 * Collapse whitespace and drop non-alphanumerics so a heading string from the
 * CVData matches its PDF-text-layer rendering, where spaces are frequently
 * stripped and adjacent fields (e.g. subhead + years) are concatenated.
 */
function normalizeHeading(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
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
 * Scan for headings orphaned at a page boundary: a heading that is the last
 * line of a non-final page, with its body content pushed to the next page.
 *
 * @param headings The heading strings from the resume data (work-experience
 *   positions and subheads, project names, technical categories). A page's
 *   last line is flagged when — after whitespace/punctuation normalization —
 *   it equals, or begins with, one of these. The final page is never checked
 *   (its last line is legitimately the end of the document).
 */
export async function detectOrphanHeadings(
  pdfBuffer: Buffer,
  headings: string[],
): Promise<OrphanHeading[]> {
  const normalizedHeadings = headings.map((h) => normalizeHeading(h)).filter((h) => h.length > 0)
  if (normalizedHeadings.length === 0) return []

  const loadingTask = getDocument({ data: new Uint8Array(pdfBuffer) })
  const pdfDoc = await loadingTask.promise
  const pageCount = pdfDoc.numPages
  const orphans: OrphanHeading[] = []

  for (let pageNum = 1; pageNum < pageCount; pageNum++) {
    const page = await pdfDoc.getPage(pageNum)
    const textContent = await page.getTextContent()
    const lines = linesForPage(textContent.items as TextItemLike[])
    if (lines.length === 0) continue

    const lastLine = lines[lines.length - 1]
    const normalizedLast = normalizeHeading(lastLine.text)
    if (normalizedLast.length === 0) continue

    const matched = normalizedHeadings.some(
      (h) => normalizedLast === h || normalizedLast.startsWith(h),
    )
    if (matched) {
      orphans.push({
        page: pageNum,
        pageCount,
        headingText: lastLine.text,
        y: lastLine.y,
      })
    }
  }

  return orphans
}

/**
 * Scan for non-final pages that stop well short of the bottom margin, leaving a
 * large trailing void. The final page is never checked (a short last page is
 * normal). A page's void is the Y of its lowest line of text — in PDF space,
 * Y is measured from the page bottom, so a small bottomY means the text
 * reaches near the bottom (good) and a large bottomY means it stops high (bad).
 */
export async function detectUnderfilledPages(
  pdfBuffer: Buffer,
  maxVoid: number = DEFAULT_MAX_TRAILING_VOID,
): Promise<UnderfilledPage[]> {
  const loadingTask = getDocument({ data: new Uint8Array(pdfBuffer) })
  const pdfDoc = await loadingTask.promise
  const pageCount = pdfDoc.numPages
  const underfilled: UnderfilledPage[] = []

  for (let pageNum = 1; pageNum < pageCount; pageNum++) {
    const page = await pdfDoc.getPage(pageNum)
    const textContent = await page.getTextContent()
    const lines = linesForPage(textContent.items as TextItemLike[])
    if (lines.length === 0) continue

    const bottomY = lines[lines.length - 1].y
    if (bottomY > maxVoid) {
      underfilled.push({
        page: pageNum,
        pageCount,
        bottomY: Math.round(bottomY),
        void: Math.round(bottomY),
      })
    }
  }

  return underfilled
}

/**
 * Format detected gaps into an actionable failure report for the console.
 *
 * Beyond naming *where* each gap is, the report names the concrete levers that
 * move page content — the layout `detailGap` value, the manifest section order,
 * and section trimming — and points at the exact files to edit for this target.
 *
 * @param resumePath Repo-relative resume dir (e.g. "resumes/frontend-generic")
 *   used to print the specific manifest/layout paths to edit. Optional so the
 *   report still works when the caller has no path handy.
 */
export function formatGapReport(gaps: PageGap[], threshold: number, resumePath?: string): string {
  const clip = (s: string) => (s.length > 60 ? `${s.slice(0, 57)}...` : s)

  const manifestFile = resumePath
    ? `pii/${resumePath}/manifest.yml`
    : 'pii/resumes/<target>/manifest.yml'
  const layoutFile = resumePath ? `pii/${resumePath}/layout.yml` : 'pii/resumes/<target>/layout.yml'

  const lines = [
    `❌ Whitespace gap check FAILED: ${gaps.length} gap(s) over ${threshold}u`,
    ...gaps.map(
      (g) =>
        `   • page ${g.page}/${g.pageCount}: ${g.gap}u gap between ` +
        `"${clip(g.aboveText)}" and "${clip(g.belowText)}"`,
    ),
    '',
    '   WHAT THIS MEANS: too much vertical whitespace opened up mid-page. The two',
    '   most common causes and the levers that fix each:',
    '',
    "   1) A per-index detailGap injected a large band between an entry's subheads.",
    `      → In ${layoutFile}, look at layout.spacing.workExperience.detailGap.`,
    '        An array like [6, 80, 6, 6] gives the work item at that index (here',
    '        index 1 = the 2nd entry) an 80u gap between its subheads. Replace the',
    '        array with a single uniform number (e.g. detailGap: 8). This is the',
    '        usual culprit when the gap sits between two subheads of ONE entry.',
    '',
    '   2) A multi-subhead entry straddles the page boundary, so the print engine',
    '      reserves blank space rather than split it.',
    `      → In ${manifestFile}, reorder the workExperience list so a single-subhead`,
    '        entry lands on the boundary, or move the multi-subhead entry earlier/',
    '        later. You can also trim: drop a projects entry or a bullet to pull the',
    '        boundary up, or add one to push it down past the whole entry.',
    '',
    '   Also check: itemGap / sectionMarginTop / bulletGap in the same layout.yml',
    '   nudge total height; careerSummary and technical length affect where page 1',
    '   ends. Re-render after each change — the gap check re-runs automatically.',
  ]
  return lines.join('\n')
}

/**
 * Format orphaned headings into an actionable failure report for the console.
 *
 * Names the levers that pull a stranded heading back onto its content's page or
 * push the whole entry to the next page, and cites the target's exact files.
 */
export function formatOrphanReport(orphans: OrphanHeading[], resumePath?: string): string {
  const clip = (s: string) => (s.length > 60 ? `${s.slice(0, 57)}...` : s)

  const manifestFile = resumePath
    ? `pii/${resumePath}/manifest.yml`
    : 'pii/resumes/<target>/manifest.yml'
  const layoutFile = resumePath ? `pii/${resumePath}/layout.yml` : 'pii/resumes/<target>/layout.yml'

  const lines = [
    `❌ Orphaned-heading check FAILED: ${orphans.length} heading(s) stranded at a page break`,
    ...orphans.map(
      (o) =>
        `   • page ${o.page}/${o.pageCount}: "${clip(o.headingText)}" is the last line, ` +
        'its content is on the next page',
    ),
    '',
    '   WHAT THIS MEANS: a section/position heading sits alone at the bottom of a',
    '   page while its bullets flow onto the next. The heading must travel with at',
    '   least its first line of content. Levers, easiest first:',
    '',
    '   1) Push the whole entry to the next page.',
    `      → In ${layoutFile}, nudge total page-1 height up so the heading crosses`,
    '        the boundary with its content: raise itemGap, sectionMarginTop, or',
    '        bulletGap slightly. Small changes move the boundary a lot.',
    '',
    '   2) Pull earlier content tighter so the entry + its first bullet both fit.',
    `      → In ${layoutFile}, lower those same spacing values, or in ${manifestFile}`,
    '        drop a bullet / trim a projects entry above the stranded heading.',
    '',
    '   3) Reorder so a shorter (single-subhead) entry lands on the boundary.',
    `      → In ${manifestFile}, reorder the workExperience list.`,
    '',
    '   Re-render after each change — this check re-runs automatically.',
  ]
  return lines.join('\n')
}

/**
 * Format underfilled pages into an actionable failure report for the console.
 *
 * Names the levers that fill the trailing void: getting the next entry's first
 * content onto the page, adding content, or rebalancing across pages.
 */
export function formatUnderfilledReport(
  pages: UnderfilledPage[],
  maxVoid: number,
  resumePath?: string,
): string {
  const manifestFile = resumePath
    ? `pii/${resumePath}/manifest.yml`
    : 'pii/resumes/<target>/manifest.yml'
  const componentFile = 'src/components/WorkExperience/WorkExperience.tsx'

  const lines = [
    `❌ Underfilled-page check FAILED: ${pages.length} page(s) with a trailing void over ${maxVoid}u`,
    ...pages.map(
      (p) =>
        `   • page ${p.page}/${p.pageCount}: content stops ${p.void}u above the page bottom ` +
        '(a well-filled page reaches ~70-80u)',
    ),
    '',
    '   WHAT THIS MEANS: the page ends with a large blank band because the next',
    '   entry is an atomic block (break-inside: avoid) too tall for the remaining',
    '   space, so the print engine moved the whole block down. Levers, easiest first:',
    '',
    '   1) Let the next entry start on this page and split across the break.',
    `      → In ${componentFile}, the detail block uses breakInside: 'avoid'. For a`,
    '        multi-bullet entry that never fits, allowing it to split (auto) fills',
    '        the void. Trade-off: a subhead can then separate from its first bullet.',
    '',
    '   2) Add content so the page fills naturally.',
    `      → In ${manifestFile}, add a bullet or a projects entry above the break,`,
    '        or move a shorter entry up so its content lands in the void.',
    '',
    '   3) Rebalance so both pages are fuller (e.g. trim page 2 so more fits page 1).',
    '',
    '   Re-render after each change — this check re-runs automatically.',
  ]
  return lines.join('\n')
}

/**
 * Shape of the CVData fields this detector reads. Kept local and structural so
 * the detector has no hard dependency on the app's full type graph.
 */
export interface HeadingSource {
  workExperience?: { position?: string; details?: { subhead?: string }[] }[]
  projects?: { name?: string }[]
  technical?: { category?: string }[]
}

/**
 * Collect every heading string a resume renders as a standalone header line:
 * work-experience positions and subheads, project names, technical categories.
 * These are the lines that must never be orphaned at a page break.
 */
export function collectHeadings(data: HeadingSource): string[] {
  const headings: string[] = []
  for (const we of data.workExperience ?? []) {
    if (we.position) headings.push(we.position)
    for (const d of we.details ?? []) {
      if (d.subhead) headings.push(d.subhead)
    }
  }
  for (const p of data.projects ?? []) {
    if (p.name) headings.push(p.name)
  }
  for (const t of data.technical ?? []) {
    if (t.category) headings.push(t.category)
  }
  return headings
}
