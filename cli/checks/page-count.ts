import type { Check } from './types'

const DEFAULT_TARGET_PAGES = 1

export const pageCount: Check = {
  name: 'page-count',
  severity: 'error',
  async run(ctx) {
    const resume = ctx.metadata?.pdf?.resume
    if (!resume || typeof resume.pages !== 'number') {
      return {
        ok: false,
        detail: 'no pdf.resume.pages in metadata.json — build the resume first',
      }
    }
    const target =
      typeof ctx.manifest?.pages === 'number' ? ctx.manifest.pages : DEFAULT_TARGET_PAGES
    if (resume.pages === target) {
      return { ok: true, detail: `${resume.pages} page(s), target ${target}` }
    }
    return {
      ok: false,
      detail: `${resume.pages} page(s) but target is ${target}`,
    }
  },
}
