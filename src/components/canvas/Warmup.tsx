"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { prewarmScene } from "@/lib/prewarm";
import { useGameStore } from "@/store/useGameStore";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Mounted once per scene (key={scene}). Uploads every texture to the GPU a couple at a time.
 * When this is a room change (the first load is handled by ReadySignal), it also draws the whole room once
 * while the screen is still black from the fade, so the room never hitches as the fade lifts.
 */
export default function Warmup() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const roomChange = useGameStore.getState().sceneReady;
      await sleep(roomChange ? 40 : 250); // let the scene finish mounting

      const found = new Set<THREE.Texture>();
      const add = (v: unknown) => {
        const t = v as THREE.Texture | null;
        if (t && t.isTexture) found.add(t);
      };
      scene.traverse((o) => {
        const m = (o as THREE.Mesh).material as
          | THREE.Material
          | THREE.Material[]
          | undefined;
        if (!m) return;
        for (const mat of Array.isArray(m) ? m : [m]) {
          for (const v of Object.values(mat)) add(v); // map, emissiveMap, roughnessMap, ...
          const uniforms = (mat as THREE.ShaderMaterial).uniforms;
          if (uniforms) for (const k in uniforms) add(uniforms[k].value);
        }
      });

      const list = [...found].filter(
        (t) => t.image && !(t as THREE.VideoTexture).isVideoTexture,
      );
      for (let i = 0; i < list.length; i++) {
        if (cancelled) return;
        try {
          gl.initTexture(list[i]);
        } catch {
          /* a texture that can't be pre-uploaded just uploads on first use, as before */
        }
        if (i % 2 === 1) await sleep(0); // spread the uploads over several frames
      }

      if (!cancelled && roomChange)
        await prewarmScene(gl, scene, camera, () => cancelled);
    })();

    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera]);

  return null;
}
