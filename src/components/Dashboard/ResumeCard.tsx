'use client'

import type { ResumeTarget } from '@/app/api/dashboard/resumes/route'

type ResumeCardProps = {
  resume: ResumeTarget
  isSelected: boolean
  onSelect: (resume: ResumeTarget) => void
  onOpen: (resume: ResumeTarget) => void
  onPrint: (resume: ResumeTarget) => void
}

export default function ResumeCard({
  resume,
  isSelected,
  onSelect,
  onOpen,
  onPrint,
}: ResumeCardProps) {
  return (
    <div
      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
        isSelected
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-400'
          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
      }`}
      onClick={() => onSelect(resume)}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-900 dark:text-gray-100">{resume.name}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {resume.hasManifest ? `${resume.sectionCount} sections` : 'No manifest'}
          </p>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onOpen(resume)
            }}
            className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Open
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onPrint(resume)
            }}
            className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  )
}
