import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getPiiDirectory } from './getPiiPath'

export interface ResumeIndex {
  lastUpdated: string
  default: string
  positions: Record<string, PositionEntry>
}

export interface PositionEntry {
  default: string
  companies: Record<string, CompanyResume[]>
}

export interface CompanyResume {
  date: string
  path: string
  lastModified: string
  status: 'draft' | 'active' | 'archived'
}

export interface DefaultResumeResult {
  path: string
  type: 'global' | 'position-default' | 'company-specific'
  position?: string
  company?: string
}

export function getDefaultResume(): DefaultResumeResult {
  const piiPath = getPiiDirectory()
  const indexPath = join(piiPath, 'resume-index.json')

  if (!existsSync(indexPath)) {
    return {
      path: 'data.yml',
      type: 'global',
    }
  }

  let index: ResumeIndex
  try {
    const content = readFileSync(indexPath, 'utf-8')
    index = JSON.parse(content)
  } catch {
    return {
      path: 'data.yml',
      type: 'global',
    }
  }

  if (index.default && index.default !== 'data.yml') {
    return {
      path: index.default,
      type: 'global',
    }
  }

  const positions = Object.entries(index.positions || {})
  if (positions.length === 0) {
    return {
      path: 'data.yml',
      type: 'global',
    }
  }

  const firstPosition = positions[0]
  const [positionName, positionEntry] = firstPosition

  if (positionEntry.default) {
    return {
      path: positionEntry.default,
      type: 'position-default',
      position: positionName,
    }
  }

  const companies = Object.entries(positionEntry.companies || {})
  if (companies.length === 0) {
    return {
      path: 'data.yml',
      type: 'global',
    }
  }

  const [companyName, companyResumes] = companies[0]

  const activeResume = companyResumes.find((r) => r.status === 'active')
  const latestResume = companyResumes.sort(
    (a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime(),
  )[0]

  const selectedResume = activeResume || latestResume

  if (!selectedResume) {
    return {
      path: 'data.yml',
      type: 'global',
    }
  }

  return {
    path: selectedResume.path,
    type: 'company-specific',
    position: positionName,
    company: companyName,
  }
}

export function getResumeByPosition(position: string): DefaultResumeResult | null {
  const piiPath = getPiiDirectory()
  const indexPath = join(piiPath, 'resume-index.json')

  if (!existsSync(indexPath)) {
    return null
  }

  let index: ResumeIndex
  try {
    const content = readFileSync(indexPath, 'utf-8')
    index = JSON.parse(content)
  } catch {
    return null
  }

  const positionEntry = index.positions?.[position]
  if (!positionEntry) {
    return null
  }

  if (positionEntry.default) {
    return {
      path: positionEntry.default,
      type: 'position-default',
      position,
    }
  }

  return null
}

export function getResumeByCompany(position: string, company: string): DefaultResumeResult | null {
  const piiPath = getPiiDirectory()
  const indexPath = join(piiPath, 'resume-index.json')

  if (!existsSync(indexPath)) {
    return null
  }

  let index: ResumeIndex
  try {
    const content = readFileSync(indexPath, 'utf-8')
    index = JSON.parse(content)
  } catch {
    return null
  }

  const companyResumes = index.positions?.[position]?.companies?.[company]
  if (!companyResumes || companyResumes.length === 0) {
    return null
  }

  const activeResume = companyResumes.find((r) => r.status === 'active')
  const latestResume = companyResumes.sort(
    (a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime(),
  )[0]

  const selectedResume = activeResume || latestResume

  return {
    path: selectedResume.path,
    type: 'company-specific',
    position,
    company,
  }
}

export function listAllResumes(): DefaultResumeResult[] {
  const piiPath = getPiiDirectory()
  const indexPath = join(piiPath, 'resume-index.json')

  if (!existsSync(indexPath)) {
    return []
  }

  let index: ResumeIndex
  try {
    const content = readFileSync(indexPath, 'utf-8')
    index = JSON.parse(content)
  } catch {
    return []
  }

  const results: DefaultResumeResult[] = []

  if (index.default && index.default !== 'data.yml') {
    results.push({
      path: index.default,
      type: 'global',
    })
  }

  for (const [positionName, positionEntry] of Object.entries(index.positions || {})) {
    if (positionEntry.default) {
      results.push({
        path: positionEntry.default,
        type: 'position-default',
        position: positionName,
      })
    }

    for (const [companyName, companyResumes] of Object.entries(positionEntry.companies || {})) {
      for (const resume of companyResumes) {
        results.push({
          path: resume.path,
          type: 'company-specific',
          position: positionName,
          company: companyName,
        })
      }
    }
  }

  return results
}
