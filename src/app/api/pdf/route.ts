import { spawn } from 'node:child_process'
import type { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const {
    mode = 'prod',
    resumePath,
    resumeType = 'single-column',
    print = ['resume', 'cover'],
  } = await req.json()

  const args = ['scripts/pdf/pdf.ts', `--${mode}`, `--resumeType=${resumeType}`]

  if (resumePath) {
    args.push(`--resumePath=${resumePath}`)
  }

  if (print.length > 0) {
    args.push(`--print=${print.join(',')}`)
  }

  console.log(`📄 Triggering PDF generation: bun ${args.join(' ')}`)

  const child = spawn('bun', args, {
    cwd: process.cwd(),
    detached: true,
    stdio: 'ignore',
  })
  child.unref()

  return Response.json(
    {
      message: 'PDF generation triggered',
      mode,
      resumeType,
      resumePath,
    },
    { status: 202 },
  )
}
