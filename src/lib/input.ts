// Mutable input state read every frame by the player controller.
// Deliberately NOT React state: updating it never causes a re-render.
export const input = {
  keys: new Set<string>(),
  move: { x: 0, y: 0 }, // touch joystick, range -1..1 (y up = forward)
  look: { dx: 0, dy: 0 }, // accumulated look delta since last frame
};
