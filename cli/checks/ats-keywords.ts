import { readFileSync } from 'node:fs'
import type { Check, PdfSection } from './types'

const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'you',
  'your',
  'our',
  'are',
  'will',
  'this',
  'that',
  'have',
  'from',
  'they',
  'them',
  'was',
  'were',
  'has',
  'had',
  'not',
  'but',
  'all',
  'can',
  'who',
  'what',
  'when',
  'where',
  'how',
  'why',
  'about',
  'into',
  'their',
  'work',
  'team',
  'role',
])

const MIN_TERM_LENGTH = 4
const TOP_TERM_COUNT = 15

function extractTerms(text: string): string[] {
  const counts = new Map<string, number>()
  for (const raw of text.toLowerCase().split(/[^a-z0-9+#.]+/)) {
    const term = raw.replace(/^[.]+|[.]+$/g, '')
    if (term.length < MIN_TERM_LENGTH || STOP_WORDS.has(term)) continue
    counts.set(term, (counts.get(term) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_TERM_COUNT)
    .map(([term]) => term)
}

function resumeTextSurface(resume: PdfSection | undefined): string | null {
  if (!resume) return null
  const lines = resume.trailingWords?.map((w) => w.lineText) ?? []
  if (lines.length === 0) return null
  return lines.join(' ')
}

export const atsKeywords: Check = {
  name: 'ats-keywords',
  severity: 'warn',
  async run(ctx) {
    if (!ctx.postingPath) {
      return { ok: true, detail: 'no posting.md / not applicable' }
    }
    const surface = resumeTextSurface(ctx.metadata?.pdf?.resume)
    if (!surface) {
      return {
        ok: true,
        detail: 'posting.md present but no cheap resume text surface / not applicable',
      }
    }
    const postingText = readFileSync(ctx.postingPath, 'utf-8')
    const postingTerms = extractTerms(postingText)
    if (postingTerms.length === 0) {
      return { ok: true, detail: 'posting.md had no significant terms / not applicable' }
    }
    const haystack = surface.toLowerCase()
    const missing = postingTerms.filter((term) => !haystack.includes(term))
    if (missing.length === 0) {
      return {
        ok: true,
        detail: `all ${postingTerms.length} top posting terms present in resume text`,
      }
    }
    return {
      ok: false,
      detail: `${missing.length}/${postingTerms.length} top terms absent from resume text: ${missing
        .slice(0, 6)
        .join(', ')}`,
    }
  },
}
