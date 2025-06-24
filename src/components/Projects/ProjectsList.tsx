import Projects from "./Projects";
import type { Project } from "../../types";

export default function ProjectsList({
  projects = [],
  showBubbles = true,
}: {
  projects?: Project[];
  showBubbles?: boolean;
}) {
  return <Projects data={projects} showBubbles={showBubbles} />;
}
