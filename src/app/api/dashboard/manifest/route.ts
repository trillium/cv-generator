import * as fs from 'node:fs'
import * as path from 'node:path'
import { type NextRequest, NextResponse } from 'next/server'
import { safePiiResolve } from '@/lib/getPiiPath'
import { parseManifestFile } from '@/lib/manifest/schema'
import { yaml } from '@/lib/yamlService'

export async function GET(request: NextRequest) {
  const dirPath = request.nextUrl.searchParams.get('path')
  if (!dirPath) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 })
  }

  const resolvedDir = safePiiResolve(dirPath)
  if (!resolvedDir) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  const manifestPath = path.join(resolvedDir, 'manifest.yml')

  if (!fs.existsSync(manifestPath)) {
    return NextResponse.json({ manifest: null })
  }

  const manifest = parseManifestFile(manifestPath)
  return NextResponse.json({ manifest })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { dirPath, manifest } = body

  if (!dirPath || !manifest) {
    return NextResponse.json({ error: 'Missing dirPath or manifest' }, { status: 400 })
  }

  const resolvedDir = safePiiResolve(dirPath)
  if (!resolvedDir) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  const manifestPath = path.join(resolvedDir, 'manifest.yml')
  const dir = path.dirname(manifestPath)

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(manifestPath, yaml.dump(manifest))

  return NextResponse.json({ success: true })
}
