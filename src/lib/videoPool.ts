const active = new Map<string, HTMLVideoElement>();

/** Lets a video play if there is a free slot. Returns true if it is (now) playing. */
export function requestPlay(id: string, video: HTMLVideoElement, max: number) {
  if (active.has(id)) return true;
  if (active.size >= max) return false;
  active.set(id, video);
  video.play().catch(() => active.delete(id)); // autoplay can be refused; try again next time
  return true;
}

export function release(id: string) {
  const video = active.get(id);
  if (video) {
    video.pause();
    active.delete(id);
  }
}
