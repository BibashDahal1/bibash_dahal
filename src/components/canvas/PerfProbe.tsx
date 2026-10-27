"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

/** Development only: logs fps, draw calls and memory every 3 seconds, so you can see what a change really did. */
export default function PerfProbe() {
  const gl = useThree((s) => s.gl);
  const acc = useRef({ t: 0, f: 0 });

  useFrame((_, dt) => {
    acc.current.t += dt;
    acc.current.f++;
    if (acc.current.t < 3) return;
    const { calls, triangles } = gl.info.render;
    const { geometries, textures } = gl.info.memory;
    console.log(
      `[perf] ${(acc.current.f / acc.current.t).toFixed(0)} fps | ${calls} draw calls | ${(triangles / 1000).toFixed(0)}k tris | ${geometries} geometries | ${textures} textures | ${gl.info.programs?.length ?? 0} shader programs`,
    );
    acc.current = { t: 0, f: 0 };
  });

  return null;
}
