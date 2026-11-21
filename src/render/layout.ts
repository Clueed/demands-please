import type { Size } from "./stage";

/** A rectangle in whole game pixels. */
export type Rect = { x: number; y: number; w: number; h: number };

/** A polygon in whole game pixels, for the few faces drawn in perspective. */
export type Points = readonly (readonly [x: number, y: number])[];

/**
 * The monitor is the game's main interface, so it is as large as the frame allows: whole,
 * on the left of the desk, leaving just enough room on the right for the visitor.
 */
const MONITOR = { x: 8, y: 8, w: 468, h: 286 };
const BEZEL = 6;
const CHIN = 12;
const MONITOR_RIGHT = MONITOR.x + MONITOR.w;
const MONITOR_BOTTOM = MONITOR.y + MONITOR.h;
const MONITOR_CENTRE = MONITOR.x + MONITOR.w / 2;
/** How far the monitor's right side sticks out past its front. */
const MONITOR_DEPTH = 6;
/** The x where the monitor's right side ends; the room right of it is free. */
const MONITOR_SIDE_RIGHT = MONITOR_RIGHT + MONITOR_DEPTH;
/** How far the monitor, being nearer, covers the visitor's chair and shoulder. */
const VISITOR_TUCK = 6;
/** Where the far edge of the desk meets the room. Everything behind the desk ends here. */
const DESK_BACK = 300;
const VISITOR_WIDTH = 148;

/**
 * The parts of the room that stay put whatever the game window's size, in game pixels
 * relative to its top-left corner. The monitor is anchored to the left edge.
 */
export const REGIONS = {
  /** The monitor on the desk, bezel included. Reaches past the left edge of the game window. */
  monitor: MONITOR,
  /** The part of the screen in view, inside the bezel. All the windows live here. */
  screen: {
    x: MONITOR.x + BEZEL,
    y: MONITOR.y + BEZEL,
    w: MONITOR.w - 2 * BEZEL,
    h: MONITOR.h - BEZEL - CHIN,
  },
  /** The neck of the monitor stand, between the monitor and its foot on the desk. */
  standNeck: { x: MONITOR_CENTRE - 28, y: MONITOR_BOTTOM, w: 56, h: 16 },
} as const satisfies Record<string, Rect>;

/** Faces drawn in perspective, seen from right at the desk. */
export const FACES = {
  /** The monitor's right side, visible because it stands left of centre. */
  monitorSide: [
    [MONITOR_RIGHT, MONITOR.y],
    [MONITOR_SIDE_RIGHT, MONITOR.y + 4],
    [MONITOR_SIDE_RIGHT, MONITOR_BOTTOM - 4],
    [MONITOR_RIGHT, MONITOR_BOTTOM],
  ],
  /** The foot of the monitor stand, lying on the desk. */
  standFoot: [
    [MONITOR_CENTRE - 50, MONITOR_BOTTOM + 14],
    [MONITOR_CENTRE + 50, MONITOR_BOTTOM + 14],
    [MONITOR_CENTRE + 60, MONITOR_BOTTOM + 24],
    [MONITOR_CENTRE - 60, MONITOR_BOTTOM + 24],
  ],
} as const satisfies Record<string, Points>;

/** A part of the visitor, centred and standing `lift` above the desk's far edge. */
const seated = (w: number, h: number, lift = 0): Rect => ({
  x: Math.round((VISITOR_WIDTH - w) / 2),
  y: DESK_BACK - lift - h,
  w,
  h,
});

/** The visitor's parts, relative to `roomLayout().visitor`. The desk hides anything below it. */
export const VISITOR_PARTS = {
  chair: seated(140, 194),
  body: seated(120, 168),
  head: seated(60, 68, 166),
} as const satisfies Record<string, Rect>;

/** The parts of the room that stretch with the game window. */
export function roomLayout({ width, height }: Size): {
  wall: Rect;
  visitor: Rect;
  deskTop: Points;
} {
  return {
    /** The back wall, filling the whole game window. */
    wall: { x: 0, y: 0, w: width, h: height },
    /**
     * The person sitting across the desk, right of the monitor and partly behind it: the
     * monitor is nearer, so it covers the edge of the chair and shoulder.
     */
    visitor: {
      x: MONITOR_SIDE_RIGHT - VISITOR_TUCK,
      y: 0,
      w: VISITOR_WIDTH,
      h: DESK_BACK,
    },
    /**
     * The desk top, narrowing towards the back. Its front edge is below the bottom of the
     * game window, so the desk runs out of view; a taller window shows more of it.
     */
    deskTop: [
      [4, DESK_BACK],
      [width - 4, DESK_BACK],
      [width + 90, height + 40],
      [-90, height + 40],
    ],
  };
}

/** A length of `n` game pixels, as CSS. */
export const gamePx = (n: number) => `calc(var(--game-px) * ${n})`;

/** Inline style that places an element at a rect, in game pixels. */
export function rectStyle({ x, y, w, h }: Rect) {
  return { left: gamePx(x), top: gamePx(y), width: gamePx(w), height: gamePx(h) };
}

/** Smallest rect around a polygon. */
export function boundingRect(points: Points): Rect {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}
