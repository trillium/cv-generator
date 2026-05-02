export type PageSize = {
  name: string
  width: number
  height: number
}

export type PageMargins = {
  top: number
  bottom: number
  left: number
  right: number
}

const DEFAULT_PAGE_SIZES = {
  letter: { name: 'US Letter', width: 8.5, height: 11 },
  a4: { name: 'A4', width: 8.27, height: 11.69 },
  legal: { name: 'US Legal', width: 8.5, height: 14 },
  tabloid: { name: 'Tabloid', width: 11, height: 17 },
} as const satisfies Record<string, PageSize>

export { DEFAULT_PAGE_SIZES }

const CSS_DPI = 96
const PDF_SCALE = 1

const PDF_MARGINS: PageMargins = { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 }

function computeContentDimensions(page: PageSize, margins: PageMargins, scale: number) {
  const contentWidthInches = page.width - margins.left - margins.right
  const contentHeightInches = page.height - margins.top - margins.bottom
  return {
    width: Math.floor((contentWidthInches * CSS_DPI) / scale),
    height: Math.floor((contentHeightInches * CSS_DPI) / scale),
  }
}

const LETTER_CONTENT = computeContentDimensions(DEFAULT_PAGE_SIZES.letter, PDF_MARGINS, PDF_SCALE)

export const PDF_CONFIG = {
  scale: PDF_SCALE,
  margins: PDF_MARGINS,
  dpi: CSS_DPI,
  pageSize: DEFAULT_PAGE_SIZES.letter,
  contentWidth: LETTER_CONTENT.width,
  contentHeight: LETTER_CONTENT.height,
  marginString: `${PDF_MARGINS.top}in`,
}

export interface PrintPageSizeProps {
  targetSelector?: string
  pageSize?: PageSize
  margins?: PageMargins
  dpi?: number
  onPageSizeChange?: (pageSize: PageSize) => void
  pdfType?: string
}
