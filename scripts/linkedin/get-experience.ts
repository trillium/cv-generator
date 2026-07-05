const INTERCEPTOR = '/opt/homebrew/bin/interceptor'
const EXPERIENCE_URL = 'https://www.linkedin.com/in/trilliumsmith/details/experience/'

interface Experience {
  title: string
  company: string
  employmentType: string | null
  dateRange: string | null
  duration: string | null
  location: string | null
  description: string[]
  skills: string | null
}

async function run(cmd: string, args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const proc = Bun.spawn([cmd, ...args], { stdout: 'pipe', stderr: 'pipe' })
  const stdout = await new Response(proc.stdout).text()
  const stderr = await new Response(proc.stderr).text()
  const exitCode = await proc.exited
  return { stdout, stderr, exitCode }
}

async function getOrOpenExperienceTab(): Promise<void> {
  const { stdout, exitCode } = await run(INTERCEPTOR, ['tabs'])

  if (exitCode !== 0) {
    console.error('Error: interceptor is not running or not reachable. Start the interceptor browser extension first.')
    process.exit(1)
  }

  const lines = stdout.split('\n').filter(l => l.trim())
  const existing = lines.find(l => l.includes('linkedin.com/in/trilliumsmith/details/experience'))

  if (existing) {
    const match = existing.match(/^\s*\*?\s*(\d+)/)
    if (match) {
      const tabId = match[1]
      console.error(`Found existing experience tab (${tabId}), switching to it...`)
      const { exitCode: swCode } = await run(INTERCEPTOR, ['tab', 'switch', tabId])
      if (swCode !== 0) {
        console.error(`Warning: could not switch to tab ${tabId}, proceeding with read anyway`)
      }
      await run(INTERCEPTOR, ['wait-stable', '--ms', '500'])
    }
  } else {
    console.error('Opening LinkedIn experience page...')
    const { exitCode: openCode, stderr } = await run(INTERCEPTOR, ['open', EXPERIENCE_URL, '--text-only'])
    if (openCode !== 0) {
      console.error(`Error: failed to open LinkedIn page. ${stderr}`)
      process.exit(1)
    }
  }
}

async function readPageText(): Promise<string> {
  const { stdout, exitCode, stderr } = await run(INTERCEPTOR, ['read', '--text-only'])
  if (exitCode !== 0) {
    console.error(`Error reading page: ${stderr}`)
    process.exit(1)
  }
  return stdout
}

function parseExperiences(text: string): Experience[] {
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)

  const experiences: Experience[] = []

  const dateRangePattern = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\s*[-–]\s*(Present|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/
  const durationPattern = /^\d+\s+(yr|yrs|mo|mos|year|years|month|months)/
  const employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Self-employed', 'Internship', 'Apprenticeship', 'Seasonal']
  const skillsPrefix = 'Skills:'

  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (dateRangePattern.test(line)) {
      const entry = buildEntry(lines, i, experiences)
      if (entry) {
        experiences.push(entry)
        i = entry._nextIndex
        continue
      }
    }
    i++
  }

  if (experiences.length === 0) {
    return parseExperiencesFallback(lines, dateRangePattern, durationPattern, employmentTypes, skillsPrefix)
  }

  return experiences.map(({ _nextIndex: _, ...e }) => e as Experience)
}

function buildEntry(
  lines: string[],
  dateLineIdx: number,
  existing: Array<Experience & { _nextIndex: number }>
): (Experience & { _nextIndex: number }) | null {
  const prevTitle = lines[dateLineIdx - 1] ?? ''
  const prevPrev = lines[dateLineIdx - 2] ?? ''

  if (!prevTitle) return null

  const employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Self-employed', 'Internship', 'Apprenticeship', 'Seasonal']
  const durationPattern = /^\d+\s+(yr|yrs|mo|mos|year|years|month|months)/
  const skillsPrefix = 'Skills:'

  let title: string
  let company: string
  let employmentType: string | null = null

  const empMatch = employmentTypes.find(et => prevTitle.includes(et))
  if (empMatch) {
    company = prevTitle.replace(`· ${empMatch}`, '').replace(empMatch, '').trim()
    employmentType = empMatch
    title = prevPrev
  } else if (prevTitle.includes('·')) {
    const parts = prevTitle.split('·')
    company = parts[0].trim()
    employmentType = parts[1]?.trim() ?? null
    title = prevPrev
  } else {
    title = prevTitle
    company = prevPrev
  }

  if (!title || !company) return null

  const dateRange = lines[dateLineIdx]
  let duration: string | null = null
  let location: string | null = null
  let nextIdx = dateLineIdx + 1

  if (nextIdx < lines.length && durationPattern.test(lines[nextIdx])) {
    duration = lines[nextIdx]
    nextIdx++
  }

  if (nextIdx < lines.length && !durationPattern.test(lines[nextIdx]) && lines[nextIdx].match(/,\s*(CA|NY|TX|WA|OR|Remote|United States|Los Angeles|New York|San Francisco|Seattle|Austin)/)) {
    location = lines[nextIdx]
    nextIdx++
  }

  const description: string[] = []
  let skills: string | null = null

  while (nextIdx < lines.length) {
    const l = lines[nextIdx]

    const isNextTitle =
      (nextIdx + 1 < lines.length && /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/.test(lines[nextIdx + 1])) ||
      (nextIdx + 2 < lines.length && /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/.test(lines[nextIdx + 2]))

    if (isNextTitle && description.length > 0) break

    if (l.startsWith(skillsPrefix)) {
      skills = l.slice(skillsPrefix.length).trim()
      nextIdx++
      break
    }

    if (l.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/)) break

    description.push(l)
    nextIdx++
  }

  return {
    title: title.trim(),
    company: company.trim(),
    employmentType,
    dateRange,
    duration,
    location,
    description,
    skills,
    _nextIndex: nextIdx,
  }
}

function parseExperiencesFallback(
  lines: string[],
  dateRangePattern: RegExp,
  durationPattern: RegExp,
  employmentTypes: string[],
  skillsPrefix: string
): Experience[] {
  const experiences: Experience[] = []
  const blocks: string[][] = []
  let currentBlock: string[] = []

  for (const line of lines) {
    if (dateRangePattern.test(line) && currentBlock.length > 0) {
      const titleIdx = currentBlock.findIndex(l =>
        !employmentTypes.some(et => l.includes(et)) &&
        !l.match(/^\d/) &&
        l.length > 3 &&
        l.length < 100
      )
      if (titleIdx >= 0) {
        blocks.push(currentBlock)
        currentBlock = []
      }
    }
    currentBlock.push(line)
  }
  if (currentBlock.length) blocks.push(currentBlock)

  for (const block of blocks) {
    if (block.length < 2) continue

    let title = ''
    let company = ''
    let employmentType: string | null = null
    let dateRange: string | null = null
    let duration: string | null = null
    let location: string | null = null
    const description: string[] = []
    let skills: string | null = null

    for (let i = 0; i < block.length; i++) {
      const l = block[i]
      if (dateRangePattern.test(l)) {
        dateRange = l
        if (i + 1 < block.length && durationPattern.test(block[i + 1])) {
          duration = block[i + 1]
          i++
        }
        continue
      }
      if (durationPattern.test(l)) { duration = l; continue }
      if (l.startsWith(skillsPrefix)) { skills = l.slice(skillsPrefix.length).trim(); continue }

      const empMatch = employmentTypes.find(et => l.includes(et))
      if (empMatch) {
        if (!company) company = l.replace(`· ${empMatch}`, '').replace(empMatch, '').trim()
        employmentType = empMatch
        continue
      }

      if (!title) { title = l; continue }
      if (!company) { company = l; continue }

      if (l.match(/,\s*(CA|NY|TX|WA|OR|Remote|United States|Los Angeles|New York|San Francisco|Seattle|Austin)/)) {
        location = l; continue
      }

      description.push(l)
    }

    if (title) {
      experiences.push({ title, company, employmentType, dateRange, duration, location, description, skills })
    }
  }

  return experiences
}

function formatText(experiences: Experience[]): string {
  if (experiences.length === 0) {
    return 'No experience entries found. LinkedIn may require login or the page structure may have changed.'
  }

  return experiences.map((e, idx) => {
    const lines = [
      `${'─'.repeat(60)}`,
      `[${idx + 1}] ${e.title}`,
      `    ${e.company}${e.employmentType ? ` · ${e.employmentType}` : ''}`,
    ]
    if (e.dateRange) lines.push(`    ${e.dateRange}${e.duration ? ` · ${e.duration}` : ''}`)
    if (e.location) lines.push(`    ${e.location}`)
    if (e.description.length > 0) {
      lines.push('')
      e.description.forEach(d => lines.push(`    ${d}`))
    }
    if (e.skills) lines.push(`\n    Skills: ${e.skills}`)
    return lines.join('\n')
  }).join('\n\n') + `\n${'─'.repeat(60)}\n\n${experiences.length} experience entries found`
}

async function main() {
  const jsonMode = process.argv.includes('--json')

  await getOrOpenExperienceTab()

  console.error('Reading page content...')
  const text = await readPageText()

  console.error('Parsing experience entries...')
  const experiences = parseExperiences(text)

  if (jsonMode) {
    console.log(JSON.stringify(experiences, null, 2))
  } else {
    console.log(formatText(experiences))
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
