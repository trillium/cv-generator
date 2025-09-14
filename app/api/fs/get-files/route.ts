import { NextRequest, NextResponse } from 'next/server'
import { readFiles } from './readFiles'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { files, directory } = body

        if (!files || !Array.isArray(files)) {
            return NextResponse.json(
                { success: false, error: 'Files array is required' },
                { status: 400 }
            )
        }

        const baseDirectory = directory || process.env.PII_PATH || '.'
        console.log("[get-files] Reading files from:", baseDirectory)
        console.log("[get-files] Files to read:", files)

        const fileContents = await readFiles(files, baseDirectory)

        return NextResponse.json({
            success: true,
            directory: baseDirectory,
            files: fileContents,
            totalFiles: Object.keys(fileContents).length
        })
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}