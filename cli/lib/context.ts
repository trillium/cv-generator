import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import type { CheckContext, CompanyLayout, CompanyManifest, CompanyMetadata } from '../checks/types'

function repoRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
}

export function resumesRoot(): string {
  return path.join(repoRoot(), 'pii', 'resumes')
}

export function companyDir(company: string): string {
  return path.join(resumesRoot(), company)
}

export function metadataPath(company: string): string {
  const version = readManifest(company)?.version
  if (typeof version === 'string') {
    const versioned = path.join(companyDir(company), version, 'metadata.json')
    if (existsSync(versioned)) return versioned
  }
  return path.join(companyDir(company), 'metadata.json')
}

function readMetadata(company: string): CompanyMetadata | null {
  const file = metadataPath(company)
  if (!existsSync(file)) return null
  const raw = readFileSync(file, 'utf-8')
  return JSON.parse(raw) as CompanyMetadata
}

function readManifest(company: string): CompanyManifest | null {
  const file = path.join(companyDir(company), 'manifest.yml')
  if (!existsSync(file)) return null
  const raw = readFileSync(file, 'utf-8')
  const parsed = parse(raw)
  if (parsed === null || typeof parsed !== 'object') return null
  return parsed as CompanyManifest
}

function readLayout(company: string): CompanyLayout | null {
  const file = path.join(companyDir(company), 'layout.yml')
  if (!existsSync(file)) return null
  const raw = readFileSync(file, 'utf-8')
  const parsed = parse(raw)
  if (parsed === null || typeof parsed !== 'object') return null
  return parsed as CompanyLayout
}

function findPosting(company: string): string | null {
  for (const name of ['job.md', 'posting.md']) {
    const file = path.join(companyDir(company), name)
    if (existsSync(file)) return file
  }
  return null
}

export function buildContext(company: string): CheckContext {
  const dir = companyDir(company)
  if (!existsSync(dir)) {
    throw new Error(`company dir not found: pii/resumes/${company}`)
  }
  return {
    company,
    companyDir: dir,
    metadata: readMetadata(company),
    manifest: readManifest(company),
    layout: readLayout(company),
    postingPath: findPosting(company),
  }
}
