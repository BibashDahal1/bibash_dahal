import { ROOM_LAYOUTS } from "@/constants/rooms";
import { BACK_WALL_Z, doorX } from "@/constants/world";
import { useGameStore, type Destination } from "@/store/useGameStore";
import { teleportPlayer } from "./player";
import { sleep } from "./sleep";

export async function enterRoom(dest: Destination) {
  const s = useGameStore.getState();
  s.setPhase("transition");
  s.setFade(true);
  await sleep(900);

  const { spawn } = ROOM_LAYOUTS[dest];
  teleportPlayer(spawn.x, spawn.z, 0); // facing the far end of the room
  s.setScene(dest);
  s.setOpenDoor(null);
  s.setPhase("explore");

  await sleep(250);
  s.setFade(false);
}

export async function returnToLobby(from: Destination) {
  const s = useGameStore.getState();
  if (s.phase === "transition") return;
  s.setPhase("transition");
  s.setFade(true);
  await sleep(800);

  teleportPlayer(doorX(from), BACK_WALL_Z + 3, Math.PI);
  s.setScene("lobby");
  s.setDestination(null);
  s.setOpenDoor(null);
  s.setReceptionistPose("sit");
  s.setPhase("explore");

  await sleep(250);
  s.setFade(false);
}
