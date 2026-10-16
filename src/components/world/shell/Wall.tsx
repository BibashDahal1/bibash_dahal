"use client";

import { useWood } from "@/hooks/useWood";
import type { RoomTheme } from "@/constants/themes";
import { GOLD } from "@/constants/world";

type Props = {
  width: number;
  height: number;
  position: [number, number, number];
  rotationY: number;
  theme: RoomTheme;
  /** Wood from floor to ceiling (the wall behind the gold name). */
  full?: boolean;
};

/** Wood-panelled wall: paneling + dado rail + plaster above, or full-height wood. */
export default function Wall({
  width,
  height,
  position,
  rotationY,
  theme,
  full = false,
}: Props) {
  const wainH = full ? height : Math.min(theme.wainscot, height - 0.5);
  const wood = useWood(theme.wood, [width / 2, wainH / 2]);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {!full && (
        <mesh position={[0, height / 2, 0]}>
          <planeGeometry args={[width, height]} />
          <meshStandardMaterial color={theme.plaster} roughness={0.92} />
        </mesh>
      )}

      <mesh position={[0, wainH / 2, 0.008]}>
        <planeGeometry args={[width, wainH]} />
        <meshStandardMaterial map={wood} roughness={0.55} />
      </mesh>

      {/* baseboard */}
      <mesh position={[0, 0.13, 0.03]}>
        <boxGeometry args={[width, 0.26, 0.05]} />
        <meshStandardMaterial color="#2a190e" roughness={0.5} />
      </mesh>

      {!full && (
        <>
          {/* dado rail with a gold line */}
          <mesh position={[0, wainH, 0.04]}>
            <boxGeometry args={[width, 0.09, 0.07]} />
            <meshStandardMaterial color="#2a190e" roughness={0.5} />
          </mesh>
          <mesh position={[0, wainH + 0.05, 0.078]}>
            <boxGeometry args={[width, 0.018, 0.012]} />
            <meshStandardMaterial
              color={GOLD}
              metalness={0.9}
              roughness={0.3}
            />
          </mesh>
        </>
      )}
    </group>
  );
}
