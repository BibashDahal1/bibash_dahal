// The guide's mutable state. The story script commands him; the Guide component moves him.
export const guide = {
  x: 0,
  z: 0,
  yaw: 0,
  visible: false,
  target: null as null | { x: number; z: number; speed: number },
  faceAt: null as null | { x: number; z: number },
  resolve: null as null | (() => void),
};

export function placeGuide(x: number, z: number, yaw = 0) {
  guide.x = x;
  guide.z = z;
  guide.yaw = yaw;
  guide.visible = true;
  guide.target = null;
  guide.faceAt = null;
}

/** Resolves when the guide reaches the point. */
export function walkGuideTo(x: number, z: number, speed = 1.5) {
  return new Promise<void>((resolve) => {
    guide.faceAt = null;
    guide.target = { x, z, speed };
    guide.resolve = resolve;
  });
}

export function guideFace(x: number, z: number) {
  guide.faceAt = { x, z };
}

export function hideGuide() {
  guide.visible = false;
  guide.target = null;
  guide.faceAt = null;
  guide.resolve = null;
}
