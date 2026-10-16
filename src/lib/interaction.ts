import type * as THREE from "three";
import { useGameStore } from "@/store/useGameStore";

export interface Interactable {
  id: string;
  label: string;
  object: THREE.Object3D;
  activate: () => void;
}

/** Everything the crosshair can "use". Components register themselves via useInteractable. */
export const interactables = new Map<string, Interactable>();

export function registerInteractable(item: Interactable) {
  interactables.set(item.id, item);
  return () => {
    if (interactables.get(item.id) === item) interactables.delete(item.id);
  };
}

export function activateHover() {
  const { phase, hover } = useGameStore.getState();
  if (phase !== "explore" || !hover) return;
  interactables.get(hover.id)?.activate();
}
