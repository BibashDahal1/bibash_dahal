import * as THREE from "three";
import type { Quality } from "@/constants/quality";

export interface CharacterGeometries {
  sphere: THREE.SphereGeometry; // radius 1
  hemi: THREE.SphereGeometry; // top cap of a sphere (hair)
  limb: THREE.CylinderGeometry; // diameter 1, slightly tapering toward the bottom
  tube: THREE.CylinderGeometry; // diameter 1, straight
  box: THREE.BoxGeometry; // 1x1x1
}

const cache: Partial<Record<Quality, CharacterGeometries>> = {};

/** One shared set of unit shapes for every person in the scene, scaled per body part. */
export function getGeometries(q: Quality): CharacterGeometries {
  const hit = cache[q];
  if (hit) return hit;
  const hi = q === "high";
  const w = hi ? 20 : 10;
  const h = hi ? 14 : 7;
  const r = hi ? 14 : 8;
  const made: CharacterGeometries = {
    sphere: new THREE.SphereGeometry(1, w, h),
    hemi: new THREE.SphereGeometry(1, w, h, 0, Math.PI * 2, 0, Math.PI * 0.56),
    limb: new THREE.CylinderGeometry(0.5, 0.42, 1, r),
    tube: new THREE.CylinderGeometry(0.5, 0.5, 1, r),
    box: new THREE.BoxGeometry(1, 1, 1),
  };
  cache[q] = made;
  return made;
}
