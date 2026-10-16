import { DESK } from "@/constants/world";
import DeskPhone from "@/components/world/props/DeskPhone";
import Monitor from "@/components/world/props/Monitor";

const COUNTER_Y = 1.05;

/** Things on the reception counter. They face -z (toward the receptionist), so visitors see their backs. */
export default function DeskAccessories() {
  return (
    <>
      <Monitor position={[-0.9, COUNTER_Y, DESK.z + 2.6]} rotationY={Math.PI} />
      <DeskPhone
        position={[0.95, COUNTER_Y, DESK.z + 2.5]}
        rotationY={Math.PI}
      />
    </>
  );
}
