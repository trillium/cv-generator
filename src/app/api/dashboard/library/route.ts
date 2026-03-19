import * as fs from 'node:fs'
import * as path from 'node:path'
import { NextResponse } from 'next/server'
import { getPiiDirectory } from '@/lib/getPiiPath'
import { parseLibraryFilename, sectionToDirectory } from '@/lib/manifest/schema'
import { ALL_MANIFEST_SECTIONS, type ManifestSectionKey } from '@/lib/manifest/types'
import { yaml } from '@/lib/yamlService'

const DIRECTORY_TO_SECTION: Record<string, ManifestSectionKey> = {}
for (const section of ALL_MANIFEST_SECTIONS) {
  DIRECTORY_TO_SECTION[sectionToDirectory(section)] = section
}

export async function GET() {
  const piiPath = getPiiDirectory()
  const libraryPath = path.join(piiPath, 'library')

  if (!fs.existsSync(libraryPath)) {
    return NextResponse.json({ library: {} })
  }

  const index: Record<string, Record<string, { scopes: string[]; usedIn: string[] }>> = {}

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

    const sectionIndex: Record<string, { scopes: string[]; usedIn: string[] }> = {}

    for (const filename of files) {
      if (filename === 'index.yml') continue
      const ref = path.basename(filename, path.extname(filename))
      const parsed = parseLibraryFilename(ref)
      if (!parsed) continue

      if (!sectionIndex[parsed.item]) {
        sectionIndex[parsed.item] = { scopes: [], usedIn: [] }
      }
      if (!sectionIndex[parsed.item].scopes.includes(parsed.scope)) {
        sectionIndex[parsed.item].scopes.push(parsed.scope)
      }
    }

    if (Object.keys(sectionIndex).length > 0) {
      index[sectionKey] = sectionIndex
    }
  }

  const resumesPath = path.join(piiPath, 'resumes')
  if (fs.existsSync(resumesPath)) {
    const companies = fs
      .readdirSync(resumesPath, { withFileTypes: true })
      .filter((e) => e.isDirectory())
    for (const company of companies) {
      const manifestPath = path.join(resumesPath, company.name, 'manifest.yml')
      if (!fs.existsSync(manifestPath)) continue
      const manifest = yaml.load(fs.readFileSync(manifestPath, 'utf-8'))
      if (!manifest) continue
      for (const value of Object.values(manifest)) {
        const refs = Array.isArray(value) ? value : [value]
        for (const ref of refs) {
          if (typeof ref !== 'string') continue
          const parsed = parseLibraryFilename(ref)
          if (!parsed) continue
          for (const sectionIndex of Object.values(index)) {
            if (
              sectionIndex[parsed.item] &&
              !sectionIndex[parsed.item].usedIn.includes(company.name)
            ) {
              sectionIndex[parsed.item].usedIn.push(company.name)
            }
          }
        }
      }
    }
  }

  return NextResponse.json({ library: index })
}
