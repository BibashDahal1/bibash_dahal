"use client";

import { useState } from "react";
import { useModelPool } from "@/hooks/useModelPool";
import Humanoid, { type HumanoidProps } from "./Humanoid";
import ModelHuman from "./ModelHuman";

type PersonProps = HumanoidProps & {
  /** Which model of that gender to use. Default: picked from `seed`. */
  modelIndex?: number;
};

/**
 * One person. Uses a real rigged model when model files exist (see constants/characters.ts),
 * and the built-in procedural person otherwise. Takes the same props as Humanoid.
 */
export default function Person({ modelIndex, ...props }: PersonProps) {
  const pool = useModelPool();
  const [failed, setFailed] = useState(false);

  if (!pool) return null; // still checking which files exist (the loading screen covers this)

  const gender = props.look.face;
  const list = pool[gender];
  if (failed || list.length === 0) return <Humanoid {...props} />;

  const seed = props.seed ?? 0;
  const url = list[(modelIndex ?? seed) % list.length];

  return (
    <ModelHuman
      url={url}
      gender={gender}
      pose={props.pose ?? "stand"}
      lookAtCamera={props.lookAtCamera ?? false}
      walkSpeed={props.walkSpeed ?? 1}
      seed={seed}
      bodyTurn={props.bodyTurn ?? 0}
      position={props.position ?? [0, 0, 0]}
      rotationY={props.rotationY ?? 0}
      onFail={() => setFailed(true)}
    />
  );
}
