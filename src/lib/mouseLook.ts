// On desktop, mouse look is the default. The browser only allows pointer lock after a click or key press,
// so the first click in the scene captures the mouse. Esc releases it, and a click captures it again.
// Menus and cards release it, and relockIfWanted() takes it back when they close.
let wanted = true;

function lock() {
  const result = document.body.requestPointerLock?.() as unknown as
    | Promise<void>
    | undefined;
  result?.catch?.(() => undefined);
}

export const wantsMouseLook = () => wanted;

/** Switches mouse look on or off. Call from a click or key press (browsers require it). */
export function toggleMouseLook() {
  if (document.pointerLockElement) {
    wanted = false;
    document.exitPointerLock();
  } else {
    wanted = true;
    lock();
  }
}

/** Captures the mouse. Call from a click or key press. */
export function lockMouse() {
  wanted = true;
  if (!document.pointerLockElement) lock();
}

/** After a menu or card closes: take the mouse again, if the visitor hasn't turned mouse look off. */
export function relockIfWanted() {
  if (wanted && !document.pointerLockElement) lock();
}
