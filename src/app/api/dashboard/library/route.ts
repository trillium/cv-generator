import { NextResponse } from 'next/server'
import { getPiiDirectory } from '@/lib/getPiiPath'
import { generateIndex } from '@/lib/manifest/libraryIndex'

export async function GET() {
  const piiPath = getPiiDirectory()
  const index = generateIndex(piiPath)
  return NextResponse.json({ library: index })
}
