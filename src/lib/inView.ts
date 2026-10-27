import * as THREE from "three";

const frustum = new THREE.Frustum();
const m4 = new THREE.Matrix4();
const sphere = new THREE.Sphere();
let stamp = -1;
let camId = -1;

/**
 * Culling switch. While it is off, everything counts as "in view".
 * The pre-warm turns it off so every object is drawn once (and its data uploaded) during loading.
 */
export const cullState = { enabled: true };

/**
 * Is a sphere inside the camera view? The frustum is rebuilt once per frame and shared by everything that asks,
 * so any number of objects can cull themselves for almost no cost.
 * `time` is state.clock.elapsedTime (it is the same for every callback within one frame).
 */
export function inView(
  camera: THREE.Camera,
  time: number,
  center: THREE.Vector3,
  radius: number,
) {
  if (!cullState.enabled) return true;
  if (time !== stamp || camera.id !== camId) {
    stamp = time;
    camId = camera.id;
    camera.updateMatrixWorld();
    m4.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(m4);
  }
  sphere.center.copy(center);
  sphere.radius = radius * 1.1 + 0.3; // a little margin so fast turns never pop
  return frustum.intersectsSphere(sphere);
}
