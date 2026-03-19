import * as fs from 'node:fs'
import * as path from 'node:path'
import { sectionToDirectory } from '../lib/manifest/schema'
import { type ManifestSectionKey, SINGLETON_SECTIONS } from '../lib/manifest/types'
import {
  FULL_DATA_FILENAMES,
  loadDataFile,
  parseNumberedArrayFile,
  SECTION_KEY_TO_FILENAME,
  SUPPORTED_EXTENSIONS,
} from '../lib/multiFileMapper'
import { yaml } from '../lib/yamlService'

const SKIP_SECTIONS = new Set(['info', 'metadata', 'llm', 'notes', 'linkedIn'])
const SKIP_FILES = new Set(['metadata.json', 'llm.json'])
const SKIP_EXTENSIONS = new Set(['.pdf', '.md'])

const ALL_MANIFEST_SECTION_KEYS = new Set<string>([
  'header',
  'careerSummary',
  'workExperience',
  'projects',
  'technical',
  'education',
  'coverLetter',
  'profile',
  'languages',
])

type LibraryEntry = {
  section: ManifestSectionKey
  item: string
  scope: string
  content: Record<string, unknown>
  sourcePath: string
}

type ManifestEntry = {
  section: ManifestSectionKey
  ref: string
  order: number
}

type CompanyMigration = {
  company: string
  libraryEntries: LibraryEntry[]
  manifestEntries: ManifestEntry[]
  skippedFiles: string[]
}

function filenameToSectionKey(filename: string): string | null {
  const ext = path.extname(filename)
  const nameWithoutExt = path.basename(filename, ext)

  for (const [sectionKey, filenames] of Object.entries(SECTION_KEY_TO_FILENAME)) {
    if (filenames.includes(nameWithoutExt)) {
      return sectionKey
    }
  }
  return null
}

function isFullDataFile(filename: string): boolean {
  const ext = path.extname(filename)
  const nameWithoutExt = path.basename(filename, ext)
  return FULL_DATA_FILENAMES.includes(nameWithoutExt)
}

function sanitizeItemName(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function isEmpty(value: unknown): boolean {
  if (value == null) return true
  if (Array.isArray(value) && value.length === 0) return true
  if (typeof value === 'object' && Object.keys(value as object).length === 0) return true
  return false
}

function safeLoadDataFile(filePath: string): Record<string, unknown> | null {
  try {
    const data = loadDataFile(filePath)
    return data ?? null
  } catch {
    return null
  }
}

function addEntry(
  section: ManifestSectionKey,
  item: string,
  scope: string,
  sectionKey: string,
  sectionData: unknown,
  sourcePath: string,
  libraryEntries: LibraryEntry[],
  manifestEntries: ManifestEntry[],
  order: number,
) {
  libraryEntries.push({
    section,
    item,
    scope,
    content: { [sectionKey]: sectionData },
    sourcePath,
  })
  manifestEntries.push({ section, ref: `${item}.${scope}`, order })
}

function extractMigratableSections(fileData: Record<string, unknown>): [string, unknown][] {
  return Object.entries(fileData).filter(
    ([key, value]) =>
      ALL_MANIFEST_SECTION_KEYS.has(key) && !SKIP_SECTIONS.has(key) && !isEmpty(value),
  )
}

function scanCompanyDir(
  companyPath: string,
  companyName: string,
  defaultScope: string,
): CompanyMigration {
  const dirEntries = fs.readdirSync(companyPath, { withFileTypes: true })
  const libraryEntries: LibraryEntry[] = []
  const manifestEntries: ManifestEntry[] = []
  const skippedFiles: string[] = []
  let order = 0

  const dataFiles = dirEntries
    .filter((e) => e.isFile())
    .filter((e) => !SKIP_FILES.has(e.name))
    .filter((e) => !SKIP_EXTENSIONS.has(path.extname(e.name)))
    .filter((e) => SUPPORTED_EXTENSIONS.includes(path.extname(e.name)))
    .filter(
      (e) =>
        !e.name.includes('.HIDE.') &&
        !e.name.includes('.VARIATIONS.') &&
        !e.name.includes('.updated.'),
    )
    .map((e) => e.name)

  const numberedFiles: Map<
    string,
    { basename: string; sectionKey: string; number: string; filename: string }[]
  > = new Map()
  const sectionFiles: string[] = []
  const fullDataFiles: string[] = []

  for (const filename of dataFiles) {
    const numbered = parseNumberedArrayFile(filename)
    if (numbered) {
      const group = numberedFiles.get(numbered.sectionKey) || []
      group.push({ ...numbered, filename })
      numberedFiles.set(numbered.sectionKey, group)
    } else if (isFullDataFile(filename)) {
      fullDataFiles.push(filename)
    } else {
      sectionFiles.push(filename)
    }
  }

  const sectionsHandledByNumbered = new Set(numberedFiles.keys())

  for (const [sectionKey, files] of numberedFiles) {
    if (!ALL_MANIFEST_SECTION_KEYS.has(sectionKey)) {
      for (const f of files) skippedFiles.push(f.filename)
      continue
    }

    const sorted = [...files].sort((a, b) => Number.parseInt(a.number) - Number.parseInt(b.number))

    const basenameCounts = new Map<string, number>()
    for (const f of sorted) {
      basenameCounts.set(f.basename, (basenameCounts.get(f.basename) || 0) + 1)
    }

    for (const file of sorted) {
      const filePath = path.join(companyPath, file.filename)
      const fileData = safeLoadDataFile(filePath)
      if (!fileData) {
        skippedFiles.push(file.filename)
        continue
      }

      const sectionData = fileData[sectionKey]
      if (isEmpty(sectionData)) {
        skippedFiles.push(file.filename)
        continue
      }

      const hasDuplicateBasename = (basenameCounts.get(file.basename) || 0) > 1
      const rawItem = hasDuplicateBasename ? `${file.basename}-${file.number}` : file.basename
      const item = sanitizeItemName(rawItem)
      addEntry(
        sectionKey as ManifestSectionKey,
        item,
        defaultScope,
        sectionKey,
        sectionData,
        filePath,
        libraryEntries,
        manifestEntries,
        order++,
      )
    }
  }

  for (const filename of sectionFiles) {
    const filePath = path.join(companyPath, filename)
    const mappedSection = filenameToSectionKey(filename)

    if (mappedSection && SKIP_SECTIONS.has(mappedSection)) {
      skippedFiles.push(filename)
      continue
    }

    const fileData = safeLoadDataFile(filePath)
    if (!fileData) {
      skippedFiles.push(filename)
      continue
    }

    const sections = extractMigratableSections(fileData)
    if (sections.length === 0) {
      skippedFiles.push(filename)
      continue
    }

    for (const [sectionKey, sectionData] of sections) {
      if (sectionsHandledByNumbered.has(sectionKey)) continue

      const section = sectionKey as ManifestSectionKey
      const item = sanitizeItemName(sectionKey)
      addEntry(
        section,
        item,
        defaultScope,
        sectionKey,
        sectionData,
        filePath,
        libraryEntries,
        manifestEntries,
        order++,
      )
    }
  }

  for (const filename of fullDataFiles) {
    const filePath = path.join(companyPath, filename)
    const fileData = safeLoadDataFile(filePath)
    if (!fileData) {
      skippedFiles.push(filename)
      continue
    }

    const sections = extractMigratableSections(fileData)
    if (sections.length === 0) {
      skippedFiles.push(filename)
      continue
    }

    for (const [sectionKey, sectionData] of sections) {
      if (sectionsHandledByNumbered.has(sectionKey)) continue

      const section = sectionKey as ManifestSectionKey
      const item = sanitizeItemName(sectionKey)
      addEntry(
        section,
        item,
        defaultScope,
        sectionKey,
        sectionData,
        filePath,
        libraryEntries,
        manifestEntries,
        order++,
      )
    }
  }

  return { company: companyName, libraryEntries, manifestEntries, skippedFiles }
}

function buildManifestYaml(entries: ManifestEntry[]): string {
  const manifest: Record<string, string | string[]> = {}

  const bySection = new Map<ManifestSectionKey, ManifestEntry[]>()
  for (const entry of entries) {
    const group = bySection.get(entry.section) || []
    group.push(entry)
    bySection.set(entry.section, group)
  }

  for (const [section, sectionEntries] of bySection) {
    const sorted = sectionEntries.sort((a, b) => a.order - b.order)
    const refs = sorted.map((e) => e.ref)

    if (SINGLETON_SECTIONS.includes(section)) {
      manifest[section] = refs[0]
    } else {
      manifest[section] = refs
    }
  }

  return yaml.dump(manifest)
}

function libraryFilePath(piiPath: string, entry: LibraryEntry): string {
  const dirName = sectionToDirectory(entry.section)
  return path.join(piiPath, 'library', dirName, `${entry.item}.${entry.scope}.yml`)
}

export function planMigration(piiPath: string, defaultScope = 'default'): CompanyMigration[] {
  const resumesPath = path.join(piiPath, 'resumes')
  if (!fs.existsSync(resumesPath)) return []

  const companies = fs
    .readdirSync(resumesPath, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)

  const migrations: CompanyMigration[] = []

  for (const company of companies) {
    const companyPath = path.join(resumesPath, company)
    const migration = scanCompanyDir(companyPath, company, defaultScope)

    if (migration.libraryEntries.length > 0) {
      migrations.push(migration)
    }
  }

  return migrations
}

export function executeMigration(piiPath: string, migrations: CompanyMigration[]): void {
  const created = new Set<string>()

  for (const migration of migrations) {
    for (const entry of migration.libraryEntries) {
      const targetPath = libraryFilePath(piiPath, entry)
      const targetDir = path.dirname(targetPath)

      if (!created.has(targetPath)) {
        fs.mkdirSync(targetDir, { recursive: true })
        fs.writeFileSync(targetPath, yaml.dump(entry.content))
        created.add(targetPath)
      }
    }

    const manifestContent = buildManifestYaml(migration.manifestEntries)
    const manifestPath = path.join(piiPath, 'resumes', migration.company, 'manifest.yml')
    fs.writeFileSync(manifestPath, manifestContent)
  }
}

export function printPlan(migrations: CompanyMigration[]): void {
  if (migrations.length === 0) {
    console.log('Nothing to migrate.')
    return
  }

  for (const migration of migrations) {
    console.log(`\n=== ${migration.company} ===`)

    if (migration.skippedFiles.length > 0) {
      console.log(`  Skipped: ${migration.skippedFiles.join(', ')}`)
    }

    console.log('  Library files:')
    for (const entry of migration.libraryEntries) {
      const dirName = sectionToDirectory(entry.section)
      console.log(
        `    library/${dirName}/${entry.item}.${entry.scope}.yml  ← ${path.basename(entry.sourcePath)}`,
      )
    }

    console.log('  Manifest:')
    for (const entry of migration.manifestEntries) {
      const prefix = SINGLETON_SECTIONS.includes(entry.section) ? '  ' : '  - '
      console.log(`    ${entry.section}: ${prefix}${entry.ref}`)
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)
  const execute = args.includes('--execute')
  const scopeIdx = args.indexOf('--scope')
  const defaultScope = scopeIdx >= 0 ? args[scopeIdx + 1] : 'default'

  const piiPath = path.resolve(process.cwd(), 'pii')
  const migrations = planMigration(piiPath, defaultScope)

  printPlan(migrations)

  if (execute) {
    console.log('\nExecuting migration...')
    executeMigration(piiPath, migrations)
    console.log('Done.')
  } else {
    console.log('\nDry run. Use --execute to apply.')
  }
}
