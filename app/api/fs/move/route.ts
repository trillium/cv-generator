import { NextRequest, NextResponse } from 'next/server'
import { moveFile } from '../moveFile'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { sourcePath, destinationPath, directory, overwrite = false } = body

        if (!sourcePath || !destinationPath) {
            return NextResponse.json(
                { success: false, error: 'sourcePath and destinationPath are required' },
                { status: 400 }
            )
        }

        console.log("[MOVE] Moving file from:", sourcePath, "to:", destinationPath)
        console.log("[MOVE] In directory:", directory || process.env.PII_PATH)

        const result = await moveFile({
            sourcePath,
            destinationPath,
            baseDirectory: directory,
            overwrite
        })

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: 'File moved successfully',
                sourcePath: result.sourcePath,
                destinationPath: result.destinationPath,
                overwritten: result.overwritten
            })
        } else {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            )
        }
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
