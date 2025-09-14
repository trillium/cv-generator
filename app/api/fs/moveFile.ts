import { copyFile } from './copyFile'
import { deleteFile } from './deleteFile'

interface MoveFileOptions {
    sourcePath: string
    destinationPath: string
    baseDirectory?: string
    overwrite?: boolean
}

export async function moveFile(options: MoveFileOptions) {
    const { sourcePath, destinationPath, baseDirectory, overwrite = false } = options

    try {
        // First, copy the file
        const copyResult = await copyFile({
            sourcePath,
            destinationPath,
            baseDirectory,
            overwrite
        })

        if (!copyResult.success) {
            return {
                success: false,
                error: `Copy failed: ${copyResult.error}`,
                sourcePath: copyResult.sourcePath,
                destinationPath: copyResult.destinationPath
            }
        }

        // Then, delete the original (without backup since we just copied it)
        const deleteResult = await deleteFile({
            filePath: sourcePath,
            baseDirectory,
            createBackup: false
        })

        if (!deleteResult.success) {
            return {
                success: false,
                error: `Delete failed: ${deleteResult.error}`,
                sourcePath: copyResult.sourcePath,
                destinationPath: copyResult.destinationPath,
                note: 'File was copied successfully but original could not be deleted'
            }
        }

        return {
            success: true,
            sourcePath: copyResult.sourcePath,
            destinationPath: copyResult.destinationPath,
            overwritten: copyResult.overwritten
        }

    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            sourcePath: options.sourcePath,
            destinationPath: options.destinationPath
        }
    }
}
