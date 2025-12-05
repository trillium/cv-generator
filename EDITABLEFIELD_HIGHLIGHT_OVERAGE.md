# EditableField Page 2 Overflow Highlighting Plan

## Goal

Extend `EditableField` component to visually indicate when text content appears on page 2 of the generated PDF. Instead of editing the text directly, we overlay a colored highlight (orange) on hover to show which parts overflow.

## Current Architecture

### Metadata Storage

The system already tracks page overflow via PDF metadata:

```
pii/[resumePath]/metadata.json
└── pdf
    ├── resume
    │   ├── pages: number
    │   ├── lastPageText?: string    // Full text from page 2+
    │   └── lineBreaks?: number
    └── coverLetter
        └── [same structure]
```

### Data Flow

```
PDF Generation (puppeteer)
    ↓
Extract page info (pdfjs-dist)
    ↓
PdfMetadata { pages, lastPageText, lineBreaks }
    ↓
Save to metadata.json
    ↓
Load via loadDirectory()
    ↓
DirectoryManagerContext.storedPdfMetadata
    ↓
[NEW] EditableField consumes metadata for highlighting
```

### Key Files

- **Metadata Types**: `src/types/multiFileManager.types.ts`
- **Context**: `src/contexts/DirectoryManager/DirectoryManagerContext.tsx`
- **Component**: `src/components/EditableField/EditableField.tsx`

## Problem Statement

Currently, the system:

- ✅ Generates PDF and extracts page 2 text
- ✅ Stores `lastPageText` in metadata.json
- ✅ Loads metadata into DirectoryManagerContext
- ❌ Does NOT display overflow info in UI
- ❌ Does NOT highlight overflow text in EditableField

## Proposed Solution

### High-Level Approach

Add a **second overlay layer** to `EditableField` that highlights text matching `lastPageText` metadata.

### UI Design

#### Visual States

1. **Normal hover** (existing):

   - Blue overlay on entire field: `bg-blue-500/20`

2. **Page 2 overflow hover** (new):

   - Orange overlay on matching text: `bg-orange-500/30`
   - Appears on top of blue overlay
   - Only visible when hovering EditableField

3. **Combined state**:
   - Field gets blue overlay (whole field)
   - Orange overlay appears on specific text that's on page 2

#### Example

```
┌─────────────────────────────────────┐
│ Experience Section                  │  ← EditableField wrapper
├─────────────────────────────────────┤
│ Software Engineer                   │  ← Normal (page 1)
│ • Built React applications          │  ← Normal (page 1)
│ • Led team of 5 developers          │  ← [ORANGE] (page 2)
│ • Improved performance by 40%       │  ← [ORANGE] (page 2)
└─────────────────────────────────────┘

Hover state:
┌─────────────────────────────────────┐
│ [BLUE OVERLAY]                      │
│ Software Engineer                   │
│ • Built React applications          │
│ • Led team... [ORANGE HIGHLIGHT]    │  ← Orange on top of blue
│ • Improved... [ORANGE HIGHLIGHT]    │
└─────────────────────────────────────┘
```

## Implementation Plan

### Step 1: Text Matching Algorithm

Create utility to match field text content against `lastPageText`:

**File**: `src/components/EditableField/overflowHighlighter.ts`

```typescript
interface OverflowMatch {
  isOnPage2: boolean;
  matchedText?: string;
  matchPercentage?: number;
}

function detectPageOverflow(
  fieldContent: string | ReactNode,
  lastPageText: string | undefined,
): OverflowMatch;
```

**Matching strategy**:

1. Extract text from `children` ReactNode tree
2. Normalize whitespace and compare against `lastPageText`
3. Return partial/full match indicator
4. Handle array fields (join lines)

### Step 2: Component Updates

#### EditableField.tsx Changes

1. **Import context**:

   ```typescript
   const { storedPdfMetadata } = useDirectoryManager();
   ```

2. **Extract metadata**:

   ```typescript
   const lastPageText = storedPdfMetadata?.pdf?.resume?.lastPageText;
   const pages = storedPdfMetadata?.pdf?.resume?.pages;
   ```

3. **Detect overflow**:

   ```typescript
   const overflowInfo = detectPageOverflow(children, lastPageText);
   const hasOverflow = pages > 1 && overflowInfo.isOnPage2;
   ```

4. **Add new overlay component**:

   ```typescript
   const OverflowOverlay = () => (
     hasOverflow ? (
       <div className="absolute inset-0 group-hover:bg-orange-500/30
                       group-hover:shadow-orange-200/50
                       rounded-lg z-20 pointer-events-none print:hidden"
            title={`This content appears on page ${pages}`} />
     ) : null
   );
   ```

5. **Layer overlays**:
   ```tsx
   <div className={wrapperStyles}>
     <HighlightOverlay /> {/* z-10: blue */}
     <OverflowOverlay /> {/* z-20: orange */}
     {children}
   </div>
   ```

(NO FINE GRAIN)

### Step 4: Handle Multiple Document Types

Support both resume and cover letter:

```typescript
const documentType = /* detect from context or prop */;
const metadata = documentType === 'resume'
  ? storedPdfMetadata?.pdf?.resume
  : storedPdfMetadata?.pdf?.coverLetter;
```

### Step 5: Accessibility & UX

1. **Tooltip**: Add title explaining why orange

   ```
   "This content appears on page 2"
   ```

2. **Print styles**: Ensure overlays are hidden in print

   ```
   print:hidden
   ```

3. **Color contrast**: Use `dark:` variants for dark mode

   ```css
   group-hover:bg-orange-500/30
   dark:group-hover:bg-orange-700/40
   ```

4. **Loading states**: Handle missing/loading metadata gracefully

## Technical Considerations

### Challenges

1. **Text extraction from ReactNode**:

   - Children can be complex JSX trees
   - Need to flatten to compare with lastPageText

2. **Partial matches**:

   - Field might contain some page 1 + some page 2 content
   - Need threshold for "highlight whole field" vs "highlight partial"

3. **Dynamic content**:

   - Metadata is snapshot at last PDF generation
   - May be stale if YAML edited but PDF not regenerated

4. **Performance**:
   - Text matching on every EditableField render
   - Consider memoization

### Edge Cases

- **Empty metadata**: No PDF generated yet → no highlighting
- **Multi-page overflow**: Content spans pages 1-3 → highlight if ANY on page 2+
- **Cover letter vs resume**: Track separately
- **Array fields**: Join items before matching

## Testing Strategy

1. **Unit tests**:

   - Text matching algorithm
   - ReactNode text extraction
   - Partial match logic

2. **Visual tests**:

   - Hover states with/without overflow
   - Multiple fields with different overflow states
   - Dark mode variants

3. **Integration tests**:
   - Generate PDF → verify metadata → check highlighting
   - Edit YAML → regenerate PDF → verify updated highlighting

## Migration Path

### Phase 1: Basic Overlay (MVP)

- Whole-field orange overlay
- Based on simple text matching
- Ship quickly for feedback

### Phase 2: Refinement

- Partial text highlighting
- Better matching algorithm
- Performance optimization

### Phase 3: Advanced Features

- Show page number in tooltip
- Click to jump to page 2 in PDF viewer
- Visual indicator of "how much" is on page 2

## Open Questions

1. **What about page 3+?**

   - Currently only track "lastPageText"
   - Should we track per-page breakdown?

2. **Matching threshold?**

   - If 10% of field is on page 2, highlight whole field?
   - Or only highlight if >50%?

3. **Color choice?**

   - Orange for warning/overflow
   - Alternative: Yellow, red borders, striped pattern?

4. **Document type detection?**
   - How does EditableField know if it's in resume vs cover letter context?
   - Prop? Context? URL?

## Dependencies

- Existing: `clsx`, `useDirectoryManager`, React
- New: Text matching utility (can use Levenshtein or simple includes)

## Estimated Effort

- Phase 1 (whole-field overlay): ~2-3 hours
- Phase 2 (partial highlighting): ~4-6 hours
- Testing: ~2 hours

**Total**: 8-11 hours for full implementation
