'use client'

import { useState } from 'react'

type ItemIndex = {
  scopes: string[]
  variants?: Record<string, string[]>
  usedIn: string[]
}

type LibraryIndex = Record<string, Record<string, ItemIndex>>

type LibraryBrowserProps = {
  library: LibraryIndex
  onSelectRef?: (section: string, ref: string) => void
}

export default function LibraryBrowser({ library, onSelectRef }: LibraryBrowserProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  function toggleSection(section: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  const sections = Object.keys(library)

  if (sections.length === 0) {
    return <p className="text-sm text-gray-400 dark:text-gray-500 italic">No library content yet</p>
  }

  return (
    <div className="space-y-1">
      {sections.map((section) => {
        const items = library[section]
        const isExpanded = expandedSections.has(section)

        return (
          <div key={section}>
            <button
              type="button"
              onClick={() => toggleSection(section)}
              className="flex items-center gap-1 w-full text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 py-1"
            >
              <span className="text-xs text-gray-400">{isExpanded ? '▼' : '▶'}</span>
              <span>{section}/</span>
              <span className="text-xs text-gray-400 ml-auto">{Object.keys(items).length}</span>
            </button>

            {isExpanded && (
              <div className="ml-4 space-y-0.5">
                {Object.entries(items).map(([item, info]) => (
                  <div key={item} className="text-sm">
                    <div className="flex items-center gap-1 py-0.5">
                      <span className="text-gray-600 dark:text-gray-400">{item}</span>
                      <div className="flex gap-1 ml-1">
                        {info.scopes.map((scope) => (
                          <button
                            key={scope}
                            type="button"
                            onClick={() => onSelectRef?.(section, `${item}.${scope}`)}
                            className="text-xs px-1.5 py-0.5 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
                          >
                            {scope}
                          </button>
                        ))}
                      </div>
                    </div>
                    {info.usedIn.length > 0 && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                        used in: {info.usedIn.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
