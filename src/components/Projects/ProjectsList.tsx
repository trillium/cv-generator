import Projects from "./Projects";
import type { Project } from "../../types";

export default function ProjectsList({
  projects = [],
}: {
  projects?: Project[];
}) {
  return (
    <>
      {Array.isArray(projects) && projects.length > 0 && (
        <Projects data={projects} />
      )}
    </>
  );
}
