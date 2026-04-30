import { type NextRequest, NextResponse } from 'next/server'
import { loadDirectory } from '@/lib/multiFileManager/loadDirectory'

type PathEntry = {
  yamlPath: string
  sourceFile: string
  preview: string
}

function truncate(text: string, maxLength = 80): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

function resolveSourceFile(
  topLevelKey: string,
  sources: Record<string, string | string[]>,
  arrayIndex?: number,
): string {
  const source = sources[topLevelKey]
  if (!source) return 'unknown'
  if (Array.isArray(source)) {
    if (arrayIndex !== undefined && arrayIndex < source.length) {
      return source[arrayIndex]
    }
    return source[0]
  }
  return source
}

function walkValue(
  value: unknown,
  currentPath: string,
  topLevelKey: string,
  sources: Record<string, string | string[]>,
  results: PathEntry[],
  topLevelArrayIndex?: number,
): void {
  if (value === null || value === undefined) return

  if (typeof value === 'string') {
    results.push({
      yamlPath: currentPath,
      sourceFile: resolveSourceFile(topLevelKey, sources, topLevelArrayIndex),
      preview: truncate(value),
    })
    return
  }

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      walkValue(value[i], `${currentPath}[${i}]`, topLevelKey, sources, results, topLevelArrayIndex)
    }
    return
  }

  if (typeof value === 'object') {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (key === 'notes') continue
      const childPath = currentPath ? `${currentPath}.${key}` : key
      walkValue(child, childPath, topLevelKey, sources, results, topLevelArrayIndex)
    }
  }
}

function extractPaths(
  data: Record<string, unknown>,
  sources: Record<string, string | string[]>,
): PathEntry[] {
  const results: PathEntry[] = []
  const skipSections = new Set(['notes', 'llm', 'metadata', 'linkedIn'])

  for (const [sectionKey, sectionValue] of Object.entries(data)) {
    if (skipSections.has(sectionKey)) continue
    if (sectionValue === null || sectionValue === undefined) continue

    if (Array.isArray(sectionValue)) {
      for (let i = 0; i < sectionValue.length; i++) {
        walkValue(sectionValue[i], `${sectionKey}[${i}]`, sectionKey, sources, results, i)
      }
    } else {
      walkValue(sectionValue, sectionKey, sectionKey, sources, results)
    }
  }

  return results
}

export async function GET(request: NextRequest) {
  try {
    const dirPath = request.nextUrl.searchParams.get('path')

    if (!dirPath) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: path' },
        { status: 400 },
      )
    }

    const result = await loadDirectory(dirPath)
    const paths = extractPaths(result.data as Record<string, unknown>, result.sources)

    return NextResponse.json({ success: true, paths })
  } catch (error) {
    console.error('[API /directory/paths GET] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate paths',
      },
      { status: 500 },
    )
  }
}
