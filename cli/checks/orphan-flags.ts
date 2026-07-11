import type { Check } from './types'

export const orphanFlags: Check = {
  name: 'orphan-flags',
  severity: 'error',
  async run(ctx) {
    const resume = ctx.metadata?.pdf?.resume
    if (!resume) {
      return {
        ok: false,
        detail: 'no pdf.resume in metadata.json — build the resume first',
      }
    }
    const words = resume.trailingWords ?? []
    const orphans = words.filter((w) => w.isOrphan)
    const reported = resume.orphanCount ?? orphans.length
    if (orphans.length === 0 && reported === 0) {
      return { ok: true, detail: 'zero orphan/widow lines flagged' }
    }
    const preview = orphans
      .slice(0, 3)
      .map((w) => `"${w.lineText}"`)
      .join(', ')
    return {
      ok: false,
      detail: `${orphans.length} orphan line(s) (orphanCount ${reported})${
        preview ? `: ${preview}` : ''
      }`,
    }
  },
}
