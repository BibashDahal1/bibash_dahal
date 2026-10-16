import { STATIC_NPCS } from "@/constants/crowd";
import { FURNITURE_COLLIDERS, type Rect } from "@/constants/lobbyLayout";
import { ROOM_LAYOUTS } from "@/constants/rooms";
import { DESK, ROOM } from "@/constants/world";
import type { Scene } from "@/store/useGameStore";

const PAD = 0.5;

const NPC_COLLIDERS: Rect[] = STATIC_NPCS.filter(
  (n) => !n.pose.startsWith("sit"),
).map((n) => ({
  cx: n.position[0],
  cz: n.position[2],
  hw: 0.3,
  hd: 0.3,
}));
const LOBBY_COLLIDERS: Rect[] = [...FURNITURE_COLLIDERS, ...NPC_COLLIDERS];

const hits = (rects: Rect[], x: number, z: number) =>
  rects.some(
    (r) => Math.abs(x - r.cx) < r.hw + PAD && Math.abs(z - r.cz) < r.hd + PAD,
  );

export function isBlocked(
  x: number,
  z: number,
  scene: Scene = "lobby",
): boolean {
  if (scene !== "lobby") {
    const room = ROOM_LAYOUTS[scene];
    if (
      Math.abs(x) > room.width / 2 - PAD ||
      Math.abs(z) > room.depth / 2 - PAD
    )
      return true;
    return hits(room.colliders, x, z);
  }

  if (Math.abs(x) > ROOM.width / 2 - PAD) return true;
  if (Math.abs(z) > ROOM.depth / 2 - PAD) return true;

  const dz = z - DESK.z;
  const reach = DESK.radius + PAD;
  if (dz >= 0 && Math.hypot(x, dz) < reach) return true;
  if (dz < 0 && Math.abs(x) < reach) return true;

  return hits(LOBBY_COLLIDERS, x, z);
}
