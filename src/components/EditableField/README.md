# EditableField Component

The `EditableField` is a generic Higher-Order Component (HOC) that makes any content editable by wrapping it. This follows the single-component pattern outlined in the feature specification.

## Key Benefits

- **Minimal Code**: One component instead of many specialized ones
- **Easy Integration**: Drop-in wrapper for existing content
- **Maintainable**: Single source of truth for edit behavior
- **Scalable**: Works with any YAML structure via path strings
- **Print Compatible**: All edit UI hidden via CSS media queries

## Usage Pattern

```tsx
import EditableField from '../EditableField';

// Basic text field
<EditableField yamlPath="contact.name" value={data.name}>
  <h1 className="text-2xl font-bold">{data.name}</h1>
</EditableField>

// Multiline text (job descriptions, etc.)
<EditableField yamlPath="experience.0.description" value={job.description} fieldType="textarea">
  <p className="text-gray-700">{job.description}</p>
</EditableField>

// Array fields (skills, technologies, etc.)
<EditableField yamlPath="skills.technical" value={skills} fieldType="array">
  <div className="flex flex-wrap gap-2">
    {skills.map(skill => <span key={skill} className="badge">{skill}</span>)}
  </div>
</EditableField>
```

## Props Interface

```typescript
interface EditableFieldProps<T> {
  yamlPath: string; // Dot notation path to YAML field
  value: T; // Current value from YAML data
  fieldType?: "text" | "textarea" | "array";
  children: ReactNode; // Content to wrap and make editable
  className?: string; // Additional CSS classes
}
```

## Field Types

- **text**: Single-line text input (default)
- **textarea**: Multi-line text input with Ctrl+Enter to save
- **array**: Array of strings, newline-separated in edit mode

## Visual Behavior

- **Hover**: Subtle blue background with edit icon
- **Edit Mode**: Overlay input with save/cancel buttons
- **Print**: All edit UI completely hidden via CSS media queries

## YAML Path Examples

```typescript
// Simple properties
"contact.email";
"profile.summary";

// Array indices
"workExperience.0.position";
"workExperience.1.company";

// Nested arrays
"workExperience.0.bullets.0";
"projects.2.technologies.1";

// Deep nesting
"education.0.courses.1.name";
```

## Implementation Notes

- Uses existing `ResumeContext` for state management
- Leverages `useYamlPathUpdater` hook for data persistence
- Maintains layout during editing via invisible placeholder
- Auto-saves on blur/Enter, cancels on Escape
- Prevents editing when YAML has parsing errors
- Fully TypeScript compatible with generics
