"use client";

import { Text } from "@react-three/drei";

import {
  OFFICE,
  OFFICE_DESK,
  officePlants,
  skillSlots,
} from "@/constants/rooms";
import { GOLD } from "@/constants/world";
import Hologram from "@/components/world/holograms/Hologram";
import Plant from "@/components/world/props/Plant";
import { useGameStore } from "@/store/useGameStore";
import OfficeDesk from "./OfficeDesk";
import RoomShell from "@/components/world/shell/RoomShell";
import { THEMES } from "@/constants/themes";
import GoldenName from "@/components/world/lobby/GoldenName";

// First hologram of each category on each side gets a wall label
const categoryLabels = skillSlots.filter((slot, i) => {
  const previous = skillSlots
    .slice(0, i)
    .reverse()
    .find((p) => p.side === slot.side);
  return !previous || previous.skill.category !== slot.skill.category;
});

export default function OfficeRoom() {
  const { width: W, depth: D } = OFFICE;

  return (
    <RoomShell dims={OFFICE} theme={THEMES.office} chandelierScale={0.85}>
      {/* far wall title */}
      <GoldenName
        position={[0, 3.7, -D / 2 + 0.06]}
        fontSize={0.8}
        subtitle="FULL STACK DEVELOPER"
      />

      <OfficeDesk x={OFFICE_DESK.x} z={OFFICE_DESK.z} />

      {/* category labels on the side walls */}
      {categoryLabels.map((slot) => (
        <Text
          key={`cat-${slot.skill.id}`}
          position={[slot.side * (W / 2 - 0.06), 3.7, slot.z]}
          rotation={[0, slot.side < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
          fontSize={0.24}
          letterSpacing={0.25}
          color={GOLD}
          anchorX="center"
          anchorY="middle"
        >
          {slot.skill.category.toUpperCase()}
        </Text>
      ))}

      {/* skill holograms */}
      {skillSlots.map(({ skill, x, z }) => (
        <Hologram
          key={skill.id}
          id={`skill:${skill.id}`}
          x={x}
          z={z}
          name={skill.name}
          color={skill.color}
          logo={skill.logo}
          badge={skill.badge}
          interactLabel={`View ${skill.name}`}
          onActivate={() =>
            useGameStore.getState().openDetail({ kind: "skill", skill })
          }
        />
      ))}

      {/* plants in every gap */}
      {officePlants.map((p) => (
        <Plant
          key={`${p.x}:${p.z}`}
          position={[p.x, 0, p.z]}
          variant={p.variant}
          scale={p.scale}
        />
      ))}
    </RoomShell>
  );
}
