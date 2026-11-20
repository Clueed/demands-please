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
    calendar: { x: 4, y: 4, w: 120, h: 260 },
    binder: { x: 128, y: 4, w: 176, h: 260 },
    gauges: { x: 308, y: 4, w: 154, h: 46 },
    form: { x: 308, y: 54, w: 154, h: 210 },
  },
  order: ["calendar", "binder", "gauges", "form"],
});

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
