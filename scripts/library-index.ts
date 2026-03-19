import * as fs from 'node:fs'
import * as path from 'node:path'
import { parseLibraryFilename, sectionToDirectory } from '../lib/manifest/schema'
import { ALL_MANIFEST_SECTIONS, type ManifestSectionKey } from '../lib/manifest/types'
import { yaml } from '../lib/yamlService'

type ItemIndex = {
  scopes: string[]
  variants?: Record<string, string[]>
  usedIn: string[]
}

type SectionIndex = Record<string, ItemIndex>
type LibraryIndex = Record<string, SectionIndex>

const DIRECTORY_TO_SECTION: Record<string, ManifestSectionKey> = {}
for (const section of ALL_MANIFEST_SECTIONS) {
  DIRECTORY_TO_SECTION[sectionToDirectory(section)] = section
}

function scanLibrary(libraryPath: string): LibraryIndex {
  const index: LibraryIndex = {}

  if (!fs.existsSync(libraryPath)) return index

  const sectionDirs = fs
    .readdirSync(libraryPath, { withFileTypes: true })
    .filter((e) => e.isDirectory())

  for (const dir of sectionDirs) {
    const sectionKey = DIRECTORY_TO_SECTION[dir.name]
    if (!sectionKey) continue

    const sectionPath = path.join(libraryPath, dir.name)
    const files = fs
      .readdirSync(sectionPath)
      .filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))

    const sectionIndex: SectionIndex = {}

    for (const filename of files) {
      if (filename === 'index.yml') continue
      const ref = path.basename(filename, path.extname(filename))
      const parsed = parseLibraryFilename(ref)
      if (!parsed) continue

      if (!sectionIndex[parsed.item]) {
        sectionIndex[parsed.item] = { scopes: [], usedIn: [] }
      }

      const entry = sectionIndex[parsed.item]

      if (parsed.variant) {
        if (!entry.variants) entry.variants = {}
        if (!entry.variants[parsed.scope]) entry.variants[parsed.scope] = []
        if (!entry.variants[parsed.scope].includes(parsed.variant)) {
          entry.variants[parsed.scope].push(parsed.variant)
        }
        if (!entry.scopes.includes(parsed.scope)) {
          entry.scopes.push(parsed.scope)
        }
      } else {
        if (!entry.scopes.includes(parsed.scope)) {
          entry.scopes.push(parsed.scope)
        }
      }
    }

    if (Object.keys(sectionIndex).length > 0) {
      index[sectionKey] = sectionIndex
    }
  }

  return index
}

function scanManifests(resumesPath: string): Map<string, Set<string>> {
  const usageMap = new Map<string, Set<string>>()

  if (!fs.existsSync(resumesPath)) return usageMap

  const companies = fs
    .readdirSync(resumesPath, { withFileTypes: true })
    .filter((e) => e.isDirectory())

  for (const company of companies) {
    const manifestPath = path.join(resumesPath, company.name, 'manifest.yml')
    if (!fs.existsSync(manifestPath)) continue

    const content = fs.readFileSync(manifestPath, 'utf-8')
    const manifest = yaml.load(content) as Record<string, unknown>
    if (!manifest) continue

    for (const [, value] of Object.entries(manifest)) {
      const refs = Array.isArray(value) ? value : [value]
      for (const ref of refs) {
        if (typeof ref !== 'string') continue
        const parsed = parseLibraryFilename(ref)
        if (!parsed) continue

        const key = parsed.item
        if (!usageMap.has(key)) usageMap.set(key, new Set())
        usageMap.get(key)!.add(company.name)
      }
    }
  }

  return usageMap
}

export function generateIndex(piiPath: string): LibraryIndex {
  const libraryPath = path.join(piiPath, 'library')
  const resumesPath = path.join(piiPath, 'resumes')

  const index = scanLibrary(libraryPath)
  const usageMap = scanManifests(resumesPath)

  for (const sectionIndex of Object.values(index)) {
    for (const [item, entry] of Object.entries(sectionIndex)) {
      const companies = usageMap.get(item)
      if (companies) {
        entry.usedIn = [...companies].sort()
      }
    }
  }

  return index
}

export function writeIndex(piiPath: string, index: LibraryIndex): void {
  const indexPath = path.join(piiPath, 'library', 'index.yml')
  fs.writeFileSync(indexPath, yaml.dump(index))
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const piiPath = path.resolve(process.cwd(), 'pii')
  const index = generateIndex(piiPath)
  writeIndex(piiPath, index)
  console.log('Library index generated at pii/library/index.yml')
  console.log(yaml.dump(index))
}
