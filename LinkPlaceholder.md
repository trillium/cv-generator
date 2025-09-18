# Link Placeholder Implementation Spec

## Over### Current Implementation Status

- **Placeholder Display**: Implemented in EmptyFieldPlaceholder.tsx
- **Styling**: Implemented with gray, italic, opacity styling
- **Print Handling**: Implemented with `print:hidden` class
- **Individual Links**: Implemented via ProfileLink structure
- **Links Arrays**: Implemented via fake ProfileLink rendering
- **Field Type Check**: Implemented in getPlaceholderMessage()
- **Null Children**: Implemented in replaceBlankContent()
- **Modal Field Type**: Implemented in EditModal.tsx
- **ProfileLink Structure**: Implemented with proper div content replacementnt placeholder functionality for empty link fields in the `EmptyFieldPlaceholder` component. When a link field or links array is empty, display a clickable placeholder that allows users to add links.

## Important Notes

### ⚠️ ProfileLink.tsx - DO NOT EDIT

**File**: `src/components/Profile/ProfileLink/ProfileLink.tsx`

This file **MUST NOT** be edited as part of this implementation. All handling of 'preview' content (fallback display text when fields are empty) must be handled within the `EditableField` component or its sub-components, not in `ProfileLink.tsx`.

Currently, `ProfileLink.tsx` contains preview logic like `value={name || icon}` and `text: name || icon`, but this should be moved to the appropriate placeholder handling components to maintain separation of concerns.

## Requirements & Implementation

### 1. Placeholder Display

- Show "Click to add a link" when link field is empty
- Visually distinct (gray, italic, opacity)
- Hidden in print view

### 2. Link Field Handling

- For individual link fields (`fieldType="link"`), display placeholder when `isEmpty` is true
- Focus on visible `<div>` element (not print-only `<a>` tag)
- Replace empty content in `<div>` with placeholder text

### 3. Links Array Handling

- For empty links arrays (e.g., `projects.0.links: []`), display placeholder
- Placeholder should mimic ProfileLink structure but allow adding first link
- **Key**: ProfileLink requires `nameYamlPath` and `linkYamlPath` - when missing, show placeholder
- Path example: `projects.0.links`

## Relevant Files

The following files are involved in the link placeholder implementation:

- `src/components/EditableField/EmptyFieldPlaceholder.tsx` - Handles placeholder display for empty fields
- `src/components/Projects/ProjectLinks.tsx` - Renders project links with placeholder for empty arrays
- `src/components/EditableField/editableFieldUtils.ts` - Utilities for determining add button visibility
- `src/components/EditableField/EditableField.tsx` - Main editable field component
- `src/components/Profile/ProfileLink/ProfileLink.tsx` - Individual link component

## Current Implementation Status

### ⚠️ Not Yet Implemented (0% Complete)

- **Placeholder Display**: Not implemented
- **Styling**: Not implemented
- **Print Handling**: Not implemented
- **Individual Links**: Not implemented
- **Links Arrays**: Not implemented
- **Field Type Check**: Not implemented
- **Null Children**: Not implemented
- **Modal Field Type**: Not implemented
- **ProfileLink Structure**: Not implemented

### 🔧 Required Code Changes

#### 1. EmptyFieldPlaceholder.tsx - getPlaceholderMessage()

```tsx
// Add fieldType check
if (fieldType === "link" || yamlPath.includes("links")) {
  return "Click to add a link";
}
```

#### 2. EmptyFieldPlaceholder.tsx - replaceBlankContent() ✅ IMPLEMENTED

```tsx
// Add null children handling
if (
  !isValidElement(node) &&
  node == null &&
  isEmpty &&
  (fieldType === "link" || yamlPath.includes("links"))
) {
  return (
    <span className="text-gray-400 italic opacity-70 hover:opacity-90 transition-opacity block print:hidden">
      {getPlaceholderMessage()}
    </span>
  );
}
```

**Additional fix for link fields**: Added `hasEmptyLinkDisplay()` function to detect when link fields have empty display content even when the value is not empty (e.g., when icon is "None" but display text is empty). This ensures placeholder shows for fake ProfileLink entries.

#### 3. EmptyFieldPlaceholder.tsx - ProfileLink Structure Handling

```tsx
// Special handling for ProfileLink structure: <a>{content}</a><div>{contentMock}</div>
if (
  isValidElement(child) &&
  child.type === "div" &&
  typeof (child as React.ReactElement).props.children === "string" &&
  isContentBlank((child as React.ReactElement).props.children) &&
  (fieldType === "link" || yamlPath.includes("links"))
) {
  // Replace empty div content with placeholder
  return cloneElement(
    child as React.ReactElement,
    (child as React.ReactElement).props,
    <span className="text-gray-400 italic opacity-70 hover:opacity-90 transition-opacity block print:hidden">
      {getPlaceholderMessage()}
    </span>,
  );
}
```

#### 4. ProjectLinks.tsx - Empty Array Handling

The current implementation correctly renders a fake `ProfileLink` with empty values when the links array is empty. This is **intended behavior** that allows the EmptyFieldPlaceholder to handle the placeholder display through the existing ProfileLink structure:

```tsx
const linksToRender =
  !links || links.length === 0
    ? [
        {
          icon: "None",
          link: "",
          name: "",
        },
      ]
    : links;
```

This approach:

- Maintains consistency with the ProfileLink component structure
- Leverages the existing EmptyFieldPlaceholder logic for placeholder display
- Ensures proper YAML path handling for the first link item
- Works seamlessly with the existing link editing workflow

#### 5. editableFieldUtils.ts - shouldShowAddButtons()

```typescript
const isNestedLinksArray = parentPath.includes(".links");
// Add to return statement
return (
  supportedArrayPaths.includes(parentPath) ||
  isNestedLinesArray ||
  isNestedBubblesArray ||
  isNestedLinksArray
);
```

#### 6. EditModal.tsx - Links Array Modal Fix

```tsx
// Detect when we're editing a links array that should show link interface
const isLinksArray = fieldType === "array" && yamlPath.includes("links");

// Show link editing interface for links arrays
{fieldType === "link" || isLinksArray ? (
  // Display Text and URL inputs
) : ...}
```

## Test Cases

### Individual Link Field

- Empty link text → Shows "Click to add a link" in the visible `<div>` element
- Filled link → Displays actual link content
- Placeholder should be clickable to open edit modal

### Links Array

- Empty array `links: []` → Shows placeholder
- Array with links → Displays link list

### Example Data

```yaml
# Empty links array
- name: Foo Site
  links: []
  lines:
    - name: ""
      lines: []
      text: Bullet 1

# Filled links array
- name: Bar Site
  links:
    - name: GitHub
      link: github.com/example/bar
      icon: None
    - name: Live Site
      link: barsiteexample.com/
      icon: None
```

## Acceptance Criteria

- [x] Empty link fields show clickable placeholder
- [x] Empty links arrays show placeholder
- [x] Placeholder styling matches design
- [x] Clicking placeholder opens edit modal
- [x] Print view hides placeholders
- [x] Modal correctly shows link editing interface (not array interface)
- [x] Links arrays save proper link objects to YAML
- [x] No regressions in existing functionality
