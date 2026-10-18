"use client";

import { PROJECTS_ROOM, featuredSlot, projectSlots } from "@/constants/rooms";
import ProjectBay from "@/components/world/projects/ProjectBay";
import ProjectsShell from "@/components/world/projects/ProjectsShell";

/**
 * The futuristic gallery. The featured project (if any) is on the front wall; every other project
 * has a bay on a side wall. All of it comes from data/projects.ts.
 */
export default function ProjectsRoom() {
  const bayZs = [...new Set(projectSlots.map((s) => s.along))];
  if (featuredSlot) bayZs.push(featuredSlot.plinthZ);

  return (
    <ProjectsShell
      dims={PROJECTS_ROOM}
      bayZs={bayZs}
      titleOnFarWall={!featuredSlot}
    >
      {featuredSlot && <ProjectBay slot={featuredSlot} index={0} />}
      {projectSlots.map((slot, i) => (
        <ProjectBay key={slot.project.id} slot={slot} index={i} />
      ))}
    </ProjectsShell>
  );
}
