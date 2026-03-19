import { ARRAY_INDEX_PATTERN } from './constants'

export function extractTopLevelKey(dataPath: string): string {
  const parts = dataPath.split(/[.[\]]+/g)
  return parts[0]
}

export function deriveDirectoryFromSources(
  section: string,
  currentSources: Record<string, string | string[]>,
  yamlPath: string,
  currentDirectory: string = '',
): string {
  const sourceFile = currentSources[section]
  if (!sourceFile) {
    return currentDirectory
  }

  let sourcePath: string
  if (Array.isArray(sourceFile)) {
    const arrayIndexMatch = yamlPath.match(ARRAY_INDEX_PATTERN)
    const arrayIndex = arrayIndexMatch ? parseInt(arrayIndexMatch[1], 10) : 0
    sourcePath = sourceFile[arrayIndex] || sourceFile[0]
  } else {
    sourcePath = sourceFile
  }

  const withoutPii = sourcePath.replace(/^pii\//, '')
  const dirPath = withoutPii.substring(0, withoutPii.lastIndexOf('/'))

  return dirPath || currentDirectory
}
