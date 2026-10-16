import { useEffect } from "react";
import { input } from "@/lib/input";

/** Keyboard + pointer-locked mouse look, written into the shared input object. */
export function useDesktopInput() {
  useEffect(() => {
    const down = (e: KeyboardEvent) => input.keys.add(e.code);
    const up = (e: KeyboardEvent) => input.keys.delete(e.code);
    const blur = () => input.keys.clear();
    const mouse = (e: MouseEvent) => {
      if (!document.pointerLockElement) return;
      input.look.dx += e.movementX;
      input.look.dy += e.movementY;
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    window.addEventListener("mousemove", mouse);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      window.removeEventListener("mousemove", mouse);
    };
  }, []);
}
