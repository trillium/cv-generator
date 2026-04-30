import * as fs from 'node:fs'
import * as path from 'node:path'
import { type NextRequest, NextResponse } from 'next/server'
import { getPiiDirectory } from '@/lib/getPiiPath'
import { sectionToDirectory } from '@/lib/manifest/schema'
import type { ManifestSectionKey } from '@/lib/manifest/types'
import { ALL_MANIFEST_SECTIONS } from '@/lib/manifest/types'
import { parseYamlString } from '@/lib/yamlService'

function isValidSection(section: string): section is ManifestSectionKey {
  return ALL_MANIFEST_SECTIONS.includes(section as ManifestSectionKey)
}

export async function GET(request: NextRequest) {
  const section = request.nextUrl.searchParams.get('section')
  const ref = request.nextUrl.searchParams.get('ref')

  if (!section || !ref) {
    return NextResponse.json(
      { success: false, error: 'Missing required parameters: section, ref' },
      { status: 400 },
    )
  }

  if (!isValidSection(section)) {
    return NextResponse.json(
      { success: false, error: `Invalid section: '${section}'` },
      { status: 400 },
    )
  }

  const piiPath = getPiiDirectory()
  const directory = sectionToDirectory(section)
  const relativePath = path.join('library', directory, `${ref}.yml`)
  const fullPath = path.join(piiPath, relativePath)

  if (!fullPath.startsWith(piiPath + path.sep)) {
    return NextResponse.json({ success: false, error: 'Invalid path' }, { status: 400 })
  }

  if (!fs.existsSync(fullPath)) {
    return NextResponse.json(
      { success: false, error: `Library item not found: ${relativePath}` },
      { status: 404 },
    )
  }

  try {
    const raw = fs.readFileSync(fullPath, 'utf-8')
    const content = parseYamlString(raw)

    return NextResponse.json({
      success: true,
      content,
      filePath: relativePath,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse library item',
      },
      { status: 500 },
    )
  }
}
