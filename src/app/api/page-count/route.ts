import type { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const { resumePath, type, pageCount, lastPageText, lineBreaks } = await req.json()

  console.log(`📄 Page count received:`)
  console.log(`  Resume: ${resumePath}`)
  console.log(`  Type: ${type}`)
  console.log(`  Pages: ${pageCount}`)
  console.log(`  Line breaks in last page: ${lineBreaks}`)
  console.log(`  Last page text preview: ${lastPageText?.substring(0, 100)}...`)

  return Response.json({
    success: true,
    resumePath,
    type,
    pageCount,
    lastPageText,
    lineBreaks,
  })
}
