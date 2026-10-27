"use client";

import { ReactNode, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import Person from "@/components/characters/Person";
import { makeNpcLook } from "@/components/characters/looks";
import { STATIC_NPCS, WALKING_NPCS } from "@/constants/crowd";
import { QUALITY } from "@/constants/quality";
import { inView } from "@/lib/inView";
import { useGameStore } from "@/store/useGameStore";
import WalkingNpc from "./WalkingNpc";

/** Hides everything inside while that spot is outside the camera view (no draw calls for people you can't see). */
function Culled({
  at,
  children,
}: {
  at: [number, number, number];
  children: ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  const center = useMemo(
    () => new THREE.Vector3(at[0], at[1] + 0.9, at[2]),
    [at],
  );
  useFrame(({ camera, clock }) => {
    if (ref.current)
      ref.current.visible = inView(camera, clock.elapsedTime, center, 1.7);
  });
  return <group ref={ref}>{children}</group>;
}

export default function Crowd() {
  const quality = useGameStore((s) => s.quality);
  const q = QUALITY[quality];

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
      {statics.slice(0, q.statics).map(({ n, look }) => (
        <Culled key={n.id} at={n.position}>
          <Person
            look={look}
            pose={n.pose}
            seed={n.seed}
            position={n.position}
            rotationY={n.rotationY}
            seatHeight={n.seatHeight}
            bodyTurn={n.bodyTurn}
          />
        </Culled>
      ))}
      {walkers.slice(0, q.walkers).map(({ n, look }) => (
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
