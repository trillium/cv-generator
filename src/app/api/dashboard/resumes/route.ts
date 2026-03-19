import * as fs from 'node:fs'
import * as path from 'node:path'
import { NextResponse } from 'next/server'
import { getPiiDirectory } from '@/lib/getPiiPath'
import { hasManifest } from '@/lib/manifest/schema'

export type ResumeTarget = {
  name: string
  path: string
  hasManifest: boolean
  sectionCount: number
}

export async function GET() {
  const piiPath = getPiiDirectory()
  const resumesPath = path.join(piiPath, 'resumes')

  if (!fs.existsSync(resumesPath)) {
    return NextResponse.json({ resumes: [] })
  }

  const dirs = fs
    .readdirSync(resumesPath, { withFileTypes: true })
    .filter((e) => e.isDirectory())

  const resumes: ResumeTarget[] = dirs.map((dir) => {
    const dirPath = `resumes/${dir.name}`
    const manifest = hasManifest(dirPath)

    let sectionCount = 0
    if (manifest) {
      const manifestPath = path.join(piiPath, dirPath, 'manifest.yml')
      const content = fs.readFileSync(manifestPath, 'utf-8')
      const lines = content.split('\n').filter((l) => l.trim() && !l.startsWith('#'))
      sectionCount = lines.filter((l) => !l.startsWith(' ') && !l.startsWith('-')).length
    }

    return {
      name: dir.name,
      path: dirPath,
      hasManifest: manifest,
      sectionCount,
    }
  })

  return NextResponse.json({ resumes })
}
