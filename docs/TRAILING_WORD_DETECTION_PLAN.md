# Trailing Word Detection Plan

## Goal

Detect lines with <4 words on the last page of PDFs and store findings in `metadata.json`. The `/evaluate-yml` command will consume this data to warn users about orphan lines that should be condensed.

## Current State

- `extractLastPageText()` in `scripts/pdf/page-counter.ts` already extracts lines from last page
- `PdfMetadata` interface exists in `scripts/pdf/metadata-writer.ts` and `src/types/multiFileManager.types.ts`
- No word counting or orphan detection currently implemented

## Implementation

### 1. Add Word Counting to Text Extraction

**File**: `scripts/pdf/page-counter.ts`

- Add `TrailingWordInfo` interface with fields: `lineIndex`, `lineText`, `wordCount`, `isOrphan`
- Add `analyzeTrailingWords(lines: string[])` function that counts words per line
- Mark lines as orphan if `wordCount > 0 && wordCount < 4`
- Update `extractLastPageText()` to return `trailingWords` array

### 2. Update Metadata Schema

**Files**: `scripts/pdf/metadata-writer.ts`, `src/types/multiFileManager.types.ts`

Add to `PdfMetadata` interface:

- `trailingWords?: TrailingWordInfo[]`
- `orphanCount?: number`

### 3. Wire Through PDF Generation

**File**: `scripts/pdf/pdf-generator.ts`

- Get `trailingWords` from `extractLastPageText()`
- Return `trailingWords` to caller

**File**: `scripts/pdf/pdf.ts`

- Pass `trailingWords` and `orphanCount` to `saveMetadata()`
- Writes to `metadata.json`

## Verification

Generate a PDF and check `metadata.json` contains `trailingWords` array and `orphanCount`.
