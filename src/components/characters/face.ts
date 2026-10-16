import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Quality } from "@/constants/quality";

export type FaceType = "male" | "female";

/**
 * Master strength of every bump and dent on the face.
 * Lower it (0.7) if a face looks too sculpted, raise it (1.3) for more character.
 */
const FACE_DETAIL = 1;

/** Head-local metres. Origin = centre of the skull. +z is the front. */
export const FACE = {
  sx: 0.078, // half width
  sy: 0.108, // half height
  sz: 0.092, // half depth
  eyeX: 0.031,
  eyeY: 0.018,
  browY: 0.049,
  noseTipY: -0.024,
  mouthY: -0.0605,
} as const;

/** Eyeball size and how far forward it sits in the socket. */
export const EYE = { r: 0.0135, z: 0.0715 } as const;

/** The face texture is a straight-on front view; this is the window of head space it covers. */
export const UV = { x0: -0.09, x1: 0.09, y0: -0.13, y1: 0.115 } as const;

interface Params {
  taper: number; // how much the jaw narrows toward the chin
  brow: number;
  chin: number;
  cheek: number;
  lip: number;
  nose: number;
}

const PARAMS: Record<FaceType, Params> = {
  male: { taper: 0.2, brow: 1.0, chin: 1.0, cheek: 0.8, lip: 0.9, nose: 1.0 },
  female: {
    taper: 0.32,
    brow: 0.55,
    chin: 0.8,
    cheek: 1.15,
    lip: 1.2,
    nose: 0.85,
  },
};

const { clamp } = THREE.MathUtils;
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
/** A soft round bump (or dent, with a negative amplitude) centred on (cx, cy). */
const gauss = (
  x: number,
  y: number,
  cx: number,
  cy: number,
  sx: number,
  sy: number,
) => Math.exp(-((x - cx) ** 2 / (2 * sx * sx) + (y - cy) ** 2 / (2 * sy * sy)));

const cache = new Map<string, THREE.BufferGeometry>();

/**
 * One smooth head mesh: an ellipsoid pushed and pulled into a face. Built once per face type and quality,
 * then shared by every character of that type.
 */
export function getHeadGeometry(type: FaceType, quality: Quality) {
  const key = `${type}:${quality}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const hi = quality === "high";
  const sphere = new THREE.SphereGeometry(1, hi ? 128 : 72, hi ? 96 : 54);
  const pos = sphere.attributes.position as THREE.BufferAttribute;
  const P = PARAMS[type];
  const D = FACE_DETAIL;
  const { eyeX: ex, eyeY: ey } = FACE;

  for (let i = 0; i < pos.count; i++) {
    const ux = pos.getX(i);
    const uy = pos.getY(i);
    const uz = pos.getZ(i);
    let x = ux * FACE.sx;
    const y = uy * FACE.sy;
    let z = uz * FACE.sz;

    // jaw: the lower face narrows toward the chin
    x *= 1 - P.taper * smooth(-0.015, -0.108, y);

    // only the front of the head gets features
    const front = smooth(0, 0.45, uz);
    if (front > 0) {
      let dz = 0;

      // brow ridge
      dz +=
        0.0065 *
        P.brow *
        (gauss(x, y, -0.03, FACE.browY, 0.03, 0.0075) +
          gauss(x, y, 0.03, FACE.browY, 0.03, 0.0075));

      // eye sockets: wide, shallow almonds, so the eyeballs show
      dz -=
        0.0075 *
        (gauss(x, y, -ex, ey, 0.019, 0.011) +
          gauss(x, y, ex, ey, 0.019, 0.011));

      // nose: bridge, tip, nostril wings
      const bridge = smooth(0.04, -0.02, y);
      const bridgeW = 0.006 + 0.004 * bridge;
      dz +=
        0.016 *
        P.nose *
        bridge *
        Math.exp(-(x * x) / (2 * bridgeW * bridgeW)) *
        smooth(-0.037, -0.027, y);
      dz += 0.012 * P.nose * gauss(x, y, 0, FACE.noseTipY, 0.0085, 0.008);
      dz +=
        0.007 *
        P.nose *
        (gauss(x, y, -0.014, -0.029, 0.007, 0.006) +
          gauss(x, y, 0.014, -0.029, 0.007, 0.006));

      // philtrum, lips, the mouth groove, the dip under the lower lip, chin
      dz += 0.003 * gauss(x, y, 0, -0.047, 0.013, 0.007);
      dz += 0.0075 * P.lip * gauss(x, y, 0, -0.055, 0.018, 0.0048);
      dz += 0.0095 * P.lip * gauss(x, y, 0, -0.0665, 0.019, 0.0058);
      dz -= 0.0035 * gauss(x, y, 0, FACE.mouthY, 0.021, 0.0012);
      dz -= 0.003 * gauss(x, y, 0, -0.078, 0.014, 0.004);
      dz += 0.011 * P.chin * gauss(x, y, 0, -0.097, 0.019, 0.012);

      // cheekbones and cheeks
      dz +=
        0.005 *
        P.cheek *
        (gauss(x, y, -0.05, -0.008, 0.018, 0.016) +
          gauss(x, y, 0.05, -0.008, 0.018, 0.016));
      dz +=
        0.004 *
        P.cheek *
        (gauss(x, y, -0.045, -0.04, 0.02, 0.02) +
          gauss(x, y, 0.045, -0.04, 0.02, 0.02));

      z += dz * D * front;
    }

    pos.setXYZ(i, x, y, z);
  }

  // front-projected UVs, so the painted face lines up with the shape
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = clamp((pos.getX(i) - UV.x0) / (UV.x1 - UV.x0), 0, 1);
    uv[i * 2 + 1] = clamp((pos.getY(i) - UV.y0) / (UV.y1 - UV.y0), 0, 1);
  }
  sphere.setAttribute("uv", new THREE.BufferAttribute(uv, 2));

  // weld the seams so the lighting is smooth all the way round
  sphere.deleteAttribute("normal");
  const merged = mergeVertices(sphere, 1e-5);
  merged.computeVertexNormals();
  sphere.dispose();

  cache.set(key, merged);
  return merged;
}

let eyeParts: {
  ball: THREE.SphereGeometry;
  lidTop: THREE.SphereGeometry;
  lidBottom: THREE.SphereGeometry;
} | null = null;

/** Unit-size eyeball and the two eyelid shells, shared by everyone. */
export function getEyeParts() {
  if (!eyeParts) {
    eyeParts = {
      ball: new THREE.SphereGeometry(1, 28, 20),
      lidTop: new THREE.SphereGeometry(
        1,
        20,
        10,
        0,
        Math.PI * 2,
        0,
        Math.PI / 2,
      ),
      lidBottom: new THREE.SphereGeometry(
        1,
        20,
        10,
        0,
        Math.PI * 2,
        Math.PI / 2,
        Math.PI / 2,
      ),
    };
  }
  return eyeParts;
}
