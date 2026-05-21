'use client'

import type React from 'react'
import { useState } from 'react'
import { FiX } from 'react-icons/fi'
import type { ResumeMetadata } from '@/types'

interface MetadataEditorProps {
  metadata?: ResumeMetadata
  filePath: string
  onSave: (metadata: ResumeMetadata) => Promise<void>
  onCancel: () => void
}

export default function MetadataEditor({
  metadata,
  filePath,
  onSave,
  onCancel,
}: MetadataEditorProps) {
  const [formData, setFormData] = useState<ResumeMetadata>({
    targetCompany: metadata?.targetCompany || '',
    targetPosition: metadata?.targetPosition || '',
    targetJobUrl: metadata?.targetJobUrl || '',
    jobId: metadata?.jobId || '',
    applicationDate: metadata?.applicationDate || '',
    applicationStatus: metadata?.applicationStatus || 'draft',
    notes: metadata?.notes || '',
    tailoredFor: metadata?.tailoredFor || [],
  })

  const [tailoredInput, setTailoredInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddTailored = () => {
    if (tailoredInput.trim()) {
      setFormData({
        ...formData,
        tailoredFor: [...(formData.tailoredFor || []), tailoredInput.trim()],
      })
      setTailoredInput('')
    }
  }

  const handleRemoveTailored = (index: number) => {
    setFormData({
      ...formData,
      tailoredFor: formData.tailoredFor?.filter((_, i) => i !== index),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await onSave(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save metadata')
      setSaving(false)
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Edit Resume Metadata
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-mono">{filePath}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="meta-target-company"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Target Company
          </label>
          <input
            id="meta-target-company"
            type="text"
            value={formData.targetCompany}
            onChange={(e) => setFormData({ ...formData, targetCompany: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Google, Meta, etc."
          />
        </div>

        <div>
          <label
            htmlFor="meta-target-position"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Target Position
          </label>
          <input
            id="meta-target-position"
            type="text"
            value={formData.targetPosition}
            onChange={(e) => setFormData({ ...formData, targetPosition: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Senior Frontend Engineer"
          />
        </div>

        <div>
          <label
            htmlFor="meta-job-url"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Job Posting URL
          </label>
          <input
            id="meta-job-url"
            type="url"
            value={formData.targetJobUrl}
            onChange={(e) => setFormData({ ...formData, targetJobUrl: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="https://..."
          />
        </div>

        <div>
          <label
            htmlFor="meta-job-id"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Job ID / Requisition Number
          </label>
          <input
            id="meta-job-id"
            type="text"
            value={formData.jobId}
            onChange={(e) => setFormData({ ...formData, jobId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="R165370"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="meta-app-date"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Application Date
            </label>
            <input
              id="meta-app-date"
              type="date"
              value={formData.applicationDate}
              onChange={(e) => setFormData({ ...formData, applicationDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="meta-app-status"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Application Status
            </label>
            <select
              id="meta-app-status"
              value={formData.applicationStatus}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  applicationStatus: e.target.value as ResumeMetadata['applicationStatus'],
                })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="draft">Draft</option>
              <option value="applied">Applied</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="meta-tailored"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Tailored For
          </label>
          <div className="flex gap-2 mb-2">
            <input
              id="meta-tailored"
              type="text"
              value={tailoredInput}
              onChange={(e) => setTailoredInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddTailored()
                }
              }}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="React, accessibility, etc."
            />
            <button
              type="button"
              onClick={handleAddTailored}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tailoredFor?.map((item, idx) => (
              <span
                key={item}
                className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg text-sm flex items-center gap-2"
              >
                {item}
                <button
                  type="button"
                  onClick={() => handleRemoveTailored(idx)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                >
                  <FiX size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="meta-notes"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Notes
          </label>
          <textarea
            id="meta-notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Notes about this resume version..."
          />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}
