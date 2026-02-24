import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { detectPageOverflow } from './overflowDetection'

describe('overflowDetection - line-based matching', () => {
  describe('basic line matching', () => {
    it('returns false when lastPageLines is undefined', () => {
      const result = detectPageOverflow('Some content', undefined)
      expect(result.shouldHighlight).toBe(false)
      expect(result.matchPercentage).toBe(0)
      expect(result.isFirstOverflow).toBe(false)
    })

    it('returns false when lastPageLines is empty array', () => {
      const result = detectPageOverflow('Some content', [])
      expect(result.shouldHighlight).toBe(false)
      expect(result.matchPercentage).toBe(0)
      expect(result.isFirstOverflow).toBe(false)
    })

    it('returns false when field content is empty', () => {
      const result = detectPageOverflow('', ['Last page line'])
      expect(result.shouldHighlight).toBe(false)
      expect(result.matchPercentage).toBe(0)
      expect(result.isFirstOverflow).toBe(false)
    })

    it('highlights when field text exactly matches a line', () => {
      const fieldContent = 'Projects'
      const lastPageLines = ['Resolved critical access issues', 'Projects', 'Flossy Live Site']
      const result = detectPageOverflow(fieldContent, lastPageLines)
      expect(result.shouldHighlight).toBe(true)
      expect(result.matchPercentage).toBe(1)
    })

    it('highlights when field text is contained in a line', () => {
      const fieldContent = 'Flossy'
      const lastPageLines = ['Projects', 'Flossy Live Site', 'Translated client vision']
      const result = detectPageOverflow(fieldContent, lastPageLines)
      expect(result.shouldHighlight).toBe(true)
      expect(result.matchPercentage).toBe(1)
    })

    it('does not highlight when field text not in any line', () => {
      const fieldContent = 'Work Experience'
      const lastPageLines = ['Projects', 'Flossy Live Site', 'Education']
      const result = detectPageOverflow(fieldContent, lastPageLines)
      expect(result.shouldHighlight).toBe(false)
      expect(result.matchPercentage).toBe(0)
    })
  })

  describe('case insensitive matching', () => {
    it('matches regardless of case', () => {
      const fieldContent = 'PROJECTS'
      const lastPageLines = ['projects', 'Flossy']
      const result = detectPageOverflow(fieldContent, lastPageLines)
      expect(result.shouldHighlight).toBe(true)
    })

    it('matches mixed case', () => {
      const fieldContent = 'FLosSy LiVe SiTe'
      const lastPageLines = ['flossy live site']
      const result = detectPageOverflow(fieldContent, lastPageLines)
      expect(result.shouldHighlight).toBe(true)
    })
  })

  describe('whitespace normalization', () => {
    it('normalizes multiple spaces', () => {
      const fieldContent = 'Flossy   Live   Site'
      const lastPageLines = ['Flossy Live Site']
      const result = detectPageOverflow(fieldContent, lastPageLines)
      expect(result.shouldHighlight).toBe(true)
    })

    it('trims leading and trailing whitespace', () => {
      const fieldContent = '  Projects  '
      const lastPageLines = ['Projects']
      const result = detectPageOverflow(fieldContent, lastPageLines)
      expect(result.shouldHighlight).toBe(true)
    })

    it('handles newlines in field content', () => {
      const fieldContent = 'Flossy\nLive\nSite'
      const lastPageLines = ['Flossy Live Site']
      const result = detectPageOverflow(fieldContent, lastPageLines)
      expect(result.shouldHighlight).toBe(true)
    })
  })

  describe('partial matching behavior', () => {
    it('highlights when line contains field text', () => {
      const fieldContent = 'Flossy'
      const lastPageLines = ['Flossy Live Site - A portfolio project']
      const result = detectPageOverflow(fieldContent, lastPageLines)
      expect(result.shouldHighlight).toBe(true)
      expect(result.matchPercentage).toBe(1)
    })

    it('highlights when field contains line (if line > 20 chars)', () => {
      const fieldContent = 'Flossy Live Site - A portfolio project with details'
      const lastPageLines = ['Flossy Live Site - A portfolio project']
      const result = detectPageOverflow(fieldContent, lastPageLines)
      expect(result.shouldHighlight).toBe(true)
      expect(result.matchPercentage).toBe(0.9)
    })

    it('does not highlight when field contains short line (<= 20 chars)', () => {
      const fieldContent = 'Flossy Live Site projects work'
      const lastPageLines = ['Flossy']
      const result = detectPageOverflow(fieldContent, lastPageLines)
      expect(result.shouldHighlight).toBe(false)
    })
  })

  describe('React node text extraction', () => {
    it('extracts text from simple React element', () => {
      const element = createElement('span', null, 'Projects')
      const lastPageLines = ['Projects']
      const result = detectPageOverflow(element, lastPageLines)
      expect(result.shouldHighlight).toBe(true)
    })

    it('extracts text from nested React elements', () => {
      const element = createElement(
        'div',
        null,
        createElement('span', null, 'Flossy'),
        ' ',
        createElement('span', null, 'Live'),
        ' Site',
      )
      const lastPageLines = ['Flossy Live Site']
      const result = detectPageOverflow(element, lastPageLines)
      expect(result.shouldHighlight).toBe(true)
    })

    it('extracts text from deeply nested elements', () => {
      const element = createElement(
        'div',
        null,
        createElement('p', null, createElement('strong', null, 'Projects')),
      )
      const lastPageLines = ['Projects', 'Education']
      const result = detectPageOverflow(element, lastPageLines)
      expect(result.shouldHighlight).toBe(true)
    })

    it('handles element with no children', () => {
      const element = createElement('div', null)
      const lastPageLines = ['Some text']
      const result = detectPageOverflow(element, lastPageLines)
      expect(result.shouldHighlight).toBe(false)
    })
  })

  describe('array children', () => {
    it('extracts text from array of strings', () => {
      const content = ['Projects', 'Section']
      const lastPageLines = ['Projects Section']
      const result = detectPageOverflow(content, lastPageLines)
      expect(result.shouldHighlight).toBe(true)
    })

    it('extracts text from array of React elements', () => {
      const content = [
        createElement('span', { key: 1 }, 'Flossy'),
        createElement('span', { key: 2 }, 'Live'),
      ]
      const lastPageLines = ['Flossy Live']
      const result = detectPageOverflow(content, lastPageLines)
      expect(result.shouldHighlight).toBe(true)
    })

    it('handles empty array', () => {
      const content: string[] = []
      const lastPageLines = ['Some text']
      const result = detectPageOverflow(content, lastPageLines)
      expect(result.shouldHighlight).toBe(false)
    })
  })

  describe('real-world resume scenarios', () => {
    const lastPageLines = [
      "Resolved critical access issues for a men's coaching platform serving 2,000+ users",
      'Projects',
      'Flossy Live Site',
      'Translated client vision into a fully responsive, production-ready website',
      'Massage Therapy Booking Application GitHub · Live Site',
      'Built a serverless booking app with Next.js, Tailwind, TypeScript',
      'Talon Voice Hands-Free Accessibility Suite',
      'github.com/trillium linkedin.com/in/trilliumsmith/',
    ]

    it('detects project title on page 2', () => {
      const result = detectPageOverflow('Flossy', lastPageLines)
      expect(result.shouldHighlight).toBe(true)
    })

    it('detects section header on page 2', () => {
      const result = detectPageOverflow('Projects', lastPageLines)
      expect(result.shouldHighlight).toBe(true)
    })

    it('detects project description on page 2', () => {
      const result = detectPageOverflow(
        'Translated client vision into a fully responsive, production-ready website',
        lastPageLines,
      )
      expect(result.shouldHighlight).toBe(true)
    })

    it('does not highlight content only on page 1', () => {
      const result = detectPageOverflow('Software Engineer at Google', lastPageLines)
      expect(result.shouldHighlight).toBe(false)
    })

    it('detects footer links on page 2', () => {
      const result = detectPageOverflow('github.com/trillium', lastPageLines)
      expect(result.shouldHighlight).toBe(true)
    })

    it('detects partial project description', () => {
      const result = detectPageOverflow('serverless booking app', lastPageLines)
      expect(result.shouldHighlight).toBe(true)
    })
  })

  describe('multi-line matching', () => {
    it('matches first line when field appears on multiple lines', () => {
      const lastPageLines = ['Projects heading', 'Flossy Live Site', 'Another project']
      const result = detectPageOverflow('Projects', lastPageLines)
      expect(result.shouldHighlight).toBe(true)
    })

    it('matches any line in array', () => {
      const lastPageLines = ['Line 1', 'Line 2', 'Line 3 contains Flossy', 'Line 4']
      const result = detectPageOverflow('Flossy', lastPageLines)
      expect(result.shouldHighlight).toBe(true)
    })

    it('returns false if no lines match', () => {
      const lastPageLines = ['Line 1', 'Line 2', 'Line 3']
      const result = detectPageOverflow('NotPresent', lastPageLines)
      expect(result.shouldHighlight).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('handles numbers in content', () => {
      const content = 2024
      const lastPageLines = ['Copyright 2024']
      const result = detectPageOverflow(content, lastPageLines)
      expect(result.shouldHighlight).toBe(true)
    })

    it('handles special characters', () => {
      const result = detectPageOverflow('C++ & Node.js', ['C++ & Node.js developer'])
      expect(result.shouldHighlight).toBe(true)
    })

    it('handles very long lines', () => {
      const longLine = 'word '.repeat(100).trim()
      const lastPageLines = [longLine]
      const result = detectPageOverflow('word', lastPageLines)
      expect(result.shouldHighlight).toBe(true)
    })

    it('handles null-like values in React children', () => {
      const element = createElement('div', null, null)
      const lastPageLines = ['Some text']
      const result = detectPageOverflow(element, lastPageLines)
      expect(result.shouldHighlight).toBe(false)
    })

    it('handles boolean children', () => {
      const element = createElement('div', null, false, true)
      const lastPageLines = ['Some text']
      const result = detectPageOverflow(element, lastPageLines)
      expect(result.shouldHighlight).toBe(false)
    })

    it('handles single character matches', () => {
      const result = detectPageOverflow('a', ['a b c'])
      expect(result.shouldHighlight).toBe(true)
    })

    it('handles exact line match at start of array', () => {
      const lastPageLines = ['Exact match', 'Other line']
      const result = detectPageOverflow('Exact match', lastPageLines)
      expect(result.shouldHighlight).toBe(true)
      expect(result.matchPercentage).toBe(1)
    })

    it('handles exact line match at end of array', () => {
      const lastPageLines = ['First line', 'Exact match']
      const result = detectPageOverflow('Exact match', lastPageLines)
      expect(result.shouldHighlight).toBe(true)
      expect(result.matchPercentage).toBe(1)
    })
  })

  describe('complex React structures', () => {
    it('extracts text from complex nested structure', () => {
      const element = createElement(
        'div',
        null,
        createElement('h2', null, 'Projects'),
        createElement(
          'ul',
          null,
          createElement('li', { key: 1 }, 'Flossy Live Site'),
          createElement('li', { key: 2 }, 'Booking App'),
        ),
      )
      const lastPageLines = ['Projects Flossy Live Site Booking App']
      const result = detectPageOverflow(element, lastPageLines)
      expect(result.shouldHighlight).toBe(true)
    })

    it('handles fragments-like structures', () => {
      const element = createElement(
        'div',
        null,
        'First ',
        createElement('span', null, 'second'),
        ' third',
      )
      const lastPageLines = ['First second third']
      const result = detectPageOverflow(element, lastPageLines)
      expect(result.shouldHighlight).toBe(true)
    })
  })

  describe('matchPercentage return values', () => {
    it('returns 100% match when line contains field', () => {
      const result = detectPageOverflow('Flossy', ['Flossy Live Site'])
      expect(result.matchPercentage).toBe(1)
      expect(result.shouldHighlight).toBe(true)
    })

    it('returns 90% match when field contains line (>20 chars)', () => {
      const result = detectPageOverflow('Flossy Live Site Extended Description', [
        'Flossy Live Site Extended',
      ])
      expect(result.matchPercentage).toBe(0.9)
      expect(result.shouldHighlight).toBe(true)
    })

    it('returns 0% match when no match found', () => {
      const result = detectPageOverflow('NoMatch', ['Different text'])
      expect(result.matchPercentage).toBe(0)
      expect(result.shouldHighlight).toBe(false)
    })
  })

  describe('isFirstOverflow detection', () => {
    it('marks first line match as first overflow', () => {
      const lastPageLines = ['Projects', 'Flossy', 'Education']
      const result = detectPageOverflow('Projects', lastPageLines)
      expect(result.isFirstOverflow).toBe(true)
      expect(result.shouldHighlight).toBe(true)
    })

    it('does not mark second line match as first overflow', () => {
      const lastPageLines = ['Projects', 'Flossy', 'Education']
      const result = detectPageOverflow('Flossy', lastPageLines)
      expect(result.isFirstOverflow).toBe(false)
      expect(result.shouldHighlight).toBe(true)
    })

    it('does not mark third line match as first overflow', () => {
      const lastPageLines = ['Projects', 'Flossy', 'Education']
      const result = detectPageOverflow('Education', lastPageLines)
      expect(result.isFirstOverflow).toBe(false)
      expect(result.shouldHighlight).toBe(true)
    })

    it('marks first line partial match as first overflow', () => {
      const lastPageLines = ['Resolved critical access issues', 'Projects', 'Flossy']
      const result = detectPageOverflow('critical', lastPageLines)
      expect(result.isFirstOverflow).toBe(true)
      expect(result.shouldHighlight).toBe(true)
    })

    it('returns false for isFirstOverflow when no match', () => {
      const lastPageLines = ['Projects', 'Flossy']
      const result = detectPageOverflow('NotFound', lastPageLines)
      expect(result.isFirstOverflow).toBe(false)
      expect(result.shouldHighlight).toBe(false)
    })
  })
})
