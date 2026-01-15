# Trailing Word Detection Plan

## Context

Google resume guidelines recommend against bullet points that "spill over by a word or two into a second line" (see `llm/google-resume-tips-stripped.md:24`). We need to detect and track these "trailing words" or "orphan lines" in our PDF metadata system.

## Current Implementation

### Data Flow

1. **PDF Generation** (`scripts/pdf/pdf-generator.ts`)

   - Generates PDF using Puppeteer
   - Calls `extractLastPageText()` for multi-page PDFs
   - Returns: `pageCount`, `lastPageText`, `lineBreaks`, `lastPageLines`

2. **Text Extraction** (`scripts/pdf/page-counter.ts`)

   - `extractLastPageText()`: Extracts text from last page of PDF
   - Uses `pdfjs-dist` to parse PDF text content
   - Groups text by Y-coordinate to detect lines
   - Returns: `{ text, lineBreaks, lines }`

3. **Metadata Storage** (`scripts/pdf/metadata-writer.ts`)
   - `PdfMetadata` interface: `pages`, `lastPageText`, `lastPageLines`, `lineBreaks`, `generatedAt`
   - `saveMetadata()`: Writes to `metadata.json` (preserves top-level fields like `noBrowserOpen`)
   - Currently only tracks **last page** of multi-page PDFs

### Current Limitations

- Only analyzes the **last page** of multi-page PDFs
- No word counting or orphan line detection
- `lastPageLines` array exists but isn't analyzed for trailing words
- Single-page PDFs skip all text analysis

## Proposed Solution

### Goal

Detect lines with 1-3 words and track them in metadata so users can identify content that needs condensing.

### Implementation Plan

#### Phase 1: Extend Text Analysis

**File**: `scripts/pdf/page-counter.ts`

1. Create new function `analyzeTrailingWords()`:

   ```typescript
   interface TrailingWordInfo {
     lineIndex: number; // Which line (0-indexed)
     lineText: string; // Full text of the line
     wordCount: number; // Number of words
     isOrphan: boolean; // true if 1-3 words
   }

   function analyzeTrailingWords(lines: string[]): TrailingWordInfo[];
   ```

2. Word counting logic:

   - Trim whitespace
   - Split by whitespace: `/\s+/`
   - Filter empty strings
   - Count remaining tokens
   - Flag as orphan if `wordCount >= 1 && wordCount <= 3`

3. Update `extractLastPageText()` to return trailing word analysis:
   ```typescript
   return {
     text,
     lineBreaks,
     lines,
     trailingWords: analyzeTrailingWords(lines),
   };
   ```

#### Phase 2: Extend ALL Pages Analysis (Optional Enhancement)

**File**: `scripts/pdf/page-counter.ts`

Create `extractAllPagesText()` function:

```typescript
async function extractAllPagesText(pdfBuffer: Buffer): Promise<{
  pages: Array<{
    pageNumber: number;
    lines: string[];
    trailingWords: TrailingWordInfo[];
  }>;
  totalOrphans: number;
}>;
```

This allows detection of trailing words on **any page**, not just the last page.

#### Phase 3: Update Metadata Schema

**Files**:

- `scripts/pdf/metadata-writer.ts`
- `src/types/multiFileManager.types.ts`

Update `PdfMetadata` interface:

```typescript
export interface PdfMetadata {
  pages: number;
  lastPageText?: string;
  lastPageLines?: string[];
  lineBreaks?: number;
  trailingWords?: TrailingWordInfo[]; // NEW: orphan lines on last page
  hasOrphans?: boolean; // NEW: quick flag for UI
  orphanCount?: number; // NEW: total count
  generatedAt: string;
}
```

Alternative full-document schema (if implementing Phase 2):

```typescript
export interface PdfMetadata {
  pages: number;
  allPagesAnalysis?: Array<{
    // NEW: full document analysis
    pageNumber: number;
    lines: string[];
    trailingWords: TrailingWordInfo[];
  }>;
  hasOrphans?: boolean;
  orphanCount?: number;
  generatedAt: string;
}
```

#### Phase 4: Update PDF Generation

**File**: `scripts/pdf/pdf.ts`

Update metadata saving calls (lines 83-89, 110-116):

```typescript
saveMetadata(outDir, "resume", {
  pages: pageCount,
  lastPageText: pageCount > 1 ? lastPageText : undefined,
  lastPageLines: pageCount > 1 ? lastPageLines : undefined,
  lineBreaks: pageCount > 1 ? lineBreaks : undefined,
  trailingWords: trailingWords, // NEW
  hasOrphans: trailingWords.some((t) => t.isOrphan), // NEW
  orphanCount: trailingWords.filter((t) => t.isOrphan).length, // NEW
  generatedAt: new Date().toISOString(),
});
```

#### Phase 5: Update Return Types

**File**: `scripts/pdf/pdf-generator.ts`

Update `generateAndSavePdf()` return type:

```typescript
Promise<{
  path: string;
  pageCount: number;
  lastPageText: string;
  lineBreaks: number;
  lastPageLines: string[];
  trailingWords: TrailingWordInfo[]; // NEW
}>;
```

Call the updated `extractLastPageText()` and pass through the new field.

#### Phase 6: Console Output (User Feedback)

**File**: `scripts/pdf/pdf.ts`

Add warnings when orphans are detected (after lines 92-96, 118-124):

```typescript
if (pageCount > 1) {
  console.log(
    `📄 Resume generated: ${pageCount} page(s), ${lineBreaks} line breaks on last page`,
  );

  const orphans = trailingWords.filter((t) => t.isOrphan);
  if (orphans.length > 0) {
    console.warn(`⚠️  Found ${orphans.length} orphan line(s) with 1-3 words:`);
    orphans.forEach((o) => {
      console.warn(
        `   Line ${o.lineIndex + 1}: "${o.lineText}" (${o.wordCount} word${o.wordCount > 1 ? "s" : ""})`,
      );
    });
  }
}
```

## Testing Strategy

1. **Unit tests** for `analyzeTrailingWords()`:

   - Empty array
   - Lines with 0, 1, 2, 3, 4+ words
   - Edge cases: punctuation, multiple spaces, special characters

2. **Integration test**: Generate PDF with known orphan lines and verify metadata

3. **Manual testing**: Check existing resumes in `pii/resumes/` for orphan detection

## Future Enhancements

1. **Frontend display**: Show orphan warnings in UI when viewing PDF metadata
2. **Auto-suggest fixes**: Integrate with LLM to suggest condensed versions of orphan lines
3. **Page-by-page analysis**: Extend beyond last page (Phase 2 implementation)
4. **Configurable threshold**: Make 1-3 word limit configurable in metadata.json
5. **Historical tracking**: Track orphan trends over time in changelog

## Files to Modify

### Core Implementation

- [ ] `scripts/pdf/page-counter.ts` - Add `analyzeTrailingWords()` function
- [ ] `scripts/pdf/page-counter.ts` - Update `extractLastPageText()` return type
- [ ] `scripts/pdf/metadata-writer.ts` - Extend `PdfMetadata` interface
- [ ] `src/types/multiFileManager.types.ts` - Extend `PdfMetadata` interface (frontend)
- [ ] `scripts/pdf/pdf-generator.ts` - Update return types and pass through data
- [ ] `scripts/pdf/pdf.ts` - Update metadata saving and add console warnings

### Testing

- [ ] Create test file: `scripts/pdf/page-counter.test.ts`
- [ ] Add integration test to verify metadata.json output

## Estimated Effort

- **Phase 1 (Core)**: 2-3 hours
- **Testing**: 1 hour
- **Phase 2 (All pages)**: 2-3 hours (optional)
- **Total**: 3-8 hours depending on scope
