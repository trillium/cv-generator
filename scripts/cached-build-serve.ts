#!/usr/bin/env tsx

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getCurrentHash } from './generate-build-hash.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROOT = path.resolve(__dirname, '..')
const NEXT_DIR = path.join(ROOT, '.next')
const HASH_FILE = path.join(NEXT_DIR, '.build-hash')

function getStoredHash(): string | null {
  if (!fs.existsSync(HASH_FILE)) return null
  return fs.readFileSync(HASH_FILE, 'utf8').trim()
}

function needsRebuild(): boolean {
  if (!fs.existsSync(NEXT_DIR)) {
    console.log('🔨 .next directory missing - build required')
    return true
  }

  const storedHash = getStoredHash()
  if (!storedHash) {
    console.log('🔨 No build hash found - build required')
    return true
  }

  const currentHash = getCurrentHash(ROOT)
  if (currentHash !== storedHash) {
    console.log('🔨 Source files changed - build required')
    return true
  }

  console.log('✅ Build is up to date - skipping rebuild')
  return false
}

function main(): void {
  if (needsRebuild()) {
    console.log('📦 Building Next.js app...')
    execSync('bun run build', { stdio: 'inherit', cwd: ROOT })
  }

  console.log('🚀 Starting Next.js server...')
  execSync('bun run start', { stdio: 'inherit', cwd: ROOT })
}

main()
