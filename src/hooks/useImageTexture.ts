import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type State = {
  tex: THREE.Texture | null;
  aspect: number;
  status: "idle" | "loading" | "loaded" | "failed";
};

/** Loads an image into a texture once `enabled`, and reports its aspect ratio. Disposes it when done. */
export function useImageTexture(url: string | null, enabled: boolean): State {
  const [state, setState] = useState<State>({
    tex: null,
    aspect: 16 / 9,
    status: "idle",
  });
  const owned = useRef<THREE.Texture | null>(null);

  useEffect(() => {
    if (!url || !enabled) return;
    let cancelled = false;
    setState((s) => ({ ...s, status: "loading" }));

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      url,
      (tex) => {
        if (cancelled) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        owned.current = tex;
        const img = tex.image as HTMLImageElement;
        setState({
          tex,
          aspect: img.width && img.height ? img.width / img.height : 16 / 9,
          status: "loaded",
        });
      },
      undefined,
      () => {
        if (!cancelled) setState((s) => ({ ...s, status: "failed" }));
      },
    );

    return () => {
      cancelled = true;
      owned.current?.dispose();
      owned.current = null;
    };
  }, [url, enabled]);

  return state;
}
