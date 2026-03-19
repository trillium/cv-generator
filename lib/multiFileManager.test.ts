import * as fs from 'node:fs'
import * as path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MultiFileManager } from './multiFileManager/multiFileManager'
import { yaml } from './yamlService'

const TEST_PII_DIR = path.join(process.cwd(), 'test-pii')

vi.mock('./getPiiPath', () => ({
  getPiiDirectory: () => TEST_PII_DIR,
}))

describe('MultiFileManager', () => {
  let manager: MultiFileManager

  beforeEach(() => {
    if (fs.existsSync(TEST_PII_DIR)) {
      fs.rmSync(TEST_PII_DIR, { recursive: true })
    }
    fs.mkdirSync(TEST_PII_DIR, { recursive: true })
    manager = new MultiFileManager()
  })

  afterEach(() => {
    if (fs.existsSync(TEST_PII_DIR)) {
      fs.rmSync(TEST_PII_DIR, { recursive: true })
    }
  })

  describe('updatePath - file prioritization', () => {
    it('should prioritize section-specific file over full data file', async () => {
      const resumesDir = path.join(TEST_PII_DIR, 'resumes')
      fs.mkdirSync(resumesDir, { recursive: true })

      const dataFile = path.join(resumesDir, 'data.yml')
      const infoFile = path.join(resumesDir, 'info.yml')

      fs.writeFileSync(
        dataFile,
        yaml.dump({
          info: { firstName: 'John', lastName: 'Doe' },
          workExperience: [],
        }),
      )

      fs.writeFileSync(
        infoFile,
        yaml.dump({
          info: { firstName: 'John', lastName: 'Doe' },
        }),
      )

      await manager.updatePath('resumes', 'info.firstName', 'Jane')

      const dataContent = yaml.load(fs.readFileSync(dataFile, 'utf-8')) as Record<string, unknown>
      const infoContent = yaml.load(fs.readFileSync(infoFile, 'utf-8')) as Record<string, unknown>

      expect((infoContent.info as { firstName: string }).firstName).toBe('Jane')
      expect((dataContent.info as { firstName: string }).firstName).toBe('John')
    })

    it('should update full data file when no section-specific file exists', async () => {
      const resumesDir = path.join(TEST_PII_DIR, 'resumes')
      fs.mkdirSync(resumesDir, { recursive: true })

      const dataFile = path.join(resumesDir, 'data.yml')

      fs.writeFileSync(
        dataFile,
        yaml.dump({
          info: { firstName: 'John', lastName: 'Doe' },
          workExperience: [],
        }),
      )

      await manager.updatePath('resumes', 'info.firstName', 'Jane')

      const dataContent = yaml.load(fs.readFileSync(dataFile, 'utf-8')) as Record<string, unknown>

      expect((dataContent.info as { firstName: string }).firstName).toBe('Jane')
    })

    it('should update most specific directory when section exists in multiple levels', async () => {
      const baseDir = path.join(TEST_PII_DIR, 'resumes')
      const googleDir = path.join(baseDir, 'google')
      fs.mkdirSync(googleDir, { recursive: true })

      const baseInfoFile = path.join(baseDir, 'info.yml')
      const googleInfoFile = path.join(googleDir, 'info.yml')

      fs.writeFileSync(
        baseInfoFile,
        yaml.dump({
          info: { firstName: 'John', lastName: 'Doe' },
        }),
      )

      fs.writeFileSync(
        googleInfoFile,
        yaml.dump({
          info: { firstName: 'John', lastName: 'Smith' },
        }),
      )

      await manager.updatePath('resumes/google', 'info.firstName', 'Jane')

      const baseContent = yaml.load(fs.readFileSync(baseInfoFile, 'utf-8')) as Record<
        string,
        unknown
      >
      const googleContent = yaml.load(fs.readFileSync(googleInfoFile, 'utf-8')) as Record<
        string,
        unknown
      >

      expect((googleContent.info as { firstName: string }).firstName).toBe('Jane')
      expect((baseContent.info as { firstName: string }).firstName).toBe('John')
    })

    it("should create section-specific file when section doesn't exist", async () => {
      const resumesDir = path.join(TEST_PII_DIR, 'resumes')
      fs.mkdirSync(resumesDir, { recursive: true })

      await manager.updatePath('resumes', 'info.firstName', 'Jane')

      const infoFile = path.join(resumesDir, 'info.yml')
      expect(fs.existsSync(infoFile)).toBe(true)

      const infoContent = yaml.load(fs.readFileSync(infoFile, 'utf-8')) as Record<string, unknown>
      expect(infoContent).toHaveProperty('info')
    })

    it('should handle nested path updates in section-specific file', async () => {
      const resumesDir = path.join(TEST_PII_DIR, 'resumes')
      fs.mkdirSync(resumesDir, { recursive: true })

      const workFile = path.join(resumesDir, 'work.yml')

      fs.writeFileSync(
        workFile,
        yaml.dump({
          workExperience: [
            { position: 'Engineer', company: 'ACME' },
            { position: 'Manager', company: 'ACME' },
          ],
        }),
      )

      await manager.updatePath('resumes', 'workExperience[0].position', 'Senior Engineer')

      const workContent = yaml.load(fs.readFileSync(workFile, 'utf-8')) as Record<string, unknown>

      expect((workContent.workExperience as Array<{ position: string }>)[0].position).toBe(
        'Senior Engineer',
      )
    })

    it('should prioritize section-specific over full data even when both have same basename', async () => {
      const resumesDir = path.join(TEST_PII_DIR, 'resumes')
      fs.mkdirSync(resumesDir, { recursive: true })

      const dataFile = path.join(resumesDir, 'data.yml')
      const workFile = path.join(resumesDir, 'work.yml')

      fs.writeFileSync(
        dataFile,
        yaml.dump({
          workExperience: [{ position: 'Engineer' }],
          info: { firstName: 'John' },
        }),
      )

      fs.writeFileSync(
        workFile,
        yaml.dump({
          workExperience: [{ position: 'Engineer' }],
        }),
      )

      await manager.updatePath('resumes', 'workExperience[0].position', 'Senior Engineer')

      const dataContent = yaml.load(fs.readFileSync(dataFile, 'utf-8')) as Record<string, unknown>
      const workContent = yaml.load(fs.readFileSync(workFile, 'utf-8')) as Record<string, unknown>

      expect((workContent.workExperience as Array<{ position: string }>)[0].position).toBe(
        'Senior Engineer',
      )
      expect((dataContent.workExperience as Array<{ position: string }>)[0].position).toBe(
        'Engineer',
      )
    })
  })

  describe('loadDirectory', () => {
    it('should load and merge data from directory hierarchy', async () => {
      const baseDir = path.join(TEST_PII_DIR, 'resumes')
      const googleDir = path.join(baseDir, 'google')
      fs.mkdirSync(googleDir, { recursive: true })

      fs.writeFileSync(
        path.join(baseDir, 'info.yml'),
        yaml.dump({
          info: { firstName: 'John', lastName: 'Doe' },
        }),
      )

      fs.writeFileSync(
        path.join(googleDir, 'work.yml'),
        yaml.dump({
          workExperience: [{ position: 'Engineer' }],
        }),
      )

      const result = await manager.loadDirectory('resumes/google')

      expect(result.data).toHaveProperty('info')
      expect(result.data).toHaveProperty('workExperience')
      expect((result.data.info as { firstName: string }).firstName).toBe('John')
    })

    it('should track source files for each section', async () => {
      const resumesDir = path.join(TEST_PII_DIR, 'resumes')
      fs.mkdirSync(resumesDir, { recursive: true })

      const infoFile = path.join(resumesDir, 'info.yml')
      const workFile = path.join(resumesDir, 'work.yml')

      fs.writeFileSync(infoFile, yaml.dump({ info: { firstName: 'John' } }))
      fs.writeFileSync(workFile, yaml.dump({ workExperience: [{ position: 'Engineer' }] }))

      const result = await manager.loadDirectory('resumes')

      expect(result.sources.info).toBe(infoFile)
      expect(result.sources.workExperience).toBe(workFile)
    })

    it('should override parent directory sections with child directory sections', async () => {
      const baseDir = path.join(TEST_PII_DIR, 'resumes')
      const googleDir = path.join(baseDir, 'google')
      fs.mkdirSync(googleDir, { recursive: true })

      fs.writeFileSync(
        path.join(baseDir, 'info.yml'),
        yaml.dump({
          info: { firstName: 'John', lastName: 'Doe' },
        }),
      )

      fs.writeFileSync(
        path.join(googleDir, 'info.yml'),
        yaml.dump({
          info: { firstName: 'Jane', lastName: 'Smith' },
        }),
      )

      const result = await manager.loadDirectory('resumes/google')

      expect((result.data.info as { firstName: string }).firstName).toBe('Jane')
      expect((result.data.info as { lastName: string }).lastName).toBe('Smith')
    })
  })

  describe('loadDirectory - manifest loading', () => {
    function setupManifestFixture() {
      const companyDir = path.join(TEST_PII_DIR, 'resumes', 'acme')
      const libraryDir = path.join(TEST_PII_DIR, 'library')
      const workExpDir = path.join(libraryDir, 'workExperience')
      const projectsDir = path.join(libraryDir, 'projects')
      const headerDir = path.join(libraryDir, 'header')

      fs.mkdirSync(companyDir, { recursive: true })
      fs.mkdirSync(workExpDir, { recursive: true })
      fs.mkdirSync(projectsDir, { recursive: true })
      fs.mkdirSync(headerDir, { recursive: true })

      fs.writeFileSync(
        path.join(headerDir, 'engineer.default.yml'),
        yaml.dump({ header: { name: 'John Doe', tagline: 'Engineer' } }),
      )

      fs.writeFileSync(
        path.join(workExpDir, 'acme-corp.backend.yml'),
        yaml.dump({ workExperience: [{ position: 'Backend Engineer', company: 'ACME' }] }),
      )

      fs.writeFileSync(
        path.join(workExpDir, 'startup.fullstack.yml'),
        yaml.dump({ workExperience: [{ position: 'Fullstack Dev', company: 'Startup' }] }),
      )

      fs.writeFileSync(
        path.join(projectsDir, 'cool-app.saas.yml'),
        yaml.dump({ projects: [{ name: 'Cool App' }] }),
      )

      fs.writeFileSync(
        path.join(companyDir, 'manifest.yml'),
        yaml.dump({
          header: 'engineer.default',
          workExperience: ['acme-corp.backend', 'startup.fullstack'],
          projects: ['cool-app.saas'],
        }),
      )

      fs.writeFileSync(
        path.join(companyDir, 'info.yml'),
        yaml.dump({ info: { firstName: 'John', lastName: 'Doe' } }),
      )

      return { companyDir, libraryDir, workExpDir, projectsDir, headerDir }
    }

    it('should load data via manifest when manifest.yml exists', async () => {
      setupManifestFixture()

      const result = await manager.loadDirectory('resumes/acme')

      expect(result.data).toHaveProperty('header')
      expect(result.data).toHaveProperty('workExperience')
      expect(result.data).toHaveProperty('projects')
      expect((result.data.header as { name: string }).name).toBe('John Doe')
    })

    it('should maintain manifest array order for sections', async () => {
      setupManifestFixture()

      const result = await manager.loadDirectory('resumes/acme')
      const work = result.data.workExperience as Array<{ position: string }>

      expect(work).toHaveLength(2)
      expect(work[0].position).toBe('Backend Engineer')
      expect(work[1].position).toBe('Fullstack Dev')
    })

    it('should build sources mapping with library paths', async () => {
      setupManifestFixture()

      const result = await manager.loadDirectory('resumes/acme')

      expect(Array.isArray(result.sources.workExperience)).toBe(true)
      const workSources = result.sources.workExperience as string[]
      expect(workSources).toHaveLength(2)
      expect(workSources[0]).toContain('library/workExperience/acme-corp.backend.yml')
      expect(workSources[1]).toContain('library/workExperience/startup.fullstack.yml')
    })

    it('should use single source path for singleton sections', async () => {
      setupManifestFixture()

      const result = await manager.loadDirectory('resumes/acme')

      expect(typeof result.sources.header).toBe('string')
      expect(result.sources.header as string).toContain('library/header/engineer.default.yml')
    })

    it('should load info.yml from company folder', async () => {
      setupManifestFixture()

      const result = await manager.loadDirectory('resumes/acme')

      expect(result.data).toHaveProperty('info')
      expect((result.data.info as { firstName: string }).firstName).toBe('John')
      expect(typeof result.sources.info).toBe('string')
      expect(result.sources.info as string).toContain('resumes/acme/info.yml')
    })

    it('should load info.yml from ancestor directory', async () => {
      const resumesDir = path.join(TEST_PII_DIR, 'resumes')
      const companyDir = path.join(resumesDir, 'acme')
      const libraryDir = path.join(TEST_PII_DIR, 'library')
      const workExpDir = path.join(libraryDir, 'workExperience')

      fs.mkdirSync(companyDir, { recursive: true })
      fs.mkdirSync(workExpDir, { recursive: true })

      fs.writeFileSync(
        path.join(resumesDir, 'info.yml'),
        yaml.dump({ info: { firstName: 'Base', lastName: 'Info' } }),
      )

      fs.writeFileSync(
        path.join(workExpDir, 'job.default.yml'),
        yaml.dump({ workExperience: [{ position: 'Dev' }] }),
      )

      fs.writeFileSync(
        path.join(companyDir, 'manifest.yml'),
        yaml.dump({ workExperience: ['job.default'] }),
      )

      const result = await manager.loadDirectory('resumes/acme')

      expect((result.data.info as { firstName: string }).firstName).toBe('Base')
    })

    it('should load metadata.json from company folder', async () => {
      const { companyDir } = setupManifestFixture()

      fs.writeFileSync(
        path.join(companyDir, 'metadata.json'),
        JSON.stringify({ pdf: { resume: { pages: 1, generatedAt: '2026-01-01' } } }),
      )

      const result = await manager.loadDirectory('resumes/acme')

      expect(result.pdfMetadata).toBeDefined()
      expect(result.pdfMetadata?.pdf?.resume?.pages).toBe(1)
    })

    it('should track all loaded files including manifest and library files', async () => {
      setupManifestFixture()

      const result = await manager.loadDirectory('resumes/acme')

      expect(result.metadata.filesLoaded.some((f) => f.endsWith('manifest.yml'))).toBe(true)
      expect(result.metadata.filesLoaded.some((f) => f.endsWith('acme-corp.backend.yml'))).toBe(
        true,
      )
      expect(result.metadata.filesLoaded.some((f) => f.endsWith('info.yml'))).toBe(true)
    })
  })

  describe('updatePath - library file writes via sourceFile', () => {
    function setupLibraryFixture() {
      const companyDir = path.join(TEST_PII_DIR, 'resumes', 'acme')
      const libraryDir = path.join(TEST_PII_DIR, 'library')
      const workExpDir = path.join(libraryDir, 'workExperience')
      const headerDir = path.join(libraryDir, 'header')

      fs.mkdirSync(companyDir, { recursive: true })
      fs.mkdirSync(workExpDir, { recursive: true })
      fs.mkdirSync(headerDir, { recursive: true })

      const workFile = path.join(workExpDir, 'acme-corp.backend.yml')
      fs.writeFileSync(
        workFile,
        yaml.dump({
          workExperience: [
            {
              position: 'Backend Engineer',
              company: 'ACME',
              details: [{ subhead: 'ACME Corp', lines: [{ text: 'Built things' }] }],
            },
          ],
        }),
      )

      const headerFile = path.join(headerDir, 'engineer.default.yml')
      fs.writeFileSync(headerFile, yaml.dump({ header: { name: 'John Doe', tagline: 'Engineer' } }))

      return { companyDir, workFile, headerFile }
    }

    it('should write to library file when sourceFile is provided', async () => {
      const { workFile } = setupLibraryFixture()

      await manager.updatePath(
        'library/workExperience',
        'workExperience[0].position',
        'Senior Backend Engineer',
        workFile,
      )

      const updated = yaml.load(fs.readFileSync(workFile, 'utf-8')) as Record<string, unknown>
      const work = updated.workExperience as Array<{ position: string }>
      expect(work[0].position).toBe('Senior Backend Engineer')
    })

    it('should adjust array index to 0 for library files', async () => {
      const { workFile } = setupLibraryFixture()

      await manager.updatePath(
        'library/workExperience',
        'workExperience[5].position',
        'Adjusted Position',
        workFile,
      )

      const updated = yaml.load(fs.readFileSync(workFile, 'utf-8')) as Record<string, unknown>
      const work = updated.workExperience as Array<{ position: string }>
      expect(work[0].position).toBe('Adjusted Position')
    })

    it('should handle nested path updates in library files', async () => {
      const { workFile } = setupLibraryFixture()

      await manager.updatePath(
        'library/workExperience',
        'workExperience[0].details[0].lines[0].text',
        'Shipped features',
        workFile,
      )

      const updated = yaml.load(fs.readFileSync(workFile, 'utf-8')) as Record<string, unknown>
      const work = updated.workExperience as Array<{
        details: Array<{ lines: Array<{ text: string }> }>
      }>
      expect(work[0].details[0].lines[0].text).toBe('Shipped features')
    })

    it('should write to singleton library file', async () => {
      const { headerFile } = setupLibraryFixture()

      await manager.updatePath('library/header', 'header.name', 'Jane Doe', headerFile)

      const updated = yaml.load(fs.readFileSync(headerFile, 'utf-8')) as Record<string, unknown>
      expect((updated.header as { name: string }).name).toBe('Jane Doe')
    })
  })
})
