import { useEffect, useState } from "react";
import * as THREE from "three";

type State = {
  texture: THREE.VideoTexture | null;
  video: HTMLVideoElement | null;
  aspect: number;
  playing: boolean; // true once the first frame has really been shown
  failed: boolean;
};

const EMPTY: State = {
  texture: null,
  video: null,
  aspect: 16 / 9,
  playing: false,
  failed: false,
};

/**
 * A muted, looping video as a texture. The <video> is created only once `enabled`
 * (so videos you never walk up to never download). Playing and pausing is up to the caller.
 */
export function useVideoTexture(url: string | null, enabled: boolean): State {
  const [state, setState] = useState<State>(EMPTY);

  useEffect(() => {
    if (!url || !enabled) return;

    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = url;

    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;

    const onMeta = () =>
      setState((s) => ({
        ...s,
        aspect:
          video.videoWidth && video.videoHeight
            ? video.videoWidth / video.videoHeight
            : 16 / 9,
      }));
    const onPlaying = () => setState((s) => ({ ...s, playing: true }));
    const onError = () => setState((s) => ({ ...s, failed: true }));
    video.addEventListener("loadedmetadata", onMeta);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("error", onError);

    setState({ ...EMPTY, texture, video });

    return () => {
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("error", onError);
      video.pause();
      video.removeAttribute("src");
      video.load();
      texture.dispose();
    };
  }, [url, enabled]);

  return state;
}
