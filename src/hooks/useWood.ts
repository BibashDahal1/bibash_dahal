import { useEffect, useMemo } from "react";
import { getWoodTexture, type WoodKind } from "@/lib/woodTexture";

/** A wood texture with its own repeat. Clones share the same image, so this is cheap. */
export function useWood(kind: WoodKind, repeat: [number, number] = [1, 1]) {
  const [rx, ry] = repeat;
  const tex = useMemo(() => {
    const t = getWoodTexture(kind).clone();
    t.repeat.set(rx, ry);
    t.needsUpdate = true;
    return t;
  }, [kind, rx, ry]);
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}
