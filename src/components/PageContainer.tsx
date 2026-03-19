'use client'

import { useEffect, useRef } from 'react'

const PDF_PAGE_HEIGHT = 1260

export default function PageContainer({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new ResizeObserver(([entry]) => {
      el.classList.toggle('page-overflow', entry.contentRect.height > PDF_PAGE_HEIGHT)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <main ref={ref} className="resume-content min-h-[1260px] flex flex-col">
      {children}
    </main>
  )
}
