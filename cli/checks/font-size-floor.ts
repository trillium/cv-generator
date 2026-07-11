import type { Check } from './types'

const FONT_SIZE_FLOOR = 13.5

export const fontSizeFloor: Check = {
  name: 'font-size-floor',
  severity: 'error',
  async run(ctx) {
    const fontSize = ctx.layout?.layout?.fontSize ?? ctx.manifest?.layout?.fontSize
    if (typeof fontSize !== 'number') {
      return {
        ok: true,
        detail: `no fontSize override in layout.yml or manifest — default 16 ≥ ${FONT_SIZE_FLOOR}`,
      }
    }
    if (fontSize >= FONT_SIZE_FLOOR) {
      return { ok: true, detail: `fontSize ${fontSize} ≥ ${FONT_SIZE_FLOOR}` }
    }
    return {
      ok: false,
      detail: `fontSize ${fontSize} below floor ${FONT_SIZE_FLOOR}`,
    }
  },
}
