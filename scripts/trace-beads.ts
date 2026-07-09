import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { parse } from 'yaml'

/**
 * Trace a resume target's content back to the beads (store rows) that produce
 * it. A manifest ref like `header.generic` resolves to the library file
 * `header/header.generic.yml`, whose `cv:` external_ref is carried by exactly
 * one store row (the "frame" or blob). Frame-backed sections (workExperience,
 * projects) additionally pull one `resume_bullets` row per line, and technical
 * pulls one `resume_bullets` row per category — both keyed by the `#suffix` on
 * the external_ref. This is the inverse of scripts/sync-brain.ts.
 */

const REPO = resolve(import.meta.dir, '..')
const storeDir = (cli: string) => `/Users/trilliumsmith/data/${cli}`

// Which store owns each manifest section's frame/blob rows.
const SECTION_STORE: Record<string, string> = {
  header: 'career',
  careerSummary: 'career',
  coverLetter: 'career',
  education: 'education',
  workExperience: 'employment',
  projects: 'projects',
}

// Manifest section -> library subdirectory (mirrors sync-brain / schema.ts).
const SECTION_DIR: Record<string, string> = {
  header: 'header',
  careerSummary: 'career-summary',
  coverLetter: 'cover-letter',
  education: 'education',
  workExperience: 'workExperience',
  projects: 'projects',
  technical: 'technical',
}

const BULLET_STORE = 'resume_bullets'

// Sections whose lines/categories come from resume_bullets rows.
const FRAME_SECTIONS = new Set(['workExperience', 'projects'])

type Row = {
  id: string
  title: string
  description: string
  external_ref?: string
  labels: string[]
}

type BulletRef = { id: string; path: string; text: string }

type SectionTrace = {
  section: string
  ref: string
  relPath: string
  frameId: string | null
  frameStore: string | null
  bullets: BulletRef[]
}

function fail(message: string): never {
  console.error(`ERROR ${message}`)
  process.exit(1)
}

function listRows(cli: string): Row[] {
  const proc = Bun.spawnSync([cli, 'list', '--json', '-n', '0'], {
    cwd: storeDir(cli),
    stdout: 'pipe',
    stderr: 'pipe',
  })
  if ((proc.exitCode ?? 1) !== 0) fail(`${cli} list failed: ${proc.stderr.toString().trim()}`)
  return JSON.parse(proc.stdout.toString()) as Row[]
}

// Build, per store, a map from library relPath -> frame row and relPath -> bullet rows.
function indexStore(cli: string): {
  frames: Map<string, Row>
  bullets: Map<string, BulletRef[]>
} {
  const frames = new Map<string, Row>()
  const bullets = new Map<string, BulletRef[]>()
  for (const row of listRows(cli)) {
    const ref = row.external_ref
    if (!ref?.startsWith('cv:')) continue
    const body = ref.slice('cv:'.length)
    const hash = body.indexOf('#')
    if (hash < 0) {
      const rel = body.startsWith('pii/library/') ? body.slice('pii/library/'.length) : body
      frames.set(rel, row)
    } else {
      const relFull = body.slice(0, hash)
      const rel = relFull.startsWith('pii/library/')
        ? relFull.slice('pii/library/'.length)
        : relFull
      const suffix = body.slice(hash + 1)
      const arr = bullets.get(rel) ?? []
      arr.push({ id: row.id, path: suffix, text: row.description })
      bullets.set(rel, arr)
    }
  }
  return { frames, bullets }
}

function loadManifest(target: string): Record<string, unknown> {
  const clean = target.replace(/^resumes\//, '')
  const manifestPath = join(REPO, 'pii', 'resumes', clean, 'manifest.yml')
  let text: string
  try {
    text = readFileSync(manifestPath, 'utf8')
  } catch {
    fail(`no manifest at ${manifestPath}`)
  }
  const doc = parse(text)
  if (!doc || typeof doc !== 'object') fail(`manifest at ${manifestPath} is not a mapping`)
  return doc as Record<string, unknown>
}

function traceTarget(
  target: string,
  stores: Map<string, ReturnType<typeof indexStore>>,
): SectionTrace[] {
  const manifest = loadManifest(target)
  const traces: SectionTrace[] = []

  for (const [section, dir] of Object.entries(SECTION_DIR)) {
    const value = manifest[section]
    if (value === undefined) continue
    const refs = Array.isArray(value) ? value : [value]

    for (const ref of refs) {
      if (typeof ref !== 'string') continue
      const relPath = `${dir}/${ref}.yml`

      // technical: bullets only (categories), no frame; lives in resume_bullets.
      if (section === 'technical') {
        const bulletIndex = stores.get(BULLET_STORE)?.bullets ?? new Map()
        const bullets = [...(bulletIndex.get(relPath) ?? [])].sort((a, b) =>
          a.path.localeCompare(b.path, undefined, { numeric: true }),
        )
        traces.push({ section, ref, relPath, frameId: null, frameStore: null, bullets })
        continue
      }

      const frameStore = SECTION_STORE[section]
      const frameRow = frameStore ? stores.get(frameStore)?.frames.get(relPath) : undefined

      let bullets: BulletRef[] = []
      if (FRAME_SECTIONS.has(section)) {
        const bulletIndex = stores.get(BULLET_STORE)?.bullets ?? new Map()
        bullets = [...(bulletIndex.get(relPath) ?? [])].sort((a, b) =>
          a.path.localeCompare(b.path, undefined, { numeric: true }),
        )
      }

      traces.push({
        section,
        ref,
        relPath,
        frameId: frameRow?.id ?? null,
        frameStore: frameRow ? (frameStore ?? null) : null,
        bullets,
      })
    }
  }

  return traces
}

function collectAllBeadIds(traces: SectionTrace[]): {
  frames: string[]
  bullets: string[]
} {
  const frames = new Set<string>()
  const bullets = new Set<string>()
  for (const t of traces) {
    if (t.frameId) frames.add(t.frameId)
    for (const b of t.bullets) bullets.add(b.id)
  }
  return { frames: [...frames].sort(), bullets: [...bullets].sort() }
}

function printHuman(target: string, traces: SectionTrace[]): void {
  console.log(`\n═══ ${target} ═══`)
  for (const t of traces) {
    const label = `${t.section} · ${t.ref}`
    if (t.frameId) {
      console.log(`  ${label}`)
      console.log(`      frame  ${t.frameStore}: ${t.frameId}`)
    } else if (t.section === 'technical' || t.bullets.length > 0) {
      console.log(`  ${label}`)
    } else {
      console.log(`  ${label}`)
      console.log('      ⚠️  no frame bead found for this ref')
    }
    if (t.bullets.length > 0) {
      const kind = t.section === 'technical' ? 'category' : 'bullet'
      console.log(`      ${t.bullets.length} ${kind}(s): ${BULLET_STORE}`)
      for (const b of t.bullets) {
        console.log(`        ${b.id}  #${b.path}`)
      }
    }
  }
  const { frames, bullets } = collectAllBeadIds(traces)
  console.log(`  ── totals: ${frames.length} frame/blob bead(s), ${bullets.length} bullet bead(s)`)
}

function discoverTargets(): string[] {
  const glob = new Bun.Glob('*/manifest.yml')
  const root = join(REPO, 'pii', 'resumes')
  const out: string[] = []
  for (const rel of glob.scanSync({ cwd: root })) {
    out.push(rel.replace(/\/manifest\.yml$/, ''))
  }
  return out.sort()
}

function main(): void {
  const args = process.argv.slice(2)
  const asJson = args.includes('--json')
  const idsOnly = args.includes('--ids')
  const positional = args.filter((a) => !a.startsWith('--'))

  const allFlag = args.includes('--all') || positional.length === 0
  const targets = allFlag ? discoverTargets() : positional
  if (targets.length === 0) fail('no resume targets found under pii/resumes/')

  // Index each store once, shared across all targets.
  const storeNames = new Set<string>([...Object.values(SECTION_STORE), BULLET_STORE])
  const stores = new Map<string, ReturnType<typeof indexStore>>()
  for (const cli of storeNames) stores.set(cli, indexStore(cli))

  const perTarget = targets.map((t) => ({ target: t, traces: traceTarget(t, stores) }))

  if (asJson) {
    const payload = perTarget.map(({ target, traces }) => ({
      target,
      sections: traces,
      ...collectAllBeadIds(traces),
    }))
    console.log(JSON.stringify(payload, null, 2))
    return
  }

  if (idsOnly) {
    const frames = new Set<string>()
    const bullets = new Set<string>()
    for (const { traces } of perTarget) {
      const ids = collectAllBeadIds(traces)
      for (const f of ids.frames) frames.add(f)
      for (const b of ids.bullets) bullets.add(b)
    }
    console.log([...frames, ...bullets].sort().join('\n'))
    return
  }

  for (const { target, traces } of perTarget) printHuman(target, traces)
}

main()
