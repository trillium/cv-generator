import type { Project } from '@/types'
import Projects from './Projects'

export default function ProjectsList({
  projects = [],
  showBubbles = true,
}: {
  projects?: Project[]
  showBubbles?: boolean
}) {
  return <Projects data={projects} showBubbles={showBubbles} />
}
