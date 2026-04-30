'use client'

import { useEffect, useRef, useState } from 'react'
import { PDF_CONFIG } from '@/components/PrintPageSize/PrintPageSize.constants'

const { contentWidth, contentHeight } = PDF_CONFIG

export default function PaperSheet({ children }: { children: React.ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [overflowing, setOverflowing] = useState(false)

  useEffect(() => {
    const el = contentRef.current
    if (!el) return

    const observer = new ResizeObserver(([entry]) => {
      setOverflowing(entry.contentRect.height > contentHeight)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="paper-sheet-wrapper print:p-0 print:bg-transparent print:flex print:justify-start">
      <div
        className="paper-sheet bg-white dark:bg-gray-800 print:shadow-none print:mx-0"
        style={{ width: contentWidth, minHeight: contentHeight }}
      >
        <div ref={contentRef} className="paper-content">
          {children}
        </div>
        <div
          className="page-break-line print:hidden"
          style={{ top: contentHeight }}
          aria-hidden="true"
        />
        {overflowing && (
          <div className="page-overflow-badge print:hidden">Content exceeds one page</div>
        )}
      </div>
    </div>
  )
}
