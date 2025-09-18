# CV Generator Style Guide

## Overview

This document outlines the color system and design patterns used throughout the CV Generator application, with specific focus on dark mode implementation.

## Color System

### Primary Colors (Teal)

Used for primary actions, accents, and brand elements.

**Light Mode:**

- `primary-50`: `#f0fdfa` - Very light teal (backgrounds)
- `primary-100`: `#ccfbf1` - Light teal
- `primary-200`: `#99f6e4` - Light teal (hover states)
- `primary-300`: `#5eead4` - Medium light teal
- `primary-400`: `#2dd4bf` - Medium teal
- `primary-500`: `#14b8a6` - Base teal (primary actions)
- `primary-600`: `#0d9488` - Dark teal (active states)
- `primary-700`: `#0f766e` - Darker teal
- `primary-800`: `#115e59` - Very dark teal (default primary)
- `primary-900`: `#134e4a` - Almost black teal
- `primary-950`: `#042f2e` - Black teal

**Dark Mode:**

- `primary-50`: `#042f2e` - Very dark teal
- `primary-100`: `#134e4a` - Dark teal
- `primary-200`: `#115e59` - Base dark teal (default primary)
- `primary-300`: `#0f766e` - Medium dark teal
- `primary-400`: `#0d9488` - Light dark teal (active states)
- `primary-500`: `#14b8a6` - Medium light teal
- `primary-600`: `#2dd4bf` - Light teal
- `primary-700`: `#5eead4` - Very light teal
- `primary-800`: `#99f6e4` - Very light teal (backgrounds)
- `primary-900`: `#ccfbf1` - Almost white teal
- `primary-950`: `#f0fdfa` - White teal

### Secondary Colors (Blue)

Used for secondary actions and informational elements.

**Light Mode:**

- `secondary-50`: `#eff6ff` - Very light blue
- `secondary-100`: `#dbeafe` - Light blue
- `secondary-200`: `#bfdbfe` - Light blue
- `secondary-300`: `#93c5fd` - Medium light blue
- `secondary-400`: `#60a5fa` - Medium blue
- `secondary-500`: `#3b82f6` - Base blue (secondary actions)
- `secondary-600`: `#2563eb` - Dark blue (active states)
- `secondary-700`: `#1d4ed8` - Darker blue
- `secondary-800`: `#1e40af` - Very dark blue
- `secondary-900`: `#1e3a8a` - Almost black blue
- `secondary-950`: `#172554` - Black blue

**Dark Mode:**

- `secondary-50`: `#172554` - Very dark blue
- `secondary-100`: `#1e3a8a` - Dark blue
- `secondary-200`: `#1e40af` - Very dark blue
- `secondary-300`: `#1d4ed8` - Base dark blue (default secondary)
- `secondary-400`: `#2563eb` - Medium dark blue (active states)
- `secondary-500`: `#3b82f6` - Medium blue
- `secondary-600`: `#60a5fa` - Light blue
- `secondary-700`: `#93c5fd` - Very light blue
- `secondary-800`: `#bfdbfe` - Very light blue
- `secondary-900`: `#dbeafe` - Almost white blue
- `secondary-950`: `#eff6ff` - White blue

## Usage Guidelines

### Background Colors

#### Page Backgrounds

- **Light Mode**: `bg-white` or `bg-gray-50`
- **Dark Mode**: `dark:bg-gray-800` or `dark:bg-gray-900`
- **Usage**: Main page containers, cards, and large content areas

#### Component Backgrounds

- **Light Mode**: `bg-white`
- **Dark Mode**: `dark:bg-gray-800`
- **Usage**: Cards, modals, and component containers

### Text Colors

#### Primary Text

- **Light Mode**: `text-gray-800` or `text-gray-900`
- **Dark Mode**: `dark:text-gray-100` or `dark:text-white`
- **Usage**: Headings, important content

#### Secondary Text

- **Light Mode**: `text-gray-600`
- **Dark Mode**: `dark:text-gray-400`
- **Usage**: Descriptions, labels, secondary information

#### Tertiary Text

- **Light Mode**: `text-gray-500`
- **Dark Mode**: `dark:text-gray-500`
- **Usage**: Metadata, timestamps, less important information

### Interactive Elements

#### Primary Buttons

- **Light Mode**: `bg-blue-500 hover:bg-blue-600`
- **Dark Mode**: `dark:bg-blue-600 dark:hover:bg-blue-700`
- **Usage**: Main call-to-action buttons

#### Secondary Buttons

- **Light Mode**: `bg-gray-500 hover:bg-gray-600`
- **Dark Mode**: `dark:bg-gray-600 dark:hover:bg-gray-700`
- **Usage**: Secondary actions, cancel buttons

#### Loading States

- **Light Mode**: `border-primary-500`
- **Dark Mode**: `dark:border-primary-400`
- **Usage**: Spinners, loading indicators

### Status Colors

#### Error States

- **Light Mode**: `text-red-600`
- **Dark Mode**: `dark:text-red-400`
- **Usage**: Error messages, validation errors

#### Warning States

- **Light Mode**: `text-yellow-600`
- **Dark Mode**: `dark:text-yellow-400`
- **Usage**: Warnings, cautions

#### Success States

- **Light Mode**: `text-green-600`
- **Dark Mode**: `dark:text-green-400`
- **Usage**: Success messages, confirmations

### Borders and Dividers

#### Primary Borders

- **Light Mode**: `border-gray-200`
- **Dark Mode**: `dark:border-gray-700`
- **Usage**: Card borders, section dividers

#### Secondary Borders

- **Light Mode**: `border-gray-300`
- **Dark Mode**: `dark:border-gray-600`
- **Usage**: Subtle borders, form elements

### Text Selection

#### Light Mode Selection

```css
::selection {
  background-color: rgba(59, 130, 246, 0.3);
  color: inherit;
}
```

#### Dark Mode Selection

```css
.dark ::selection {
  background-color: rgba(156, 163, 175, 0.4);
  color: inherit;
}
```

## Implementation Examples

### Loading State

```tsx
<div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
  <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500 dark:border-primary-400"></div>
  <p className="text-gray-600 dark:text-gray-400">Loading...</p>
</div>
```

### Error State

```tsx
<div className="bg-white dark:bg-gray-900 p-6 rounded-lg">
  <h1 className="text-red-600 dark:text-red-400 font-bold">Error</h1>
  <p className="text-gray-600 dark:text-gray-400">Something went wrong</p>
</div>
```

### Button Component

```tsx
<button className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors">
  Click me
</button>
```

## Best Practices

1. **Consistency**: Always use the corresponding dark mode variant for every light mode class
2. **Contrast**: Ensure sufficient contrast ratios for accessibility
3. **Transitions**: Use `transition-colors` for smooth color changes
4. **Semantic Colors**: Use semantic color names (primary, secondary) rather than hardcoded values
5. **Testing**: Test all components in both light and dark modes
6. **Gradual Adoption**: Add dark mode support incrementally to existing components

## Color Accessibility

- **WCAG AA Compliance**: All color combinations meet WCAG AA contrast requirements
- **Focus States**: Interactive elements have clear focus indicators in both modes
- **Text Selection**: Custom selection colors maintain readability
- **Error States**: Error colors are distinct and accessible in both modes

## Maintenance

- **CSS Variables**: Colors are defined as CSS custom properties for easy maintenance
- **System Integration**: Respects user's system dark mode preference
- **Future Updates**: Color system is designed to be easily extensible
- **Documentation**: Keep this guide updated when adding new colors or patterns</content> <parameter name="filePath">/Users/trilliumsmith/code/cv-generator/cv-generator/STYLE_GUIDE.md
