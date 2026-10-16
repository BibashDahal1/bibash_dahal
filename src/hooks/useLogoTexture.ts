import { useEffect, useState } from "react";
import * as THREE from "three";
import { renderLogoCanvas } from "@/lib/logoTexture";

/** Texture for a hologram drum. Repeats `tiles` times around the cylinder. Null until the logo is ready. */
export function useLogoTexture(
  logo: string | null | undefined,
  badge: string,
  accent: string,
  tiles: number,
) {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    let cancelled = false;
    let tex: THREE.CanvasTexture | null = null;

    renderLogoCanvas(logo, badge, accent).then((canvas) => {
      if (cancelled) return;
      tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.repeat.set(tiles, 1);
      tex.anisotropy = 4;
      setTexture(tex);
    });

    return () => {
      cancelled = true;
      tex?.dispose();
    };
  }, [logo, badge, accent, tiles]);

  return texture;
}
