import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdir, writeFile as fsWriteFile, rm, access } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { deleteFile } from './deleteFile'

// Test with temporary directories
describe('deleteFile utility function', () => {
    let testDir: string

    beforeAll(async () => {
        // Create temporary test directory
        testDir = join(tmpdir(), 'cv-generator-deletefile-test-' + Date.now())
        await mkdir(testDir, { recursive: true })

        // Create test files
        await fsWriteFile(join(testDir, 'delete-me.yml'), 'name: Test\ndata: value')
        await fsWriteFile(join(testDir, 'backup-me.yml'), 'name: Backup\ndata: important')
    })

    afterAll(async () => {
        // Clean up test directory
        try {
            await rm(testDir, { recursive: true })
        } catch (error) {
            // Ignore cleanup errors
        }
    })

    it('should delete file successfully', async () => {
        const result = await deleteFile({
            filePath: 'delete-me.yml',
            baseDirectory: testDir,
            createBackup: false
        })

        expect(result.success).toBe(true)
        expect(result.filePath).toBe(join(testDir, 'delete-me.yml'))
        expect(result.backupCreated).toBe(false)

        // Verify file was deleted
        await expect(access(join(testDir, 'delete-me.yml'))).rejects.toThrow()
    })

    it('should create backup when requested', async () => {
        const result = await deleteFile({
            filePath: 'backup-me.yml',
            baseDirectory: testDir,
            createBackup: true
        })

        expect(result.success).toBe(true)
        expect(result.backupCreated).toBe(true)

        // Verify original file was deleted
        await expect(access(join(testDir, 'backup-me.yml'))).rejects.toThrow()

        // Verify backup directory was created
        const diffsDir = join(testDir, 'diffs')
        await expect(access(diffsDir)).resolves.not.toThrow()
    })

    it('should return error for non-existent file', async () => {
        const result = await deleteFile({
            filePath: 'absolutely-does-not-exist-12345.yml',
            baseDirectory: testDir,
            createBackup: false
        })

        expect(result.success).toBe(false)
        expect(result.error).toBe('File does not exist')
    })

    it('should handle invalid base directory', async () => {
        const result = await deleteFile({
            filePath: 'test.yml',
            baseDirectory: '/completely/invalid/path/that/does/not/exist',
            createBackup: false
        })

        expect(result.success).toBe(false)
        expect(typeof result.error).toBe('string')
    })

    it('should validate options parameter structure', async () => {
        const result = await deleteFile({
            filePath: 'non-existent-file.yml', // Use a filename instead of empty string
            baseDirectory: testDir
        })

        expect(result.success).toBe(false)
        expect(result.error).toBe('File does not exist')
    })
})
