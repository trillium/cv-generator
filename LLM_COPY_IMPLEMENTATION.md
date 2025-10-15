# LLM Copy Feature - Implementation Summary

## Overview

When a user clicks the "Copy" button in the EditableField modal, the copied JSON now includes the `llm` object from the CVData context.

## Complete Data Flow

### 1. **Data Storage** (`pii/base/llm.json`)

```json
{
  "llm": "This is a single LLM-generated summary or note."
}
```

Or it can be a more complex object:

```json
{
  "llm": {
    "prompt": "Your prompt here",
    "notes": ["note1", "note2"],
    "customField": "value"
  }
}
```

### 2. **API Layer** (`app/api/directory/load/route.ts`)

- Endpoint: `GET /api/directory/load?path=base`
- Uses `MultiFileManager.loadDirectory()` to merge all YAML/JSON files in the hierarchy
- Returns merged `CVData` object including the `llm` field

**API Response:**

```json
{
  "success": true,
  "data": {
    "info": {...},
    "workExperience": [...],
    "llm": "This is a single LLM-generated summary or note."
  },
  "sources": {...},
  "metadata": {...}
}
```

### 3. **Context Layer** (`src/contexts/DirectoryManagerContext.tsx`)

```typescript
// Stores the API response data
const [data, setData] = useState<CVData | null>(null);

// Exposes as parsedData for compatibility with EditableField
const value: DirectoryManagerContextType = {
  parsedData: data, // <-- Contains llm field
  // ... other fields
};
```

### 4. **Component Layer** (`src/components/EditableField/EditableField.tsx`)

```typescript
// Gets parsedData from context (includes llm)
const { parsedData, error } = useDirectoryManager();

// Passes to EditModal
<EditModal
  parsedData={parsedData}  // <-- Includes llm
  // ... other props
/>
```

### 5. **Modal Layer** (`src/components/EditableField/EditModal.tsx`)

```typescript
// Receives parsedData as prop
interface EditModalProps {
  parsedData: unknown; // CVData with llm field
  // ... other props
}

// Copy handler
const handleCopy = async () => {
  const data = extractCopyData(yamlPath, parsedData as CVData);
  await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
};
```

### 6. **Utility Layer** (`lib/utility/index.ts`)

```typescript
export function extractCopyData(yamlPath: string, parsedData: CVData): unknown {
  // Helper to merge llm if present
  function withLLM(obj: unknown): unknown {
    if (
      parsedData.llm &&
      obj &&
      typeof obj === "object" &&
      !Array.isArray(obj)
    ) {
      return { ...obj, llm: parsedData.llm };
    }
    return obj;
  }

  // All return statements use withLLM() to include llm data
  // Examples:
  // - workExperience.0 -> returns work item with llm
  // - workExperience.0.lines.3 -> returns work item with specific line and llm
  // - workExperience -> returns { workExperience: [...], llm: ... }
}
```

## Supported Copy Scenarios

### Scenario 1: Copy Entire Array

**Path:** `workExperience`

**Output:**

```json
{
  "workExperience": [
    { "position": "...", "company": "..." },
    { "position": "...", "company": "..." }
  ],
  "llm": "This is a single LLM-generated summary or note."
}
```

### Scenario 2: Copy Array Item

**Path:** `workExperience.0`

**Output:**

```json
{
  "position": "Frontend Engineer",
  "company": "HackForLA",
  "location": "Los Angeles, CA",
  "icon": "Remote",
  "years": "Oct 2022 - Present",
  "lines": [...],
  "llm": "This is a single LLM-generated summary or note."
}
```

### Scenario 3: Copy Specific Line

**Path:** `workExperience.0.lines.3` or `workExperience.0.lines.3.text`

**Output:**

```json
{
  "position": "Frontend Engineer",
  "company": "HackForLA",
  "location": "Los Angeles, CA",
  "icon": "Remote",
  "years": "Oct 2022 - Present",
  "line": {
    "text": "Enhanced team collaboration by introducing code quality tools..."
  },
  "llm": "This is a single LLM-generated summary or note."
}
```

## Type Definitions

### CVData Type (`src/types/index.ts`)

```typescript
export type LLMInfo =
  | {
      prompt: string;
      notes?: Notes;
      [key: string]: unknown;
    }
  | string;

export type CVData = {
  info: InfoType & { notes?: Notes };
  workExperience: WorkExperience[] & { notes?: Notes };
  // ... other fields
  llm?: LLMInfo; // <-- Added to CVData type
};
```

## Testing

### Manual Testing

1. Navigate to a page using directory-based data (e.g., `/two-column?dir=base`)
2. Click on any editable field to open the modal
3. Click the "Copy" (📋) button
4. Paste the clipboard content
5. Verify the `llm` field is present in the JSON

### Console Verification

Open browser console to see debug logs:

```
[EditModal] handleCopy - parsedData.llm: "This is a single LLM-generated summary or note."
[extractCopyData] withLLM - returning with llm: {position: "...", llm: "..."}
```

### API Testing

```bash
# Test API endpoint
curl -s "http://localhost:10301/api/directory/load?path=base" | jq '.data.llm'

# Expected output:
# "This is a single LLM-generated summary or note."
```

## Files Modified

1. **`lib/utility/index.ts`**

   - Added `withLLM()` helper function
   - Updated all return paths to include llm data
   - Added support for 5-part paths (e.g., `workExperience.0.lines.3.text`)

2. **`src/components/EditableField/EditModal.tsx`**

   - Added debug logging to `handleCopy()`

3. **`src/types/index.ts`**
   - Added `llm?: LLMInfo` to CVData type (already existed)

## Debug Logging

Debug logs can be removed once testing is complete:

- `EditModal.tsx` lines 118-121
- `lib/utility/index.ts` lines 14-26

## Notes

- The `llm` field is **optional** in CVData, so the feature works even if no llm.json file exists
- The `withLLM()` helper only adds llm to non-array objects
- For array copies, llm is added at the root level with the array
- The implementation supports both simple string llm values and complex object structures
