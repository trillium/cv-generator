I want there to be a hover state for each element rendered on the page and when the user clicks on that section, it brings the user to that part of the edit yml form section.

Help me plan out a way for this feature to be implemented.

Workflow:

User loads resume from data file user clicks sections User is brought to edit section user edits, saves changes are automatcially saved to the active data.yml file

This is a flawed general plan that we are rewriting together before implementation.

---

# Granular CV Editor Feature Overview

## Feature Purpose

Create an interactive CV editing experience where users can click on any piece of content to edit it inline, with changes automatically saved to the YAML data file.

## Core Architecture

### **Single Higher-Order Component Pattern**

```
EditableField<T> (Generic HOC)
├── Wraps ANY content element to make it editable
├── Accepts yamlPath prop to identify data location
├── Manages hover/edit states with CSS-only visual feedback
├── Handles inline editing without layout changes
└── Auto-saves to YAML via context updates
```

### **Implementation Strategy**

- **One Component**: Single `EditableField` wrapper for all editable content
- **Generic Implementation**: Uses TypeScript generics to handle any data type
- **Prop-driven Configuration**: YAML path and field type passed as props
- **Zero Layout Impact**: Editing states use CSS overlays/borders only

## Component Interface

```typescript
interface EditableFieldProps<T> {
  yamlPath: string; // e.g. "experience[0].company"
  value: T; // Current value from YAML data
  fieldType?: "text" | "textarea" | "array";
  children: ReactNode; // The content to wrap and make editable
  className?: string; // Additional styling
}
```

## Usage Pattern

```typescript
// Wrap any content to make it editable
<EditableField yamlPath="experience[0].company" value={job.company}>
  <h3>{job.company}</h3>
</EditableField>

<EditableField yamlPath="experience[0].bullets[1]" value={bullet}>
  <li>{bullet}</li>
</EditableField>
```

## Key Requirements

### **Print Compatibility**

- **CSS Media Queries**: All edit UI hidden in `@media print`
- **No Layout Changes**: Editing doesn't affect positioning or sizing
- **Visual Feedback Only**: Hover states use subtle borders/backgrounds

### **Universal Wrapper**

- **Single Component**: One `EditableField` handles all use cases
- **Flexible Content**: Can wrap headings, paragraphs, list items, spans
- **Consistent Behavior**: Same hover/click/save pattern everywhere
- **Type Safety**: Generic implementation maintains TypeScript safety

## Technical Benefits

- **Minimal Code**: One component instead of many specialized ones
- **Easy Integration**: Drop-in wrapper for existing content
- **Maintainable**: Single source of truth for edit behavior
- **Scalable**: Works with any YAML structure via path strings

This approach provides maximum flexibility with minimal implementation complexity while ensuring the print version remains completely unaffected.
