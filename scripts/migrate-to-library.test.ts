import * as fs from 'node:fs'
import * as path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { yaml } from '../lib/yamlService'
import { executeMigration, planMigration } from './migrate-to-library'

const TEST_PII_DIR = path.join(process.cwd(), 'test-pii-migration')

vi.mock('../lib/getPiiPath', () => ({
  getPiiDirectory: () => TEST_PII_DIR,
}))

function writeYaml(filePath: string, data: Record<string, unknown>) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, yaml.dump(data))
}

function writeJson(filePath: string, data: Record<string, unknown>) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(data))
}

describe('migrate-to-library', () => {
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

  describe('planMigration', () => {
    it('creates library entries from numbered files', () => {
      const companyDir = path.join(TEST_PII_DIR, 'resumes', 'acme')
      writeYaml(path.join(companyDir, 'workExperience.01.backend-role.yml'), {
        workExperience: [{ position: 'Backend Dev', company: 'ACME' }],
      })
      writeYaml(path.join(companyDir, 'workExperience.02.frontend-role.yml'), {
        workExperience: [{ position: 'Frontend Dev', company: 'ACME' }],
      })

      const migrations = planMigration(TEST_PII_DIR)

      expect(migrations).toHaveLength(1)
      expect(migrations[0].company).toBe('acme')
      expect(migrations[0].libraryEntries).toHaveLength(2)
      expect(migrations[0].libraryEntries[0].item).toBe('backend-role')
      expect(migrations[0].libraryEntries[1].item).toBe('frontend-role')
      expect(migrations[0].libraryEntries[0].section).toBe('workExperience')
    })

    it('creates library entries from section-specific files', () => {
      const companyDir = path.join(TEST_PII_DIR, 'resumes', 'acme')
      writeYaml(path.join(companyDir, 'header.yml'), {
        header: { name: 'John', tagline: 'Engineer' },
      })

      const migrations = planMigration(TEST_PII_DIR)

      expect(migrations[0].libraryEntries).toHaveLength(1)
      expect(migrations[0].libraryEntries[0].section).toBe('header')
      expect(migrations[0].libraryEntries[0].item).toBe('header')
    })

    it('splits multi-section data.yml into separate library entries', () => {
      const companyDir = path.join(TEST_PII_DIR, 'resumes', 'acme')
      writeYaml(path.join(companyDir, 'data.yml'), {
        header: { name: 'John' },
        workExperience: [{ position: 'Dev' }],
        info: { firstName: 'John' },
      })

      const migrations = planMigration(TEST_PII_DIR)

      const sections = migrations[0].libraryEntries.map((e) => e.section)
      expect(sections).toContain('header')
      expect(sections).toContain('workExperience')
      expect(sections).not.toContain('info')
    })

    it('skips info.yml and metadata.json', () => {
      const companyDir = path.join(TEST_PII_DIR, 'resumes', 'acme')
      writeYaml(path.join(companyDir, 'info.yml'), { info: { firstName: 'John' } })
      writeJson(path.join(companyDir, 'metadata.json'), { pdf: {} })
      writeYaml(path.join(companyDir, 'header.yml'), { header: { name: 'John' } })

      const migrations = planMigration(TEST_PII_DIR)

      expect(migrations[0].libraryEntries).toHaveLength(1)
      expect(migrations[0].libraryEntries[0].section).toBe('header')
    })

    it('skips empty array sections', () => {
      const companyDir = path.join(TEST_PII_DIR, 'resumes', 'acme')
      writeYaml(path.join(companyDir, 'technical.yml'), {
        technical: [{ category: 'Languages', bubbles: ['TypeScript'] }],
        languages: [],
        education: [],
      })

      const migrations = planMigration(TEST_PII_DIR)

      expect(migrations[0].libraryEntries).toHaveLength(1)
      expect(migrations[0].libraryEntries[0].section).toBe('technical')
    })

    it('maintains numbered file order in manifest', () => {
      const companyDir = path.join(TEST_PII_DIR, 'resumes', 'acme')
      writeYaml(path.join(companyDir, 'projects.01.alpha.yml'), {
        projects: [{ name: 'Alpha' }],
      })
      writeYaml(path.join(companyDir, 'projects.02.beta.yml'), {
        projects: [{ name: 'Beta' }],
      })
      writeYaml(path.join(companyDir, 'projects.03.gamma.yml'), {
        projects: [{ name: 'Gamma' }],
      })

      const migrations = planMigration(TEST_PII_DIR)
      const refs = migrations[0].manifestEntries.map((e) => e.ref)

      expect(refs).toEqual(['alpha.default', 'beta.default', 'gamma.default'])
    })

    it('uses kebab-case for camelCase section names', () => {
      const companyDir = path.join(TEST_PII_DIR, 'resumes', 'acme')
      writeYaml(path.join(companyDir, 'career.yml'), {
        careerSummary: [{ title: 'Experience', text: 'stuff' }],
      })

      const migrations = planMigration(TEST_PII_DIR)

      expect(migrations[0].libraryEntries[0].item).toBe('career-summary')
    })

    it('disambiguates legacy files with duplicate basenames', () => {
      const companyDir = path.join(TEST_PII_DIR, 'resumes', 'acme')
      writeYaml(path.join(companyDir, 'work.workExperience01.yml'), {
        workExperience: [{ position: 'Job A' }],
      })
      writeYaml(path.join(companyDir, 'work.workExperience02.yml'), {
        workExperience: [{ position: 'Job B' }],
      })

      const migrations = planMigration(TEST_PII_DIR)

      const items = migrations[0].libraryEntries.map((e) => e.item)
      expect(items[0]).not.toBe(items[1])
      expect(items).toContain('work-01')
      expect(items).toContain('work-02')
    })

    it('skips companies with no migratable content', () => {
      const companyDir = path.join(TEST_PII_DIR, 'resumes', 'empty-co')
      writeYaml(path.join(companyDir, 'info.yml'), { info: { firstName: 'Jane' } })

      const migrations = planMigration(TEST_PII_DIR)
      expect(migrations).toHaveLength(0)
    })

    it('generates singleton manifest entry for header', () => {
      const companyDir = path.join(TEST_PII_DIR, 'resumes', 'acme')
      writeYaml(path.join(companyDir, 'header.yml'), { header: { name: 'John' } })

      const migrations = planMigration(TEST_PII_DIR)
      const headerEntries = migrations[0].manifestEntries.filter((e) => e.section === 'header')
      expect(headerEntries).toHaveLength(1)
    })
  })

  describe('executeMigration', () => {
    it('creates library directory structure and files', () => {
      const companyDir = path.join(TEST_PII_DIR, 'resumes', 'acme')
      writeYaml(path.join(companyDir, 'header.yml'), { header: { name: 'John' } })
      writeYaml(path.join(companyDir, 'workExperience.01.job-a.yml'), {
        workExperience: [{ position: 'Dev' }],
      })

      const migrations = planMigration(TEST_PII_DIR)
      executeMigration(TEST_PII_DIR, migrations)

      const headerLib = path.join(TEST_PII_DIR, 'library', 'header', 'header.default.yml')
      const workLib = path.join(TEST_PII_DIR, 'library', 'workExperience', 'job-a.default.yml')

      expect(fs.existsSync(headerLib)).toBe(true)
      expect(fs.existsSync(workLib)).toBe(true)
    })

    it('generates valid manifest.yml', () => {
      const companyDir = path.join(TEST_PII_DIR, 'resumes', 'acme')
      writeYaml(path.join(companyDir, 'header.yml'), { header: { name: 'John' } })
      writeYaml(path.join(companyDir, 'workExperience.01.job-a.yml'), {
        workExperience: [{ position: 'Dev A' }],
      })
      writeYaml(path.join(companyDir, 'workExperience.02.job-b.yml'), {
        workExperience: [{ position: 'Dev B' }],
      })

      const migrations = planMigration(TEST_PII_DIR)
      executeMigration(TEST_PII_DIR, migrations)

      const manifestPath = path.join(companyDir, 'manifest.yml')
      expect(fs.existsSync(manifestPath)).toBe(true)

      const manifest = yaml.load(fs.readFileSync(manifestPath, 'utf-8')) as Record<string, unknown>
      expect(manifest.header).toBe('header.default')
      expect(manifest.workExperience).toEqual(['job-a.default', 'job-b.default'])
    })

    it('leaves info.yml in company folder', () => {
      const companyDir = path.join(TEST_PII_DIR, 'resumes', 'acme')
      writeYaml(path.join(companyDir, 'info.yml'), { info: { firstName: 'John' } })
      writeYaml(path.join(companyDir, 'header.yml'), { header: { name: 'John' } })

      const migrations = planMigration(TEST_PII_DIR)
      executeMigration(TEST_PII_DIR, migrations)

      expect(fs.existsSync(path.join(companyDir, 'info.yml'))).toBe(true)
      const libraryInfoGlob = path.join(TEST_PII_DIR, 'library', '**', 'info*')
      expect(fs.existsSync(path.join(TEST_PII_DIR, 'library', 'info'))).toBe(false)
    })

    it('is idempotent — running twice produces same result', () => {
      const companyDir = path.join(TEST_PII_DIR, 'resumes', 'acme')
      writeYaml(path.join(companyDir, 'header.yml'), { header: { name: 'John' } })
      writeYaml(path.join(companyDir, 'workExperience.01.job-a.yml'), {
        workExperience: [{ position: 'Dev' }],
      })

      const migrations1 = planMigration(TEST_PII_DIR)
      executeMigration(TEST_PII_DIR, migrations1)

      const headerContent1 = fs.readFileSync(
        path.join(TEST_PII_DIR, 'library', 'header', 'header.default.yml'),
        'utf-8',
      )

      const migrations2 = planMigration(TEST_PII_DIR)
      executeMigration(TEST_PII_DIR, migrations2)

      const headerContent2 = fs.readFileSync(
        path.join(TEST_PII_DIR, 'library', 'header', 'header.default.yml'),
        'utf-8',
      )

      expect(headerContent1).toBe(headerContent2)
    })
  })
})
