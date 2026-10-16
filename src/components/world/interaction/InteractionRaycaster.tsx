"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import {
  activateHover,
  interactables,
  type Interactable,
} from "@/lib/interaction";
import { useGameStore } from "@/store/useGameStore";

const INTERACT_DISTANCE = 5;

const isInside = (hit: THREE.Object3D, root: THREE.Object3D) => {
  for (let o: THREE.Object3D | null = hit; o; o = o.parent)
    if (o === root) return true;
  return false;
};

/** Casts a ray from the screen centre (the crosshair) a few times a second; click / E activates. */
export default function InteractionRaycaster() {
  const camera = useThree((s) => s.camera);
  const raycaster = useMemo(() => {
    const r = new THREE.Raycaster();
    r.far = INTERACT_DISTANCE;
    return r;
  }, []);
  const center = useMemo(() => new THREE.Vector2(0, 0), []);
  const tick = useRef(0);

  useFrame(() => {
    if (++tick.current % 3 !== 0) return;
    const st = useGameStore.getState();

    if (st.phase !== "explore" || interactables.size === 0) {
      if (st.hover) st.setHover(null);
      return;
    }

    raycaster.setFromCamera(center, camera);
    const items = [...interactables.values()];
    const hits = raycaster.intersectObjects(
      items.map((i) => i.object),
      true,
    );

    let found: Interactable | null = null;
    if (hits.length) {
      const first = hits[0].object;
      found = items.find((i) => isInside(first, i.object)) ?? null;
    }
    if ((found?.id ?? null) !== (st.hover?.id ?? null)) {
      st.setHover(found ? { id: found.id, label: found.label } : null);
    }
  });

  useEffect(() => {
    const onClick = () => {
      if (document.pointerLockElement) activateHover(); // desktop: only while the mouse is captured
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyE") activateHover();
    };
    window.addEventListener("click", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return null;
}
