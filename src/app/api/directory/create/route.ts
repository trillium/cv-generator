import { type NextRequest, NextResponse } from 'next/server'
import { MultiFileManager } from '@/lib/multiFileManager'

export async function POST(request: NextRequest) {
  try {
    const { parentPath, directoryName } = await request.json()

    if (!parentPath || !directoryName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: parentPath and directoryName',
        },
        { status: 400 },
      )
    }

    const manager = new MultiFileManager()
    const result = await manager.createDirectory(parentPath, directoryName)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      path: result.path,
    })
  } catch (error) {
    console.error('[API /directory/create] Error creating directory:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create directory',
      },
      { status: 500 },
    )
  }
}
