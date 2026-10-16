import { LOUNGE_X, PLANTS, WALL_ART } from "@/constants/lobbyLayout";
import Plant from "@/components/world/props/Plant";
import WallArt from "@/components/world/props/WallArt";
import LoungeArea from "./LoungeArea";

const LOUNGE_STYLES = [
  { sofaColor: "#5a3d2b", rugColor: "#3a2a2a" }, // leather brown
  { sofaColor: "#2f4156", rugColor: "#2a3038" }, // navy
];

export default function Decor() {
  return (
    <>
      {LOUNGE_X.map((x, i) => (
        <LoungeArea key={x} x={x} {...LOUNGE_STYLES[i]} />
      ))}
      {PLANTS.map(([x, z]) => (
        <Plant key={`${x}:${z}`} position={[x, 0, z]} />
      ))}
      {WALL_ART.map((a) => (
        <WallArt key={a.seed} {...a} />
      ))}
    </>
  );
}
