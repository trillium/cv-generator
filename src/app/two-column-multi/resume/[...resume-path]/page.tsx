'use client'
import DynamicMultiColumnPage from '@/src/app/DynamicMultiColumnPage'
export default function DynamicTwoColumnMultiResumePage() {
  return (
    <DynamicMultiColumnPage
      variant="resume"
      layout="two-column"
      defaultRoute="/two-column/resume"
    />
  )
}
