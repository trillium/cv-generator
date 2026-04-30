import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { safePiiResolve } from './getPiiPath'

vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn(() => true),
  },
}))

describe('safePiiResolve', () => {
  const originalEnv = process.env.PII_PATH

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.PII_PATH
    } else {
      process.env.PII_PATH = originalEnv
    }
  })

  describe('with relative PII_PATH', () => {
    beforeEach(() => {
      process.env.PII_PATH = 'pii'
    })

    it('resolves subpaths correctly', () => {
      const result = safePiiResolve('data.yml')
      const expected = path.resolve('pii', 'data.yml')
      expect(result).toBe(expected)
    })

    it('resolves nested subpaths', () => {
      const result = safePiiResolve('resumes/posthog/manifest.yml')
      const expected = path.resolve('pii', 'resumes/posthog/manifest.yml')
      expect(result).toBe(expected)
    })
  })

  describe('with absolute PII_PATH', () => {
    beforeEach(() => {
      process.env.PII_PATH = '/home/user/pii'
    })

    it('resolves subpaths correctly', () => {
      const result = safePiiResolve('data.yml')
      expect(result).toBe('/home/user/pii/data.yml')
    })

    it('resolves nested subpaths', () => {
      const result = safePiiResolve('resumes/posthog/manifest.yml')
      expect(result).toBe('/home/user/pii/resumes/posthog/manifest.yml')
    })
  })

  describe('path traversal prevention', () => {
    beforeEach(() => {
      process.env.PII_PATH = '/home/user/pii'
    })

    it('rejects traversal with ../../etc/passwd', () => {
      const result = safePiiResolve('../../etc/passwd')
      expect(result).toBeNull()
    })

    it('rejects traversal with ../sibling', () => {
      const result = safePiiResolve('../sibling')
      expect(result).toBeNull()
    })

    it('rejects absolute path outside pii directory', () => {
      const result = safePiiResolve('/etc/passwd')
      expect(result).toBeNull()
    })

    it('allows the pii directory itself', () => {
      process.env.PII_PATH = '/home/user/pii'
      const result = safePiiResolve('.')
      expect(result).toBe('/home/user/pii')
    })
  })

  describe('path traversal with relative PII_PATH', () => {
    beforeEach(() => {
      process.env.PII_PATH = 'pii'
    })

    it('rejects traversal attempts', () => {
      const result = safePiiResolve('../../etc/passwd')
      expect(result).toBeNull()
    })
  })
})
