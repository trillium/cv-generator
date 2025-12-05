# Resume Color Configuration System

## Overview

This document describes the implementation plan for adding customizable accent colors to resumes. Currently, all accent colors (like bubble backgrounds, buttons, etc.) are hardcoded to blue (`bg-blue-100`, `text-blue-800`). This update will allow each resume to have its own color scheme stored in metadata.

---

## Current State

### Hardcoded Colors Throughout Codebase

**WorkExperience Component** (`src/components/WorkExperience/WorkExperience.tsx:92`)

```tsx
<span className="inline-block px-2 py-1 rounded-full text-sm text-blue-800 bg-blue-100 mr-2 mb-1">
  {bubble}
</span>
```

**Other Components with Hardcoded Colors:**

- `Bubble.tsx`: Uses `border-gray-400`, `text-gray-500`
- `MetadataEditor.tsx`: Uses `bg-blue-600`, `bg-blue-100`
- `ActionButtons.tsx`: Uses `bg-blue-500`, `bg-green-500`, `bg-gray-200`
- `ResumeMetadataDisplay.tsx`: Status colors (blue/purple/green/red/orange)

### Existing Infrastructure (Ready to Use)

**ColorPicker Component** (`src/components/ColorPicker/`)

- Already implements full Tailwind color palette (25 color families)
- Already sets CSS custom properties: `--color-primary`, `--color-primary-{50-950}`
- Not currently integrated with resume system

---

## Proposed Changes

### 1. Type System Updates

**File:** `src/types/index.ts`

Add color configuration to `ResumeMetadata` type:

```typescript
export type ResumeMetadata = {
  targetCompany?: string;
  targetPosition?: string;
  targetJobUrl?: string;
  applicationDate?: string;
  applicationStatus?:
    | "draft"
    | "applied"
    | "interview"
    | "offer"
    | "rejected"
    | "withdrawn";
  notes?: string;
  tailoredFor?: string[];
  lastModified?: string;

  // NEW: Color configuration
  colorPrimary?: string; // e.g., "blue-600" or "#3b82f6"
  colorPrimaryFaded?: string; // e.g., "blue-100" or "#dbeafe"
};
```

### 2. Component Updates

#### WorkExperience Component

**File:** `src/components/WorkExperience/WorkExperience.tsx`

**Current (line 92):**

```tsx
<span className="inline-block px-2 py-1 rounded-full text-sm text-blue-800 bg-blue-100 mr-2 mb-1">
```

**Updated approach:**

- Accept color props from parent
- Use dynamic Tailwind classes or inline styles
- Fallback to blue if no color specified

**Two implementation options:**

**Option A: CSS Custom Properties (Recommended)**

```tsx
// In parent/layout component, set CSS vars from metadata
style={{
  '--resume-primary': metadata?.colorPrimary || '#1e40af',
  '--resume-primary-faded': metadata?.colorPrimaryFaded || '#dbeafe'
}}

// In WorkExperience component
<span
  className="inline-block px-2 py-1 rounded-full text-sm mr-2 mb-1"
  style={{
    backgroundColor: 'var(--resume-primary-faded)',
    color: 'var(--resume-primary)'
  }}
>
```

**Option B: Dynamic Tailwind Classes**

```tsx
// If metadata stores Tailwind class names like "blue-800"
const primaryColor = metadata?.colorPrimary || 'blue-800';
const fadedColor = metadata?.colorPrimaryFaded || 'blue-100';

<span className={`inline-block px-2 py-1 rounded-full text-sm mr-2 mb-1 text-${primaryColor} bg-${fadedColor}`}>
```

⚠️ **Option B caveat:** Dynamic Tailwind classes require those classes to be in the bundle. May need safelist in `tailwind.config.js`.

#### Bubble Component

**File:** `src/components/Bubble/Bubble.tsx`

Similar updates to use configurable colors instead of hardcoded gray.

#### Projects Component

**Files:** Components that render project bubbles

Update to use same color system as WorkExperience.

#### Technical Section

**Files:** Components that render technical skill bubbles

Update to use same color system.

### 3. Metadata Editor Integration

**File:** `src/components/FileManager/MetadataEditor.tsx`

Add ColorPicker component to the metadata editing interface:

```tsx
import ColorPicker from "@/components/ColorPicker/ColorPicker";

// In the form
<div>
  <label>Primary Color</label>
  <ColorPicker
    selectedColor={metadata?.colorPrimary}
    onColorSelect={(color) => {
      updateMetadata("colorPrimary", `${color.name}-${color.shade}`);
      // Automatically set faded color to lighter shade
      updateMetadata("colorPrimaryFaded", `${color.name}-100`);
    }}
  />
</div>;
```

### 4. Default Color Strategy

**Fallback values when no color is specified:**

- `colorPrimary`: `"blue-800"` or `"#1e40af"`
- `colorPrimaryFaded`: `"blue-100"` or `"#dbeafe"`

**Smart defaults based on company:**

- Could auto-suggest colors based on company branding (future enhancement)

### 5. Data Migration

**Existing resume files:**

- No migration needed - colors are optional
- Existing resumes will use default blue colors
- Users can set colors via UI when desired

---

## Implementation Architecture

### Color Flow Diagram

```
┌─────────────────────────┐
│   Resume YAML File      │
│   metadata:             │
│     colorPrimary: ...   │
│     colorPrimaryFaded...│
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Resume Loader         │
│   (loads metadata)      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Layout/Page Component │
│   - Sets CSS vars       │
│   - Passes to children  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Child Components      │
│   - WorkExperience      │
│   - Bubble              │
│   - Projects            │
│   - Technical           │
│   (Use CSS vars)        │
└─────────────────────────┘
```

### Editing Flow Diagram

```
┌─────────────────────────┐
│   MetadataEditor UI     │
│   - ColorPicker button  │
└───────────┬─────────────┘
            │ click
            ▼
┌─────────────────────────┐
│   ColorPicker Modal     │
│   - 25 color families   │
│   - 11 shades each      │
└───────────┬─────────────┘
            │ select
            ▼
┌─────────────────────────┐
│   Update Metadata       │
│   - colorPrimary        │
│   - colorPrimaryFaded   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Save to YAML File     │
│   - Persist selection   │
└─────────────────────────┘
```

---

## Files That Will Change

### Type Definitions

- ✏️ `src/types/index.ts` - Add color fields to `ResumeMetadata`

### Components (Color Usage)

- ✏️ `src/components/WorkExperience/WorkExperience.tsx` - Use dynamic colors
- ✏️ `src/components/Bubble/Bubble.tsx` - Use dynamic colors
- ✏️ `src/components/Bubble/BubbleList.tsx` - Pass color props
- ✏️ `src/components/Project/` - Use dynamic colors (if project bubbles exist)
- ✏️ `src/components/Technical/` - Use dynamic colors (if exists)

### Metadata Editing

- ✏️ `src/components/FileManager/MetadataEditor.tsx` - Add ColorPicker UI

### Layout/Page Components

- ✏️ Resume rendering layouts - Set CSS custom properties from metadata
- ✏️ Single column layout
- ✏️ Two column layout

### Configuration (Optional)

- ✏️ `tailwind.config.js` - May need safelist if using dynamic Tailwind classes

---

## Testing Checklist

- [ ] Create new resume with custom colors
- [ ] Edit existing resume to add colors
- [ ] Verify colors appear in bubbles (work experience, projects, technical)
- [ ] Verify colors persist when saving/reloading
- [ ] Verify default blue colors work when no metadata colors set
- [ ] Test color picker UI in metadata editor
- [ ] Test PDF export with custom colors
- [ ] Test dark mode compatibility
- [ ] Test with all 25 color families
- [ ] Verify accessibility (sufficient contrast for text)

---

## Alternative Approaches Considered

### Full Theme System

**Rejected because:** Too complex for initial implementation. Would require defining entire color palettes (primary, secondary, accent, etc.). Current scope is just accent color for bubbles.

### Hex Color Input Only

**Rejected because:** ColorPicker already exists and provides better UX. Tailwind integration gives consistent color options.

### Store Entire TailwindColor Object

**Rejected because:** Would bloat YAML files. Better to store simple strings like "blue-800" or hex values.

---

## Future Enhancements

1. **Color Presets**: Company-branded color suggestions
2. **Multi-color Support**: Different colors for different sections
3. **Gradient Support**: Allow gradient backgrounds for headers
4. **Color Accessibility**: Warn if contrast ratio is insufficient
5. **Color History**: Remember recently used colors
6. **Import Company Colors**: Auto-detect from company website/logo

---

## Notes

- The ColorPicker component already has excellent infrastructure with CSS custom property support
- Recommend CSS custom properties approach (Option A) for better performance and flexibility
- Minimal breaking changes - all color fields are optional
- Existing resumes continue to work without modification
