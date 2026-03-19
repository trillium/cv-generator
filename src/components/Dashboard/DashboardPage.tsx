'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import type { ResumeTarget } from '@/app/api/dashboard/resumes/route'
import type { Manifest, ManifestSectionKey } from '@/lib/manifest/types'
import LibraryBrowser from './LibraryBrowser'
import ManifestEditor from './ManifestEditor'
import ResumeCard from './ResumeCard'

type LibraryIndex = Record<
  string,
  Record<string, { scopes: string[]; variants?: Record<string, string[]>; usedIn: string[] }>
>

export default function DashboardPage() {
  const router = useRouter()
  const [resumes, setResumes] = useState<ResumeTarget[]>([])
  const [library, setLibrary] = useState<LibraryIndex>({})
  const [selectedResume, setSelectedResume] = useState<ResumeTarget | null>(null)
  const [manifest, setManifest] = useState<Manifest | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/resumes').then((r) => r.json()),
      fetch('/api/dashboard/library').then((r) => r.json()),
    ]).then(([resumeData, libraryData]) => {
      setResumes(resumeData.resumes || [])
      setLibrary(libraryData.library || {})
      setLoading(false)
    })
  }, [])

  const loadManifest = useCallback(async (resume: ResumeTarget) => {
    const res = await fetch(`/api/dashboard/manifest?path=${encodeURIComponent(resume.path)}`)
    const data = await res.json()
    setManifest(data.manifest || {})
  }, [])

  function handleSelect(resume: ResumeTarget) {
    setSelectedResume(resume)
    loadManifest(resume)
  }

  function handleOpen(resume: ResumeTarget) {
    router.push(`/single-column-multi/resume/${resume.path}`)
  }

  async function handlePrint(resume: ResumeTarget) {
    await fetch('/api/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ directoryPath: resume.path }),
    })
  }

  async function handleManifestUpdate(updated: Manifest) {
    if (!selectedResume) return
    setManifest(updated)

    await fetch('/api/dashboard/manifest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dirPath: selectedResume.path, manifest: updated }),
    })
  }

  function handleAddRef(section: ManifestSectionKey) {
    if (!manifest || !selectedResume) return

    const sectionLibrary = library[section]
    if (!sectionLibrary) return

    const firstItem = Object.keys(sectionLibrary)[0]
    if (!firstItem) return

    const firstScope = sectionLibrary[firstItem].scopes[0]
    const ref = `${firstItem}.${firstScope}`

    const current = manifest[section]
    const refs = current ? (Array.isArray(current) ? [...current] : [current]) : []
    refs.push(ref)

    const updated = { ...manifest, [section]: refs } as Manifest
    handleManifestUpdate(updated)
  }

  function handleLibrarySelect(section: string, ref: string) {
    if (!manifest || !selectedResume) return

    const sectionKey = section as ManifestSectionKey
    const current = manifest[sectionKey]
    const refs = current ? (Array.isArray(current) ? [...current] : [current]) : []
    refs.push(ref)

    const updated = { ...manifest, [sectionKey]: refs } as Manifest
    handleManifestUpdate(updated)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-1">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Target Resumes
          </h2>
          <div className="space-y-2">
            {resumes.map((resume) => (
              <ResumeCard
                key={resume.name}
                resume={resume}
                isSelected={selectedResume?.name === resume.name}
                onSelect={handleSelect}
                onOpen={handleOpen}
                onPrint={handlePrint}
              />
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Library
          </h2>
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 max-h-[400px] overflow-y-auto">
            <LibraryBrowser library={library} onSelectRef={handleLibrarySelect} />
          </div>
        </div>
      </div>

      {selectedResume && manifest && (
        <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
          <ManifestEditor
            resumeName={selectedResume.name}
            manifest={manifest}
            onUpdate={handleManifestUpdate}
            onAddRef={handleAddRef}
          />
        </div>
      )}
    </div>
  )
}
