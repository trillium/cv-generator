import * as fs from 'node:fs'
import * as path from 'node:path'
import { getPiiDirectory } from '../getPiiPath'
import { parseYamlString } from '../yamlService'
import {
  ALL_MANIFEST_SECTIONS,
  ARRAY_SECTIONS,
  type Manifest,
  type ManifestRef,
  type ManifestSectionKey,
  type ParsedLibraryFilename,
  type ResolvedManifest,
  type ResolvedManifestEntry,
  SINGLETON_SECTIONS,
} from './types'

const LIBRARY_FILENAME_PATTERN = /^([a-z0-9-]+)\.([a-z0-9-]+)(?:-([a-zA-Z0-9-]+))?$/

export function parseLibraryFilename(ref: ManifestRef): ParsedLibraryFilename | null {
  const match = ref.match(LIBRARY_FILENAME_PATTERN)
  if (!match) return null

  return {
    item: match[1],
    scope: match[2],
    variant: match[3],
  }
}

export function resolveRefToPath(ref: ManifestRef, section: ManifestSectionKey): string {
  const piiPath = getPiiDirectory()
  return path.join(piiPath, 'library', sectionToDirectory(section), `${ref}.yml`)
}

export function sectionToDirectory(section: ManifestSectionKey): string {
  const map: Record<ManifestSectionKey, string> = {
    header: 'header',
    careerSummary: 'career-summary',
    workExperience: 'workExperience',
    projects: 'projects',
    technical: 'technical',
    education: 'education',
    coverLetter: 'cover-letter',
    profile: 'profile',
    languages: 'languages',
  }
  return map[section]
}

export function parseManifestFile(manifestPath: string): Manifest {
  const content = fs.readFileSync(manifestPath, 'utf-8')
  const raw = parseYamlString(content)
  return validateManifest(raw)
}

export function validateManifest(raw: Record<string, unknown>): Manifest {
  const manifest: Manifest = {}
  const errors: string[] = []

  for (const [key, value] of Object.entries(raw)) {
    if (!ALL_MANIFEST_SECTIONS.includes(key as ManifestSectionKey)) {
      errors.push(`Unknown manifest section: '${key}'`)
      continue
    }

    const section = key as ManifestSectionKey

    if (SINGLETON_SECTIONS.includes(section)) {
      if (typeof value !== 'string') {
        errors.push(`Section '${section}' must be a single ref string, got ${typeof value}`)
        continue
      }
      if (!parseLibraryFilename(value)) {
        errors.push(`Invalid ref format for '${section}': '${value}'`)
        continue
      }
      ;(manifest as Record<string, unknown>)[section] = value
    } else if (ARRAY_SECTIONS.includes(section)) {
      if (!Array.isArray(value)) {
        errors.push(`Section '${section}' must be an array of refs, got ${typeof value}`)
        continue
      }
      for (const ref of value) {
        if (typeof ref !== 'string') {
          errors.push(`Ref in '${section}' must be a string, got ${typeof ref}`)
          continue
        }
        if (!parseLibraryFilename(ref)) {
          errors.push(`Invalid ref format in '${section}': '${ref}'`)
        }
      }
      ;(manifest as Record<string, unknown>)[section] = value
    }
  }

  if (errors.length > 0) {
    throw new Error(`Manifest validation failed:\n${errors.join('\n')}`)
  }

  return manifest
}

export function resolveManifest(manifestPath: string): ResolvedManifest {
  const manifest = parseManifestFile(manifestPath)
  const entries: ResolvedManifestEntry[] = []
  const errors: string[] = []

  for (const section of ALL_MANIFEST_SECTIONS) {
    const value = manifest[section]
    if (!value) continue

    const refs = Array.isArray(value) ? value : [value]

    for (const ref of refs) {
      const parsed = parseLibraryFilename(ref)
      if (!parsed) {
        errors.push(`Cannot parse ref '${ref}' in section '${section}'`)
        continue
      }

      const filePath = resolveRefToPath(ref, section)
      if (!fs.existsSync(filePath)) {
        errors.push(`Library file not found: ${filePath} (ref: '${ref}' in '${section}')`)
        continue
      }

      entries.push({ ref, section, filePath, parsed })
    }
  }

  if (errors.length > 0) {
    throw new Error(`Manifest resolution failed:\n${errors.join('\n')}`)
  }

  return { manifest, entries, manifestPath }
}

export function hasManifest(companyDir: string): boolean {
  const piiPath = getPiiDirectory()
  const manifestPath = path.join(piiPath, companyDir, 'manifest.yml')
  return fs.existsSync(manifestPath)
}
