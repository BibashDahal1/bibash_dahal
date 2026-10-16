"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { getNewspaperTexture } from "@/lib/textures";
import { useGameStore } from "@/store/useGameStore";
import { EYE, FACE, getEyeParts, getHeadGeometry } from "./face";
import { getEyeTexture, getFaceTexture } from "./faceTexture";
import { getGeometries } from "./geometry";
import { HAIR } from "./hair";
import type { CharacterLook } from "./looks";
import {
  blendPose,
  clonePose,
  isSeated,
  POSES,
  type Pose,
  type PoseName,
} from "./poses";

const { damp, clamp } = THREE.MathUtils;

const THIGH = 0.44;
const SHIN = 0.43;
const UPPER = 0.28;
const FORE = 0.26;

type JointName =
  | "root"
  | "hips"
  | "spine"
  | "chest"
  | "neck"
  | "head"
  | "mouth"
  | "eyeL"
  | "eyeR"
  | "lidL"
  | "lidR"
  | "armL"
  | "foreL"
  | "armR"
  | "foreR"
  | "legL"
  | "shinL"
  | "footL"
  | "legR"
  | "shinR"
  | "footR"
  | "fineHead"
  | "fineBody"
  | "fineHandL"
  | "fineHandR";

const FINE_GROUPS = ["fineHead", "fineBody", "fineHandL", "fineHandR"] as const;
const SEAT_POSES = ["sit", "sitRead", "sitTalk", "sitPhone"] as const;

export type HumanoidProps = {
  /** Pass a stable object (module constant or useMemo): a new object every render rebuilds the materials. */
  look: CharacterLook;
  pose?: PoseName;
  speaking?: boolean;
  /** Head follows the camera, clamped so there are no owl-necks. */
  lookAtCamera?: boolean;
  /** Hip height when seated; match the chair or sofa. */
  seatHeight?: number;
  walkSpeed?: number;
  /** Desynchronises idle motion so people don't move in lockstep. */
  seed?: number;
  /** Turns the upper body (radians, + = toward local +x). Used for people chatting side by side. */
  bodyTurn?: number;
  position?: [number, number, number];
  rotationY?: number;
};

export default function Humanoid({
  look,
  pose = "stand",
  speaking = false,
  lookAtCamera = false,
  seatHeight = 0.5,
  walkSpeed = 1,
  seed = 0,
  bodyTurn = 0,
  position = [0, 0, 0],
  rotationY = 0,
}: HumanoidProps) {
  const camera = useThree((s) => s.camera);
  const quality = useGameStore((s) => s.quality);
  const hi = quality === "high";
  const g = getGeometries(quality);
  const headGeo = getHeadGeometry(look.face, quality);
  const eyes = getEyeParts();

  const joints = useRef<Partial<Record<JointName, THREE.Object3D | null>>>({});
  const reg = (k: JointName) => (o: THREE.Object3D | null) => {
    joints.current[k] = o;
  };

  const cur = useRef(clonePose(POSES.stand));
  const walkPhase = useRef(seed * 3.7);
  const walkW = useRef(0);
  const talkW = useRef(0);
  const mouthOpen = useRef(0);
  const headYaw = useRef(0);
  const headPitch = useRef(0);
  const blink = useRef({ timer: 1.5 + (seed % 5) * 0.7, p: 0, active: false });
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const wp = useMemo(() => new THREE.Vector3(), []);

  const reading = pose === "readPaper" || pose === "sitRead";
  const phoneHeld = pose === "phone" || pose === "sitPhone";
  const talking = pose === "talk" || pose === "sitTalk";
  const paperTex = useMemo(
    () => (reading ? getNewspaperTexture() : null),
    [reading],
  );

  const seatTargets = useMemo(() => {
    const out: Partial<Record<PoseName, Pose>> = {};
    for (const p of SEAT_POSES) out[p] = { ...POSES[p], hipsY: seatHeight };
    return out;
  }, [seatHeight]);

  const m = useMemo(() => {
    const std = (color: string, roughness = 0.75) =>
      new THREE.MeshStandardMaterial({ color, roughness });
    return {
      skin: std(look.skin, 0.62),
      face: new THREE.MeshStandardMaterial({
        map: getFaceTexture(
          {
            type: look.face,
            skin: look.skin,
            hair: look.hair,
            lipstick: look.lipstick,
            stubble: look.stubble,
          },
          quality,
        ),
        roughness: 0.58,
      }),
      eye: new THREE.MeshStandardMaterial({
        map: getEyeTexture(look.eye),
        roughness: 0.15,
      }),
      lid: std(look.skin, 0.6),
      mouthDark: new THREE.MeshBasicMaterial({ color: "#1c0808" }),
      teeth: new THREE.MeshBasicMaterial({ color: "#efe9dc" }),
      hair: std(look.hair, 0.45),
      top: std(look.top, 0.85),
      bottom: std(look.bottom, 0.85),
      shoes: std(look.shoes, 0.3),
      sole: std("#0d0d0d", 0.7),
      belt: std("#1a1410", 0.5),
      accent: std(look.accent, 0.45),
      shirt: std(look.shirt, 0.8),
      case: std("#4a2e1a", 0.5),
      cup: std("#f3f0e8", 0.6),
      cupSleeve: std("#8a5a32", 0.8),
    };
  }, [look, quality]);
  // textures are cached and shared, so only the materials are disposed here
  useEffect(() => () => Object.values(m).forEach((mat) => mat.dispose()), [m]);

  useFrame(({ clock }, delta) => {
    const j = joints.current as Record<JointName, THREE.Object3D | null>;
    if (!j.root || !j.footR || !j.lidR || !j.eyeR || !j.mouth || !j.fineHandR)
      return; // not mounted yet
    const J = j as Record<JointName, THREE.Object3D>;

    const dt = Math.min(delta, 0.05);
    const t = clock.elapsedTime + seed * 7.31;
    const c = cur.current;

    blendPose(c, seatTargets[pose] ?? POSES[pose], 6, dt);

    // Level of detail: eyes, ears, hands and suit details only draw when the person is close enough to see them
    J.root.getWorldPosition(wp);
    const fine = camera.position.distanceTo(wp) < (hi ? 16 : 9);
    for (const k of FINE_GROUPS) if (J[k].visible !== fine) J[k].visible = fine;

    // People who are talking take turns: speak for a while, then listen
    const gate = talking && Math.sin(t * 0.7 + seed * 2.9) > -0.2;
    walkW.current = damp(walkW.current, pose === "walk" ? 1 : 0, 6, dt);
    talkW.current = damp(talkW.current, gate ? 1 : 0, 5, dt);
    const wW = walkW.current;
    const tW = talkW.current;
    const seated = isSeated(pose);
    const idleW = (1 - wW) * (seated ? 0.25 : 1);

    walkPhase.current += dt * 6.2 * walkSpeed * wW;
    const ph = walkPhase.current;
    const s = Math.sin(ph);
    const co = Math.cos(ph);
    const breath = Math.sin(t * 1.7);
    const sway = Math.sin(t * 0.55 + seed); // slow weight shift
    const gest = Math.sin(t * 2.3) * 0.5 + 0.5;
    const gest2 = Math.sin(t * 3.1);
    const gest3 = Math.sin(t * 1.7 + 1.3);
    const speakingNow = speaking || gate;

    // ---------- pelvis, spine, chest ----------
    J.hips.position.set(
      sway * 0.016 * idleW + s * 0.018 * wW,
      c.hipsY + Math.cos(ph * 2) * 0.015 * wW + breath * 0.003,
      0,
    );
    J.hips.rotation.set(
      0,
      -s * 0.12 * wW,
      sway * 0.025 * idleW + s * 0.03 * wW,
    );
    J.spine.rotation.set(
      c.torsoX + breath * 0.01,
      bodyTurn,
      -J.hips.rotation.z * 0.7,
    );
    J.chest.rotation.set(0.02 + breath * 0.012, s * 0.2 * wW, 0);
    J.chest.scale.set(
      1 + breath * 0.01,
      1 + breath * 0.008,
      1 + breath * 0.014,
    );

    // ---------- head: follows the camera + small natural motion ----------
    let yawTo = 0;
    let pitchTo = 0;
    if (lookAtCamera) {
      tmp.copy(camera.position);
      J.root.worldToLocal(tmp);
      yawTo = clamp(Math.atan2(tmp.x, tmp.z), -1.0, 1.0);
      pitchTo = clamp(
        Math.atan2(c.hipsY + 0.72 - tmp.y, Math.hypot(tmp.x, tmp.z)),
        -0.5,
        0.5,
      );
    }
    headYaw.current = damp(headYaw.current, yawTo, 4, dt);
    headPitch.current = damp(headPitch.current, pitchTo, 4, dt);
    const idleLook = lookAtCamera ? 0.01 : 0.04;
    J.neck.rotation.set(0.03, 0, 0);
    J.head.rotation.set(
      c.headX +
        headPitch.current +
        Math.sin(t * 3) * 0.04 * tW +
        (speaking ? Math.sin(t * 5) * 0.03 : 0) +
        Math.sin(t * 0.7 + seed) * 0.015,
      headYaw.current +
        Math.sin(t * 0.9 + seed * 2) * idleLook -
        J.chest.rotation.y * 0.5 +
        bodyTurn * 0.2,
      c.headZ,
    );

    // ---------- eyes: gaze drift, looking down when reading, blinking ----------
    J.eyeL.rotation.set(
      (reading ? 0.32 : 0) + Math.sin(t * 0.6 + seed * 2) * 0.03,
      lookAtCamera ? 0 : Math.sin(t * 0.8 + seed) * 0.07,
      0,
    );
    J.eyeR.rotation.copy(J.eyeL.rotation);

    const b = blink.current;
    b.timer -= dt;
    if (!b.active && b.timer <= 0) {
      b.active = true;
      b.p = 0;
    }
    let lid = 0;
    if (b.active) {
      b.p += dt / 0.16;
      lid = Math.sin(Math.min(b.p, 1) * Math.PI);
      if (b.p >= 1) {
        b.active = false;
        b.timer = 2 + Math.random() * 3.5;
      }
    }
    // the upper lids follow the gaze down when reading, and swing shut on a blink
    J.lidL.rotation.x = J.lidR.rotation.x =
      -0.45 + (reading ? 0.25 : 0) + lid * 1.5;

    // ---------- mouth ----------
    const mouthTarget = speakingNow
      ? 0.25 + 0.75 * Math.abs(Math.sin(t * 13) * Math.sin(t * 4.7))
      : 0;
    mouthOpen.current = damp(mouthOpen.current, mouthTarget, 25, dt);
    J.mouth.visible = mouthOpen.current > 0.07;
    J.mouth.scale.y = Math.max(0.001, mouthOpen.current);

    // ---------- arms (walk swing + talk gestures layered on the base pose) ----------
    J.armL.rotation.set(
      c.armL.shoulderX +
        s * 0.5 * wW -
        (0.15 * gest2 + 0.1 * gest3) * tW +
        breath * 0.01,
      0,
      c.armL.shoulderZ,
    );
    J.foreL.rotation.x = c.armL.elbowX - 0.3 * wW - (0.25 + 0.15 * gest3) * tW;
    J.armR.rotation.set(
      c.armR.shoulderX -
        s * 0.5 * wW -
        (0.55 + 0.35 * gest) * tW +
        breath * 0.01,
      0,
      c.armR.shoulderZ - 0.2 * tW,
    );
    J.foreR.rotation.x = c.armR.elbowX - 0.3 * wW - (0.8 + 0.4 * gest2) * tW;

    // ---------- legs + feet ----------
    const stanceL = Math.max(0, sway) * idleW;
    J.legL.rotation.set(
      c.legL.hipX - s * 0.6 * wW - stanceL * 0.05,
      0,
      c.legL.hipZ,
    );
    J.shinL.rotation.x =
      c.legL.kneeX + Math.max(0, co) * 0.9 * wW + stanceL * 0.08;
    J.footL.rotation.x =
      (Math.max(0, co) * 0.4 - Math.max(0, -co) * Math.max(0, s) * 0.5) * wW;

    const stanceR = Math.max(0, -sway) * idleW;
    J.legR.rotation.set(
      c.legR.hipX + s * 0.6 * wW - stanceR * 0.05,
      0,
      c.legR.hipZ,
    );
    J.shinR.rotation.x =
      c.legR.kneeX + Math.max(0, -co) * 0.9 * wW + stanceR * 0.08;
    J.footR.rotation.x =
      (Math.max(0, -co) * 0.4 - Math.max(0, co) * Math.max(0, -s) * 0.5) * wW;
  });

  const sw = look.shoulderWidth;
  const hw = look.hipWidth;
  const hairParts = HAIR[look.hairStyle];

  const arm = (side: "L" | "R") => {
    const sign = side === "L" ? 1 : -1;
    return (
      <group
        ref={reg(`arm${side}` as JointName)}
        position={[sign * (sw / 2), 0.21, 0]}
      >
        <mesh
          geometry={g.limb}
          material={m.top}
          position={[0, -UPPER / 2, 0]}
          scale={[0.1, UPPER, 0.1]}
        />
        <mesh
          geometry={g.sphere}
          material={m.top}
          position={[0, -UPPER, 0]}
          scale={0.049}
        />
        <group ref={reg(`fore${side}` as JointName)} position={[0, -UPPER, 0]}>
          <mesh
            geometry={g.limb}
            material={m.top}
            position={[0, -FORE / 2, 0]}
            scale={[0.082, FORE, 0.082]}
          />
          {/* shirt cuff */}
          <mesh
            geometry={g.tube}
            material={m.shirt}
            position={[0, -FORE + 0.012, 0]}
            scale={[0.076, 0.028, 0.076]}
          />

          {/* hand */}
          <group position={[0, -FORE, 0]}>
            <mesh
              geometry={g.sphere}
              material={m.skin}
              position={[0, -0.034, 0.002]}
              scale={[0.03, 0.04, 0.017]}
            />
            <group ref={reg(`fineHand${side}` as JointName)}>
              <mesh
                geometry={g.box}
                material={m.skin}
                position={[0, -0.077, 0.007]}
                rotation={[-0.25, 0, 0]}
                scale={[0.052, 0.05, 0.015]}
              />
              <mesh
                geometry={g.limb}
                material={m.skin}
                position={[-sign * 0.016, -0.042, 0.018]}
                rotation={[-0.4, 0, sign * 0.2]}
                scale={[0.016, 0.042, 0.016]}
              />
            </group>

            {/* things held in the right hand */}
            {side === "R" && phoneHeld && (
              <mesh position={[0, -0.06, 0.035]}>
                <boxGeometry args={[0.07, 0.14, 0.012]} />
                <meshStandardMaterial color="#111111" roughness={0.3} />
              </mesh>
            )}
            {side === "R" && pose === "briefcase" && (
              <group position={[0, -0.06, 0]}>
                <mesh
                  geometry={g.box}
                  material={m.belt}
                  position={[0, -0.01, 0]}
                  scale={[0.1, 0.02, 0.02]}
                />
                <mesh
                  geometry={g.box}
                  material={m.case}
                  position={[0, -0.17, 0]}
                  scale={[0.42, 0.3, 0.12]}
                />
                <mesh
                  geometry={g.box}
                  material={m.belt}
                  position={[0, -0.2, 0.062]}
                  scale={[0.05, 0.03, 0.01]}
                />
              </group>
            )}
            {side === "R" && pose === "coffee" && (
              // counter-rotated so the cup stays upright whatever the forearm does
              <group position={[0, -0.06, 0.035]} rotation={[2.2, 0, 0]}>
                <mesh
                  geometry={g.limb}
                  material={m.cup}
                  scale={[0.07, 0.1, 0.07]}
                />
                <mesh
                  geometry={g.tube}
                  material={m.cupSleeve}
                  position={[0, -0.005, 0]}
                  scale={[0.074, 0.045, 0.074]}
                />
                <mesh
                  geometry={g.tube}
                  material={m.cup}
                  position={[0, 0.055, 0]}
                  scale={[0.076, 0.012, 0.076]}
                />
              </group>
            )}
          </group>
        </group>
      </group>
    );
  };

  const leg = (side: "L" | "R") => {
    const sign = side === "L" ? 1 : -1;
    return (
      <group
        ref={reg(`leg${side}` as JointName)}
        position={[sign * (hw / 2), 0, 0]}
      >
        <mesh
          geometry={g.limb}
          material={m.bottom}
          position={[0, -THIGH / 2, 0]}
          scale={[0.16, THIGH, 0.17]}
        />
        <mesh
          geometry={g.sphere}
          material={m.bottom}
          position={[0, -THIGH, 0]}
          scale={0.064}
        />
        <group ref={reg(`shin${side}` as JointName)} position={[0, -THIGH, 0]}>
          <mesh
            geometry={g.limb}
            material={m.bottom}
            position={[0, -SHIN / 2, 0]}
            scale={[0.12, SHIN, 0.125]}
          />
          <group ref={reg(`foot${side}` as JointName)} position={[0, -SHIN, 0]}>
            <mesh
              geometry={g.sphere}
              material={m.shoes}
              position={[0, -0.032, 0.035]}
              scale={[0.046, 0.042, 0.115]}
            />
            <mesh
              geometry={g.box}
              material={m.sole}
              position={[0, -0.072, 0.032]}
              scale={[0.092, 0.014, 0.235]}
            />
          </group>
        </group>
      </group>
    );
  };

  return (
    <group
      ref={reg("root")}
      position={position}
      rotation={[0, rotationY, 0]}
      scale={look.height}
    >
      <group ref={reg("hips")} position={[0, 0.95, 0]}>
        {/* pelvis + belt */}
        <mesh
          geometry={g.sphere}
          material={m.bottom}
          scale={[(hw + 0.14) / 2, 0.1, 0.11]}
        />
        <mesh
          geometry={g.tube}
          material={m.belt}
          position={[0, 0.085, 0]}
          scale={[hw + 0.13, 0.035, 0.205]}
        />

        <group ref={reg("spine")}>
          {/* jacket: the hem covers the hips, then the waist */}
          <mesh
            geometry={g.limb}
            material={m.top}
            position={[0, 0.0, 0]}
            scale={[hw + 0.19, 0.24, 0.25]}
          />
          <mesh
            geometry={g.limb}
            material={m.top}
            position={[0, 0.15, 0]}
            scale={[sw * 0.8, 0.28, 0.2]}
          />

          <group ref={reg("chest")} position={[0, 0.27, 0]}>
            <mesh
              geometry={g.sphere}
              material={m.top}
              position={[0, 0.13, 0]}
              scale={[(sw + 0.1) / 2, 0.17, 0.125]}
            />

            {/* suit details: shirt front, lapels, tie / scarf, pocket square, sloping trapezius */}
            <group ref={reg("fineBody")}>
              <mesh
                geometry={g.box}
                material={m.shirt}
                position={[0, 0.14, 0.126]}
                scale={[0.1, 0.19, 0.012]}
              />
              {[1, -1].map((s) => (
                <mesh
                  key={s}
                  geometry={g.box}
                  material={m.top}
                  position={[s * 0.062, 0.145, 0.129]}
                  rotation={[0, 0, s * 0.28]}
                  scale={[0.05, 0.19, 0.012]}
                />
              ))}
              <mesh
                geometry={g.box}
                material={m.accent}
                position={[0, 0.115, 0.133]}
                scale={[0.028, 0.16, 0.01]}
              />
              <mesh
                geometry={g.sphere}
                material={m.accent}
                position={[0, 0.215, 0.13]}
                scale={[0.02, 0.017, 0.014]}
              />
              <mesh
                geometry={g.box}
                material={m.shirt}
                position={[sw * 0.22, 0.1, 0.122]}
                scale={[0.032, 0.02, 0.008]}
              />
              {[1, -1].map((s) => (
                <mesh
                  key={s}
                  geometry={g.sphere}
                  material={m.top}
                  position={[s * 0.075, 0.285, -0.005]}
                  rotation={[0, 0, -s * 0.35]}
                  scale={[0.09, 0.035, 0.06]}
                />
              ))}
            </group>

            {/* shoulders */}
            {[1, -1].map((s) => (
              <mesh
                key={s}
                geometry={g.sphere}
                material={m.top}
                position={[s * (sw / 2), 0.21, 0]}
                scale={0.064}
              />
            ))}

            {/* newspaper, held at the chest in both hands */}
            {reading && (
              <group position={[0, 0.13, 0.3]} rotation={[-0.15, 0, 0]}>
                <mesh>
                  <planeGeometry args={[0.42, 0.32]} />
                  <meshStandardMaterial
                    map={paperTex}
                    side={THREE.DoubleSide}
                    roughness={0.95}
                  />
                </mesh>
              </group>
            )}

            {/* neck + collar */}
            <group ref={reg("neck")} position={[0, 0.28, 0]}>
              <mesh
                geometry={g.tube}
                material={m.skin}
                position={[0, 0.03, 0]}
                scale={[0.1, 0.1, 0.105]}
              />
              <mesh
                geometry={g.tube}
                material={m.shirt}
                position={[0, 0, 0]}
                scale={[0.122, 0.03, 0.126]}
              />

              {/* head: one sculpted mesh with a painted face, real eyes and eyelids */}
              <group ref={reg("head")} position={[0, 0.06, 0]}>
                <group position={[0, 0.115, 0]}>
                  <mesh geometry={headGeo} material={m.face} />

                  <group ref={reg("fineHead")}>
                    {/* ears */}
                    {[1, -1].map((s) => (
                      <mesh
                        key={s}
                        geometry={g.sphere}
                        material={m.skin}
                        position={[s * 0.079, -0.005, -0.003]}
                        scale={[0.008, 0.022, 0.014]}
                      />
                    ))}

                    {/* eyes: the eyeball (looks around) sits in the socket; the lids open and shut over it */}
                    {([1, -1] as const).map((s) => (
                      <group
                        key={s}
                        position={[s * FACE.eyeX, FACE.eyeY, EYE.z]}
                      >
                        <group ref={reg(s === 1 ? "eyeL" : "eyeR")}>
                          <mesh
                            geometry={eyes.ball}
                            material={m.eye}
                            scale={EYE.r}
                          />
                        </group>
                        <mesh
                          ref={reg(s === 1 ? "lidL" : "lidR")}
                          geometry={eyes.lidTop}
                          material={m.lid}
                          scale={EYE.r * 1.07}
                          rotation={[-0.45, 0, 0]}
                        />
                        <mesh
                          geometry={eyes.lidBottom}
                          material={m.lid}
                          scale={EYE.r * 1.07}
                          rotation={[0.5, 0, 0]}
                        />
                      </group>
                    ))}

                    {/* the open mouth, visible only while speaking */}
                    <group
                      ref={reg("mouth")}
                      position={[0, FACE.mouthY, 0.0855]}
                      visible={false}
                    >
                      <mesh material={m.mouthDark} scale={[0.0125, 0.0085, 1]}>
                        <circleGeometry args={[1, 18]} />
                      </mesh>
                      <mesh
                        material={m.teeth}
                        position={[0, 0.0032, 0.0003]}
                        scale={[0.0105, 0.0028, 1]}
                      >
                        <circleGeometry args={[1, 14]} />
                      </mesh>
                    </group>
                  </group>

                  {/* hair, built from several shaped pieces */}
                  {hairParts.map((p, i) => (
                    <mesh
                      key={i}
                      geometry={g[p.shape]}
                      material={m.hair}
                      position={p.position}
                      rotation={p.rotation}
                      scale={p.scale}
                    />
                  ))}
                </group>
              </group>
            </group>

            {arm("L")}
            {arm("R")}
          </group>
        </group>

        {leg("L")}
        {leg("R")}
      </group>
    </group>
  );
}
