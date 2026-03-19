import { ARRAY_INDEX_PATTERN } from './constants'

export function extractTopLevelKey(dataPath: string): string {
  const parts = dataPath.split(/[.[\]]+/g)
  return parts[0]
}

function resolveSourcePath(
  section: string,
  currentSources: Record<string, string | string[]>,
  yamlPath: string,
): string | null {
  const sourceFile = currentSources[section]
  if (!sourceFile) return null

  if (Array.isArray(sourceFile)) {
    const arrayIndexMatch = yamlPath.match(ARRAY_INDEX_PATTERN)
    const arrayIndex = arrayIndexMatch ? parseInt(arrayIndexMatch[1], 10) : 0
    return sourceFile[arrayIndex] || sourceFile[0]
  }

  return sourceFile
}

export function deriveDirectoryFromSources(
  section: string,
  currentSources: Record<string, string | string[]>,
  yamlPath: string,
  currentDirectory: string = '',
): string {
  const sourcePath = resolveSourcePath(section, currentSources, yamlPath)
  if (!sourcePath) return currentDirectory

  const withoutPii = sourcePath.replace(/^pii\//, '')
  const dirPath = withoutPii.substring(0, withoutPii.lastIndexOf('/'))

  return dirPath || currentDirectory
}

export function deriveSourceFile(
  section: string,
  currentSources: Record<string, string | string[]>,
  yamlPath: string,
): string | null {
  return resolveSourcePath(section, currentSources, yamlPath)
}
