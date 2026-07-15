import { runBullets } from './commands/bullets'
import { runCheck } from './commands/check'
import { runDoctor } from './commands/doctor'

const STUBS: Record<string, string> = {
  new: 'scaffold a new company resume dir from the template',
  build: 'render resume + cover letter PDFs and write metadata.json',
  optimize: 'iterate layout/manifest until page-count and orphan checks pass',
  sent: 'mark an application as sent and record the timestamp',
  status: 'summarize every company dir: build state, checks, sent state',
  prime: 'print workflow context and the current definition of done',
  clicks: 'report link-click analytics for sent applications',
}

const HELP = `cvgen — CV generation CLI

usage: cvgen <command> [options]

commands:
  doctor            environment preflight (dev server, dolt, stores, puppeteer)
                      --json   machine-readable report
                      --fast   skip the puppeteer launch probe
                      --fix    start the dev server if its probe failed
  check <company>   run the check registry against a company dir, write results
                    into its metadata.json
  bullets review <company>   render + push the human bullet-review card
  bullets ratify <chatId>    parse the review reply, hash-verify, patch labels

stubs (not implemented — doctrine in brain-u1ws):
${Object.entries(STUBS)
  .map(([verb, desc]) => `  ${verb.padEnd(16)}${desc}`)
  .join('\n')}

  --help, -h        show this help`

function runStub(verb: string): number {
  console.log(`cvgen ${verb}: ${STUBS[verb]}`)
  console.log('not implemented — doctrine in brain-u1ws')
  return 2
}

async function main(): Promise<number> {
  const [verb, ...rest] = process.argv.slice(2)

  if (!verb || verb === '--help' || verb === '-h') {
    console.log(HELP)
    return verb ? 0 : 1
  }

  switch (verb) {
    case 'doctor':
      return runDoctor(rest)
    case 'check':
      return runCheck(rest)
    case 'bullets':
      return runBullets(rest)
    default:
      if (verb in STUBS) return runStub(verb)
      console.error(`unknown command: ${verb}`)
      console.error("run 'cvgen --help' for usage")
      return 1
  }
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(err instanceof Error ? err.stack : String(err))
    process.exit(1)
  })
