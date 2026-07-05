import { parse, stringify } from 'yaml'

export type Doc = unknown
export type Bullet = { path: string; text: string }
export type TechCat = { catIdx: number; yaml: string }

export const SECTION_TOKEN: Record<string, string> = {
  workExperience: 'work-experience',
  'open-source': 'open-source',
  projects: 'project',
}

export function parseDoc(text: string): Doc {
  return parse(text)
}

export function renderDoc(doc: Doc): string {
  return stringify(doc)
}

function isObject(node: unknown): node is Record<string, unknown> {
  return typeof node === 'object' && node !== null && !Array.isArray(node)
}

export function toFrame(node: Doc): Doc {
  if (Array.isArray(node)) return node.map(toFrame)
  if (isObject(node)) {
    const out: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(node)) {
      if (key === 'lines' && Array.isArray(value)) out[key] = value.length
      else out[key] = toFrame(value)
    }
    return out
  }
  return node
}

export function extractBullets(doc: Doc, label: string): Bullet[] {
  const acc: Bullet[] = []
  const walk = (node: unknown, path: number[]) => {
    if (Array.isArray(node)) {
      node.forEach((el, i) => {
        walk(el, [...path, i])
      })
      return
    }
    if (isObject(node)) {
      for (const [key, value] of Object.entries(node)) {
        if (key === 'lines' && Array.isArray(value)) {
          value.forEach((el, i) => {
            if (!isObject(el))
              throw new Error(`${label}: line at ${[...path, i].join('.')} is not an object`)
            const keys = Object.keys(el)
            if (keys.length !== 1 || keys[0] !== 'text')
              throw new Error(
                `${label}: line at ${[...path, i].join('.')} has keys [${keys.join(',')}], expected [text]`,
              )
            acc.push({ path: [...path, i].join('.'), text: el.text as string })
          })
        } else walk(value, path)
      }
    }
  }
  walk(doc, [])
  return acc
}

function inflate(node: unknown, path: number[], lookup: (p: string) => string): unknown {
  if (Array.isArray(node)) return node.map((el, i) => inflate(el, [...path, i], lookup))
  if (isObject(node)) {
    const out: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(node)) {
      if (key === 'lines' && typeof value === 'number') {
        out[key] = Array.from({ length: value }, (_, i) => ({
          text: lookup([...path, i].join('.')),
        }))
      } else out[key] = inflate(value, path, lookup)
    }
    return out
  }
  return node
}

export function comparePaths(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i++) {
    const da = pa[i] ?? -1
    const db = pb[i] ?? -1
    if (da !== db) return da - db
  }
  return 0
}

export function composeFrameDoc(frameYaml: string, bullets: Bullet[], label: string): Doc {
  const frame = parseDoc(frameYaml)
  const sorted = [...bullets].sort((a, b) => comparePaths(a.path, b.path))
  const map = new Map<string, string>()
  for (const b of sorted) {
    if (map.has(b.path)) throw new Error(`${label}: duplicate bullet path ${b.path}`)
    map.set(b.path, b.text)
  }
  let consumed = 0
  const doc = inflate(frame, [], (p) => {
    consumed++
    if (!map.has(p)) throw new Error(`${label}: frame expects bullet at ${p} but none stored`)
    return map.get(p) as string
  })
  if (consumed !== map.size)
    throw new Error(`${label}: frame consumes ${consumed} bullets but ${map.size} stored`)
  return doc
}

export function composeTechnicalDoc(cats: TechCat[], label: string): Doc {
  if (cats.length === 0) throw new Error(`${label}: no technical categories stored`)
  const seen = new Set<number>()
  for (const c of cats) {
    if (seen.has(c.catIdx)) throw new Error(`${label}: duplicate category index ${c.catIdx}`)
    seen.add(c.catIdx)
  }
  const ordered = [...cats].sort((a, b) => a.catIdx - b.catIdx)
  for (let i = 0; i < ordered.length; i++) {
    if (ordered[i].catIdx !== i) throw new Error(`${label}: category index gap at ${i}`)
  }
  return { technical: ordered.map((c) => parseDoc(c.yaml)) }
}

export function deepEqual(a: unknown, b: unknown): boolean {
  return deepDiff(a, b, '$') === null
}

export function deepDiff(a: unknown, b: unknown, path: string): string | null {
  if (a === b) return null
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b))
      return `${path}: array/non-array mismatch (${typeof a} vs ${typeof b})`
    if (a.length !== b.length) return `${path}: array length ${a.length} vs ${b.length}`
    for (let i = 0; i < a.length; i++) {
      const d = deepDiff(a[i], b[i], `${path}[${i}]`)
      if (d) return d
    }
    return null
  }
  if (isObject(a) || isObject(b)) {
    if (!isObject(a) || !isObject(b)) return `${path}: object/non-object mismatch`
    const ak = Object.keys(a).sort()
    const bk = Object.keys(b).sort()
    if (ak.length !== bk.length || !ak.every((k, i) => k === bk[i]))
      return `${path}: key set [${ak.join(',')}] vs [${bk.join(',')}]`
    for (const k of ak) {
      const d = deepDiff(a[k], b[k], `${path}.${k}`)
      if (d) return d
    }
    return null
  }
  return `${path}: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`
}

export type SectionInput =
  | { kind: 'blob'; description: string }
  | { kind: 'technical'; cats: TechCat[]; label: string }
  | { kind: 'frame'; frameYaml: string; bullets: Bullet[]; label: string }

export function renderSection(input: SectionInput): string {
  if (input.kind === 'blob') return input.description
  if (input.kind === 'technical') return renderDoc(composeTechnicalDoc(input.cats, input.label))
  return renderDoc(composeFrameDoc(input.frameYaml, input.bullets, input.label))
}

export function normalizeTitle(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function normalizeText(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}
