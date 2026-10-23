"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

import { CERT_W, type CertificateSlot } from "@/constants/rooms";
import { useImageTexture } from "@/hooks/useImageTexture";
import { useInteractable } from "@/hooks/useInteractable";
import {
  createGlintTexture,
  getCertificateCardCanvas,
} from "@/lib/classicTextures";
import { imageUrl } from "@/lib/cloudinary";
import { playerPos } from "@/lib/player";
import { createGlowTexture } from "@/lib/textures";
import { useGameStore } from "@/store/useGameStore";

const MAX_W = 2.1; // the certificate itself fits inside this box
const MAX_H = 1.5;
const FRAME_Y = 2.3; // height of the frame centre
const A4 = 1.414;

let sharedGlow: THREE.Texture | null = null;
const getGlow = () => (sharedGlow ??= createGlowTexture());
let sharedGlint: THREE.Texture | null = null;
const getGlint = () => (sharedGlint ??= createGlintTexture());

/**
 * One certificate in a gold frame behind glass, with a picture light, a light glint sweeping across the pane,
 * and an engraved brass plaque. Aim at it to open the viewer.
 */
export default function CertificateFrame({ slot }: { slot: CertificateSlot }) {
  const { certificate: cert, index, side, z } = slot;
  const left = side < 0;
  const id = `cert:${cert.id}`;
  const color = cert.color ?? "#e8c477";

  const hit = useRef<THREE.Mesh>(null);
  const [activated, setActivated] = useState(false);
  const hovered = useGameStore((s) => s.hover?.id === id);

  // the real scan once it has loaded; a generated certificate card until then (and if there is no image)
  const url = cert.image ? imageUrl(cert.image, 1280) : null;
  const img = useImageTexture(url, activated);
  const card = useMemo(() => {
    const t = new THREE.CanvasTexture(getCertificateCardCanvas(cert));
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [cert]);
  useEffect(() => () => card.dispose(), [card]);

  // each pane gets its own copy of the glint texture, so each sweeps at its own moment
  const glint = useMemo(() => {
    const t = getGlint().clone();
    t.needsUpdate = true;
    return t;
  }, []);
  useEffect(() => () => glint.dispose(), [glint]);

  useInteractable(hit, id, `View certificate: ${cert.title}`, () =>
    useGameStore.getState().openDetail({ kind: "certificate", index }),
  );

  useFrame(({ clock }) => {
    if (
      !activated &&
      Math.hypot(
        playerPos.x - (left ? -CERT_W / 2 : CERT_W / 2),
        playerPos.z - z,
      ) < 20
    ) {
      setActivated(true);
    }
    glint.offset.x = ((clock.elapsedTime * 0.22 + index * 0.9) % 4) - 2; // sweeps across, then pauses
  });

  const loaded = img.status === "loaded" && !!img.tex;
  const tex = loaded ? img.tex! : card;
  const aspect = loaded ? img.aspect : A4;

  const wide = aspect > MAX_W / MAX_H;
  const fw = wide ? MAX_W : MAX_H * aspect;
  const fh = wide ? MAX_W / aspect : MAX_H;
  const matW = fw + 0.16;
  const matH = fh + 0.16;
  const outerW = matW + 0.18;
  const outerH = matH + 0.18;
  const plaqueW = Math.min(2.3, Math.max(1.4, outerW * 0.85));

  const gold = (
    <meshStandardMaterial
      color="#c9a24a"
      metalness={0.9}
      roughness={0.3}
      emissive={color}
      emissiveIntensity={hovered ? 0.28 : 0}
    />
  );

  return (
    <group
      position={[left ? -CERT_W / 2 + 0.05 : CERT_W / 2 - 0.05, 0, z]}
      rotation={[0, left ? Math.PI / 2 : -Math.PI / 2, 0]}
    >
      {/* warm wash of light on the wall */}
      <mesh position={[0, FRAME_Y - 0.1, 0.012]}>
        <planeGeometry args={[outerW * 1.9, outerH * 1.9]} />
        <meshBasicMaterial
          map={getGlow()}
          color="#ffd9a0"
          transparent
          opacity={hovered ? 0.5 : 0.28}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <group position={[0, FRAME_Y, 0]}>
        {/* dark backing */}
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[outerW - 0.02, outerH - 0.02, 0.04]} />
          <meshStandardMaterial color="#1a100a" roughness={0.6} />
        </mesh>

        {/* gold molding */}
        <mesh position={[0, outerH / 2 - 0.045, 0.05]}>
          <boxGeometry args={[outerW, 0.09, 0.1]} />
          {gold}
        </mesh>
        <mesh position={[0, -outerH / 2 + 0.045, 0.05]}>
          <boxGeometry args={[outerW, 0.09, 0.1]} />
          {gold}
        </mesh>
        <mesh position={[-outerW / 2 + 0.045, 0, 0.05]}>
          <boxGeometry args={[0.09, outerH - 0.18, 0.1]} />
          {gold}
        </mesh>
        <mesh position={[outerW / 2 - 0.045, 0, 0.05]}>
          <boxGeometry args={[0.09, outerH - 0.18, 0.1]} />
          {gold}
        </mesh>

        {/* ivory mat, then the certificate */}
        <mesh position={[0, 0, 0.042]}>
          <planeGeometry args={[matW, matH]} />
          <meshStandardMaterial color="#f3ecdc" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0, 0.046]}>
          <planeGeometry args={[fw, fh]} />
          <meshBasicMaterial
            key={loaded ? "scan" : "card"}
            map={tex}
            toneMapped={false}
          />
        </mesh>

        {/* the glass: aim at it to open the viewer */}
        <mesh ref={hit} position={[0, 0, 0.075]}>
          <planeGeometry args={[matW, matH]} />
          <meshStandardMaterial
            color="#d8ecff"
            transparent
            opacity={0.09}
            roughness={0.05}
            metalness={0.1}
            depthWrite={false}
          />
        </mesh>
        <mesh position={[0, 0, 0.078]}>
          <planeGeometry args={[matW, matH]} />
          <meshBasicMaterial
            map={glint}
            transparent
            opacity={hovered ? 0.8 : 0.55}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>

        {/* brass picture light above the frame */}
        <group position={[0, outerH / 2 + 0.2, 0]}>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * outerW * 0.2, -0.02, 0.09]}>
              <boxGeometry args={[0.03, 0.03, 0.18]} />
              <meshStandardMaterial
                color="#c9a24a"
                metalness={0.9}
                roughness={0.3}
              />
            </mesh>
          ))}
          <mesh position={[0, 0, 0.19]}>
            <boxGeometry args={[outerW * 0.55, 0.045, 0.06]} />
            <meshStandardMaterial
              color="#c9a24a"
              metalness={0.9}
              roughness={0.3}
            />
          </mesh>
          <mesh position={[0, -0.03, 0.2]}>
            <boxGeometry args={[outerW * 0.5, 0.012, 0.04]} />
            <meshBasicMaterial color="#fff1c9" toneMapped={false} />
          </mesh>
        </group>

        {/* engraved plaque */}
        <group position={[0, -outerH / 2 - 0.3, 0]}>
          <mesh position={[0, 0, 0.012]}>
            <boxGeometry args={[plaqueW, 0.3, 0.025]} />
            <meshStandardMaterial
              color="#c9a24a"
              metalness={0.85}
              roughness={0.35}
            />
          </mesh>
          <Text
            position={[0, 0.045, 0.03]}
            fontSize={0.072}
            maxWidth={plaqueW - 0.16}
            textAlign="center"
            letterSpacing={0.02}
            color="#2b1d0a"
            anchorX="center"
            anchorY="middle"
          >
            {cert.title}
          </Text>
          <Text
            position={[0, -0.06, 0.03]}
            fontSize={0.045}
            maxWidth={plaqueW - 0.16}
            textAlign="center"
            letterSpacing={0.06}
            color="#4a3410"
            anchorX="center"
            anchorY="middle"
          >
            {`${cert.issuer} · ${cert.date}`.toUpperCase()}
          </Text>
        </group>
      </group>
    </group>
  );
}
