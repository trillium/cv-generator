# TanStack Router: Dynamic `$resumeType` Route Guide

## How `$resumeType` Works

- In TanStack Router, a file or folder named with a `$` prefix (e.g. `$resumeType`) creates a dynamic route parameter.
- The value in the URL (e.g. `/single-column/resume`) is available as `params.resumeType` in your route/component.

## Example Folder/File Structure

```
src/
  routes/
    $resumeType.tsx                # (optional) Layout for all resumeType pages
    $resumeType.resume.tsx         # /:resumeType/resume
    $resumeType.cover-letter.tsx   # /:resumeType/cover-letter
    components/
      Resume/
        Resume.tsx
      CoverLetter/
        CoverLetter.tsx
```

## Example Route File

**src/routes/$resumeType.resume.tsx**

```tsx
import { createFileRoute } from "@tanstack/react-router";
import Resume from "../components/Resume/Resume";

export const Route = createFileRoute(undefined)({
  component: ResumePage,
});

function ResumePage({ params }) {
  // params.resumeType will be "single-column", "two-column", etc.
  return <Resume type={params.resumeType} />;
}
```

**src/routes/$resumeType.cover-letter.tsx**

```tsx
import { createFileRoute } from "@tanstack/react-router";
import CoverLetter from "../components/CoverLetter/CoverLetter";

export const Route = createFileRoute(undefined)({
  component: CoverLetterPage,
});

function CoverLetterPage({ params }) {
  return <CoverLetter type={params.resumeType} />;
}
```

## Key Points

- Use `createFileRoute(undefined)` for dynamic routes.
- The file name `$resumeType.resume.tsx` creates the route `/:resumeType/resume`.
- Access the dynamic value with `params.resumeType` in your component.
- Organize your components in `src/components/Resume/` and `src/components/CoverLetter/` for clarity.

---

Let me know if you want a more detailed example or have a specific folder structure in mind!
