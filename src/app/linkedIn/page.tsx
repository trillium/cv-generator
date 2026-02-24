'use client'

import { useEffect } from 'react'
import LinkedInProfile from '@/components/LinkedIn/LinkedInProfile'
import { LinkedInProvider, useLinkedInData } from '@/contexts/LinkedInContext'
import { ErrorState, LoadingState } from '@/src/components/SharedUIStates'

function LinkedInPageContent() {
  const { currentLinkedInData, loadLinkedInFile, loading, error } = useLinkedInData()

  useEffect(() => {
    loadLinkedInFile('linkedin')
  }, [loadLinkedInFile])

  if (loading) {
    return <LoadingState message="Loading LinkedIn profile..." />
  }

  if (error) {
    return <ErrorState message={error} />
  }

  if (!currentLinkedInData) {
    return null
  }

  return <LinkedInProfile data={currentLinkedInData} />
}

export default function LinkedInPage() {
  return (
    <LinkedInProvider>
      <LinkedInPageContent />
    </LinkedInProvider>
  )
}
