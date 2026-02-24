// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import type { ProfileLinkProps } from '../Profile/ProfileLink/ProfileLink'
import ProjectLinks from './ProjectLinks'

// Mock the context hooks to avoid DirectoryManagerProvider requirement
vi.mock('../../contexts/DirectoryManager/DirectoryManagerContext.hook', () => ({
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

vi.mock('../../contexts/ModalContext', () => ({
  useModal: () => ({
    openModal: vi.fn(),
    closeModal: vi.fn(),
  }),
}))

vi.mock('../../hooks/useYamlPathUpdater', () => ({
  useYamlPathUpdater: () => ({
    updateYamlPath: vi.fn(),
  }),
  getNestedValue: vi.fn(() => undefined),
}))

vi.mock('../EditableField/useArrayOperations', () => ({
  useArrayOperations: () => ({
    handleAddAbove: vi.fn(),
    handleAddBelow: vi.fn(),
    handleDelete: vi.fn(),
    handleMoveUp: vi.fn(),
    handleMoveDown: vi.fn(),
  }),
}))

vi.mock('../EditableField/editableFieldUtils', () => ({
  shouldShowAddButtons: () => false,
  isFieldEmpty: () => true,
}))

describe('ProjectLinks', () => {
  describe('empty links array', () => {
    it('renders placeholder when links is empty array', () => {
      render(<ProjectLinks links={[]} projectIndex={0} />)

      expect(screen.getAllByText('Click to add projects.0.links.0.name')).toHaveLength(2)
    })

    it('renders placeholder when links is undefined', () => {
      render(<ProjectLinks links={undefined} projectIndex={0} />)

      expect(screen.getAllByText('Click to add projects.0.links.0.name')).toHaveLength(2)
    })

    it('Renders placeholder text when passed an empty array', () => {
      const links: ProfileLinkProps[] = []
      const index = 0

      render(<ProjectLinks links={Array.isArray(links) ? links : []} projectIndex={index} />)

      const placeholders = screen.getAllByText('Click to add projects.0.links.0.name')
      expect(placeholders).toHaveLength(2)
    })
  })

  describe('non-empty links array', () => {
    it('renders links when links array has items', () => {
      const mockLinks = [
        { icon: 'None', link: 'github.com/user' },
        { icon: 'None', link: 'example.com' },
      ]

      render(<ProjectLinks links={mockLinks} projectIndex={0} />)

      // Should render the links, not the placeholder
      expect(screen.queryByText('Click to add projects.0.links.0.name')).not.toBeInTheDocument()

      // Check that ProfileLink components are rendered (mock them if needed)
      // For now, just check that ul is rendered
      expect(screen.getByRole('list')).toBeInTheDocument()
    })
  })
})
