import * as fs from 'node:fs'
import * as path from 'node:path'
import { generateIndex, type LibraryIndex } from '../lib/manifest/libraryIndex'
import { yaml } from '../lib/yamlService'

export function writeIndex(piiPath: string, index: LibraryIndex): void {
  const indexPath = path.join(piiPath, 'library', 'index.yml')
  fs.writeFileSync(indexPath, yaml.dump(index))
}

export { generateIndex }

if (import.meta.url === `file://${process.argv[1]}`) {
  const piiPath = path.resolve(process.cwd(), 'pii')
  const index = generateIndex(piiPath)
  writeIndex(piiPath, index)
  console.log('Library index generated at pii/library/index.yml')
  console.log(yaml.dump(index))
}
