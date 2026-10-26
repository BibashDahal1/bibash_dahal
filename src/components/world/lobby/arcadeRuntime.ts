/**
 * Shared state for the arcade corner, so five cabinets don't each do their own work every frame.
 * ArcadeCorner updates it once per frame; the cabinets read it.
 */
export const arcadeRuntime = {
  /** is the arcade corner inside the camera view? */
  visible: true,
  /** frame counter */
  frame: 0,
  /** a cabinet repaints its screen every `interval` frames (cabinets take turns) */
  interval: 6,
};
