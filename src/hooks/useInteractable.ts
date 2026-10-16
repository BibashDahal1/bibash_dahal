import { RefObject, useEffect, useRef } from "react";
import type * as THREE from "three";
import { registerInteractable } from "@/lib/interaction";

/** Makes `ref`'s object (and its children) aimable. Attach it to an invisible hit-box for easy targeting. */
export function useInteractable(
  ref: RefObject<THREE.Object3D | null>,
  id: string,
  label: string,
  onActivate: () => void,
) {
  const callback = useRef(onActivate);
  useEffect(() => {
    callback.current = onActivate;
  });

  useEffect(() => {
    const object = ref.current;
    if (!object) return;
    return registerInteractable({
      id,
      label,
      object,
      activate: () => callback.current(),
    });
  }, [ref, id, label]);
}
