type Props = { w: number; h: number; color: string; hovered: boolean };

/** A thin glowing frame around a screen or picture. Brighter while you aim at it. */
export default function HoloFrame({ w, h, color, hovered }: Props) {
  const t = 0.04;
  const opacity = hovered ? 1 : 0.55;
  return (
    <group>
      {[
        { p: [0, h / 2 + t / 2, 0], s: [w + t * 2, t, 0.03] },
        { p: [0, -h / 2 - t / 2, 0], s: [w + t * 2, t, 0.03] },
        { p: [-w / 2 - t / 2, 0, 0], s: [t, h, 0.03] },
        { p: [w / 2 + t / 2, 0, 0], s: [t, h, 0.03] },
      ].map((b, i) => (
        <mesh key={i} position={b.p as [number, number, number]}>
          <boxGeometry args={b.s as [number, number, number]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={opacity}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}
