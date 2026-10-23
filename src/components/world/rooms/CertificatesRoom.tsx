"use client";

import Plant from "@/components/world/props/Plant";
import GoldenName from "@/components/world/lobby/GoldenName";
import Bench from "@/components/world/certificates/Bench";
import CertificateFrame from "@/components/world/certificates/CertificateFrame";
import CertificatesShell from "@/components/world/certificates/CertificatesShell";
import Showpiece from "@/components/world/certificates/Showpiece";
import {
  CERTIFICATES_ROOM,
  SHOWPIECE,
  certificateBenches,
  certificatePlants,
  certificateSlots,
} from "@/constants/rooms";

/** The certificates gallery. Everything here comes from data/certificates.ts. */
export default function CertificatesRoom() {
  const { depth: D } = CERTIFICATES_ROOM;

  return (
    <CertificatesShell dims={CERTIFICATES_ROOM}>
      <GoldenName
        text="CERTIFICATES"
        position={[0, 3.9, -D / 2 + 0.06]}
        fontSize={0.95}
        subtitle="CREDENTIALS & ACHIEVEMENTS"
      />

      {certificateSlots.map((slot) => (
        <CertificateFrame key={slot.certificate.id} slot={slot} />
      ))}

      {certificateBenches.map((z) => (
        <Bench key={z} position={[0, 0, z]} />
      ))}

      <Showpiece x={SHOWPIECE.x} z={SHOWPIECE.z} />

      {certificatePlants.map((p) => (
        <Plant
          key={`${p.x}:${p.z}`}
          position={[p.x, 0, p.z]}
          variant={p.variant}
          scale={p.scale}
        />
      ))}
    </CertificatesShell>
  );
}
