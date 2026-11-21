import { clamp } from "@/lib/utils";

import { REGIONS, type Rect } from "../layout";

/**
 * Presentation-only state for the monitor: where each window sits and which is on top.
 * Kept separate from `GameState` on purpose; the game rules never see it.
 * All coordinates are whole game pixels relative to the screen.
 */
export type WindowId = "calendar" | "gauges" | "binder" | "form";

export type ScreenState = {
  windows: Record<WindowId, Rect>;
  /** Bottom to top. */
  order: WindowId[];
};

export const initialScreen = (): ScreenState => ({
  windows: {
    // The calendar hangs off the left edge; its text is right-aligned so the visible part reads.
    calendar: { x: -CALENDAR_HANG, y: 4, w: 100 + CALENDAR_HANG, h: DESK_H - 16 - OVERVIEW_H },
    gauges: { x: 4, y: DESK_H - 4 - OVERVIEW_H, w: 96, h: OVERVIEW_H },
    // Sized to its content, so the decision sits right under the reason.
    form: { x: 104, y: 4, w: 168, h: 204 },
    // The directory is where most of the game happens, so it gets the full-height column.
    binder: { x: 276, y: 4, w: REGIONS.screen.w - 280, h: DESK_H - 8 },
  },
  order: ["calendar", "binder", "gauges", "form"],
});

/** How far the calendar starts out hanging off the left edge of the screen. */
export const CALENDAR_HANG = 24;
/** Height of the taskbar along the bottom of the screen, in game pixels. */
export const TASKBAR_H = 14;
/** The overview only needs room for two figures. */
const OVERVIEW_H = 66;
/** The desktop area above the taskbar, where windows start out. */
const DESK_H = REGIONS.screen.h - TASKBAR_H;

export type ScreenAction =
  | { type: "move"; id: WindowId; x: number; y: number }
  | { type: "raise"; id: WindowId };

/** How much of a window (game pixels, each way) always stays on the screen, to grab it back. */
export const MIN_VISIBLE = 16;

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
  if (state.order.at(-1) === action.id) return state;
  return { ...state, order: [...state.order.filter((id) => id !== action.id), action.id] };
}
