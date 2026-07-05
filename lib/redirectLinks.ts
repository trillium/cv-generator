import type { CVData, InfoLink } from '@/types'

const DESTINATION_MAP: Record<string, string> = {
  website: 'website',
  github: 'github',
  linkedIn: 'linkedin',
  bluesky: 'bluesky',
  email: 'email',
}

const LINK_FIELDS = ['website', 'github', 'linkedIn', 'bluesky'] as const
type LinkField = (typeof LINK_FIELDS)[number]

function slugifyCompany(company: string): string {
  return company.toLowerCase().trim()
}

function slugifyPosition(position: string, company: string): string {
  const companyLower = company.toLowerCase().trim()
  let slug = position.toLowerCase().trim()
  if (slug.startsWith(companyLower)) {
    slug = slug.slice(companyLower.length).trim()
  }
  return slug.replace(/\s+/g, '_')
}

function rewriteLink(link: InfoLink, trackedUrl: string): InfoLink {
  if (typeof link === 'string') return trackedUrl
  return { ...link, link: trackedUrl }
}

export function applyRedirectLinks(data: CVData): CVData {
  const trackingLevel = (data as Record<string, unknown>).trackingLevel as number | undefined
  if (trackingLevel === 0 || trackingLevel === undefined) return data

  const company = data.metadata?.targetCompany
  const position = data.metadata?.targetPosition
  if (!company || !position) return data

  const subdomain = `${slugifyCompany(company)}-${slugifyPosition(position, company)}`
  const resumeType = 'draft'
  const version = 1

  const info = { ...data.info }

  for (const field of LINK_FIELDS) {
    const value = info[field as keyof typeof info] as InfoLink | undefined
    if (value === undefined) continue
    const destination = DESTINATION_MAP[field]
    const trackedUrl = `${subdomain}.trilliumsmith.com/rd/${destination}?src=${resumeType}-v${version}`
    ;(info as Record<LinkField, InfoLink>)[field] = rewriteLink(value, trackedUrl)
  }

  if (info.email) {
    const destination = DESTINATION_MAP.email
    const trackedUrl = `${subdomain}.trilliumsmith.com/rd/${destination}?src=${resumeType}-v${version}`
    info.email = trackedUrl
  }

  return { ...data, info }
}
