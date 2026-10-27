"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGameStore } from "@/store/useGameStore";

/**
 * Development only. Logs:
 *  - fps / draw calls / memory every 3 seconds
 *  - every canvas resize
 *  - every phase change, with a timestamp
 *  - any frame longer than 60 ms, and any main-thread block longer than 50 ms ("longtask")
 * so a hitch can be traced to the exact moment and what was running.
 */
export default function PerfProbe() {
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const acc = useRef({ t: 0, f: 0 });

  useEffect(() => {
    console.log(`[canvas] ${size.width}x${size.height} @ dpr ${dpr}`);
  }, [size, dpr]);

  useEffect(
    () =>
      useGameStore.subscribe((s, prev) => {
        const now = performance.now().toFixed(0);
        if (s.phase !== prev.phase)
          console.log(`[phase] ${prev.phase} -> ${s.phase} @ ${now} ms`);
        if (s.sceneReady && !prev.sceneReady)
          console.log(`[phase] scene ready @ ${now} ms`);
      }),
    [],
  );

  useEffect(() => {
    if (typeof PerformanceObserver === "undefined") return;
    let obs: PerformanceObserver | null = null;
    try {
      obs = new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          console.warn(
            `[longtask] ${e.duration.toFixed(0)} ms, started @ ${e.startTime.toFixed(0)} ms (phase: ${useGameStore.getState().phase})`,
          );
        }
      });
      obs.observe({ entryTypes: ["longtask"] });
    } catch {
      /* not supported in this browser */
    }
    return () => obs?.disconnect();
  }, []);

  useFrame((_, dt) => {
    if (dt > 0.06) {
      console.warn(
        `[perf] long frame: ${(dt * 1000).toFixed(0)} ms (phase: ${useGameStore.getState().phase})`,
      );
    }
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
