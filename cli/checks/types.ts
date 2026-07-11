export type Severity = 'error' | 'warn'

export interface CheckContext {
  company: string
  companyDir: string
  metadata: CompanyMetadata | null
  manifest: CompanyManifest | null
  layout: CompanyLayout | null
  postingPath: string | null
}

export interface CompanyLayout {
  layout?: {
    fontSize?: number
    [key: string]: unknown
  }
  [key: string]: unknown
}

export interface CheckOutcome {
  ok: boolean
  detail: string
}

export interface Check {
  name: string
  severity: Severity
  run(ctx: CheckContext): Promise<CheckOutcome>
}

export interface TrailingWord {
  lineIndex: number
  lineText: string
  wordCount: number
  isOrphan: boolean
  yPosition: number
  gapToNext: number | null
}

export interface PdfSection {
  pages: number
  trailingWords?: TrailingWord[]
  orphanCount?: number
  generatedAt?: string
}

export interface ChecksBlock {
  pass: boolean
  failures: string[]
  ranAt: string
}

export interface CompanyMetadata {
  pdf?: {
    resume?: PdfSection
    coverLetter?: PdfSection
  }
  checks?: ChecksBlock
  [key: string]: unknown
}

export interface CompanyManifest {
  pages?: number
  layout?: {
    fontSize?: number
    [key: string]: unknown
  }
  [key: string]: unknown
}
