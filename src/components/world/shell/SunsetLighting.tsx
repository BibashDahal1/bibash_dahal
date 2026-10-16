// Tweak these to taste: warmer / stronger sunset
const AMBIENT = 0.8;
const HEMISPHERE = 0.7;
const SUN_STRENGTH = 1.35;

type Props = { sun: boolean; accent: string; depth: number };

export default function SunsetLighting({ sun, accent, depth }: Props) {
  return (
    <>
      <ambientLight intensity={AMBIENT} color="#ffd9bd" />
      <hemisphereLight args={["#ffc08a", "#3b2432", HEMISPHERE]} />
      {sun && (
        <>
          <directionalLight
            position={[22, 7, 0]}
            color="#ff9a55"
            intensity={SUN_STRENGTH}
          />
          <directionalLight
            position={[-22, 6, 0]}
            color="#ffb98a"
            intensity={SUN_STRENGTH * 0.5}
          />
        </>
      )}
      {/* wash on the name wall */}
      <pointLight
        position={[0, 3.6, -depth / 2 + 2.5]}
        color={accent}
        intensity={45}
        distance={10}
        decay={2}
      />
    </>
  );
}
