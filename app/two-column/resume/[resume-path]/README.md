# Dynamic Resume Routing

This directory implements dynamic routing for resume files using Next.js dynamic routes and URL-safe encoding.

## How it works

### Dynamic Route: `[resume-path]`

The `[resume-path]` directory creates a dynamic route that accepts any resume path as a URL parameter. For example:

- `/single-column/resume/data` → loads `data.yml`
- `/single-column/resume/data_anon` → loads `data_anon.yml`
- `/single-column/resume/resumes-ashes-software-engineer-ashes-data` → loads `resumes/software-engineer/data.yml`

### URL Safe Encoding

The route uses the `urlSafeEncoding.ts` utility to handle complex file paths:

#### Without encoding (limited):

```
/single-column/resume/data_anon ✅ Works
/single-column/resume/resumes/software-engineer/data ❌ Doesn't work (slashes break routing)
```

#### With URL safe encoding:

```typescript
// Original path: "resumes/software-engineer/google/2025-01-15/data.yml"
// Encoded path: "resumes-ashes-software-engineer-ashes-google-ashes-2025-01-15-ashes-data"
// URL: /single-column/resume/resumes-ashes-software-engineer-ashes-google-ashes-2025-01-15-ashes-data
```

### Features

1. **Automatic validation**: Checks if the resume file exists before attempting to load
2. **Extension handling**: Automatically adds `.yml` extension if not present
3. **Nested path support**: Handles resume files in subdirectories using the encoding system
4. **Error handling**: Provides clear error messages when files aren't found
5. **Loading states**: Shows appropriate loading and error states

### File Resolution Process

1. Extract `[resume-path]` parameter from URL
2. Decode using `decodeFilePathFromUrl()` to get the actual file path
3. Query available files via `listAllResumeFiles()`
4. Find matching file with support for:
   - Exact matches
   - Partial matches
   - With/without `.yml` extension
   - Nested directory paths
5. Load resume data via `readResumeData()`
6. Render the SingleColumnResume component

### Usage Examples

#### Simple files (root directory):

```
/single-column/resume/data → data.yml
/single-column/resume/data_anon → data_anon.yml
```

#### Complex nested paths (using encoding):

```
/single-column/resume/resumes-ashes-software-engineer-ashes-data → resumes/software-engineer/data.yml
/single-column/resume/resumes-ashes-frontend-ashes-react-ashes-senior → resumes/frontend/react/senior.yml
```

### Helper Pages

- `/resumes` - Lists all available resume files with clickable links using proper encoding
- Each link in the list uses `encodeFilePathForUrl()` to create valid URLs

### Error Handling

The route provides comprehensive error handling:

- **File not found**: Shows available files and suggests alternatives
- **Loading errors**: Displays detailed error messages
- **Empty data**: Handles cases where files exist but contain no valid data
- **Navigation**: Provides fallback navigation to default resume view

This system allows for flexible resume organization while maintaining clean, shareable URLs.
