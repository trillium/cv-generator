import { type NextRequest, NextResponse } from 'next/server'
import { MultiFileManager } from '@/lib/multiFileManager'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dirPath = searchParams.get('path')

    if (!dirPath) {
      return NextResponse.json(
        { success: false, error: 'Directory path is required' },
        { status: 400 },
      )
    }

    const manager = new MultiFileManager()
    const result = await manager.loadDirectory(dirPath)

    const hasErrors = result.validationErrors && result.validationErrors.length > 0

    return NextResponse.json({
      success: true,
      hasErrors,
      errorCount: result.validationErrors?.length || 0,
      errors: result.validationErrors || [],
      directoryPath: dirPath,
      metadata: {
        filesLoaded: result.metadata.filesLoaded,
        loadedDirectories: result.metadata.loadedDirectories,
      },
    })
  } catch (error) {
    console.error('[API /directory/validate GET] Error validating directory:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate directory',
      },
      { status: 500 },
    )
  }
}
