'use client'

import ResumeNavigator from '@/components/ResumeNavigator/ResumeNavigator'
import { useModal } from '@/contexts/ModalContext'

interface ResumeNavigationModalProps {
  buttonText?: string
  buttonClassName?: string
  onSelectResume?: (filePath: string) => void
}

/**
 * A component that opens the ResumeNavigator in a modal with navigation capabilities
 * This is useful for adding navigation functionality to any page
 */
export default function ResumeNavigationModal({
  buttonText = 'Browse Resumes',
  buttonClassName = 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors',
  onSelectResume,
}: ResumeNavigationModalProps) {
  const { openModal } = useModal()

  const openNavigator = () => {
    openModal(<ResumeNavigator onSelectResume={onSelectResume} />, 'xl')
  }

  return (
    <button onClick={openNavigator} className={buttonClassName}>
      {buttonText}
    </button>
  )
}
