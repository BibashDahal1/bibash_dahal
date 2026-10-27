import * as THREE from "three";
import { cullState } from "@/lib/inView";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** resolves after n animation frames (or after 1 s, so a hidden tab can never block it) */
function frames(n: number) {
  const run = new Promise<void>((resolve) => {
    let left = n;
    const step = () => {
      if (--left <= 0) resolve();
      else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
  return Promise.race([run, sleep(1000)]);
}

/**
 * Draws the WHOLE scene once, including everything outside the current view.
 * A GPU upload (geometry, textures) and shader compile normally happen the first time something is drawn,
 * which lands exactly when you first look at it. Doing it here, behind the loading screen or a fade to black,
 * means nothing hitches later.
 */
export async function prewarmScene(
  gl: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  isCancelled: () => boolean = () => false,
) {
  cullState.enabled = false; // culled objects switch themselves back on during the next frames
  try {
    await frames(3);
    if (isCancelled()) return;

    const changed: THREE.Object3D[] = [];
    scene.traverse((o) => {
      if (o.frustumCulled) {
        o.frustumCulled = false; // draw it even though it is outside the view
        changed.push(o);
      }
    });
    try {
      gl.compile(scene, camera);
      gl.render(scene, camera);
    } catch {
      /* not critical: things just upload when first seen, as before */
    }
    for (const o of changed) o.frustumCulled = true;
  } finally {
    cullState.enabled = true;
  }
}
