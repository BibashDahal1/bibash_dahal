"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import Person from "@/components/characters/Person";
import { GUIDE_LOOK } from "@/components/characters/looks";
import type { PoseName } from "@/components/characters/poses";
import { guide } from "@/lib/guide";
import { useGameStore } from "@/store/useGameStore";
import SpeechBubble from "./SpeechBubble";

/** Moves the guide according to lib/guide.ts. Invisible until the story script places him. */
export default function Guide() {
  const body = useRef<THREE.Group>(null);
  const tag = useRef<THREE.Group>(null);
  const poseRef = useRef<PoseName>("stand");
  const [pose, setPose] = useState<PoseName>("stand");
  const line = useGameStore((s) => s.lines.guide);

  useFrame((_, delta) => {
    const b = body.current;
    const t = tag.current;
    if (!b || !t) return;
    const dt = Math.min(delta, 0.05);

    const turnTo = (target: number) => {
      const d = Math.atan2(
        Math.sin(target - guide.yaw),
        Math.cos(target - guide.yaw),
      );
      guide.yaw += d * (1 - Math.exp(-8 * dt));
    };

    let moving = false;
    const goal = guide.target;
    if (goal) {
      const dx = goal.x - guide.x;
      const dz = goal.z - guide.z;
      const dist = Math.hypot(dx, dz);
      const step = goal.speed * dt;
      if (dist <= step) {
        guide.x = goal.x;
        guide.z = goal.z;
        guide.target = null;
        const done = guide.resolve;
        guide.resolve = null;
        done?.();
      } else {
        guide.x += (dx / dist) * step;
        guide.z += (dz / dist) * step;
        turnTo(Math.atan2(dx, dz)); // characters face +z at yaw 0
        moving = true;
      }
    } else if (guide.faceAt) {
      turnTo(Math.atan2(guide.faceAt.x - guide.x, guide.faceAt.z - guide.z));
    }

    b.visible = t.visible = guide.visible;
    b.position.set(guide.x, 0, guide.z);
    b.rotation.y = guide.yaw;
    t.position.set(guide.x, 0, guide.z); // bubble follows position only, never rotates

    const want: PoseName = moving ? "walk" : "stand";
    if (want !== poseRef.current) {
      poseRef.current = want;
      setPose(want);
    }
  });

  return (
    <>
      <group ref={body} visible={false}>
        <Person
          look={GUIDE_LOOK}
          modelIndex={0}
          pose={pose}
          seed={77}
          lookAtCamera={pose === "stand"}
          walkSpeed={1.3}
        />
      </group>
      <group ref={tag} visible={false}>
        <SpeechBubble text={line} position={[0, 2.1, 0]} />
      </group>
    </>
  );
}
