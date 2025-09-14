import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { moveFile } from './moveFile'
import { copyFile } from './copyFile'
import { deleteFile } from './deleteFile'

// Mock the utility functions
vi.mock('./copyFile')
vi.mock('./deleteFile')

const mockCopyFile = vi.mocked(copyFile)
const mockDeleteFile = vi.mocked(deleteFile)

describe('moveFile utility function', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('should move file successfully (copy then delete)', async () => {
        mockCopyFile.mockResolvedValue({
            success: true,
            sourcePath: '/base/path/source.yml',
            destinationPath: '/base/path/destination.yml',
            overwritten: false
        })

        mockDeleteFile.mockResolvedValue({
            success: true,
            filePath: '/base/path/source.yml',
            backupCreated: false
        })

        const result = await moveFile({
            sourcePath: 'source.yml',
            destinationPath: 'destination.yml',
            baseDirectory: '/base/path',
            overwrite: false
        })

        expect(result.success).toBe(true)
        expect(result.sourcePath).toBe('/base/path/source.yml')
        expect(result.destinationPath).toBe('/base/path/destination.yml')
        expect(result.overwritten).toBe(false)

        expect(mockCopyFile).toHaveBeenCalledWith({
            sourcePath: 'source.yml',
            destinationPath: 'destination.yml',
            baseDirectory: '/base/path',
            overwrite: false
        })

        expect(mockDeleteFile).toHaveBeenCalledWith({
            filePath: 'source.yml',
            baseDirectory: '/base/path',
            createBackup: false
        })
    })

    it('should fail when copy operation fails', async () => {
        mockCopyFile.mockResolvedValue({
            success: false,
            error: 'Source file does not exist',
            sourcePath: '/base/path/nonexistent.yml',
            destinationPath: '/base/path/destination.yml'
        })

        const result = await moveFile({
            sourcePath: 'nonexistent.yml',
            destinationPath: 'destination.yml',
            baseDirectory: '/base/path'
        })

        expect(result.success).toBe(false)
        expect(result.error).toBe('Copy failed: Source file does not exist')
        expect(result.sourcePath).toBe('/base/path/nonexistent.yml')
        expect(result.destinationPath).toBe('/base/path/destination.yml')

        // Should not attempt delete if copy fails
        expect(mockDeleteFile).not.toHaveBeenCalled()
    })

    it('should fail when delete operation fails after successful copy', async () => {
        mockCopyFile.mockResolvedValue({
            success: true,
            sourcePath: '/base/path/source.yml',
            destinationPath: '/base/path/destination.yml',
            overwritten: false
        })

        mockDeleteFile.mockResolvedValue({
            success: false,
            error: 'Permission denied',
            filePath: 'source.yml'
        })

        const result = await moveFile({
            sourcePath: 'source.yml',
            destinationPath: 'destination.yml',
            baseDirectory: '/base/path'
        })

        expect(result.success).toBe(false)
        expect(result.error).toBe('Delete failed: Permission denied')
        expect(result.note).toBe('File was copied successfully but original could not be deleted')
        expect(result.sourcePath).toBe('/base/path/source.yml')
        expect(result.destinationPath).toBe('/base/path/destination.yml')
    })

    it('should handle overwrite correctly', async () => {
        mockCopyFile.mockResolvedValue({
            success: true,
            sourcePath: '/base/path/source.yml',
            destinationPath: '/base/path/existing.yml',
            overwritten: true
        })

        mockDeleteFile.mockResolvedValue({
            success: true,
            filePath: '/base/path/source.yml',
            backupCreated: false
        })

        const result = await moveFile({
            sourcePath: 'source.yml',
            destinationPath: 'existing.yml',
            baseDirectory: '/base/path',
            overwrite: true
        })

        expect(result.success).toBe(true)
        expect(result.overwritten).toBe(true)

        expect(mockCopyFile).toHaveBeenCalledWith({
            sourcePath: 'source.yml',
            destinationPath: 'existing.yml',
            baseDirectory: '/base/path',
            overwrite: true
        })
    })

    it('should not create backup during delete (since file was copied)', async () => {
        mockCopyFile.mockResolvedValue({
            success: true,
            sourcePath: '/base/path/source.yml',
            destinationPath: '/base/path/destination.yml',
            overwritten: false
        })

        mockDeleteFile.mockResolvedValue({
            success: true,
            filePath: '/base/path/source.yml',
            backupCreated: false
        })

        await moveFile({
            sourcePath: 'source.yml',
            destinationPath: 'destination.yml',
            baseDirectory: '/base/path'
        })

        expect(mockDeleteFile).toHaveBeenCalledWith({
            filePath: 'source.yml',
            baseDirectory: '/base/path',
            createBackup: false // Important: no backup since we just copied
        })
    })

    it('should handle unexpected errors gracefully', async () => {
        mockCopyFile.mockRejectedValue(new Error('Unexpected filesystem error'))

        const result = await moveFile({
            sourcePath: 'source.yml',
            destinationPath: 'destination.yml',
            baseDirectory: '/base/path'
        })

        expect(result.success).toBe(false)
        expect(result.error).toBe('Unexpected filesystem error')
        expect(result.sourcePath).toBe('source.yml')
        expect(result.destinationPath).toBe('destination.yml')
    })
})
