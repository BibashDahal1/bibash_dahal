"use client";

import { useEffect } from "react";

import {
  BACK_WALL_Z,
  DOORS,
  DOOR_STAND_Z,
  DOOR_TRIGGER,
  doorX,
} from "@/constants/world";
import { useSpeech } from "@/hooks/useSpeech";
import {
  guide,
  guideFace,
  hideGuide,
  placeGuide,
  walkGuideTo,
} from "@/lib/guide";
import { playerPos } from "@/lib/player";
import { sleep } from "@/lib/sleep";
import { enterRoom } from "@/lib/transitions";
import {
  useGameStore,
  type Destination,
  type Speaker,
} from "@/store/useGameStore";

const ABORT = Symbol("abort");

/** What is said for each destination. Edit the words here. */
const SCRIPT: Record<
  Destination,
  { call: (name: string) => string; where: string }
> = {
  office: {
    call: (n) =>
      `Hello? Could you come to reception, please? ${n} is here to meet Mr. Dahal.`,
    where: "the office",
  },
  projects: {
    call: (n) =>
      `Hello? Could you come to reception, please? ${n} would like to see the projects.`,
    where: "the project gallery",
  },
  certificates: {
    call: (n) =>
      `Hello? Could you come to reception, please? ${n} would like to see the certificates.`,
    where: "the certificate gallery",
  },
};

export default function GuideDirector() {
  const phase = useGameStore((s) => s.phase);
  const destination = useGameStore((s) => s.destination);
  const { speak, cancel } = useSpeech();

  useEffect(() => {
    if (phase !== "guided" || !destination) return;

    const dest: Destination = destination;
    const store = useGameStore.getState();
    const name = store.name;
    const x = doorX(dest);
    const side = DOORS[dest].aside; // which way the guide steps aside at the door
    const script = SCRIPT[dest];
    let cancelled = false;

    // --- helpers -------------------------------------------------------
    const check = () => {
      if (cancelled) throw ABORT;
    };
    const wait = async (ms: number) => {
      await sleep(ms);
      check();
    };
    const say = async (who: Speaker, text: string) => {
      store.setLine(who, text);
      await Promise.all([
        speak(text, { voice: who === "guide" ? "male" : "female" }),
        sleep(Math.max(1600, text.length * 55)),
      ]);
      check();
      store.setLine(who, null);
      await wait(250);
    };
    const guideNear = (d: number) =>
      Math.hypot(playerPos.x - guide.x, playerPos.z - guide.z) < d;
    const inDoorway = () =>
      Math.abs(playerPos.x - x) < DOOR_TRIGGER.halfWidth &&
      playerPos.z < DOOR_TRIGGER.z;

    /** Pauses until the visitor catches up, nudging them now and then. */
    const waitForVisitor = async (d: number) => {
      let waited = 0;
      while (!guideNear(d)) {
        await wait(200);
        waited += 200;
        if (waited >= 7000) {
          waited = 0;
          await say("guide", `This way, ${name}.`);
        }
      }
    };
    const leadTo = async (tx: number, tz: number) => {
      await waitForVisitor(3.5);
      await walkGuideTo(tx, tz, 1.6);
      check();
    };

    // --- the scene -----------------------------------------------------
    (async () => {
      try {
        // 1. The receptionist makes a call
        store.setReceptionistPose("sitPhone");
        await say(
          "receptionist",
          `Of course, ${name}. One moment while I call someone to take you there.`,
        );
        await say("receptionist", script.call(name));
        store.setReceptionistPose("sit");

        // 2. The door opens, the guide steps out, the door closes behind him
        placeGuide(x, BACK_WALL_Z - 0.6, 0);
        store.setOpenDoor(dest);
        await wait(900);
        await walkGuideTo(x, DOOR_STAND_Z, 1.6);
        check();
        store.setOpenDoor(null);

        // 3. He walks up to the visitor and introduces himself
        const dx = guide.x - playerPos.x;
        const dz = guide.z - playerPos.z;
        const d = Math.hypot(dx, dz) || 1;
        await walkGuideTo(
          playerPos.x + (dx / d) * 1.8,
          playerPos.z + (dz / d) * 1.8,
          1.8,
        );
        check();
        await waitForVisitor(4);
        guideFace(playerPos.x, playerPos.z);
        await say(
          "guide",
          `Hello ${name}! I'm here to take you to ${script.where}. Please follow me.`,
        );

        // 4. Lead the way, waiting for the visitor whenever they fall behind
        await leadTo(x, -9.5);
        await leadTo(x, DOOR_STAND_Z);

        // 5. Open the door and step aside
        store.setOpenDoor(dest);
        await wait(700);
        await walkGuideTo(x + side * 2, DOOR_STAND_Z, 1.5);
        check();
        guideFace(x, BACK_WALL_Z);
        await say("guide", `Right this way, ${name}. Please go on in.`);

        // 6. When the visitor steps into the doorway, fade into the room
        let idle = 0;
        while (!inDoorway()) {
          await wait(200);
          idle += 200;
          if (idle >= 9000) {
            idle = 0;
            await say("guide", `Just through the door, ${name}.`);
          }
        }
        enterRoom(dest); // not awaited: it must outlive this effect
      } catch (e) {
        if (e !== ABORT) console.error(e);
      }
    })();

    return () => {
      cancelled = true;
      cancel();
      hideGuide();
      const s = useGameStore.getState();
      s.setLine("guide", null);
      s.setLine("receptionist", null);
    };
  }, [phase, destination, speak, cancel]);

  return null;
}
