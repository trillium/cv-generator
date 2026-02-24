import type { CVData } from '@/types'
import { MultiFileManager } from '../../lib/multiFileManager'

export async function loadAndProcessData(resumePath: string, isAnon: boolean): Promise<CVData> {
  try {
    const manager = new MultiFileManager()
    const result = await manager.loadDirectory(resumePath)
    const dataObj = result.data

    console.log(`✅ Data loaded from directory: ${resumePath}`)
    console.log(`   Files loaded: ${result.metadata.filesLoaded.join(', ')}`)
    console.log(`   Sections: ${Object.keys(dataObj).join(', ')}`)

    if (isAnon) {
      console.log('⚠️  Anonymization not yet implemented')
    }

    return dataObj
  } catch (err) {
    console.error('❌ Failed to process input file:', err)
    process.exit(1)
  }
}
