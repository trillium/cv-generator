# Resume Validation API

API endpoint for AI agents and MCP tools to validate resume data structure.

## Endpoint

```
GET /api/directory/validate?path={directoryPath}
```

## Purpose

Validates resume data structure without loading the full UI. Returns structured validation errors that can be programmatically addressed.

## Parameters

- `path` (required): Resume directory path (e.g., `resumes/this-dot-labs`)

## Response Format

### Success Response

```json
{
  "success": true,
  "hasErrors": boolean,
  "errorCount": number,
  "errors": ValidationError[],
  "directoryPath": string,
  "metadata": {
    "filesLoaded": string[],
    "loadedDirectories": string[]
  }
}
```

### ValidationError Format

```json
{
  "field": "workExperience[2].details",
  "message": "details must be an array, not an object or other type",
  "sourceFile": ["pii/resumes/this-dot-labs/work.workExperience10.yml"],
  "expected": "array (e.g., [{subhead: '...', lines: [...]}])",
  "actual": "object with keys: 0",
  "severity": "error"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message"
}
```

## Common Validation Errors

### Missing Required Fields

```json
{
  "field": "workExperience[0].company",
  "message": "Missing required field: company",
  "expected": "string",
  "actual": "undefined",
  "severity": "error"
}
```

**Fix:** Add the missing field to the source YAML file.

### Array vs Object Mismatch

```json
{
  "field": "workExperience[2].details",
  "message": "details must be an array, not an object or other type",
  "expected": "array (e.g., [{subhead: '...', lines: [...]}])",
  "actual": "object with keys: 0",
  "severity": "error"
}
```

**Fix:** Change from object notation:

```yaml
details:
  "0":
    subhead: Example
```

To array notation:

```yaml
details:
  - subhead: Example
```

## Usage Examples

### Check for Errors

```bash
curl "http://localhost:10300/api/directory/validate?path=resumes/this-dot-labs" \
  | jq '{hasErrors, errorCount}'
```

### Get All Errors

```bash
curl "http://localhost:10300/api/directory/validate?path=resumes/this-dot-labs" \
  | jq '.errors'
```

### Get Affected Files

```bash
curl "http://localhost:10300/api/directory/validate?path=resumes/this-dot-labs" \
  | jq '.errors[].sourceFile' | sort | uniq
```

### Check Specific Error Type

```bash
curl "http://localhost:10300/api/directory/validate?path=resumes/this-dot-labs" \
  | jq '.errors[] | select(.message | contains("Missing required field"))'
```

## MCP Tool Integration

This endpoint is designed for MCP (Model Context Protocol) tools to:

1. **Pre-flight validation**: Check for errors before attempting operations
2. **Error reporting**: Get structured error data for automated fixes
3. **File targeting**: Identify which files need changes via `sourceFile` field
4. **Batch validation**: Validate multiple resumes programmatically

## Required Data Structure

### WorkExperience

Each work experience entry must have:

- `position` (string)
- `company` (string)
- `location` (string)
- `icon` (string)
- `details` (array of objects)

Each detail object must have:

- `subhead` (string)
- `lines` (array)

Optional fields:

- `years` (string)
- `bubbles` (array of strings)

### Example Valid Structure

```yaml
workExperience:
  - position: Software Developer
    company: Acme Corp
    location: Los Angeles, CA
    icon: Remote
    details:
      - subhead: Frontend Team
        years: 2021 - Present
        lines:
          - text: Built responsive web applications
          - text: Improved performance by 50%
    bubbles:
      - React
      - TypeScript
```

## Integration Patterns

### AI Agent Workflow

1. Call validation endpoint
2. If `hasErrors: true`, iterate through `errors` array
3. For each error:
   - Read `sourceFile`
   - Apply fix based on `expected` vs `actual`
   - Validate fix matches expected structure
4. Re-validate after fixes

### Error Auto-Fix Strategy

```javascript
// Pseudo-code for AI agent
const response = await fetch("/api/directory/validate?path=resumes/example");
const { hasErrors, errors } = await response.json();

if (hasErrors) {
  for (const error of errors) {
    if (error.message.includes("Missing required field")) {
      // Add missing field to YAML
      await addField(error.sourceFile, error.field);
    }

    if (error.message.includes("must be an array")) {
      // Convert object to array in YAML
      await convertToArray(error.sourceFile, error.field);
    }
  }

  // Re-validate
  const recheck = await fetch("/api/directory/validate?path=resumes/example");
  const { hasErrors: stillHasErrors } = await recheck.json();

  if (!stillHasErrors) {
    console.log("All errors fixed!");
  }
}
```

## Testing

```bash
# No errors expected (should return empty errors array)
curl "http://localhost:10300/api/directory/validate?path=resumes/valid-example"

# With errors (returns structured error data)
curl "http://localhost:10300/api/directory/validate?path=resumes/this-dot-labs"

# Invalid path (returns 500 error)
curl "http://localhost:10300/api/directory/validate?path=nonexistent"
```
