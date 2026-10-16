"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { footstep } from "@/lib/audio";

import {
  EYE_HEIGHT,
  LOOK_SENSITIVITY,
  LYING_HEIGHT,
  MOVE_SPEED,
  RECEPTIONIST_HEAD,
  RUN_MULTIPLIER,
  WAKE_DURATION,
} from "@/constants/world";
import { useDesktopInput } from "@/hooks/useDesktopInput";
import { isBlocked } from "@/lib/collision";
import { input } from "@/lib/input";
import { playerPos } from "@/lib/player";
import { useGameStore } from "@/store/useGameStore";

const { clamp, lerp, damp } = THREE.MathUtils;
const LYING_PITCH = 1.25;

export default function PlayerController() {
  const camera = useThree((s) => s.camera);
  useDesktopInput();

  const wakeTime = useRef(0);
  const bobPhase = useRef(0);
  const bobAmp = useRef(0);
  const stepDist = useRef(0);

  useEffect(() => {
    camera.rotation.order = "YXZ";
  }, [camera]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const { phase, scene, setPhase } = useGameStore.getState();
    const p = playerPos;

    let eye = EYE_HEIGHT;
    let moving = false;
    let speed = MOVE_SPEED;

    if (phase === "intro") {
      eye = LYING_HEIGHT;
      p.pitch = LYING_PITCH;
      p.yaw = 0;
      wakeTime.current = 0;
      input.look.dx = input.look.dy = 0;
    } else if (phase === "waking") {
      wakeTime.current += dt;
      const t = clamp((wakeTime.current - 1) / 3.2, 0, 1);
      const k = t * t * (3 - 2 * t);
      eye = lerp(LYING_HEIGHT, EYE_HEIGHT, k);
      p.pitch = lerp(LYING_PITCH, 0, k);
      input.look.dx = input.look.dy = 0;
      if (wakeTime.current >= WAKE_DURATION) setPhase("explore");
    } else if (phase === "explore" || phase === "guided") {
      // look
      p.yaw -= input.look.dx * LOOK_SENSITIVITY;
      p.pitch = clamp(p.pitch - input.look.dy * LOOK_SENSITIVITY, -1.4, 1.4);
      input.look.dx = input.look.dy = 0;

      // move
      const k = input.keys;
      let mx =
        (k.has("KeyD") || k.has("ArrowRight") ? 1 : 0) -
        (k.has("KeyA") || k.has("ArrowLeft") ? 1 : 0);
      let my =
        (k.has("KeyW") || k.has("ArrowUp") ? 1 : 0) -
        (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0);
      mx += input.move.x;
      my += input.move.y;
      const len = Math.hypot(mx, my);
      if (len > 1) {
        mx /= len;
        my /= len;
      }
      speed =
        MOVE_SPEED *
        (k.has("ShiftLeft") || k.has("ShiftRight") ? RUN_MULTIPLIER : 1);

      const sin = Math.sin(p.yaw);
      const cos = Math.cos(p.yaw);
      const dx = (-sin * my + cos * mx) * speed * dt;
      const dz = (-cos * my - sin * mx) * speed * dt;
      if (!isBlocked(p.x + dx, p.z, scene)) p.x += dx;
      if (!isBlocked(p.x, p.z + dz, scene)) p.z += dz;
      moving = len > 0.05;
      if (moving) {
        stepDist.current += speed * dt;
        if (stepDist.current >= 0.8) {
          stepDist.current -= 0.8;
          footstep(speed > MOVE_SPEED);
        }
      } else {
        stepDist.current = 0.5; // the first step lands quickly after you start walking
      }
    } else if (phase === "greeting" || phase === "menu") {
      // ease the view onto the receptionist's face; movement is paused
      const tx = RECEPTIONIST_HEAD.x - p.x;
      const tz = RECEPTIONIST_HEAD.z - p.z;
      const targetYaw = Math.atan2(-tx, -tz);
      const targetPitch = Math.atan2(
        RECEPTIONIST_HEAD.y - EYE_HEIGHT,
        Math.hypot(tx, tz),
      );
      const diff = Math.atan2(
        Math.sin(targetYaw - p.yaw),
        Math.cos(targetYaw - p.yaw),
      );
      p.yaw += diff * (1 - Math.exp(-4 * dt));
      p.pitch = damp(p.pitch, targetPitch, 4, dt);
      input.look.dx = input.look.dy = 0;
    }
    // "transition": frozen

    bobAmp.current = damp(bobAmp.current, moving ? 1 : 0, 8, dt);
    if (moving) bobPhase.current += dt * speed * 2.2;
    const bobY = Math.sin(bobPhase.current) * 0.035 * bobAmp.current;

    camera.position.set(p.x, eye + bobY, p.z);
    camera.rotation.set(p.pitch, p.yaw, 0);
  });

  return null;
}
