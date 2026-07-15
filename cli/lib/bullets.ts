import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { parse } from 'yaml'
import { companyDir } from './context'

const STORE_CLI = 'resume_bullets'
const STORE_DIR = '/Users/trilliumsmith/data/resume_bullets'
const BULLET_LABEL = 'resume-bullet'
const APPROVED_LABEL = 'review:approved'

const BULLET_SECTIONS = ['workExperience', 'projects'] as const
type BulletSection = (typeof BULLET_SECTIONS)[number]

export interface ExtractedBullet {
  text: string
  normalized: string
  hash: string
  sourceFile: string
}

export interface StoreRow {
  id: string
  title: string
  description: string
  labels: string[]
}

export function normalize(text: string): string {
  return text.trim().replace(/\s+/g, ' ')
}

export function hashBullet(text: string): string {
  return createHash('sha256').update(normalize(text)).digest('hex')
}

function libraryRoot(): string {
  return path.resolve(companyDir('_'), '..', '..', 'library')
}

function readManifestRefs(company: string, section: BulletSection): string[] {
  const file = path.join(companyDir(company), 'manifest.yml')
  if (!existsSync(file)) return []
  const parsed = parse(readFileSync(file, 'utf-8')) as Record<string, unknown> | null
  const refs = parsed?.[section]
  if (!Array.isArray(refs)) return []
  return refs.filter((r): r is string => typeof r === 'string')
}

function textLinesFromWorkExperience(doc: unknown): string[] {
  const root = (doc as { workExperience?: unknown })?.workExperience
  if (!Array.isArray(root)) return []
  const out: string[] = []
  for (const entry of root) {
    const details = (entry as { details?: unknown })?.details
    if (!Array.isArray(details)) continue
    for (const detail of details) {
      const lines = (detail as { lines?: unknown })?.lines
      if (!Array.isArray(lines)) continue
      for (const line of lines) {
        const text = (line as { text?: unknown })?.text
        if (typeof text === 'string' && text.trim().length > 0) out.push(text)
      }
    }
  }
  return out
}

function textLinesFromProjects(doc: unknown): string[] {
  const root = (doc as { projects?: unknown })?.projects
  if (!Array.isArray(root)) return []
  const out: string[] = []
  for (const entry of root) {
    const lines = (entry as { lines?: unknown })?.lines
    if (!Array.isArray(lines)) continue
    for (const line of lines) {
      const text = (line as { text?: unknown })?.text
      if (typeof text === 'string' && text.trim().length > 0) out.push(text)
    }
  }
  return out
}

function extractSectionLines(section: BulletSection, doc: unknown): string[] {
  return section === 'workExperience'
    ? textLinesFromWorkExperience(doc)
    : textLinesFromProjects(doc)
}

export function extractBullets(company: string): ExtractedBullet[] {
  const root = libraryRoot()
  const bullets: ExtractedBullet[] = []
  const seen = new Set<string>()
  for (const section of BULLET_SECTIONS) {
    for (const ref of readManifestRefs(company, section)) {
      const file = path.join(root, section, `${ref}.yml`)
      if (!existsSync(file)) {
        throw new Error(`manifest ref missing library file: ${section}/${ref}.yml`)
      }
      const doc = parse(readFileSync(file, 'utf-8'))
      const relSource = path.join('pii', 'library', section, `${ref}.yml`)
      for (const text of extractSectionLines(section, doc)) {
        const normalized = normalize(text)
        if (seen.has(normalized)) continue
        seen.add(normalized)
        bullets.push({
          text: normalized,
          normalized,
          hash: hashBullet(text),
          sourceFile: relSource,
        })
      }
    }
  }
  return bullets
}

function runStore(args: string[]): string {
  const proc = Bun.spawnSync([STORE_CLI, ...args], {
    cwd: STORE_DIR,
    stdout: 'pipe',
    stderr: 'pipe',
  })
  if ((proc.exitCode ?? 1) !== 0) {
    throw new Error(`${STORE_CLI} ${args.join(' ')} failed: ${proc.stderr.toString().trim()}`)
  }
  return proc.stdout.toString()
}

export function listStoreRows(label = BULLET_LABEL): StoreRow[] {
  const raw = runStore(['list', '--label', label, '-n', '0', '--json'])
  const parsed = JSON.parse(raw.trim() || '[]') as Array<Partial<StoreRow>>
  return parsed.map((r) => ({
    id: String(r.id ?? ''),
    title: String(r.title ?? ''),
    description: String(r.description ?? ''),
    labels: Array.isArray(r.labels) ? r.labels.map(String) : [],
  }))
}

export function approvedHashSet(): Set<string> {
  const rows = listStoreRows(APPROVED_LABEL)
  const set = new Set<string>()
  for (const row of rows) {
    if (row.title.trim().length > 0) set.add(hashBullet(row.title))
    if (row.description.trim().length > 0) set.add(hashBullet(row.description))
  }
  return set
}

export interface ScopedRow {
  row: StoreRow
  hash: string
  sourceFile: string
}

export function storeBulletsForCompany(company: string): {
  scoped: ScopedRow[]
  drift: ExtractedBullet[]
} {
  const extracted = extractBullets(company)
  const rows = listStoreRows()
  const index = new Map<string, StoreRow>()
  for (const row of rows) {
    for (const field of [row.title, row.description]) {
      if (field.trim().length === 0) continue
      const h = hashBullet(field)
      if (!index.has(h)) index.set(h, row)
    }
  }
  const scoped: ScopedRow[] = []
  const drift: ExtractedBullet[] = []
  const seenRows = new Set<string>()
  for (const b of extracted) {
    const row = index.get(b.hash)
    if (!row) {
      drift.push(b)
      continue
    }
    if (seenRows.has(row.id)) continue
    seenRows.add(row.id)
    scoped.push({ row, hash: b.hash, sourceFile: b.sourceFile })
  }
  return { scoped, drift }
}

export function labelAdd(id: string, label: string): void {
  runStore(['label', 'add', id, label])
}

export function labelRemove(id: string, label: string): void {
  runStore(['label', 'remove', id, label])
}

export function setMetadata(id: string, pairs: Record<string, string>): void {
  const args = ['update', id]
  for (const [key, value] of Object.entries(pairs)) args.push('--set-metadata', `${key}=${value}`)
  runStore(args)
}
