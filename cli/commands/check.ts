import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { registry } from '../checks'
import type { Check, CheckContext, CheckOutcome } from '../checks/types'
import { buildContext, metadataPath } from '../lib/context'

const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const DIM = '\x1b[2m'
const RESET = '\x1b[0m'

interface RanCheck {
  check: Check
  outcome: CheckOutcome
}

async function runRegistry(ctx: CheckContext): Promise<RanCheck[]> {
  const results: RanCheck[] = []
  for (const check of registry) {
    try {
      const outcome = await check.run(ctx)
      results.push({ check, outcome })
    } catch (err) {
      results.push({
        check,
        outcome: {
          ok: false,
          detail: `check threw: ${err instanceof Error ? err.message : String(err)}`,
        },
      })
    }
  }
  return results
}

function label(ran: RanCheck): string {
  if (ran.outcome.ok) return `${GREEN}PASS${RESET}`
  return ran.check.severity === 'error' ? `${RED}FAIL${RESET}` : `${YELLOW}WARN${RESET}`
}

function errorFailures(results: RanCheck[]): string[] {
  return results
    .filter((r) => !r.outcome.ok && r.check.severity === 'error')
    .map((r) => r.check.name)
}

function writeChecksBlock(company: string, pass: boolean, failures: string[]): void {
  const file = metadataPath(company)
  const existing = existsSync(file) ? JSON.parse(readFileSync(file, 'utf-8')) : {}
  existing.checks = { pass, failures, ranAt: new Date().toISOString() }
  writeFileSync(file, `${JSON.stringify(existing, null, 2)}\n`, 'utf-8')
}

export async function runCheck(args: string[]): Promise<number> {
  const company = args.find((a) => !a.startsWith('--'))
  if (!company) {
    console.error('usage: cvgen check <company>')
    return 2
  }

  let ctx: CheckContext
  try {
    ctx = buildContext(company)
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err))
    return 2
  }

  const results = await runRegistry(ctx)
  const failures = errorFailures(results)
  const pass = failures.length === 0

  console.log(`cvgen check ${company} — ${pass ? 'PASS' : 'FAIL'}`)
  for (const ran of results) {
    console.log(`  ${label(ran)}  ${ran.check.name}  ${DIM}${ran.outcome.detail}${RESET}`)
  }

  writeChecksBlock(company, pass, failures)
  console.log(`${DIM}wrote checks block to ${metadataPath(company)}${RESET}`)

  return pass ? 0 : 1
}
