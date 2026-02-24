import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/multiFileManager', () => ({
  MultiFileManager: vi.fn().mockImplementation(() => ({
    updatePath: vi.fn().mockResolvedValue({
      success: true,
      updatedFile: 'info.yml',
    }),
  })),
}))

vi.mock('@/lib/pdfSectionMapper', () => ({
  getPdfsToRegenerate: vi.fn().mockReturnValue(['resume', 'cover']),
}))

const mockRebuildPdfs = vi.fn().mockResolvedValue({
  jobId: 'test-job-id',
  status: 'processing',
  message: 'PDF generation started',
  pdfsToRegenerate: ['resume', 'cover'],
})

vi.mock('@/lib/pdfRebuilder', () => ({
  rebuildPdfs: (...args: unknown[]) => mockRebuildPdfs(...args),
}))

import { POST } from './route'

describe('POST /api/directory/update', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should trigger PDF generation in the directory containing the edited file', async () => {
    const request = new NextRequest('http://localhost:3000/api/directory/update', {
      method: 'POST',
      body: JSON.stringify({
        directoryPath: 'resumes/facebook',
        yamlPath: 'info.firstName',
        value: 'Jane',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(mockRebuildPdfs).toHaveBeenCalledWith('resumes/facebook', ['resume', 'cover'])
  })

  it('should trigger PDF generation in base directory when base file is edited', async () => {
    const request = new NextRequest('http://localhost:3000/api/directory/update', {
      method: 'POST',
      body: JSON.stringify({
        directoryPath: 'resumes',
        yamlPath: 'info.lastName',
        value: 'Williams',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(mockRebuildPdfs).toHaveBeenCalledWith('resumes', ['resume', 'cover'])
  })
})
