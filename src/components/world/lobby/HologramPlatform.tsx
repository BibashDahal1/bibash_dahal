"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { PALETTES, type PaletteName } from "./hologramPalette";

export const PLATFORM_H = 0.2; // height of the emitter surface

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const EMITTER_FRAG = /* glsl */ `
  uniform vec3 uColA; uniform vec3 uColB; uniform float uTime;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p) * 2.0;
    if (r > 1.0) discard;
    float ang = atan(p.y, p.x);
    float edge = 1.0 - smoothstep(0.92, 1.0, r);
    float rings = pow(max(0.0, sin(r * 42.0 - uTime * 3.0)), 8.0);
    float spokes = smoothstep(0.93, 1.0, cos(ang * 24.0 + uTime * 0.4));
    float core = pow(1.0 - r, 2.5);
    float a = edge * (0.10 + rings * 0.55 + spokes * 0.22 * (1.0 - r) + core * 0.7);
    vec3 col = mix(uColA, uColB, r);
    gl_FragColor = vec4(col * a, a);
    #include <colorspace_fragment>
  }
`;

const FLOOR_FRAG = /* glsl */ `
  uniform vec3 uColA; uniform vec3 uColB; uniform float uTime;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p) * 2.0;
    if (r > 1.0) discard;
    float fall = pow(1.0 - r, 2.2);
    float ring1 = smoothstep(0.012, 0.0, abs(r - 0.52));
    float ring2 = smoothstep(0.012, 0.0, abs(r - 0.78 - 0.02 * sin(uTime * 1.5)));
    float ph = fract(uTime * 0.25);
    float pulse = smoothstep(0.03, 0.0, abs(r - ph)) * (1.0 - ph);
    float a = (fall * 0.38 + ring1 * 0.25 + ring2 * 0.18 + pulse * 0.5)
              * (1.0 - smoothstep(0.9, 1.0, r));
    vec3 col = mix(uColA, uColB, r);
    gl_FragColor = vec4(col * a, a);
    #include <colorspace_fragment>
  }
`;

const BEAM_FRAG = /* glsl */ `
  uniform vec3 uColA; uniform vec3 uColB; uniform float uTime;
  varying vec2 vUv;
  void main() {
    float a = pow(1.0 - vUv.y, 1.4) * 0.22;
    a *= 0.75 + 0.25 * sin(vUv.y * 60.0 - uTime * 4.0);
    vec3 col = mix(uColA, uColB, vUv.y);
    gl_FragColor = vec4(col * a, a);
    #include <colorspace_fragment>
  }
`;

// all 32 light strips in ONE mesh
const STRIP_FRAG = /* glsl */ `
  uniform vec3 uColA; uniform vec3 uColC; uniform float uTime;
  varying vec2 vUv;
  void main() {
    float x = vUv.x * 32.0;
    float id = floor(x);
    float seg = fract(x);
    float lit = step(0.15, seg) * step(seg, 0.85);
    float pulse = 0.55 + 0.45 * sin(uTime * 3.0 + id * 3.14159);
    vec3 col = mod(id, 2.0) < 1.0 ? uColA : uColC;
    float a = lit * pulse;
    gl_FragColor = vec4(col * a, a);
    #include <colorspace_fragment>
  }
`;

interface Props {
  width: number; // portrait width (sets beam spread)
  beamHeight: number;
  palette: PaletteName;
}

export default function HologramPlatform({
  width,
  beamHeight,
  palette,
}: Props) {
  const pal = PALETTES[palette];
  const spin = useRef<(THREE.Group | null)[]>([]);

  const mats = useMemo(() => {
    const make = (frag: string, side: THREE.Side = THREE.FrontSide) =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: frag,
        uniforms: {
          uColA: { value: new THREE.Color(pal.a) },
          uColB: { value: new THREE.Color(pal.b) },
          uColC: { value: new THREE.Color(pal.c) },
          uTime: { value: 0 },
        },
        transparent: true,
        premultipliedAlpha: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side,
        toneMapped: false,
      });
    const basic = (c: string) =>
      new THREE.MeshBasicMaterial({
        color: c,
        toneMapped: false,
        transparent: true,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
    return {
      emitter: make(EMITTER_FRAG, THREE.DoubleSide),
      floor: make(FLOOR_FRAG, THREE.DoubleSide),
      beam: make(BEAM_FRAG),
      strips: make(STRIP_FRAG),
      ringA: basic(pal.a),
      ringB: basic(pal.c),
      edgeA: basic(pal.a),
      edgeB: basic(pal.c),
    };
  }, [pal]);

  useEffect(
    () => () => Object.values(mats).forEach((m) => m.dispose()),
    [mats],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    mats.emitter.uniforms.uTime.value = t;
    mats.floor.uniforms.uTime.value = t;
    mats.beam.uniforms.uTime.value = t;
    mats.strips.uniforms.uTime.value = t;

    const s = spin.current;
    if (s[0]) s[0].rotation.y = t * 0.6;
    if (s[1]) s[1].rotation.y = -t * 0.9;
    if (s[2]) s[2].rotation.y = t * 0.35;
  });

  const ringSpecs = [
    { y: 0.32, r: 1.0, mat: mats.ringA },
    { y: 0.55, r: 0.9, mat: mats.ringB },
    { y: 0.8, r: 0.8, mat: mats.ringA },
  ];

  return (
    <group>
      {/* floor glow + radar ping */}
      <mesh
        position={[0, 0.004, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={1}
      >
        <circleGeometry args={[2.6, 64]} />
        <primitive object={mats.floor} attach="material" />
      </mesh>

      {/* lower tier */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[1.4, 1.5, 0.1, 48]} />
        <meshStandardMaterial
          color="#060a18"
          metalness={0.9}
          roughness={0.25}
        />
      </mesh>
      <mesh position={[0, 0.101, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.4, 0.012, 6, 64]} />
        <primitive object={mats.edgeA} attach="material" />
      </mesh>

      {/* chasing light strips: one mesh */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[1.455, 1.455, 0.035, 64, 1, true]} />
        <primitive object={mats.strips} attach="material" />
      </mesh>

      {/* upper tier */}
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[1.05, 1.15, 0.08, 48]} />
        <meshStandardMaterial
          color="#0a0f22"
          metalness={0.95}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[0, 0.181, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.05, 0.01, 6, 64]} />
        <primitive object={mats.edgeB} attach="material" />
      </mesh>

      {/* emitter disc */}
      <mesh
        position={[0, PLATFORM_H - 0.008, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={2}
      >
        <circleGeometry args={[0.9, 64]} />
        <primitive object={mats.emitter} attach="material" />
      </mesh>

      {/* floating counter-rotating arc rings */}
      {ringSpecs.map((s, i) => (
        <group
          key={i}
          position={[0, PLATFORM_H + s.y, 0]}
          ref={(el) => {
            spin.current[i] = el;
          }}
        >
          {[0, Math.PI].map((off) => (
            <mesh key={off} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry
                args={[s.r - 0.014, s.r + 0.014, 64, 1, off, 1.9]}
              />
              <primitive object={s.mat} attach="material" />
            </mesh>
          ))}
        </group>
      ))}

      {/* light beam up to the portrait */}
      <mesh position={[0, PLATFORM_H + beamHeight / 2, 0]}>
        <cylinderGeometry args={[width * 0.42, 0.8, beamHeight, 48, 1, true]} />
        <primitive object={mats.beam} attach="material" />
      </mesh>
    </group>
  );
}
