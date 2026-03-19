import * as fs from 'node:fs'
import * as path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { yaml } from '../lib/yamlService'
import { generateIndex } from './library-index'

const TEST_PII_DIR = path.join(process.cwd(), 'test-pii-index')

vi.mock('../lib/getPiiPath', () => ({
  getPiiDirectory: () => TEST_PII_DIR,
}))

function writeYaml(filePath: string, data: Record<string, unknown>) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, yaml.dump(data))
}

describe('library-index', () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_PII_DIR)) {
      fs.rmSync(TEST_PII_DIR, { recursive: true })
    }
    fs.mkdirSync(TEST_PII_DIR, { recursive: true })
  })

  afterEach(() => {
    if (fs.existsSync(TEST_PII_DIR)) {
      fs.rmSync(TEST_PII_DIR, { recursive: true })
    }
  })

  it('generates correct index from library files', () => {
    const workDir = path.join(TEST_PII_DIR, 'library', 'workExperience')
    fs.mkdirSync(workDir, { recursive: true })
    writeYaml(path.join(workDir, 'ts-consulting.agentic.yml'), {
      workExperience: [{ position: 'Dev' }],
    })
    writeYaml(path.join(workDir, 'ts-consulting.fullstack.yml'), {
      workExperience: [{ position: 'Fullstack' }],
    })
    writeYaml(path.join(workDir, 'hackforla.leadership.yml'), {
      workExperience: [{ position: 'Lead' }],
    })

    const index = generateIndex(TEST_PII_DIR)

    expect(index.workExperience).toBeDefined()
    expect(index.workExperience['ts-consulting'].scopes).toEqual(['agentic', 'fullstack'])
    expect(index.workExperience['hackforla'].scopes).toEqual(['leadership'])
  })

  it('parses item.scope-variant.yml correctly', () => {
    const workDir = path.join(TEST_PII_DIR, 'library', 'workExperience')
    fs.mkdirSync(workDir, { recursive: true })
    writeYaml(path.join(workDir, 'ts-consulting.agentic.yml'), {
      workExperience: [{ position: 'Dev' }],
    })
    writeYaml(path.join(workDir, 'ts-consulting.agentic-codeRabbit.yml'), {
      workExperience: [{ position: 'Dev CR' }],
    })

    const index = generateIndex(TEST_PII_DIR)

    expect(index.workExperience['ts-consulting'].scopes).toEqual(['agentic'])
    expect(index.workExperience['ts-consulting'].variants).toEqual({
      agentic: ['codeRabbit'],
    })
  })

  it('scans manifests for usedIn references', () => {
    const workDir = path.join(TEST_PII_DIR, 'library', 'workExperience')
    fs.mkdirSync(workDir, { recursive: true })
    writeYaml(path.join(workDir, 'ts-consulting.agentic.yml'), {
      workExperience: [{ position: 'Dev' }],
    })

    const posthogDir = path.join(TEST_PII_DIR, 'resumes', 'posthog')
    fs.mkdirSync(posthogDir, { recursive: true })
    writeYaml(path.join(posthogDir, 'manifest.yml'), {
      workExperience: ['ts-consulting.agentic'],
    })

    const acmeDir = path.join(TEST_PII_DIR, 'resumes', 'acme')
    fs.mkdirSync(acmeDir, { recursive: true })
    writeYaml(path.join(acmeDir, 'manifest.yml'), {
      workExperience: ['ts-consulting.agentic'],
    })

    const index = generateIndex(TEST_PII_DIR)

    expect(index.workExperience['ts-consulting'].usedIn).toEqual(['acme', 'posthog'])
  })

  it('returns empty index for empty library', () => {
    fs.mkdirSync(path.join(TEST_PII_DIR, 'library'), { recursive: true })

    const index = generateIndex(TEST_PII_DIR)

    expect(Object.keys(index)).toHaveLength(0)
  })

  it('returns empty index when library dir does not exist', () => {
    const index = generateIndex(TEST_PII_DIR)
    expect(Object.keys(index)).toHaveLength(0)
  })

  it('handles multiple sections', () => {
    const workDir = path.join(TEST_PII_DIR, 'library', 'workExperience')
    const projDir = path.join(TEST_PII_DIR, 'library', 'projects')
    const headerDir = path.join(TEST_PII_DIR, 'library', 'header')
    fs.mkdirSync(workDir, { recursive: true })
    fs.mkdirSync(projDir, { recursive: true })
    fs.mkdirSync(headerDir, { recursive: true })

    writeYaml(path.join(workDir, 'job-a.default.yml'), { workExperience: [] })
    writeYaml(path.join(projDir, 'app-x.saas.yml'), { projects: [] })
    writeYaml(path.join(headerDir, 'eng.default.yml'), { header: {} })

    const index = generateIndex(TEST_PII_DIR)

    expect(Object.keys(index)).toEqual(
      expect.arrayContaining(['workExperience', 'projects', 'header']),
    )
    expect(index.workExperience['job-a']).toBeDefined()
    expect(index.projects['app-x']).toBeDefined()
    expect(index.header.eng).toBeDefined()
  })
})
