import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { CHARACTERS } from "@/constants/characters";

export interface Asset {
  scene: THREE.Object3D;
  animations: THREE.AnimationClip[];
}
export interface ModelPool {
  male: string[];
  female: string[];
}

// ---------------------------------------------------------------- loading
const assets = new Map<string, Promise<Asset>>();

/** Loads a .glb / .gltf / .fbx once; every person shares the result (then clones it). */
export function loadAsset(url: string): Promise<Asset> {
  let job = assets.get(url);
  if (!job) {
    job = /\.fbx(\?|$)/i.test(url)
      ? new FBXLoader()
          .loadAsync(url)
          .then((obj) => ({ scene: obj, animations: obj.animations }))
      : new GLTFLoader()
          .loadAsync(url)
          .then((gltf) => ({ scene: gltf.scene, animations: gltf.animations }));
    assets.set(url, job);
  }
  return job;
}

let poolJob: Promise<ModelPool> | null = null;

/** Which of the configured character files actually exist. Checked once. */
export function getModelPool(): Promise<ModelPool> {
  if (!poolJob) {
    poolJob = (async () => {
      if (!CHARACTERS.enabled) return { male: [], female: [] };
      const exists = async (url: string) => {
        try {
          const res = await fetch(url, { method: "HEAD" });
          const type = res.headers.get("content-type") ?? "";
          return res.ok && !type.includes("text/html") ? url : null;
        } catch {
          return null;
        }
      };
      const check = async (urls: string[]) =>
        (await Promise.all(urls.map(exists))).filter((u): u is string => !!u);
      return {
        male: await check(CHARACTERS.models.male),
        female: await check(CHARACTERS.models.female),
      };
    })();
  }
  return poolJob;
}

/** Downloads every character and animation file ahead of time (behind the loading screen). */
export async function preloadCharacters() {
  const pool = await getModelPool();
  const urls = new Set<string>([
    ...pool.male,
    ...pool.female,
    ...(Object.values(CHARACTERS.animations).filter(Boolean) as string[]),
  ]);
  if (pool.male.length + pool.female.length === 0) return;
  await Promise.allSettled([...urls].map(loadAsset));
}

// ---------------------------------------------------------------- skeleton helpers
/** "mixamorig:Hips", "mixamorigHips" and "Hips" all become "hips", so Mixamo animations fit any similar skeleton. */
export const normKey = (name: string) =>
  name
    .replace(/^mixamorig[:_]?/i, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();

export function findBone(root: THREE.Object3D, key: string) {
  let found = null as THREE.Object3D | null;
  root.traverse((o) => {
    if (!found && normKey(o.name) === key) found = o;
  });
  return found;
}

/** Scales a model to a real-world height and puts its feet on the floor. */
export function normalize(root: THREE.Object3D, targetHeight: number) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const h = box.max.y - box.min.y;
  if (!Number.isFinite(h) || h <= 0) return;
  root.scale.multiplyScalar(targetHeight / h);
  root.updateMatrixWorld(true);
  const after = new THREE.Box3().setFromObject(root);
  root.position.y -= after.min.y;
}

/**
 * Mixamo animations are in centimetres; a model exported from Blender may be in metres.
 * This finds the ratio from the hips height in the idle clip versus the model's own hips.
 */
export function positionScale(root: THREE.Object3D, idle: THREE.AnimationClip) {
  const hips = findBone(root, "hips");
  const track = idle.tracks.find(
    (t) =>
      t.name.endsWith(".position") &&
      normKey(t.name.slice(0, t.name.lastIndexOf("."))) === "hips",
  );
  const y = track?.values[1];
  if (!hips || !y || !hips.position.y) return 1;
  return hips.position.y / y;
}

const clipCache = new Map<string, THREE.AnimationClip>();

/**
 * Makes an animation fit a particular model:
 *  - bone names are matched loosely (see normKey)
 *  - only the hips keep a position track, rescaled, and the walk-away drift is removed
 *  - scale tracks are dropped
 */
export function prepareClip(
  cacheKey: string,
  clip: THREE.AnimationClip,
  root: THREE.Object3D,
  scale: number,
) {
  const hit = clipCache.get(cacheKey);
  if (hit) return hit;

  const names = new Map<string, string>();
  root.traverse((o) => {
    if (o.name) names.set(normKey(o.name), o.name);
  });

  const tracks: THREE.KeyframeTrack[] = [];
  for (const t of clip.tracks) {
    const dot = t.name.lastIndexOf(".");
    const node = t.name.slice(0, dot);
    const prop = t.name.slice(dot + 1);
    const key = normKey(node);
    const target = names.get(key);
    if (!target) continue;

    if (prop === "quaternion") {
      const copy = t.clone();
      copy.name = `${target}.quaternion`;
      tracks.push(copy);
    } else if (prop === "position" && key === "hips") {
      const v = Float32Array.from(t.values);
      const x0 = v[0] * scale;
      const z0 = v[2] * scale;
      for (let i = 0; i < v.length; i += 3) {
        v[i] = x0; // keep the height changes (sitting down), lose the walking-away
        v[i + 1] *= scale;
        v[i + 2] = z0;
      }
      tracks.push(
        new THREE.VectorKeyframeTrack(`${target}.position`, t.times, v),
      );
    }
  }

  const out = new THREE.AnimationClip(clip.name, clip.duration, tracks);
  clipCache.set(cacheKey, out);
  return out;
}
