#!/usr/bin/env tsx

import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, "..");
const NEXT_DIR = path.join(ROOT, ".next");
const HASH_FILE = path.join(NEXT_DIR, ".build-hash");

const DIRS = ["app", "src", "lib"];
const FILE_PATTERNS = [".env", ".config.", "pnpm-lock.yaml"];

function walkDir(dir: string, files: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, files);
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function getFileMtimes(): string {
  const files: string[] = [];

  for (const dir of DIRS) {
    const dirPath = path.join(ROOT, dir);
    if (fs.existsSync(dirPath)) {
      walkDir(dirPath, files);
    }
  }

  const rootFiles = fs.readdirSync(ROOT);
  for (const file of rootFiles) {
    const fullPath = path.join(ROOT, file);
    if (fs.statSync(fullPath).isFile()) {
      if (
        FILE_PATTERNS.some((pattern) => file.includes(pattern)) ||
        file === "pnpm-lock.yaml"
      ) {
        files.push(fullPath);
      }
    }
  }

  const mtimes = files
    .sort()
    .map((file) => {
      const stat = fs.statSync(file);
      const relativePath = path.relative(ROOT, file);
      return `${relativePath}:${stat.mtimeMs}`;
    })
    .join("\n");

  return createHash("sha256").update(mtimes).digest("hex");
}

function getStoredHash(): string | null {
  if (!fs.existsSync(HASH_FILE)) return null;
  return fs.readFileSync(HASH_FILE, "utf8").trim();
}

function storeHash(hash: string): void {
  fs.mkdirSync(NEXT_DIR, { recursive: true });
  fs.writeFileSync(HASH_FILE, hash);
}

function needsRebuild(): boolean {
  if (!fs.existsSync(NEXT_DIR)) {
    console.log("🔨 .next directory missing - build required");
    return true;
  }

  const currentHash = getFileMtimes();
  const storedHash = getStoredHash();

  if (!storedHash) {
    console.log("🔨 No build hash found - build required");
    return true;
  }

  if (currentHash !== storedHash) {
    console.log("🔨 Source files changed - build required");
    return true;
  }

  console.log("✅ Build is up to date - skipping rebuild");
  return false;
}

function main(): void {
  if (needsRebuild()) {
    console.log("📦 Building Next.js app...");
    execSync("pnpm build", { stdio: "inherit", cwd: ROOT });

    const currentHash = getFileMtimes();
    storeHash(currentHash);
    console.log("✅ Build complete and hash stored");
  }

  console.log("🚀 Starting Next.js server...");
  execSync("pnpm start", { stdio: "inherit", cwd: ROOT });
}

main();
