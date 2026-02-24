'use client'

import { useState } from 'react'
import { useDirectoryManager } from '@/contexts/DirectoryManager/DirectoryManagerContext.hook'
import { useModal } from '@/contexts/ModalContext'
import { DEFAULT_SCALE, MAX_SCALE, MIN_SCALE, SCALE_STEP } from './PdfPreview.constants'
import type { PdfPreviewProps } from './types'
import { getPdfMetadata } from './utils'

export default function PdfPreview({ pdfUrl }: PdfPreviewProps) {
  const [scale, setScale] = useState(DEFAULT_SCALE)
  const { closeModal } = useModal()
  const { storedPdfMetadata, documentType } = useDirectoryManager()

  const metadata = documentType ? getPdfMetadata(storedPdfMetadata, documentType) : null

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + SCALE_STEP, MAX_SCALE))
  }

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - SCALE_STEP, MIN_SCALE))
  }

  const handleDownload = () => {
    window.open(pdfUrl, '_blank')
  }

  return (
    <div className="pdf-preview-container flex flex-col h-full">
      <div className="pdf-controls flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center gap-4">
          <button
            onClick={handleZoomOut}
            disabled={scale <= MIN_SCALE}
            className="px-3 py-1 bg-white border rounded hover:bg-gray-100 disabled:opacity-50"
            type="button"
          >
            -
          </button>
          <span className="text-sm font-medium">{Math.round(scale * 100)}%</span>
          <button
            onClick={handleZoomIn}
            disabled={scale >= MAX_SCALE}
            className="px-3 py-1 bg-white border rounded hover:bg-gray-100 disabled:opacity-50"
            type="button"
          >
            +
          </button>
        </div>

        <div className="flex items-center gap-2">
          {metadata?.pageCount !== undefined && (
            <span className="text-sm text-gray-600">
              {metadata.pageCount} {metadata.pageCount === 1 ? 'page' : 'pages'}
            </span>
          )}
          {metadata?.error && (
            <span className="text-sm text-red-600" title={metadata.error}>
              ⚠️ Has errors
            </span>
          )}
          <button
            onClick={handleDownload}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            type="button"
          >
            Download
          </button>
          <button
            onClick={closeModal}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            type="button"
          >
            Close
          </button>
        </div>
      </div>

      <div className="pdf-viewer flex-1 overflow-auto bg-gray-200 p-4">
        <div
          className="pdf-container mx-auto bg-white shadow-lg"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease-in-out',
          }}
        >
          <iframe src={pdfUrl} className="w-full h-screen border-0" title="PDF Preview" />
        </div>
      </div>

      {metadata?.offScreenText && metadata.offScreenText.length > 0 && (
        <div className="pdf-warnings p-4 border-t bg-yellow-50">
          <p className="text-sm font-medium text-yellow-800 mb-2">⚠️ Off-screen content detected:</p>
          <ul className="text-xs text-yellow-700 list-disc list-inside">
            {metadata.offScreenText.slice(0, 5).map((text: string, i: number) => (
              <li key={i}>{text}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
