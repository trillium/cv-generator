'use client'

import { usePathname } from 'next/navigation'
import { MdRefresh } from 'react-icons/md'
import { toast } from 'sonner'
import { useDirectoryManager } from '@/contexts/DirectoryManager/DirectoryManagerContext.hook'

export default function ReprintButton() {
  const { currentDirectory } = useDirectoryManager()
  const pathname = usePathname()

  const handleReprint = async () => {
    if (!currentDirectory) {
      toast.error('No resume directory loaded')
      return
    }

    const segments = pathname?.split('/').filter(Boolean) || []
    const layoutSegment = segments[0] || 'single-column-multi'
    const resumeType = layoutSegment.replace(/-multi$/, '')
    const variant = segments[1] || 'resume'
    const print = variant === 'cover-letter' ? ['cover'] : ['resume']

    try {
      console.log('🖨️ Reprint:', { currentDirectory, resumeType, variant, print, pathname })
      console.log('🖨️ Reprint:', { currentDirectory, resumeType, variant, print, pathname })

      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'dev',
          resumePath: currentDirectory,
          resumeType,
          print,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to trigger PDF generation')
      }

      toast.success(`Regenerating ${variant} PDF for ${currentDirectory}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Failed to reprint: ${message}`)
    }
  }

  return (
    <button
      onClick={handleReprint}
      className="flex items-center gap-2 rounded-md bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      title="Regenerate PDF"
    >
      <MdRefresh className="w-4 h-4" />
      <span>Reprint</span>
    </button>
  )
}
