import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import type { CVData } from '@/types'

export function ensureDirectoryExists(dirPath: string) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath)
  }
}

export function getOutputFilename({
  data,
  type,
}: {
  data: CVData
  type: 'Resume' | 'CoverLetter'
}): string {
  const parts = [data.header.name.split(' ').join('_'), type]
  if (data.metadata?.targetCompany) parts.push(data.metadata.targetCompany.replace(/\s+/g, '_'))
  if (data.metadata?.jobId) parts.push(data.metadata.jobId)
  return `${parts.join('_')}.pdf`
}

export function resetScriptDataJson(outputPath: string) {
  writeFileSync(outputPath, '{}\n')
}
