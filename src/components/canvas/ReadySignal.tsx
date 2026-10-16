"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { preloadCharacters } from "@/lib/characterAssets";
import { sleep } from "@/lib/sleep";
import { useGameStore } from "@/store/useGameStore";

/**
 * Mounted inside <Suspense>, so it only appears once fonts and everything else resolved.
 * It also waits for the character files, so the loading screen covers their download.
 */
export default function ReadySignal() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    if (useGameStore.getState().sceneReady) return;
    let cancelled = false;

    const compile = () => {
      try {
        gl.compile(scene, camera); // compile every shader now, so nothing hitches when you first look around
      } catch {
        /* not critical */
      }
    };

    (async () => {
      compile();
      // capped, so a slow connection never blocks the page forever
      await Promise.race([
        preloadCharacters().catch(() => undefined),
        sleep(20000),
      ]);
      await sleep(900); // let the people appear in the scene, then compile their shaders too
      compile();
      if (!cancelled) useGameStore.getState().setSceneReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera]);

  return null;
}
