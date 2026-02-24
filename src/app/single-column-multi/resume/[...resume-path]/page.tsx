'use client'
import DynamicMultiColumnPage from '@/src/app/DynamicMultiColumnPage'
export default function DynamicSingleColumnMultiResumePage() {
  return (
    <DynamicMultiColumnPage
      variant="resume"
      layout="single-column"
      defaultRoute="/single-column/resume"
    />
  )
}
