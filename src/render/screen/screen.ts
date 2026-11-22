import type { AttachmentKind } from "@/game/types";
import { clamp } from "@/lib/utils";

import { REGIONS, type Rect } from "../layout";

/**
 * Presentation-only state for the monitor: where each window sits, which are open and which
 * is on top. Kept separate from `GameState` on purpose; the game rules never see it.
 * All coordinates are whole game pixels relative to the screen.
 */
/** The desktop apps beside the service desk, stacked in one spot and switched from the taskbar. */
/** In the order they start stacked, back to front. */
export const APP_WINDOWS = ["catalog", "org", "mail", "intranet"] as const;
export type AppWindowId = (typeof APP_WINDOWS)[number];
export type WindowId = "ticket" | AppWindowId | AttachmentKind;

export type ScreenState = {
  windows: Record<WindowId, Rect>;
  /** Open windows, bottom to top. */
  order: WindowId[];
};

/** Height of the taskbar along the bottom of the screen, in game pixels. */
export const TASKBAR_H = 14;
/** The desktop area above the taskbar, where windows start out. */
const DESK_H = REGIONS.screen.h - TASKBAR_H;
const FULL_H = DESK_H - 8;
/**
 * Where each app opens: sized to what's in it and dropped about the desktop, overlapping like
 * a desk nobody tidied. Moving them around is part of the job.
 */
const APP_RECTS: Record<AppWindowId, Rect> = {
  // Long and narrow, peeking out on the left and along the top.
  catalog: { x: 182, y: 4, w: 222, h: 230 },
  // A short tree; its title bar and right edge stick out from behind mail.
  org: { x: 290, y: 14, w: 160, h: 158 },
  mail: { x: 200, y: 30, w: 220, h: 150 },
  // Just two short lists, over mail's corner.
  intranet: { x: 298, y: 124, w: 150, h: 126 },
};
/** How tall each attachment opens: as long as its paper, with a little room for a long business case. */
const DOC_H: Record<AttachmentKind, number> = {
  businessCase: 104,
  vendorSheet: 90,
  certificate: 106,
  worksCouncil: 90,
};
/** Attachments open stacked over the apps, clear of the ticket, each a little lower. */
const doc = (kind: AttachmentKind, i: number): Rect => ({
  x: 276 + i * 6,
  y: 10 + i * 14,
  w: 156,
  h: DOC_H[kind],
});

export const initialScreen = (): ScreenState => ({
  windows: {
    ticket: { x: 4, y: 4, w: 180, h: FULL_H },
    ...APP_RECTS,
    businessCase: doc("businessCase", 0),
    vendorSheet: doc("vendorSheet", 1),
    certificate: doc("certificate", 2),
    worksCouncil: doc("worksCouncil", 3),
  },
  order: [...APP_WINDOWS, "ticket"],
});

export type ScreenAction =
  | { type: "move"; id: WindowId; x: number; y: number }
  | { type: "raise"; id: WindowId }
  | { type: "close"; id: WindowId }
  /** Close the attachment on top, if any: what Escape does. */
  | { type: "closeTopAttachment" }
  /** Put away every attachment and reset where they open, e.g. when the next ticket comes in. */
  | { type: "closeAttachments" };

/** How much of a window (game pixels) always stays on screen past the left edge, to grab it back. */
export const MIN_VISIBLE = 16;
/** Height of a window's title bar, border included. It never leaves the desktop. */
export const TITLE_H = 15;

const ATTACHMENT_WINDOWS: WindowId[] = [
  "businessCase",
  "vendorSheet",
  "certificate",
  "worksCouncil",
];

/**
 * Let a window hang off the left and bottom of the screen, snapped to whole game pixels.
 * Its title bar always stays on the desktop and its right end (with the close button) on
 * screen, so it can always be grabbed and closed.
 */
function clampToScreen(win: Rect, x: number, y: number): Rect {
  const { w } = REGIONS.screen;
  return {
    ...win,
    x: clamp(Math.round(x), MIN_VISIBLE - win.w, w - win.w),
    y: clamp(Math.round(y), 0, DESK_H - TITLE_H),
  };
}

/**
 * Keep a dragging pointer on the screen, like a mouse that can't leave the display.
 * Takes and returns game pixels relative to the game window.
 */
export function clampPointer(p: { x: number; y: number }) {
  const { x, y, w, h } = REGIONS.screen;
  return { x: clamp(p.x, x, x + w - 1), y: clamp(p.y, y, y + h - 1) };
}

export function screenReducer(state: ScreenState, action: ScreenAction): ScreenState {
  if (action.type === "move") {
    const win = state.windows[action.id];
    const moved = clampToScreen(win, action.x, action.y);
    // Most pointer moves land on the same game pixel; keeping the state skips the re-render.
    if (moved.x === win.x && moved.y === win.y) return state;
    return { ...state, windows: { ...state.windows, [action.id]: moved } };
  }
  if (action.type === "raise") {
    // Raising a closed window opens it.
    if (state.order.at(-1) === action.id) return state;
    return { ...state, order: [...state.order.filter((id) => id !== action.id), action.id] };
  }
  if (action.type === "close") {
    if (!state.order.includes(action.id)) return state;
    return { ...state, order: state.order.filter((id) => id !== action.id) };
  }
  if (action.type === "closeTopAttachment") {
    const top = state.order.findLast((id) => ATTACHMENT_WINDOWS.includes(id));
    return top ? screenReducer(state, { type: "close", id: top }) : state;
  }
  // Each ticket's files open where they first did, wherever the last ones were dragged.
  const start = initialScreen().windows;
  const windows = { ...state.windows };
  for (const id of ATTACHMENT_WINDOWS) windows[id] = start[id];
  return { windows, order: state.order.filter((id) => !ATTACHMENT_WINDOWS.includes(id)) };
}
