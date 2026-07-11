import { atsKeywords } from './ats-keywords'
import { fontSizeFloor } from './font-size-floor'
import { orphanFlags } from './orphan-flags'
import { pageCount } from './page-count'
import type { Check } from './types'

export const registry: Check[] = [pageCount, orphanFlags, fontSizeFloor, atsKeywords]

export type { Check, CheckContext, CheckOutcome, Severity } from './types'
