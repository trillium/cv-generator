#!/usr/bin/env bun

import chokidar from "chokidar";
import path from "path";

const PII_DIR = path.join(process.cwd(), "pii");
const PORT = process.env.PORT_DEV || "10300";
const API_URL = process.env.WATCH_API_URL || `http://localhost:${PORT}`;

interface ReloadPayload {
  path: string;
  type: "change" | "add" | "unlink";
  timestamp: number;
}

let pendingAbortController: AbortController | null = null;

async function notifyReload(payload: ReloadPayload) {
  if (pendingAbortController) {
    console.log(`[API] 🚫 Cancelling previous job for newer change`);
    pendingAbortController.abort();
  }

  const controller = new AbortController();
  pendingAbortController = controller;

  const url = `${API_URL}/api/directory/reload`;
  console.log(`\n[API] Sending POST to ${url}`);
  console.log(`[API] Payload:`, JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    console.log(
      `[API] Response status: ${response.status} ${response.statusText}`,
    );

    if (!response.ok) {
      const text = await response.text();
      console.error(`[API] Error response body:`, text);
      return;
    }

    const result = await response.json();
    console.log(`[API] ✓ Success:`, result);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.log(`[API] ⏭️  Job cancelled`);
    } else {
      console.error(`[API] ❌ Request failed:`, error);
    }
  } finally {
    if (pendingAbortController === controller) {
      pendingAbortController = null;
    }
  }
}

function getRelativePath(absolutePath: string): string {
  const piiRelative = path.relative(PII_DIR, absolutePath);
  const resumesMatch = piiRelative.match(/^resumes\/(.+)$/);
  return resumesMatch ? resumesMatch[1] : piiRelative;
}

console.log(`🔍 Watching ${PII_DIR}/resumes for changes...`);
console.log(`📡 Will notify ${API_URL}/api/directory/reload`);

const watcher = chokidar.watch(`${PII_DIR}/resumes`, {
  ignored: [/(^|[/\\])\../, /\.pdf$/, /\.md$/],
  persistent: true,
  ignoreInitial: true,
  usePolling: true,
  interval: 1000,
  awaitWriteFinish: {
    stabilityThreshold: 300,
    pollInterval: 100,
  },
});

watcher
  .on("ready", () => {
    console.log("✅ Watcher ready, monitoring files...");
    const watched = watcher.getWatched();
    const fileCount = Object.values(watched).reduce(
      (acc, files) => acc + files.length,
      0,
    );
    console.log(`📊 Monitoring ${fileCount} files`);
  })
  .on("all", (event, filePath) => {
    console.log(`[DEBUG] Event: ${event} | File: ${filePath}`);
  })
  .on("change", (filePath) => {
    const relativePath = getRelativePath(filePath);
    console.log(`📝 Changed: ${relativePath}`);
    notifyReload({
      path: relativePath,
      type: "change",
      timestamp: Date.now(),
    });
  })
  .on("add", (filePath) => {
    const relativePath = getRelativePath(filePath);
    console.log(`➕ Added: ${relativePath}`);
    notifyReload({
      path: relativePath,
      type: "add",
      timestamp: Date.now(),
    });
  })
  .on("unlink", (filePath) => {
    const relativePath = getRelativePath(filePath);
    console.log(`➖ Deleted: ${relativePath}`);
    notifyReload({
      path: relativePath,
      type: "unlink",
      timestamp: Date.now(),
    });
  })
  .on("error", (error) => {
    console.error(`❌ Watcher error:`, error);
  });

process.on("SIGINT", () => {
  console.log("\n👋 Stopping watcher...");
  watcher.close();
  process.exit(0);
});
