import type { Project } from "@/data/types";
import LogoBadge from "./LogoBadge";
import ProjectGallery from "./ProjectGallery";

export default function ProjectDetail({ project }: { project: Project }) {
  return (
    <>
      <div className="flex items-center gap-4">
        <LogoBadge
          logo={project.logo}
          name={project.label}
          badge={project.badge}
          color={project.color}
        />
        <div>
          <p
            className="text-[11px] uppercase tracking-[0.3em]"
            style={{ color: project.color }}
          >
            {project.kind}
          </p>
          <h2 className="font-display text-xl leading-snug text-[#f4ede0] sm:text-2xl">
            {project.name}
          </h2>
        </div>
      </div>

      <p className="mt-5 text-sm leading-relaxed text-[#d9d0bd]">
        {project.description}
      </p>

      <ul className="mt-4 space-y-2">
        {project.highlights.map((h) => (
          <li
            key={h}
            className="flex gap-2 text-sm leading-relaxed text-[#d9d0bd]"
          >
            <span style={{ color: project.color }}>◆</span>
            <span>{h}</span>
          </li>
        ))}
      </ul>

      <ProjectGallery project={project} />

      <div className="mt-5 flex flex-wrap gap-2">
        {project.tech.map((t) => (
          <span
            key={t}
            className="rounded-full border border-white/15 px-3 py-1 text-xs text-[#e8dfc9]"
          >
            {t}
          </span>
        ))}
      </div>

      {project.link && (
        <a
          href={project.link.url}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-block rounded-lg bg-[#d4af37] px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-black transition hover:bg-[#ffe08a]"
        >
          {project.link.label} ↗
        </a>
      )}
    </>
  );
}
