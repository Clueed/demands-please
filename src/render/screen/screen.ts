import type { AttachmentKind } from "@/game/types";
import { clamp } from "@/lib/utils";

import { REGIONS, type Rect } from "../layout";

/**
 * Presentation-only state for the monitor: where each window sits, which are open and which
 * is on top. Kept separate from `GameState` on purpose; the game rules never see it.
 * All coordinates are whole game pixels relative to the screen.
 */
export type WindowId = "ticket" | "rulebook" | AttachmentKind;

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
const DOC = { w: 156, h: 150 };
/** Attachments open stacked over the rulebook, clear of the ticket, each a little lower. */
const doc = (i: number): Rect => ({ x: 276 + i * 6, y: 10 + i * 14, ...DOC });

export const initialScreen = (): ScreenState => ({
  windows: {
    ticket: { x: 4, y: 4, w: 180, h: FULL_H },
    rulebook: { x: 188, y: 4, w: REGIONS.screen.w - 192, h: FULL_H },
    businessCase: doc(0),
    vendorSheet: doc(1),
    certificate: doc(2),
    worksCouncil: doc(3),
  },
  order: ["rulebook", "ticket"],
});

export type ScreenAction =
  | { type: "move"; id: WindowId; x: number; y: number }
  | { type: "raise"; id: WindowId }
  | { type: "close"; id: WindowId }
  /** Put away every attachment, e.g. when the next ticket comes in. */
  | { type: "closeAttachments" };

/** How much of a window (game pixels, each way) always stays on the screen, to grab it back. */
export const MIN_VISIBLE = 16;

const ATTACHMENT_WINDOWS: WindowId[] = [
  "businessCase",
  "vendorSheet",
  "certificate",
  "worksCouncil",
];

/**
 * Let a window hang off the screen, but keep at least `MIN_VISIBLE` of it on screen,
 * snapped to whole game pixels.
 */
function clampToScreen(win: Rect, x: number, y: number): Rect {
  const { w, h } = REGIONS.screen;
  return {
    ...win,
    x: clamp(Math.round(x), MIN_VISIBLE - win.w, w - MIN_VISIBLE),
    y: clamp(Math.round(y), MIN_VISIBLE - win.h, h - MIN_VISIBLE),
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
  if (!state.order.some((id) => ATTACHMENT_WINDOWS.includes(id))) return state;
  return { ...state, order: state.order.filter((id) => !ATTACHMENT_WINDOWS.includes(id)) };
}
