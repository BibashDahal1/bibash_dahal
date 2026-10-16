import { SPAWN } from "@/constants/world";

// Written by PlayerController every frame; readable from anywhere.
export const playerPos: { x: number; z: number; yaw: number; pitch: number } = {
  x: SPAWN.x,
  z: SPAWN.z,
  yaw: 0,
  pitch: 1.25,
};

export function teleportPlayer(x: number, z: number, yaw = 0) {
  playerPos.x = x;
  playerPos.z = z;
  playerPos.yaw = yaw; // 0 faces -z, PI faces +z
  playerPos.pitch = 0;
}
