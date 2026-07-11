import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { connect } from 'node:net'
import { homedir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { allPass, type DoctorReport, formatProbeTable, type ProbeResult } from '../lib/output'

const DEV_ENDPOINTS = ['http://mac:10300', 'http://localhost:10300']
const DEV_PROBE_TIMEOUT_MS = 2000
const DOLT_HOST = '127.0.0.1'
const DOLT_PORT = 3307
const DOLT_CONNECT_TIMEOUT_MS = 2000
const RESUME_STORES = [
  'resume_bullets',
  'employment',
  'career',
  'education',
  'companies',
  'applications',
  'interviews',
]

async function probeEndpoint(url: string): Promise<boolean> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), DEV_PROBE_TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: controller.signal, redirect: 'manual' })
    return res.status > 0
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

async function probeDevServer(): Promise<ProbeResult> {
  for (const url of DEV_ENDPOINTS) {
    if (await probeEndpoint(url)) {
      return { name: 'dev-server', ok: true, detail: `answered at ${url}` }
    }
  }
  return {
    name: 'dev-server',
    ok: false,
    detail: `no response from ${DEV_ENDPOINTS.join(' or ')} (run with --fix to start)`,
  }
}

function probeDolt(): Promise<ProbeResult> {
  return new Promise((resolve) => {
    const socket = connect({ host: DOLT_HOST, port: DOLT_PORT })
    let settled = false
    const done = (result: ProbeResult) => {
      if (settled) return
      settled = true
      socket.destroy()
      resolve(result)
    }
    socket.setTimeout(DOLT_CONNECT_TIMEOUT_MS)
    socket.once('connect', () =>
      done({ name: 'dolt', ok: true, detail: `TCP ${DOLT_HOST}:${DOLT_PORT} reachable` }),
    )
    socket.once('timeout', () =>
      done({
        name: 'dolt',
        ok: false,
        detail: `TCP ${DOLT_HOST}:${DOLT_PORT} timed out after ${DOLT_CONNECT_TIMEOUT_MS}ms`,
      }),
    )
    socket.once('error', (err: NodeJS.ErrnoException) =>
      done({
        name: 'dolt',
        ok: false,
        detail: `TCP ${DOLT_HOST}:${DOLT_PORT} failed (${err.code ?? err.message})`,
      }),
    )
  })
}

function probeResumeStores(): ProbeResult {
  const dataRoot = path.join(homedir(), 'data')
  const missing = RESUME_STORES.filter((store) => !existsSync(path.join(dataRoot, store, '.beads')))
  if (missing.length === 0) {
    return {
      name: 'resume-stores',
      ok: true,
      detail: `all ${RESUME_STORES.length} store dirs present under ~/data`,
    }
  }
  return {
    name: 'resume-stores',
    ok: false,
    detail: `missing .beads for: ${missing.join(', ')}`,
  }
}

async function probePuppeteer(): Promise<ProbeResult> {
  let launch: typeof import('puppeteer').default
  try {
    const mod = await import('puppeteer')
    launch = mod.default
  } catch (err) {
    return {
      name: 'puppeteer',
      ok: false,
      detail: `import failed (${err instanceof Error ? err.message : String(err)})`,
    }
  }
  try {
    const browser = await launch.launch({ headless: true })
    await browser.close()
    return { name: 'puppeteer', ok: true, detail: 'launched and closed headless browser' }
  } catch (err) {
    return {
      name: 'puppeteer',
      ok: false,
      detail: `launch failed (${err instanceof Error ? err.message : String(err)})`,
    }
  }
}

async function collectProbes(fast: boolean): Promise<ProbeResult[]> {
  const [devServer, dolt, puppeteer] = await Promise.all([
    probeDevServer(),
    probeDolt(),
    fast
      ? Promise.resolve<ProbeResult>({
          name: 'puppeteer',
          ok: true,
          detail: 'skipped (--fast)',
        })
      : probePuppeteer(),
  ])
  return [devServer, dolt, probeResumeStores(), puppeteer]
}

function repoRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
}

async function startDevServer(): Promise<void> {
  const child = spawn('bun', ['dev'], {
    cwd: repoRoot(),
    detached: true,
    stdio: 'ignore',
  })
  child.unref()
}

async function waitForDevServer(attempts: number, delayMs: number): Promise<ProbeResult> {
  for (let i = 0; i < attempts; i++) {
    const result = await probeDevServer()
    if (result.ok) return result
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }
  return probeDevServer()
}

export async function runDoctor(args: string[]): Promise<number> {
  const asJson = args.includes('--json')
  const fast = args.includes('--fast')
  const fix = args.includes('--fix')

  let probes = await collectProbes(fast)

  if (fix) {
    const devServer = probes.find((p) => p.name === 'dev-server')
    if (devServer && !devServer.ok) {
      await startDevServer()
      const restarted = await waitForDevServer(10, 1000)
      probes = probes.map((p) =>
        p.name === 'dev-server'
          ? restarted.ok
            ? { ...restarted, detail: `${restarted.detail} (started by --fix)` }
            : { ...restarted, detail: `${restarted.detail} (--fix start did not come up)` }
          : p,
      )
    }
  }

  const pass = allPass(probes)
  const report: DoctorReport = { pass, probes }

  if (asJson) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    console.log(`cvgen doctor — ${pass ? 'all checks passed' : 'FAILURES present'}`)
    console.log(formatProbeTable(probes))
  }

  return pass ? 0 : 1
}
