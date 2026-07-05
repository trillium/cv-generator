export type ManifestRef = string

export type ManifestSectionKey =
  | 'header'
  | 'careerSummary'
  | 'workExperience'
  | 'openSource'
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
  'openSource',
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

export type ManifestMeta = {
  resumeType?: string
  version?: string
  pages?: number
  trackingLevel?: number
}

export const MANIFEST_META_KEYS: (keyof ManifestMeta)[] = [
  'resumeType',
  'version',
  'pages',
  'trackingLevel',
]

export type Manifest = {
  [K in ManifestSectionKey]?: K extends 'header' | 'profile' ? ManifestRef : ManifestRef[]
} & ManifestMeta

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
