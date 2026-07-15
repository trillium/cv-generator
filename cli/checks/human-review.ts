import { approvedHashSet, extractBullets } from '../lib/bullets'
import type { Check } from './types'

function preview(text: string): string {
  return text.length > 60 ? `${text.slice(0, 57)}...` : text
}

export const humanReview: Check = {
  name: 'human-review',
  severity: 'warn',
  async run(ctx) {
    const bullets = extractBullets(ctx.company)
    if (bullets.length === 0) {
      return { ok: true, detail: 'no workExperience/projects bullets in manifest / not applicable' }
    }
    const approved = approvedHashSet()
    const unapproved = bullets.filter((b) => !approved.has(b.hash))
    const total = bullets.length
    const reviewed = total - unapproved.length
    if (unapproved.length === 0) {
      return { ok: true, detail: `approved ${reviewed}/${total} bullets human-reviewed` }
    }
    const previews = unapproved
      .slice(0, 2)
      .map((b) => `"${preview(b.text)}"`)
      .join(', ')
    return {
      ok: false,
      detail: `approved ${reviewed}/${total} bullets human-reviewed — ${unapproved.length} unapproved: ${previews}`,
    }
  },
}
