/** A size in whole game pixels. */
export type Size = { width: number; height: number };

/**
 * The game window's size in game pixels follows the viewport's aspect ratio. The zoom is set so
 * `STAGE_MIN` just fits, and the window grows past it in whichever direction has room left, up
 * to `STAGE_MAX`. Only viewports wider or taller than that get bars.
 *
 * The scene is laid out for `STAGE_MIN`: extra width shows more of the room to the sides,
 * extra height shows more of the desk. Placeholder limits: 16:9 up to 32:9 wide and 4:3 tall.
 */
export const STAGE_MIN: Size = { width: 640, height: 360 };
export const STAGE_MAX: Size = { width: 1280, height: 480 };

export type StageFit = Size & {
  /** CSS pixels per game pixel. May be fractional. */
  cssPx: number;
  /** Top-left of the game window in CSS pixels. Negative when it overhangs by a fraction of a game pixel. */
  left: number;
  top: number;
};

/** Size and zoom of the game window that fills the viewport, centred. */
export function fitStage(viewportWidth: number, viewportHeight: number): StageFit {
  const cssPx = Math.min(viewportWidth / STAGE_MIN.width, viewportHeight / STAGE_MIN.height);
  // Rounded up so the window covers the viewport; the overhang (under one game pixel) is cut off.
  const width = Math.min(STAGE_MAX.width, Math.ceil(viewportWidth / cssPx - 1e-9));
  const height = Math.min(STAGE_MAX.height, Math.ceil(viewportHeight / cssPx - 1e-9));
  return {
    width,
    height,
    cssPx,
    left: (viewportWidth - width * cssPx) / 2,
    top: (viewportHeight - height * cssPx) / 2,
  };
}

/** Convert a pointer position (CSS pixels, relative to the viewport) to whole game pixels. */
export function toGamePx(fit: StageFit, clientX: number, clientY: number) {
  return {
    x: Math.floor((clientX - fit.left) / fit.cssPx),
    y: Math.floor((clientY - fit.top) / fit.cssPx),
  };
}
