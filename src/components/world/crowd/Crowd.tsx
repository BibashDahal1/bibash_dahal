"use client";

import { useMemo } from "react";

import Person from "@/components/characters/Person";
import { makeNpcLook } from "@/components/characters/looks";
import { STATIC_NPCS, WALKING_NPCS } from "@/constants/crowd";
import { QUALITY } from "@/constants/quality";
import { useGameStore } from "@/store/useGameStore";
import WalkingNpc from "./WalkingNpc";

export default function Crowd() {
  const quality = useGameStore((s) => s.quality);

  // Looks are generated once, so each person's materials stay stable between renders
  const statics = useMemo(
    () => STATIC_NPCS.map((n) => ({ n, look: makeNpcLook(n.seed) })),
    [],
  );
  const walkers = useMemo(
    () => WALKING_NPCS.map((n) => ({ n, look: makeNpcLook(n.seed) })),
    [],
  );

  return (
    <>
      {statics.map(({ n, look }) => (
        <Person
          key={n.id}
          look={look}
          pose={n.pose}
          seed={n.seed}
          position={n.position}
          rotationY={n.rotationY}
          seatHeight={n.seatHeight}
          bodyTurn={n.bodyTurn}
        />
      ))}
      {walkers.slice(0, QUALITY[quality].walkers).map(({ n, look }) => (
        <WalkingNpc
          key={n.id}
          look={look}
          path={n.path}
          speed={n.speed}
          seed={n.seed}
        />
      ))}
    </>
  );
}
