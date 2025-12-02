# PDF On-Demand Generation Feature Plan

## Overview

Transform `bun run pdf` into an on-demand PDF generation system that:

1. Accepts `--dev` or `--prod` flags (defaults to `--prod`)
2. Connects to already-running dev or prod server
3. Gets triggered via API endpoint when resume files are updated
4. Generates PDFs on-demand
5. Reports page count back to the app via new API endpoint

## Current State

### Existing PDF Process

```
CLI Args → Load Data → Write JSON → Start Dev Server → Puppeteer → Generate PDF → Cleanup
                                    (port 7542+)
```

Key files:

- `scripts/pdf/pdf.ts` - Main entry point
- `scripts/pdf/pdf-generator.ts` - PDF generation via Puppeteer
- `scripts/pdf/server.ts` - Next.js dev server spawning
- `scripts/pdf/cli-args.ts` - CLI argument parsing

### Existing Infrastructure

**Build caching:**

- `scripts/cached-build-serve.ts` - Checks build hash, rebuilds if needed
- `scripts/generate-build-hash.ts` - Creates hash from source files
- `.next/.build-hash` - Stores current build hash

**Server modes:**

- Dev: `bun run dev -p 10300` (PORT_DEV)
- Prod: `bun run start` → `scripts/start-with-port.sh` → port 10301 (PORT_PROD)

**API routes:**

- Located in `app/api/`
- Example: `app/api/pdf/route.ts` (triggers `bun run pdf`)

## New Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              App Running (dev or prod server)               │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────▼────────────┐
         │  User updates resume   │
         │  file in app           │
         └───────────┬────────────┘
                     │
         ┌───────────▼────────────┐
         │  POST /api/pdf         │
         │  {                     │
         │    mode: 'dev'|'prod'  │
         │    resumePath: '...'   │
         │    resumeType: '...'   │
         │    print: ['resume']   │
         │  }                     │
         └───────────┬────────────┘
                     │
         ┌───────────▼────────────┐
         │  Spawn bun run pdf        │
         │  with flags            │
         └───────────┬────────────┘
                     │
         ┌───────────▼────────────┐
         │  PDF Generator:        │
         │  1. Connect to running │
         │     dev/prod server    │
         │  2. Load data          │
         │  3. Generate PDF       │
         │  4. Count pages        │
         │  5. POST page count    │
         │     back to API        │
         └────────────────────────┘
```

## Implementation Tasks

### 1. Update CLI Argument Parser

**File:** `scripts/pdf/cli-args.ts`

Add new interface fields:

```typescript
export interface CliArgs {
  mode: "dev" | "prod"; // NEW
  resumePath: string;
  isAnon: boolean;
  skipPdf: boolean;
  resumeType: string;
  printOptions: Array<"resume" | "cover">;
}
```

Parse new flags:

- `--dev` → `mode: 'dev'`
- `--prod` → `mode: 'prod'`
- Default to `'prod'`

### 2. Create Server Mode Manager

**New file:** `scripts/pdf/server-mode.ts`

```typescript
export type ServerMode = "dev" | "prod";

export interface ServerConfig {
  mode: ServerMode;
  port: number;
  url: string;
  process: ChildProcess;
}

export async function startServerByMode(
  rootDir: string,
  mode: ServerMode,
): Promise<ServerConfig>;
```

**Dev mode:**

- Use existing `startNextServer()` from `server.ts`
- Spawns `bun run dev -p 7542`

**Prod mode:**

- Check if build exists and is fresh (reuse `cached-build-serve.ts` logic)
- If stale: run `bun run build`
- Spawn `bun run start` (uses PORT_PROD=10301)

### 3. ~~Add File Watcher~~ (NOT NEEDED)

We don't watch files. The app triggers PDF generation via API when it knows files changed.

### 4. Add Page Count Detection

**New file:** `scripts/pdf/page-counter.ts`

```typescript
import { PDFDocument } from "pdf-lib";

export async function countPdfPages(pdfBuffer: Buffer): Promise<number>;
```

Parse generated PDF and count pages using `pdf-lib` or similar

### 5. Create API Endpoint

**New file:** `app/api/page-count/[...resumePath]/route.ts`

```typescript
export async function POST(
  req: NextRequest,
  { params }: { params: { resumePath: string[] } },
) {
  const { pageCount, type } = await req.json();
  // type: 'resume' | 'cover'
  // resumePath: encoded path segments

  // Store page count metadata
  // Future: could write to .meta.json alongside data.yml

  return Response.json({
    success: true,
    resumePath: params.resumePath.join("/"),
    type,
    pageCount,
  });
}
```

For now, just log the page count. Later can persist to metadata file.

### 6. Refactor PDF Generator

**Update:** `scripts/pdf/pdf-generator.ts`

Current `generateAndSavePdf()` needs to return both:

- Output path
- Page count

```typescript
export async function generateAndSavePdf({
  url,
  dataObj,
  type,
  outDir,
  browser,
}: {
  url: string;
  dataObj: CVData;
  type: "Resume" | "CoverLetter";
  outDir: string;
  browser: Browser;
}): Promise<{
  path: string;
  pageCount: number;
}>;
```

### 7. Simplify Main Function

**Update:** `scripts/pdf/pdf.ts`

Remove watch mode complexity. Just:

1. Parse args (including mode)
2. Connect to already-running server (dev or prod based on mode)
3. Generate PDF
4. Report page count
5. Exit

```typescript
async function main(
  dataObj: CVData,
  resumeType: string,
  resumePath: string,
  printOptions: Array<"resume" | "cover">,
  mode: "dev" | "prod",
) {
  console.log(dataObj.header.name);

  let browser: Browser | null = null;

  try {
    // Connect to already-running server
    const serverUrl =
      mode === "dev"
        ? `http://localhost:${process.env.PORT_DEV || 10300}`
        : `http://localhost:${process.env.PORT_PROD || 10301}`;

    console.log(`🔗 Connecting to ${mode} server at ${serverUrl}`);

    // Verify server is running
    await fetch(serverUrl).catch(() => {
      throw new Error(
        `Server not running at ${serverUrl}. Start it first with pnpm ${mode === "dev" ? "dev" : "start"}`,
      );
    });

    console.log("🐾 Opening Puppeteer and generating PDF");
    const outDir = path.join(projectRoot, "out");

    const { resumeUrl, coverLetterUrl } = buildUrls(
      serverUrl,
      resumeType,
      resumePath,
    );

    browser = await puppeteer.launch();

    const results: Array<{ type: string; pageCount: number }> = [];

    if (printOptions.includes("resume")) {
      const { path: pdfPath, pageCount } = await generateAndSavePdf({
        url: resumeUrl,
        dataObj,
        type: "Resume",
        outDir,
        browser,
      });
      results.push({ type: "resume", pageCount });
    }

    if (printOptions.includes("cover")) {
      const { path: pdfPath, pageCount } = await generateAndSavePdf({
        url: coverLetterUrl,
        dataObj,
        type: "CoverLetter",
        outDir,
        browser,
      });
      results.push({ type: "cover", pageCount });
    }

    // Report page counts back to server
    for (const { type, pageCount } of results) {
      await fetch(`${serverUrl}/api/page-count/${encodePath(resumePath)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, pageCount }),
      }).catch((err) => {
        console.warn(`⚠️  Failed to report page count: ${err.message}`);
      });
    }

    console.log("💾 PDF saved");
    console.log("🏁 Done");
  } catch (error) {
    console.error("💥 Error during PDF generation:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log("🔒 Browser closed");
    }
  }
}
```

### 8. Update Main Entry Point

**Update:** `scripts/pdf/pdf.ts`

```typescript
(async () => {
  const args = await parseCliArgs(); // now includes mode

  console.log(`Mode: ${args.mode}`);
  console.log(`Resume path: ${args.resumePath}`);
  console.log(`Resume type: ${args.resumeType}`);

  const dataObj = await loadAndProcessData(
    args.resumePath,
    scriptDataJsonPath,
    args.isAnon,
  );

  if (args.skipPdf) {
    console.log("⏩ Skipping server and PDF generation");
    return;
  }

  // Start server based on mode
  const serverConfig = await startServerByMode(projectRoot, args.mode);

  // Run watch mode
  await runWatchMode(args, dataObj, serverConfig);
})();
```

### 9. Update API Endpoint to Trigger PDF Generation

**Update:** `app/api/pdf/route.ts`

```typescript
export async function POST(req: NextRequest) {
  const {
    mode = "prod",
    resumePath,
    resumeType = "single-column",
    print = ["resume", "cover"],
  } = await req.json();

  const args = ["pdf", `--${mode}`, `--resumeType=${resumeType}`];

  if (resumePath) {
    args.push(`--resumePath=${resumePath}`);
  }

  if (print.length > 0) {
    args.push(`--print=${print.join(",")}`);
  }

  console.log(`📄 Triggering PDF generation: pnpm ${args.join(" ")}`);

  const child = spawn("pnpm", args, {
    cwd: process.cwd(),
    detached: true,
    stdio: "ignore",
  });
  child.unref();

  return Response.json(
    {
      message: "PDF generation triggered",
      mode,
      resumeType,
      resumePath,
    },
    { status: 202 },
  );
}
```

### 10. Dependencies

Add to `package.json`:

```json
{
  "devDependencies": {
    "pdf-lib": "^1.17.1"
  }
}
```

No need for `chokidar` - we're not watching files!

## User Flow Examples

### App-Triggered Generation (Production Mode)

```bash
# Server already running: bun run start (on :10301)

# User edits resume in app, app hits API:
POST /api/pdf
{
  "mode": "prod",
  "resumePath": "resumes/frontend-dev",
  "resumeType": "single-column",
  "print": ["resume"]
}

# API spawns:
# bun run pdf --prod --resumePath=resumes/frontend-dev --resumeType=single-column --print=resume

# PDF script:
# → Connects to running server at :10301
# → Generates PDF
# → Counts pages
# → POSTs page count back to /api/page-count/resumes/frontend-dev
# → Exits
```

### App-Triggered Generation (Dev Mode)

```bash
# Dev server already running: bun run dev (on :10300)

# App hits API:
POST /api/pdf
{
  "mode": "dev",
  "resumePath": "resumes/frontend-dev",
  "resumeType": "single-column"
}

# API spawns:
# bun run pdf --dev --resumePath=resumes/frontend-dev

# PDF script:
# → Connects to running dev server at :10300
# → Generates PDF (using hot-reloaded code)
# → Reports page count
# → Exits
```

### Manual CLI Usage

```bash
# Server must already be running!

# Production:
bun run pdf --prod --resumeType=single-column

# Dev:
bun run pdf --dev --resumeType=single-column
```

## Error Handling

1. **Server not running:** Check server URL, fail with clear message
2. **PDF generation errors:** Log and exit with error code
3. **Page count API errors:** Log warning, continue (non-critical)
4. **Invalid mode parameter:** Validate and fail early

## Testing Strategy

1. **Unit tests:**

   - Page counting logic
   - Path encoding/decoding
   - CLI argument parsing

2. **Integration tests:**

   - API triggers PDF generation
   - Production vs dev mode
   - Page count reporting

3. **Manual tests:**
   - Hit API endpoint, verify PDF generates
   - Check page count API receives correct data
   - Test both dev and prod modes

## Migration Path

1. Implement new mode (we DONT CARE about existing behavior)
2. Default to `--prod` for new behavior
3. Remove server-spawning logic (expects server already running)
4. Update API endpoint to accept mode parameter
5. Update documentation

## Future Enhancements

1. **Parallel generation:** Generate resume + cover letter concurrently
2. **Page count persistence:** Save to `.meta.json` alongside data.yml
3. **Browser pool:** Reuse Puppeteer browsers for faster generation
4. **WebSocket updates:** Push PDF status updates to browser
5. **Queue system:** Handle concurrent generation requests

## Open Questions

1. Should we keep browser alive between PDF generations for speed?
2. Do we need page count validation (warn if > 1 page)?
3. Should API endpoint persist page count to filesystem?
4. How should the app know when PDF generation is complete?

## Dependencies on Existing Systems

- ✅ Build hash system (`generate-build-hash.ts`)
- ✅ Server startup logic (`server.ts`, `start-with-port.sh`)
- ✅ Data loading (`data-loader.ts`)
- ✅ URL building (`url-builder.ts`)
- ✅ File management (`file-utils.ts`)
- ✅ Resume path resolution (`getDefaultResume`)

## Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Server not running when PDF triggered | Check server health before generation |
| Concurrent PDF generation | Document that API returns 202 (async) |
| Spawned process zombies | Use detached + unref properly |
| PDF generation failures silent | Log to file or database for debugging |

## Success Criteria

- ✅ `bun run pdf` works in both dev and prod modes
- ✅ API endpoint triggers PDF generation with mode parameter
- ✅ Page count reported back to API
- ✅ Production mode connects to running prod server
- ✅ Dev mode connects to running dev server
- ✅ Clear error messages when server not running

---

**Status:** Planning phase **Next Step:** Review plan with Trillium, begin implementation
