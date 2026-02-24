#!/usr/bin/env tsx

import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROOT = path.resolve(__dirname, '..')
const NEXT_DIR = path.join(ROOT, '.next')
const HASH_FILE = path.join(NEXT_DIR, '.build-hash')

const DIRS = ['app', 'src', 'lib']
const FILE_PATTERNS = ['.env', '.config.', 'bun.lock']

function walkDir(dir: string, files: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkDir(fullPath, files)
    } else {
      files.push(fullPath)
    }
  }
  return files
}

export function getCurrentHash(rootPath: string = ROOT): string {
  const files: string[] = []
  for (const dir of DIRS) {
    const dirPath = path.join(rootPath, dir)
    if (fs.existsSync(dirPath)) {
      walkDir(dirPath, files)
    }
  }
  const rootFiles = fs.readdirSync(rootPath)
  for (const file of rootFiles) {
    const fullPath = path.join(rootPath, file)
    if (fs.statSync(fullPath).isFile()) {
      if (FILE_PATTERNS.some((pattern) => file.includes(pattern)) || file === 'bun.lock') {
        files.push(fullPath)
      }
    }
  }
  const mtimes = files
    .sort()
    .map((file) => {
      const stat = fs.statSync(file)
      const relativePath = path.relative(rootPath, file)
      return `${relativePath}:${stat.mtimeMs}`
    })
    .join('\n')
  return createHash('sha256').update(mtimes).digest('hex')
}

export function storeHash(hash: string, hashFile: string = HASH_FILE): void {
  fs.mkdirSync(path.dirname(hashFile), { recursive: true })
  fs.writeFileSync(hashFile, hash)
}

function main(): void {
  const hash = getCurrentHash()
  storeHash(hash)
  console.log(`Hash generated and stored: ${hash}`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
