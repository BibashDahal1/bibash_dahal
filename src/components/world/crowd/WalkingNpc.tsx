"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import Person from "@/components/characters/Person";
import type { CharacterLook } from "@/components/characters/looks";
import type { PoseName } from "@/components/characters/poses";

type Props = {
  look: CharacterLook;
  path: readonly (readonly [number, number])[];
  speed?: number;
  seed?: number;
  pauseRange?: [number, number]; // seconds spent standing at each waypoint
};

/** Walks a looping route, pausing at each waypoint. Passes through the player visually (no avoidance yet). */
export default function WalkingNpc({
  look,
  path,
  speed = 1.1,
  seed = 0,
  pauseRange = [1.5, 4],
}: Props) {
  const group = useRef<THREE.Group>(null);
  const [pose, setPose] = useState<PoseName>("walk");
  const s = useRef({
    x: path[0][0],
    z: path[0][1],
    yaw: 0,
    next: 1,
    wait: 0,
    pose: "walk" as PoseName,
  });

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);
    const st = s.current;
    let want: PoseName = "walk";

    if (st.wait > 0) {
      st.wait -= dt;
      want = "stand";
    } else {
      const [tx, tz] = path[st.next];
      const dx = tx - st.x;
      const dz = tz - st.z;
      const dist = Math.hypot(dx, dz);
      const step = speed * dt;

      if (dist <= step) {
        st.x = tx;
        st.z = tz;
        st.next = (st.next + 1) % path.length;
        st.wait =
          pauseRange[0] + Math.random() * (pauseRange[1] - pauseRange[0]);
        want = "stand";
      } else {
        st.x += (dx / dist) * step;
        st.z += (dz / dist) * step;
        const targetYaw = Math.atan2(dx, dz); // characters face +z at yaw 0
        const diff = Math.atan2(
          Math.sin(targetYaw - st.yaw),
          Math.cos(targetYaw - st.yaw),
        );
        st.yaw += diff * (1 - Math.exp(-8 * dt));
      }
    }

    g.position.set(st.x, 0, st.z);
    g.rotation.y = st.yaw;

    if (want !== st.pose) {
      st.pose = want;
      setPose(want);
    }
  });

  return (
    <group ref={group}>
      <Person look={look} pose={pose} seed={seed} walkSpeed={speed / 1.1} />
    </group>
  );
}
