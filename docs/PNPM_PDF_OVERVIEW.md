# PNPM PDF Script Overview

## What It Does

The `pnpm pdf` command generates PDF versions of your resume and cover letter by:

1. Loading CV data from a YAML file
2. Starting a temporary Next.js dev server
3. Using Puppeteer (headless Chrome) to render pages
4. Converting rendered pages to PDF
5. Opening the generated PDFs in your default viewer

## Available Commands

```bash
pnpm pdf                    # Interactive: prompts for resume type
pnpm pdf:anon              # Generate anonymized PDF (single-column)
pnpm pdf:resume            # Generate only resume (single-column)
pnpm pdf:cover             # Generate only cover letter (single-column)
```

## Command Line Options

### Basic Usage

```bash
tsx pdf.ts [dataPath] [options]
```

### Options

- `--resumeType=<type>` - Specify layout variant (e.g., `single-column`, `two-column`)
- `--resumePath=<path>` - Use specific resume from dynamic route
- `--print=<resume|cover|resume,cover>` - Control what to generate (default: both)
- `--anon` - Anonymize the data before generating PDF

# Depricated, delete

- `--no-pdf` - Skip PDF generation (only write data to script-data.json)

### Examples

```bash
tsx pdf.ts --resumeType=single-column
tsx pdf.ts --resumeType=two-column --print=resume
tsx pdf.ts --anon --resumeType=single-column
tsx pdf.ts /path/to/data.yml --resumeType=single-column
tsx pdf.ts --resumePath=resumes-ashes-frontend-developer-ashes-meta-ashes-2025-02-01-ashes-data
```

## How It Works

### Architecture

```
┌─────────────────┐
│  Data Source    │ (data.yml or PII_PATH/data.yml)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Load & Process  │ (UnifiedFileManager + YAML parser)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Anonymize?      │ (optional: anonymizeData)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Write to JSON   │ (src/script-data.json)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Start Next.js   │ (pnpm dev on port 7542+)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Launch Puppeteer│ (headless Chrome)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Render Pages    │ (navigate to URLs, wait for networkidle)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Generate PDFs   │ (page.pdf() with letter format)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Save & Open     │ (write to out/ folder, open in viewer)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Cleanup         │ (close browser, kill server, reset JSON)
└─────────────────┘
```

### Step-by-Step Process

1. **Parse Arguments**

   - Extract data path, resume type, print options, flags
   - Prompt for resume type if not provided

2. **Load Data**

   - Read YAML file using UnifiedFileManager
   - Parse with js-yaml
   - Optionally anonymize data
   - Write to `src/script-data.json`

3. **Start Server**

   - Kill any existing process on port 7542
   - Spawn Next.js dev server with `pnpm dev -p 7542`
   - Wait for "Ready" message (30s timeout)
   - Retry on next port if 7542 is busy (up to 5 attempts)

4. **Generate PDFs**

   - Launch Puppeteer browser
   - For each document type (resume/cover):
     - Navigate to URL (e.g., `/single-column/resume`)
     - Wait for network idle
     - Generate PDF with:
       - Format: letter (8.5" x 11")
       - Margins: 0.25" all sides
       - Scale: 0.8
       - Print backgrounds enabled
     - Save to `out/` directory
     - Open in default PDF viewer

5. **Cleanup**
   - Close Puppeteer browser
   - Kill Next.js server
   - Reset `src/script-data.json` to empty object

## URL Routing

### Default Routes

When no `--resumePath` is specified:

- Resume: `/{resumeType}/resume`
- Cover Letter: `/{resumeType}/cover-letter`

Uses data from `src/script-data.json`

### Dynamic Routes

When `--resumePath` is specified:

- Resume: `/{resumeType}/resume/{encodedPath}`
- Cover Letter: `/{resumeType}/cover-letter/{encodedPath}`

Path is encoded using "ashes" separator for URL safety

## Output Files

Generated PDFs are saved to `out/` directory with naming pattern:

```
{FirstName}_{LastName}_{Type}.pdf
```

Examples:

- `Trillium_Smith_Resume.pdf`
- `Trillium_Smith_CoverLetter.pdf`
- `Anon_Resume.pdf` (when using --anon)

## Error Handling

### Port Conflicts

- Automatically kills processes on target port
- Retries with next port (7542, 7543, 7544, etc.)
- Fails after 5 attempts

### Server Startup

- 30-second timeout for server ready
- Monitors stdout for "Ready" message
- Logs errors from stderr

### Data Processing

- Validates YAML parsing
- Exits on file read failures
- Shows clear error messages

## Environment Variables

- `PII_PATH` - Override default data file location
  - When set: uses `$PII_PATH/data.yml`
  - When unset: uses `./src/data.json`

## PDF Settings

```javascript
{
  format: 'letter',           // 8.5" x 11"
  margin: {
    top: '.25in',
    bottom: '.25in',
    left: '.25in',
    right: '.25in'
  },
  printBackground: true,      // Include background colors/images
  scale: 0.8                  // 80% scale for better fitting
}
```

## Dependencies

- `puppeteer` - Headless browser for PDF generation
- `js-yaml` - YAML parsing
- `dotenv` - Environment variable loading
- Next.js dev server
- UnifiedFileManager - File I/O abstraction
- anonymizeData - Data anonymization

## Platform Support

Cross-platform PDF opening:

- macOS: `open '{path}'`
- Windows: `start "" "{path}"`
- Linux: `xdg-open '{path}'`

## Troubleshooting

**Server won't start**

- Manually kill processes: `lsof -ti:7542 | xargs kill -9`
- Check available ports
- Verify pnpm is installed

**PDF not generated**

- Check Next.js build errors
- Verify data.yml exists and is valid
- Ensure Puppeteer can launch Chrome
- Check disk space in `out/` directory

**PDFs are multiple pages**

- Commented out page count warning (lines 231-234)
- Adjust scale or margins in pdfOptions
- Review content length
