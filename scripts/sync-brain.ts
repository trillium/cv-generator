import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { renderSection, type SectionInput, type TechCat } from './lib/atom-compose'

const REPO = resolve(import.meta.dir, '..')
const CHECK = process.argv.includes('--check')
const storeDir = (cli: string) => `/Users/trilliumsmith/data/${cli}`

type Row = {
  id: string
  title: string
  description: string
  external_ref?: string
  labels: string[]
}

function abort(message: string): never {
  console.error(`ABORT ${message}`)
  process.exit(1)
}

function listRows(cli: string): Row[] {
  const proc = Bun.spawnSync([cli, 'list', '--json', '-n', '0'], {
    cwd: storeDir(cli),
    stdout: 'pipe',
    stderr: 'pipe',
  })
  if ((proc.exitCode ?? 1) !== 0) abort(`${cli} list failed: ${proc.stderr.toString().trim()}`)
  return JSON.parse(proc.stdout.toString()) as Row[]
}

const cvRows = (cli: string) => listRows(cli).filter((r) => r.external_ref?.startsWith('cv:'))
const relOf = (ref: string) => ref.slice('cv:'.length)

const targets = new Map<string, SectionInput>()

function claim(relPath: string, input: SectionInput) {
  if (targets.has(relPath)) abort(`duplicate target ${relPath}`)
  targets.set(relPath, input)
}

for (const cli of ['career', 'education'])
  for (const row of cvRows(cli))
    claim(relOf(row.external_ref as string), { kind: 'blob', description: row.description })

for (const cli of ['employment', 'projects'])
  for (const row of cvRows(cli)) {
    const relPath = relOf(row.external_ref as string)
    claim(relPath, { kind: 'frame', frameYaml: row.description, bullets: [], label: relPath })
  }

const techByBase = new Map<string, TechCat[]>()
for (const row of listRows('resume_bullets')) {
  const ref = row.external_ref
  if (!ref?.startsWith('cv:')) continue
  const hash = ref.indexOf('#')
  if (hash < 0) continue
  const relPath = relOf(ref.slice(0, hash))
  const suffix = ref.slice(hash + 1)
  if (row.labels.includes('section:technical')) {
    const cats = techByBase.get(relPath) ?? []
    cats.push({ catIdx: Number(suffix), yaml: row.description })
    techByBase.set(relPath, cats)
    continue
  }
  const target = targets.get(relPath)
  if (!target || target.kind !== 'frame') abort(`bullet ${ref} has no frame target`)
  target.bullets.push({ path: suffix, text: row.description })
}

for (const [relPath, cats] of techByBase)
  claim(relPath, { kind: 'technical', cats, label: relPath })

const rendered = new Map<string, string>()
for (const [relPath, input] of targets) rendered.set(relPath, renderSection(input))

if (CHECK) {
  let clean = 0
  let drifted = 0
  for (const [relPath, content] of rendered) {
    const target = join(REPO, relPath)
    let onDisk: string | null = null
    try {
      onDisk = readFileSync(target, 'utf8')
    } catch {
      onDisk = null
    }
    if (onDisk === content) {
      clean++
    } else {
      drifted++
      console.log(`drift ${relPath}`)
    }
  }
  console.log(`check: files=${rendered.size} clean=${clean} drifted=${drifted}`)
  if (drifted > 0) process.exit(1)
} else {
  for (const [relPath, content] of rendered) {
    const target = join(REPO, relPath)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, content)
  }
  console.log(`synced ${rendered.size} files from brain stores`)
}
