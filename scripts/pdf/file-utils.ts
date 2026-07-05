import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import type { CVData } from '@/types'

export function ensureDirectoryExists(dirPath: string) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true })
  }
}

export function getOutputFilename({
  data,
  type,
}: {
  data: CVData
  type: 'Resume' | 'CoverLetter'
}): string {
  const parts = [data.header.name.split(' ').join('_')]
  if (data.info?.role) parts.push(data.info.role.replace(/\s+/g, '_'))
  parts.push(type)
  return `${parts.join('_')}.pdf`
}

export function resetScriptDataJson(outputPath: string) {
  writeFileSync(outputPath, '{}\n')
}
