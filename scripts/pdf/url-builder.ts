import { encodeFilePathForUrl } from "../../src/utils/urlSafeEncoding";

export function buildUrls(
  serverUrl: string,
  resumeType: string,
  resumePath: string,
): { resumeUrl: string; coverLetterUrl: string } {
  const encodedResumePath = resumePath.includes("-ashes-")
    ? resumePath
    : encodeFilePathForUrl(resumePath);

  const resumeUrl = new URL(
    `/${resumeType}/resume/${encodedResumePath}`,
    serverUrl,
  ).toString();
  const coverLetterUrl = new URL(
    `/${resumeType}/cover-letter/${encodedResumePath}`,
    serverUrl,
  ).toString();

  console.log(
    `📄 Using resume path: ${resumePath} (encoded: ${encodedResumePath})`,
  );

  return { resumeUrl, coverLetterUrl };
}
