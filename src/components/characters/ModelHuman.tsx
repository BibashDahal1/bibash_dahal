"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";

import { CHARACTERS, FALLBACKS } from "@/constants/characters";
import {
  findBone,
  loadAsset,
  normalize,
  positionScale,
  prepareClip,
} from "@/lib/characterAssets";
import { useGameStore } from "@/store/useGameStore";
import { isSeated, type PoseName } from "./poses";

const { damp, clamp } = THREE.MathUtils;
const Y_AXIS = new THREE.Vector3(0, 1, 0);

type Props = {
  url: string;
  gender: "male" | "female";
  pose: PoseName;
  lookAtCamera: boolean;
  walkSpeed: number;
  seed: number;
  bodyTurn: number;
  position: [number, number, number];
  rotationY: number;
  /** Called if the model or its animations can't be used, so the caller can show a procedural person instead. */
  onFail: () => void;
};

/** One authored 3D person: a rigged model, played with motion-captured animation clips. */
export default function ModelHuman({
  url,
  gender,
  pose,
  lookAtCamera,
  walkSpeed,
  seed,
  bodyTurn,
  position,
  rotationY,
  onFail,
}: Props) {
  const camera = useThree((s) => s.camera);
  const quality = useGameStore((s) => s.quality);

  const [model, setModel] = useState<THREE.Object3D | null>(null);
  const holder = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const mixer = useRef<THREE.AnimationMixer | null>(null);
  const actions = useRef<Partial<Record<PoseName, THREE.AnimationAction>>>({});
  const current = useRef<THREE.AnimationAction | null>(null);
  const head = useRef<THREE.Object3D | null>(null);
  const headYaw = useRef(0);
  const failRef = useRef(onFail);
  const wp = useMemo(() => new THREE.Vector3(), []);
  const local = useMemo(() => new THREE.Vector3(), []);
  const headQ = useMemo(() => new THREE.Quaternion(), []);

  useEffect(() => {
    failRef.current = onFail;
  });

  // ---- build this person: clone the shared model, fit the animations to it ----
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const source = await loadAsset(url);
        const root = cloneSkinned(source.scene);
        root.traverse((o) => {
          o.frustumCulled = false; // skinned meshes can be culled wrongly while animating
        });
        normalize(root, CHARACTERS.height[gender] * (0.97 + (seed % 7) * 0.01));

        const files = CHARACTERS.animations;
        const urls = [
          ...new Set(Object.values(files).filter(Boolean) as string[]),
        ];
        const results = await Promise.allSettled(urls.map(loadAsset));
        const clips = new Map<string, THREE.AnimationClip>();
        results.forEach((r, i) => {
          if (r.status === "fulfilled" && r.value.animations[0])
            clips.set(urls[i], r.value.animations[0]);
        });

        const idle = files.stand ? clips.get(files.stand) : undefined;
        const scale = idle ? positionScale(root, idle) : 1;

        const m = new THREE.AnimationMixer(root);
        const built: Partial<Record<PoseName, THREE.AnimationAction>> = {};
        (Object.keys(FALLBACKS) as PoseName[]).forEach((p) => {
          for (const candidate of FALLBACKS[p]) {
            const file = files[candidate];
            const clip = file ? clips.get(file) : undefined;
            if (clip) {
              built[p] = m.clipAction(
                prepareClip(`${url}|${file}`, clip, root, scale),
              );
              break;
            }
          }
        });

        if (cancelled) {
          m.stopAllAction();
          return;
        }
        if (!built.stand && !built.sit)
          throw new Error("no usable animations (need at least idle.fbx)");

        mixer.current = m;
        actions.current = built;
        current.current = null;
        head.current = findBone(root, "head");
        setModel(root);
      } catch (e) {
        console.warn(
          "[characters] falling back to a procedural person:",
          url,
          e,
        );
        if (!cancelled) failRef.current();
      }
    })();

    return () => {
      cancelled = true;
      mixer.current?.stopAllAction();
      mixer.current = null;
    };
  }, [url, gender, seed]);

  // ---- switch animation when the pose changes ----
  useEffect(() => {
    if (!model) return;
    const next = actions.current[pose];
    if (!next) {
      failRef.current(); // e.g. a seated person but no sit animation
      return;
    }
    const prev = current.current;
    const timeScale =
      pose === "walk" ? (walkSpeed * 1.1) / CHARACTERS.walkClipSpeed : 1;

    if (prev !== next) {
      next.reset();
      if (!prev) next.time = (seed * 0.37) % (next.getClip().duration || 1); // so people don't move in lockstep
      next
        .setEffectiveTimeScale(timeScale)
        .fadeIn(prev ? 0.35 : 0)
        .play();
      prev?.fadeOut(0.35);
      current.current = next;
    } else {
      next.setEffectiveTimeScale(timeScale);
    }
  }, [model, pose, walkSpeed, seed]);

  useFrame((_, delta) => {
    const g = holder.current;
    const m = mixer.current;
    if (!g || !m) return;

    // far away: hide and stop animating
    g.getWorldPosition(wp);
    const near =
      camera.position.distanceTo(wp) < CHARACTERS.cullDistance[quality];
    if (g.visible !== near) g.visible = near;
    if (!near) return;

    const dt = Math.min(delta, 0.05);
    m.update(dt);

    const seated = isSeated(pose);
    inner.current?.position.set(
      0,
      seated ? CHARACTERS.seat.y : 0,
      seated ? CHARACTERS.seat.z : 0,
    );

    // the head follows the visitor (applied after the animation, on top of it)
    if (
      CHARACTERS.headTracking &&
      lookAtCamera &&
      head.current &&
      inner.current
    ) {
      local.copy(camera.position);
      inner.current.worldToLocal(local);
      const yaw = clamp(Math.atan2(local.x, local.z), -0.7, 0.7);
      headYaw.current = damp(headYaw.current, yaw, 4, dt);
      headQ.setFromAxisAngle(Y_AXIS, headYaw.current * 0.8);
      head.current.quaternion.multiply(headQ);
    }
  });

  return (
    <group
      ref={holder}
      position={position}
      rotation={[0, rotationY + bodyTurn * 0.8, 0]}
    >
      <group ref={inner} rotation={[0, CHARACTERS.facingOffset, 0]}>
        {model && <primitive object={model} />}
      </group>
    </group>
  );
}
