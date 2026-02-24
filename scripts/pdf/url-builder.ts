export function buildUrls(
  serverUrl: string,
  resumeType: string,
  resumePath: string,
): { resumeUrl: string; coverLetterUrl: string } {
  const resumeUrl = new URL(`/${resumeType}-multi/resume/${resumePath}`, serverUrl).toString()
  const coverLetterUrl = new URL(
    `/${resumeType}-multi/cover-letter/${resumePath}`,
    serverUrl,
  ).toString()

  console.log(`📄 Using resume path: ${resumePath}`)

  return { resumeUrl, coverLetterUrl }
}
