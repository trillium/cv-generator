import type * as React from 'react'

interface SectionSourcesProps {
  sources: Record<string, string | string[]>
}

const SectionSources: React.FC<SectionSourcesProps> = ({ sources }) => {
  if (Object.keys(sources).length === 0) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Section Sources
      </h2>
      <div className="space-y-1 text-xs">
        {Object.entries(sources).map(([section, source]) => (
          <div key={section} className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">{section}:</span>
            <span className="font-mono text-gray-900 dark:text-gray-100">{String(source)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SectionSources
