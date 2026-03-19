import { describe, expect, it } from 'vitest'
import { parseLibraryFilename, sectionToDirectory, validateManifest } from './schema'

describe('parseLibraryFilename', () => {
  it('parses item.scope', () => {
    expect(parseLibraryFilename('ts-consulting.agentic')).toEqual({
      item: 'ts-consulting',
      scope: 'agentic',
      variant: undefined,
    })
  })

  it('parses item.scope-variant', () => {
    expect(parseLibraryFilename('ts-consulting.agentic-codeRabbit')).toEqual({
      item: 'ts-consulting',
      scope: 'agentic',
      variant: 'codeRabbit',
    })
  })

  it('parses single-word item and scope', () => {
    expect(parseLibraryFilename('hackforla.leadership')).toEqual({
      item: 'hackforla',
      scope: 'leadership',
      variant: undefined,
    })
  })

  it('returns null for invalid formats', () => {
    expect(parseLibraryFilename('no-scope')).toBeNull()
    expect(parseLibraryFilename('')).toBeNull()
    expect(parseLibraryFilename('has.too.many.dots')).toBeNull()
  })

  it('returns null for refs with uppercase items', () => {
    expect(parseLibraryFilename('TsConsulting.agentic')).toBeNull()
  })
})

describe('sectionToDirectory', () => {
  it('maps camelCase sections to directory names', () => {
    expect(sectionToDirectory('workExperience')).toBe('workExperience')
    expect(sectionToDirectory('careerSummary')).toBe('career-summary')
    expect(sectionToDirectory('coverLetter')).toBe('cover-letter')
    expect(sectionToDirectory('header')).toBe('header')
  })
})

describe('validateManifest', () => {
  it('validates a well-formed manifest', () => {
    const raw = {
      header: 'product-engineer.default',
      careerSummary: ['product-eng.agentic'],
      workExperience: ['ts-consulting.agentic', 'hackforla.leadership'],
      projects: ['booking-saas.serverless'],
      technical: ['frontend.react'],
    }
    const result = validateManifest(raw)
    expect(result.header).toBe('product-engineer.default')
    expect(result.workExperience).toHaveLength(2)
  })

  it('rejects unknown sections', () => {
    expect(() => validateManifest({ banana: 'fruit.yellow' })).toThrow('Unknown manifest section')
  })

  it('rejects singleton sections with arrays', () => {
    expect(() => validateManifest({ header: ['product-engineer.default'] })).toThrow(
      'must be a single ref string',
    )
  })

  it('rejects array sections with strings', () => {
    expect(() => validateManifest({ workExperience: 'ts-consulting.agentic' })).toThrow(
      'must be an array',
    )
  })

  it('rejects invalid ref formats', () => {
    expect(() => validateManifest({ header: 'no-scope-here' })).toThrow('Invalid ref format')
  })

  it('rejects invalid refs inside arrays', () => {
    expect(() => validateManifest({ projects: ['valid.ref', 'NOPE'] })).toThrow(
      'Invalid ref format',
    )
  })

  it('accepts empty manifest', () => {
    const result = validateManifest({})
    expect(result).toEqual({})
  })
})
