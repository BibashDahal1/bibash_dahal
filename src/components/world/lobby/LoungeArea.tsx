import { SOFA_Z, TABLE_Z } from "@/constants/lobbyLayout";
import CoffeeTable from "@/components/world/props/CoffeeTable";
import Rug from "@/components/world/props/Rug";
import Sofa from "@/components/world/props/Sofa";

type Props = { x: number; sofaColor: string; rugColor: string };

export default function LoungeArea({ x, sofaColor, rugColor }: Props) {
  return (
    <group>
      <Rug
        position={[x, 0.012, (SOFA_Z[0] + SOFA_Z[1]) / 2]}
        size={[4.2, 6.6]}
        color={rugColor}
      />
      <Sofa position={[x, 0, SOFA_Z[0]]} rotationY={0} color={sofaColor} />
      <Sofa
        position={[x, 0, SOFA_Z[1]]}
        rotationY={Math.PI}
        color={sofaColor}
      />
      <CoffeeTable position={[x, 0, TABLE_Z]} />
    </group>
  );
}
