import { NextResponse } from 'next/server'
import { getPiiDirectory } from '@/lib/getPiiPath'
import { generateIndex } from '~/scripts/library-index'

export async function GET() {
  const piiPath = getPiiDirectory()
  const index = generateIndex(piiPath)
  return NextResponse.json({ library: index })
}
