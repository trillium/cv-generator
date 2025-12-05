# TASK 3: Deduplicate Dynamic Multi-Column Page Files

## Problem

There is significant code duplication across four dynamic multi-column page files in the `app` directory. These files are nearly identical, differing only in the component rendered (Resume or CoverLetter) and the layout variant (single-column or two-column).

### Affected Files

- `app/two-column-multi/resume/[...resume-path]/page.tsx`
- `app/two-column-multi/cover-letter/[...resume-path]/page.tsx`
- `app/single-column-multi/cover-letter/[...resume-path]/page.tsx`
- `app/single-column-multi/resume/[...resume-path]/page.tsx`

## Similarities

- All files implement dynamic routing for resume or cover letter rendering.
- They share nearly identical logic for data fetching, error/loading/empty state handling, and page structure.
- Only the rendered component and some static text differ.

## Differences

- The main difference is which component is rendered (Resume or CoverLetter).
- The layout variant (single-column or two-column) is also a parameter.
- Some minor text or prop differences may exist.

## Proposed Solution

Refactor these four files into a single generic dynamic page component. This component will:

- Accept props or route parameters to determine:
  - Which variant to render (resume or cover letter)
  - Which layout to use (single-column or two-column)
- Dynamically import and render the correct component based on these parameters.
- Share all common logic for data fetching, state handling, and layout.

## Refactor Steps

1. Analyze the four files and extract all shared logic into a new generic component (e.g., `DynamicMultiColumnPage`).
2. Parameterize the component to accept `type` (resume/cover letter) and `layout` (single/two column).
3. Replace the four original files with thin wrappers or route handlers that pass the correct parameters to the generic component.
4. Test all routes to ensure identical behavior and correct rendering for all variants.

## Benefits

- Eliminates code duplication (DRY principle).
- Centralizes logic for easier maintenance and future changes.
- Reduces risk of inconsistencies between variants.
- Simplifies future enhancements to dynamic multi-column pages.
