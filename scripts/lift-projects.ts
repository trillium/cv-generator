import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { yaml } from '../lib/yamlService'

type ProjectEntry = {
  projects: Array<{
    name: string
    duration: string
    lines: Array<{ text: string }>
    links?: Array<{ name: string; link: string }>
  }>
}

type BrainFrontmatter = {
  id?: string
  title?: string
  created?: string
  updated?: string
  tags?: string[]
}

const BRAIN_ENTRIES = path.join(os.homedir(), 'data', 'brain', 'entries')

function parseFrontmatter(md: string): { fm: BrainFrontmatter; body: string } {
  const match = md.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) return { fm: {}, body: md }
  return { fm: (yaml.load(match[1]) as BrainFrontmatter) ?? {}, body: match[2] }
}

function deriveDuration(fm: BrainFrontmatter): string {
  const date = fm.updated || fm.created
  return date ? date.slice(0, 4) : new Date().getFullYear().toString()
}

function buildScaffold(source: string, projectName: string): ProjectEntry {
  const { fm } = parseFrontmatter(source)
  return {
    projects: [
      {
        name: projectName,
        duration: deriveDuration(fm),
        lines: [
          { text: 'TODO: X-Y-Z bullet — what you did, how, with what outcome' },
          { text: 'TODO: second bullet' },
        ],
      },
    ],
  }
}

type Args = {
  source?: string
  project?: string
  company?: string
  write?: boolean
}

function parseArgs(argv: string[]): Args {
  const out: Args = {}
  for (let i = 0; i < argv.length; i++) {
    const raw = argv[i]
    const eq = raw.indexOf('=')
    const key = eq === -1 ? raw : raw.slice(0, eq)
    const inlineValue = eq === -1 ? undefined : raw.slice(eq + 1)
    if (key === '--write') {
      out.write = true
      continue
    }
    const value = inlineValue ?? argv[++i]
    if (key === '--from') out.source = value
    else if (key === '--project') out.project = value
    else if (key === '--company') out.company = value
  }
  return out
}

function resolveSourcePath(source: string): string {
  if (fs.existsSync(source)) return source
  const slugPath = path.join(BRAIN_ENTRIES, source.endsWith('.md') ? source : `${source}.md`)
  if (fs.existsSync(slugPath)) return slugPath
  throw new Error(`source not found: ${source} (tried as path and as brain slug at ${slugPath})`)
}

function readSource(source?: string): string {
  if (source) return fs.readFileSync(resolveSourcePath(source), 'utf8')
  return fs.readFileSync(0, 'utf8')
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function printUsage(): void {
  const lines = [
    'usage: bun scripts/lift-projects.ts --project=<name> [--company=<co>] [--from=<path|brain-slug>] [--write]',
    '  reads markdown from --from path, ~/data/brain/entries/<slug>.md, or stdin',
    '  prints yml scaffold to stdout; --write requires --company and writes',
    '  pii/library/projects/<slug>.<company>.yml, echoing source to stderr for hand-iteration',
  ]
  for (const line of lines) console.error(line)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2))
  if (!args.project) {
    printUsage()
    process.exit(1)
  }
  const source = readSource(args.source)
  const scaffold = buildScaffold(source, args.project)
  const out = yaml.dump(scaffold)
  if (args.write) {
    if (!args.company) {
      console.error('--write requires --company')
      process.exit(1)
    }
    const dir = path.resolve(process.cwd(), 'pii', 'library', 'projects')
    fs.mkdirSync(dir, { recursive: true })
    const file = path.join(dir, `${slugify(args.project)}.${args.company}.yml`)
    fs.writeFileSync(file, out)
    console.error(`wrote ${file}`)
    console.error('\n--- source for hand-iteration ---')
    process.stderr.write(source)
  } else {
    process.stdout.write(out)
  }
}
