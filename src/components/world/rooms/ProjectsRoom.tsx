"use client";

import { PROJECTS_ROOM, projectSlots } from "@/constants/rooms";
import ProjectBay from "@/components/world/projects/ProjectBay";
import ProjectsShell from "@/components/world/projects/ProjectsShell";

/** The futuristic gallery: one bay per entry in data/projects.ts. */
export default function ProjectsRoom() {
  const bayZs = [...new Set(projectSlots.map((s) => s.bayZ))];

  return (
    <ProjectsShell dims={PROJECTS_ROOM} bayZs={bayZs}>
      {projectSlots.map((slot, i) => (
        <ProjectBay key={slot.project.id} slot={slot} index={i} />
      ))}
    </ProjectsShell>
  );
}
