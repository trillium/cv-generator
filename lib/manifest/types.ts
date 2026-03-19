export type ManifestRef = string

export type ManifestSectionKey =
  | 'header'
  | 'careerSummary'
  | 'workExperience'
  | 'projects'
  | 'technical'
  | 'education'
  | 'coverLetter'
  | 'profile'
  | 'languages'

export const SINGLETON_SECTIONS: ManifestSectionKey[] = ['header', 'profile']

export const ARRAY_SECTIONS: ManifestSectionKey[] = [
  'careerSummary',
  'workExperience',
  'projects',
  'technical',
  'education',
  'coverLetter',
  'languages',
]

export const ALL_MANIFEST_SECTIONS: ManifestSectionKey[] = [
  ...SINGLETON_SECTIONS,
  ...ARRAY_SECTIONS,
]

export type Manifest = {
  [K in ManifestSectionKey]?: K extends 'header' | 'profile' ? ManifestRef : ManifestRef[]
}

export type ParsedLibraryFilename = {
  item: string
  scope: string
  variant?: string
}

export type ResolvedManifestEntry = {
  ref: ManifestRef
  section: ManifestSectionKey
  filePath: string
  parsed: ParsedLibraryFilename
}

export type ResolvedManifest = {
  manifest: Manifest
  entries: ResolvedManifestEntry[]
  manifestPath: string
}
