"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { preloadCharacters } from "@/lib/characterAssets";
import { prewarmScene } from "@/lib/prewarm";
import { sleep } from "@/lib/sleep";
import { useGameStore } from "@/store/useGameStore";

/**
 * Mounted inside <Suspense>, so it only appears once fonts and everything else resolved.
 * It waits for the character files, then draws the whole lobby once (nothing hitches later),
 * and only then tells the loading screen it can lift.
 */
export default function ReadySignal() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    if (useGameStore.getState().sceneReady) return;
    let cancelled = false;

    (async () => {
      try {
        gl.compile(scene, camera); // start compiling shaders right away
      } catch {
        /* not critical */
      }
      // capped, so a slow connection never blocks the page forever
      await Promise.race([
        preloadCharacters().catch(() => undefined),
        sleep(20000),
      ]);
      await sleep(900); // let the people appear in the scene
      if (cancelled) return;

      await prewarmScene(gl, scene, camera, () => cancelled);
      if (!cancelled) useGameStore.getState().setSceneReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera]);

  return null;
}
