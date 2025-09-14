import { readFile } from 'fs/promises'
import { join } from 'path'
import yaml from 'js-yaml'

/**
 * Takes a list of files from a post, finds them all, processes the data from yml to json
 */
export async function readFiles(paths: string[], baseDirectory: string) {
    const results: { [key: string]: any } = {}

    for (const filePath of paths) {
        try {
            const fullPath = join(baseDirectory, filePath)
            const fileContent = await readFile(fullPath, 'utf-8')

            // Check if file is YAML/YML
            if (filePath.endsWith('.yml') || filePath.endsWith('.yaml')) {
                try {
                    const parsedContent = yaml.load(fileContent)
                    results[filePath] = parsedContent
                } catch (yamlError) {
                    results[filePath] = {
                        error: 'Failed to parse YAML',
                        message: yamlError instanceof Error ? yamlError.message : 'Unknown YAML error',
                        rawContent: fileContent
                    }
                }
            } else {
                // For non-YAML files, try to parse as JSON, otherwise return raw content
                try {
                    const parsedContent = JSON.parse(fileContent)
                    results[filePath] = parsedContent
                } catch {
                    results[filePath] = fileContent
                }
            }
        } catch (error) {
            results[filePath] = {
                error: 'Failed to read file',
                message: error instanceof Error ? error.message : 'Unknown error'
            }
        }
    }

    return results
}
