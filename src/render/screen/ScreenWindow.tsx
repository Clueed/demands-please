import { X } from "lucide-react";
import { useEffect, useRef, type Dispatch, type PointerEvent, type ReactNode } from "react";

import { rectStyle } from "../layout";
import { toGamePx } from "../stage";
import { useFit } from "../stageFitContext";
import { WINDOW_ICONS } from "./windows";
import { clampPointer, type ScreenAction, type ScreenState, type WindowId } from "./screen";

/** How far (game pixels) the pointer must move before a press becomes a drag. */
const DRAG_THRESHOLD = 3;

/**
 * A window on the monitor: press to bring to the front, drag to move.
 * A press only becomes a drag once the pointer moves, so clicks on anything inside
 * (buttons, tabs, scroll areas) work as usual.
 */
export function ScreenWindow({
  id,
  label,
  onClose,
  screen,
  dispatch,
  children,
}: {
  id: WindowId;
  label: string;
  /** Shows a close button in the title bar. */
  onClose?: () => void;
  screen: ScreenState;
  dispatch: Dispatch<ScreenAction>;
  children?: ReactNode;
}) {
  const Icon = WINDOW_ICONS[id];
  const fit = useFit();
  const press = useRef<AbortController | null>(null);
  const rect = screen.windows[id];

  // Stop listening if the window goes away mid-press.
  useEffect(() => () => press.current?.abort(), []);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    dispatch({ type: "raise", id });
    if (
      e.button !== 0 ||
      !(e.target instanceof Element) ||
      !e.target.closest("[data-window-handle]")
    )
      return;

    // Listen on the window rather than capturing the pointer: capture would retarget the
    // click away from controls, and without either a fast move could leave the window.
    press.current?.abort();
    const controller = new AbortController();
    press.current = controller;
    const start = clampPointer(toGamePx(fit, e.clientX, e.clientY));
    const from = { x: rect.x, y: rect.y };
    let dragging = false;

    const onMove = (ev: globalThis.PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return;
      // Like a mouse that can't leave the display: the window follows the pointer only as
      // far as the screen's edge, so it can hang off the screen but the grab point can't.
      const pointer = clampPointer(toGamePx(fit, ev.clientX, ev.clientY));
      const dx = pointer.x - start.x;
      const dy = pointer.y - start.y;
      if (!dragging && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      dragging = true;
      // The reducer also keeps a strip of the window on screen, to grab it back.
      dispatch({ type: "move", id, x: from.x + dx, y: from.y + dy });
    };
    const onEnd = (ev: globalThis.PointerEvent) => {
      if (ev.pointerId === e.pointerId) controller.abort();
    };

    const { signal } = controller;
    window.addEventListener("pointermove", onMove, { signal });
    window.addEventListener("pointerup", onEnd, { signal });
    window.addEventListener("pointercancel", onEnd, { signal });
  };

  return (
    <section
      aria-label={label}
      className="office-window absolute flex flex-col"
      data-active={screen.order.at(-1) === id}
      style={{ ...rectStyle(rect), zIndex: screen.order.indexOf(id) + 1 }}
      onPointerDown={onPointerDown}
    >
      <div
        data-window-handle
        className="office-titlebar flex shrink-0 cursor-grab touch-none items-center justify-between px-4 text-game-sm"
      >
        <span className="flex items-center gap-3">
          <Icon aria-hidden="true" />
          {label}
        </span>
        <span className="office-titlebar-ridges" aria-hidden="true" />
        {onClose && (
          <button className="office-close" onClick={onClose} aria-label={`Close ${label}`}>
            <X aria-hidden="true" />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}
