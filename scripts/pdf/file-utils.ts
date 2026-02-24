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
  return `${[data.header.name.split(' ').join('_'), type].join('_')}.pdf`
}

export function resetScriptDataJson(outputPath: string) {
  writeFileSync(outputPath, '{}\n')
}
