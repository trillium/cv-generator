'use client'

import type { Manifest, ManifestSectionKey } from '@/lib/manifest/types'
import { SINGLETON_SECTIONS } from '@/lib/manifest/types'

type ManifestEditorProps = {
  resumeName: string
  manifest: Manifest
  onUpdate: (manifest: Manifest) => void
  onAddRef?: (section: ManifestSectionKey) => void
}

function ManifestSection({
  section,
  refs,
  isSingleton,
  onMoveUp,
  onMoveDown,
  onRemove,
  onAdd,
}: {
  section: ManifestSectionKey
  refs: string[]
  isSingleton: boolean
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
  onRemove: (index: number) => void
  onAdd: () => void
}) {
  return (
    <div className="mb-3">
      <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
        {section}
      </h4>
      <div className="space-y-1">
        {refs.map((ref, index) => (
          <div
            key={`${ref}-${index}`}
            className="flex items-center gap-1 text-sm py-1 px-2 rounded bg-gray-50 dark:bg-gray-700/50"
          >
            {!isSingleton && <span className="text-xs text-gray-400 w-4">{index + 1}.</span>}
            <span className="flex-1 text-gray-700 dark:text-gray-300 font-mono text-xs">{ref}</span>
            {!isSingleton && refs.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => onMoveUp(index)}
                  disabled={index === 0}
                  className="text-xs px-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-default"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => onMoveDown(index)}
                  disabled={index === refs.length - 1}
                  className="text-xs px-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-default"
                >
                  ↓
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="text-xs px-1 text-red-400 hover:text-red-600 dark:hover:text-red-300"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      {!isSingleton && (
        <button
          type="button"
          onClick={onAdd}
          className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mt-1"
        >
          + Add from library
        </button>
      )}
    </div>
  )
}

export default function ManifestEditor({
  resumeName,
  manifest,
  onUpdate,
  onAddRef,
}: ManifestEditorProps) {
  function getRefs(section: ManifestSectionKey): string[] {
    const value = manifest[section]
    if (!value) return []
    return Array.isArray(value) ? value : [value]
  }

  function updateSection(section: ManifestSectionKey, refs: string[]) {
    const isSingleton = SINGLETON_SECTIONS.includes(section)
    const updated = { ...manifest }

    if (refs.length === 0) {
      delete (updated as Record<string, unknown>)[section]
    } else if (isSingleton) {
      ;(updated as Record<string, unknown>)[section] = refs[0]
    } else {
      ;(updated as Record<string, unknown>)[section] = refs
    }

    onUpdate(updated)
  }

  function moveUp(section: ManifestSectionKey, index: number) {
    if (index === 0) return
    const refs = [...getRefs(section)]
    ;[refs[index - 1], refs[index]] = [refs[index], refs[index - 1]]
    updateSection(section, refs)
  }

  function moveDown(section: ManifestSectionKey, index: number) {
    const refs = [...getRefs(section)]
    if (index >= refs.length - 1) return
    ;[refs[index], refs[index + 1]] = [refs[index + 1], refs[index]]
    updateSection(section, refs)
  }

  function remove(section: ManifestSectionKey, index: number) {
    const refs = [...getRefs(section)]
    refs.splice(index, 1)
    updateSection(section, refs)
  }

  const sections = Object.keys(manifest).filter(
    (k) => manifest[k as ManifestSectionKey] !== undefined,
  ) as ManifestSectionKey[]

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
        Manifest: {resumeName}
      </h3>

      {sections.length === 0 ? (
        <p className="text-sm text-gray-400 italic">Empty manifest</p>
      ) : (
        sections.map((section) => (
          <ManifestSection
            key={section}
            section={section}
            refs={getRefs(section)}
            isSingleton={SINGLETON_SECTIONS.includes(section)}
            onMoveUp={(i) => moveUp(section, i)}
            onMoveDown={(i) => moveDown(section, i)}
            onRemove={(i) => remove(section, i)}
            onAdd={() => onAddRef?.(section)}
          />
        ))
      )}
    </div>
  )
}
