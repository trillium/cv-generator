import { describe, expect, it } from 'vitest'
import { deriveDirectoryFromSources } from './pathUtils'

describe('deriveDirectoryFromSources - numbered array bug reproduction', () => {
  const mockSources = {
    workExperience: [
      'pii/resumes/this-dot-labs/work.workExperience01.yml',
      'pii/resumes/this-dot-labs/work.workExperience10.yml',
      'pii/resumes/data.yml',
    ],
    personalInfo: 'pii/resumes/this-dot-labs/info.yml',
    career: 'pii/resumes/this-dot-labs/career.yml',
  }

  it('should extract correct directory from single source', () => {
    const result = deriveDirectoryFromSources('personalInfo', mockSources, 'personalInfo.name')
    expect(result).toBe('resumes/this-dot-labs')
  })

  describe('bracket notation [n]', () => {
    it('should extract correct directory from array source at index 0', () => {
      const result = deriveDirectoryFromSources(
        'workExperience',
        mockSources,
        'workExperience[0].company',
      )
      expect(result).toBe('resumes/this-dot-labs')
    })

    it('should extract correct directory from array source at index 1', () => {
      const result = deriveDirectoryFromSources(
        'workExperience',
        mockSources,
        'workExperience[1].company',
      )
      expect(result).toBe('resumes/this-dot-labs')
    })

    it('should extract correct directory from array source at index 2', () => {
      const result = deriveDirectoryFromSources(
        'workExperience',
        mockSources,
        'workExperience[2].company',
      )
      expect(result).toBe('resumes')
    })
  })

  describe('dot notation .n.', () => {
    it('should extract correct directory from array source at index 0 (dot notation)', () => {
      const result = deriveDirectoryFromSources(
        'workExperience',
        mockSources,
        'workExperience.0.company',
      )
      expect(result).toBe('resumes/this-dot-labs')
    })

    it('should extract correct directory from array source at index 1 (dot notation)', () => {
      const result = deriveDirectoryFromSources(
        'workExperience',
        mockSources,
        'workExperience.1.company',
      )
      expect(result).toBe('resumes/this-dot-labs')
    })

    it('should extract correct directory from array source at index 2 (dot notation)', () => {
      const result = deriveDirectoryFromSources(
        'workExperience',
        mockSources,
        'workExperience.2.company',
      )
      expect(result).toBe('resumes')
    })

    it('should handle nested dot notation path', () => {
      const result = deriveDirectoryFromSources(
        'workExperience',
        mockSources,
        'workExperience.0.details.0.subhead',
      )
      expect(result).toBe('resumes/this-dot-labs')
    })
  })

  it('should fall back to index 0 when no array index in path', () => {
    const result = deriveDirectoryFromSources('workExperience', mockSources, 'workExperience')
    expect(result).toBe('resumes/this-dot-labs')
  })

  it('should fall back to currentDirectory when section not found', () => {
    const result = deriveDirectoryFromSources(
      'unknownSection',
      mockSources,
      'unknownSection.field',
      'resumes/fallback',
    )
    expect(result).toBe('resumes/fallback')
  })

  it('should handle array index out of bounds by falling back to index 0', () => {
    const result = deriveDirectoryFromSources(
      'workExperience',
      mockSources,
      'workExperience[999].company',
    )
    expect(result).toBe('resumes/this-dot-labs')
  })
})

describe('deriveDirectoryFromSources - library/manifest paths', () => {
  const librarySources = {
    workExperience: [
      'pii/library/workExperience/ts-consulting.agentic.yml',
      'pii/library/workExperience/hackforla.leadership.yml',
    ],
    header: 'pii/library/header/product-engineer.default.yml',
    coverLetter: ['pii/library/cover-letter/posthog.product.yml'],
    info: 'pii/resumes/posthog/info.yml',
  }

  it('should resolve library path for array source at index 0', () => {
    const result = deriveDirectoryFromSources(
      'workExperience',
      librarySources,
      'workExperience[0].position',
    )
    expect(result).toBe('library/workExperience')
  })

  it('should resolve library path for array source at index 1', () => {
    const result = deriveDirectoryFromSources(
      'workExperience',
      librarySources,
      'workExperience[1].position',
    )
    expect(result).toBe('library/workExperience')
  })

  it('should resolve library path for singleton source', () => {
    const result = deriveDirectoryFromSources('header', librarySources, 'header.name')
    expect(result).toBe('library/header')
  })

  it('should resolve library path for cover letter', () => {
    const result = deriveDirectoryFromSources(
      'coverLetter',
      librarySources,
      'coverLetter[0].text',
    )
    expect(result).toBe('library/cover-letter')
  })

  it('should still resolve company-local paths (info stays in resumes)', () => {
    const result = deriveDirectoryFromSources('info', librarySources, 'info.firstName')
    expect(result).toBe('resumes/posthog')
  })
})
