import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

const REPO = resolve(import.meta.dir, '..')
const STORES = ['career', 'employment', 'brain']
const CHECK = process.argv.includes('--check')

type Entry = { id: string; title: string; external_ref?: string }

function run(cmd: string[]): string {
  const proc = Bun.spawnSync(cmd, { stdout: 'pipe', stderr: 'pipe' })
  if (proc.exitCode !== 0) {
    throw new Error(`${cmd.join(' ')} failed: ${proc.stderr.toString().trim()}`)
  }
  return proc.stdout.toString()
}

function resumeEntries(store: string): Entry[] {
  const out = run([store, 'list', '--json', '--label', 'sys:resume', '-n', '0'])
  const items = JSON.parse(out) as Entry[]
  return items.filter((e) => e.external_ref?.startsWith('cv:'))
}

function description(store: string, id: string): string {
  const out = run([store, 'show', id, '--json'])
  const parsed = JSON.parse(out) as Array<{ description: string }>
  return parsed[0].description
}

let written = 0
let clean = 0
let drifted = 0

for (const store of STORES) {
  for (const entry of resumeEntries(store)) {
    const relPath = (entry.external_ref as string).slice('cv:'.length)
    const target = join(REPO, relPath)
    const content = description(store, entry.id)

    if (CHECK) {
      const onDisk = existsSync(target) ? readFileSync(target, 'utf8') : null
      if (onDisk === content) {
        clean++
      } else {
        drifted++
        console.log(`drift ${entry.id} <> ${relPath}`)
      }
      continue
    }

    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, content)
    written++
    console.log(`${entry.id} -> ${relPath}`)
  }
}

if (CHECK) {
  console.log(`\ncheck: clean=${clean} drifted=${drifted}`)
  if (drifted > 0) process.exit(1)
} else {
  console.log(`\nsynced ${written} files from brain stores`)
}
