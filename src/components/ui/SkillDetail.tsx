import type { Skill } from "@/data/types";
import LogoBadge from "./LogoBadge";

export default function SkillDetail({ skill }: { skill: Skill }) {
  return (
    <>
      <div className="flex items-center gap-4">
        <LogoBadge
          logo={skill.logo}
          name={skill.name}
          badge={skill.badge}
          color={skill.color}
        />
        <div>
          <p
            className="text-[11px] uppercase tracking-[0.3em]"
            style={{ color: skill.color }}
          >
            {skill.category}
          </p>
          <h2 className="font-display text-2xl text-[#f4ede0]">{skill.name}</h2>
        </div>
      </div>

      <p className="mt-5 text-sm leading-relaxed text-[#d9d0bd]">
        {skill.summary}
      </p>

      {skill.usedIn && skill.usedIn.length > 0 && (
        <div className="mt-5">
          <p className="text-xs uppercase tracking-widest text-[#8a7f66]">
            Used in
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {skill.usedIn.map((u) => (
              <span
                key={u}
                className="rounded-full border border-white/15 px-3 py-1 text-xs text-[#e8dfc9]"
              >
                {u}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
