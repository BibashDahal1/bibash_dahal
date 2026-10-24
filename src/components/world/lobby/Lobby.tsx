"use client";

import Crowd from "@/components/world/crowd/Crowd";
import RoomShell from "@/components/world/shell/RoomShell";
import { THEMES } from "@/constants/themes";
import { BACK_WALL_Z, STAFF_DOOR_X, doorX } from "@/constants/world";
import { ROOM } from "@/constants/world";
import { useGameStore } from "@/store/useGameStore";
import ArcadeCabinet from "./ArcadeCabinet";
import Decor from "./Decor";
import DeskAccessories from "./DeskAccessories";
import Door from "./Door";
import GoldenName from "./GoldenName";
import Guide from "./Guide";
import GuideDirector from "./GuideDirector";
import Receptionist from "./Receptionist";
import ReceptionDesk from "./ReceptionDesk";
import HologramPortrait from "./HologramPortrait";

export default function Lobby() {
  const openDoor = useGameStore((s) => s.openDoor);

  return (
    <RoomShell
      dims={ROOM}
      theme={THEMES.lobby}
      chandelierScale={1.4}
      chandelierZ={[-3, 7]}
    >
      <GoldenName />
      <ReceptionDesk />
      <DeskAccessories />
      <Receptionist />
      <Guide />
      <GuideDirector />
      <Decor />
      <Crowd />
      <ArcadeCabinet />
      <Door
        position={[doorX("office"), 0, BACK_WALL_Z]}
        label="OFFICE"
        isOpen={openDoor === "office"}
      />
      <Door
        position={[doorX("certificates"), 0, BACK_WALL_Z]}
        label="CERTIFICATES"
        isOpen={openDoor === "certificates"}
      />
      <Door
        position={[doorX("projects"), 0, BACK_WALL_Z]}
        label="PROJECTS"
        accent="#5eeaff"
        isOpen={openDoor === "projects"}
      />
      <Door
        position={[STAFF_DOOR_X, 0, BACK_WALL_Z]}
        label="STAFF ONLY"
        isOpen={false}
      />
      <HologramPortrait position={[0, 0, 0]} height={3.2} palette="blue" />
    </RoomShell>
  );
}
