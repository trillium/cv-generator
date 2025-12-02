# Server-Side Printable Resume Page

## Purpose

This document describes how to implement a server-rendered (SSR) printable resume page in the Next.js app directory, ensuring the page loads with all data present in the initial HTML. This is ideal for printing, PDF generation, and SEO.

---

## Approach

### 1. Use a Server Component

- Create a new server component at:
  ```
   /src/app/pdf/page.tsx
  ```
- Do **not** include `"use client"` at the top.

### 2. Fetch Resume Data via API

- Use the existing API endpoint:
  ```
  /api/files/[path]
  ```
- This endpoint supports `GET` requests to fetch file content and metadata by path.

#### Example API Call

```ts
const res = await fetch(
  `${process.env.NEXT_PUBLIC_BASE_URL}/api/files/${encodeURIComponent(resumePath)}`,
);
const { success, content, metadata } = await res.json();
```

- `resumePath` should be decoded from the URL param using your utility (e.g., `decodeFilePathFromUrl`).

### 3. Render the Resume

- Pass the fetched data to your resume component (e.g., `SingleColumnResume`).
- Pass the fetched data to your resume component (e.g., `SingleColumnResume`).
- It is NOT the responsibility of this task to ensure the resume component or its dependencies are SSR-compatible. That is out of scope for this implementation.

### 4. Error Handling

- If the API returns an error or the file is missing, render a user-friendly error message server-side.

---

## Example Skeleton

```tsx
// app/api/pdf/page.tsx
import SingleColumnResume from "../../../../src/components/Resume/single-column/resume";
import { decodeFilePathFromUrl } from "../../../../src/utils/urlSafeEncoding";

export default async function PrintResumePage({ params }) {
  const encodedPath = params["resume-path"];
  const resumePath = decodeFilePathFromUrl(encodedPath);
  let data = null;
  let error = null;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/files/${encodeURIComponent(resumePath)}`,
    );
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    data = json.content;
  } catch (e) {
    error = e.message;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return <SingleColumnResume data={data} />;
}
```

---

## Notes

- The API endpoint `/api/files/[path]` is the recommended way to fetch resume data for SSR.
- Do **not** use client-side hooks or context in the server component.
- Ensuring SSR compatibility of the resume component and its dependencies is out of scope for this task. This document only covers implementing the server-rendered printable page and fetching data.

---

## References

- [Next.js Server Components Documentation](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [API Route: /api/files/[path]](./src/app/api/files/[path]/route.ts)
