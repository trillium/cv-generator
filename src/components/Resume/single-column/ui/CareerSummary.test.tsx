// @vitest-environment jsdom
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import type { CVData } from '@/types'
import CareerSummary from './CareerSummary'

// Mock context hooks used by EditableField
vi.mock('../../../../contexts/DirectoryManager/DirectoryManagerContext.hook', () => ({
  useDirectoryManager: () => ({
    parsedData: {},
    error: null,
    content: '',
    currentFile: null,
    files: [],
    loading: false,
    loadDirectory: vi.fn(),
  }),
}))

vi.mock('../../../../contexts/ModalContext', () => ({
  useModal: () => ({
    openModal: vi.fn(),
    closeModal: vi.fn(),
  }),
}))

vi.mock('../../../../hooks/useYamlPathUpdater', () => ({
  useYamlPathUpdater: () => ({
    updateYamlPath: vi.fn(),
  }),
  getNestedValue: vi.fn(() => undefined),
}))

vi.mock('../../../EditableField/useArrayOperations', () => ({
  useArrayOperations: () => ({
    handleAddAbove: vi.fn(),
    handleAddBelow: vi.fn(),
    handleDelete: vi.fn(),
    handleMoveUp: vi.fn(),
    handleMoveDown: vi.fn(),
  }),
}))

vi.mock('../../../EditableField/editableFieldUtils', () => ({
  shouldShowAddButtons: () => false,
  isFieldEmpty: () => true,
}))

function makeData(layoutOverride?: CVData['layout']): CVData {
  return {
    careerSummary: [
      { title: 'Experience', text: 'Full-stack engineer shipping AI-first products' },
      { title: 'Skills', text: 'React, TypeScript, Node.js' },
    ],
    layout: layoutOverride,
  } as CVData
}

describe('CareerSummary', () => {
  // The grid has label divs (odd) and value divs (even) as direct children of the grid
  // Value divs have the margin-left style applied
  function getValueDivs(container: HTMLElement) {
    const grid = container.querySelector('.grid') as HTMLElement
    // Value divs are the even children (2nd, 4th, ...) within each Fragment
    return Array.from(grid.children).filter((_, i) => i % 2 === 1) as HTMLElement[]
  }

  it('uses default 8px margin-left when no layout config', () => {
    const { container } = render(<CareerSummary data={makeData()} />)
    const valueDivs = getValueDivs(container)
    expect(valueDivs.length).toBeGreaterThan(0)
    expect(valueDivs[0].style.marginLeft).toBe('8px')
  })

  it('applies custom careerSummary gapX from layout config', () => {
    const { container } = render(
      <CareerSummary data={makeData({ spacing: { careerSummary: { gapX: 2 } } })} />,
    )
    const valueDivs = getValueDivs(container)
    expect(valueDivs[0].style.marginLeft).toBe('2px')
  })

  // jsdom strips negative margin-left values entirely, so we can't assert
  // on them in this environment. Negative values are verified working in-browser.

  it('changes margin when value changes to a different positive value', () => {
    const { container, rerender } = render(
      <CareerSummary data={makeData({ spacing: { careerSummary: { gapX: 20 } } })} />,
    )
    expect(getValueDivs(container)[0].style.marginLeft).toBe('20px')

    rerender(<CareerSummary data={makeData({ spacing: { careerSummary: { gapX: 4 } } })} />)
    expect(getValueDivs(container)[0].style.marginLeft).toBe('4px')
  })

  it('supports zero gap', () => {
    const { container } = render(
      <CareerSummary data={makeData({ spacing: { careerSummary: { gapX: 0 } } })} />,
    )
    expect(getValueDivs(container)[0].style.marginLeft).toBe('0px')
  })
})
