import { NextRequest, NextResponse } from 'next/server'
import { writeYamlFile } from '../writeFile'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { yamlContent, filePath, directory, createDiff = true } = body

        if (!yamlContent || !filePath) {
            return NextResponse.json(
                { success: false, error: 'YAML content and filePath are required' },
                { status: 400 }
            )
        }

        console.log("[POST] Writing YAML file:", filePath)
        console.log("[POST] To directory:", directory || process.env.PII_PATH)
        console.log("[POST] YAML content length:", yamlContent.length)

        const result = await writeYamlFile(yamlContent, {
            filePath,
            baseDirectory: directory,
            createDiff
        })

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: 'YAML file written successfully',
                filePath: result.filePath,
                fileExisted: result.fileExisted,
                diffCreated: result.diffCreated
            })
        } else {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 500 }
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
