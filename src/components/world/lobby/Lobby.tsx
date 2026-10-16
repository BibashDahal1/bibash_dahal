"use client";

import Crowd from "@/components/world/crowd/Crowd";
import RoomShell from "@/components/world/shell/RoomShell";
import { THEMES } from "@/constants/themes";
import { BACK_WALL_Z, DOOR_X, ROOM } from "@/constants/world";
import { useGameStore } from "@/store/useGameStore";
import Decor from "./Decor";
import DeskAccessories from "./DeskAccessories";
import Door from "./Door";
import GoldenName from "./GoldenName";
import Guide from "./Guide";
import GuideDirector from "./GuideDirector";
import Receptionist from "./Receptionist";
import ReceptionDesk from "./ReceptionDesk";

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
      <Door
        position={[-DOOR_X, 0, BACK_WALL_Z]}
        label="OFFICE"
        isOpen={openDoor === "office"}
      />
      <Door
        position={[DOOR_X, 0, BACK_WALL_Z]}
        label="PROJECTS"
        accent="#5eeaff"
        isOpen={openDoor === "projects"}
      />
    </RoomShell>
  );
}
