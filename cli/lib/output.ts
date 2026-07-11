export interface ProbeResult {
  name: string
  ok: boolean
  detail: string
}

export interface DoctorReport {
  pass: boolean
  probes: ProbeResult[]
}

const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const DIM = '\x1b[2m'
const RESET = '\x1b[0m'

export function formatProbeTable(probes: ProbeResult[]): string {
  const nameWidth = Math.max(...probes.map((p) => p.name.length), 4)
  const rows = probes.map((p) => {
    const mark = p.ok ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`
    const name = p.name.padEnd(nameWidth)
    return `  ${mark}  ${name}  ${DIM}${p.detail}${RESET}`
  })
  return rows.join('\n')
}

export function allPass(probes: ProbeResult[]): boolean {
  return probes.every((p) => p.ok)
}
