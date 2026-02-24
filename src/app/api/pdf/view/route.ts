import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const resumePath = searchParams.get('resumePath')
  const type = searchParams.get('type')

  if (!resumePath || !type) {
    return NextResponse.json({ error: 'Missing resumePath or type parameter' }, { status: 400 })
  }

  const piiPath = process.env.PII_PATH || 'pii'
  const fullPath = path.join(process.cwd(), piiPath, resumePath)

  const fileName =
    type === 'resume' ? 'Trillium_Smith_Resume.pdf' : 'Trillium_Smith_CoverLetter.pdf'
  const pdfPath = path.join(fullPath, fileName)

  if (!existsSync(pdfPath)) {
    return NextResponse.json({ error: 'PDF not found', path: pdfPath }, { status: 404 })
  }

  const pdfBuffer = readFileSync(pdfPath)

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${fileName}"`,
    },
  })
}
