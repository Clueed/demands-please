import { useEffect, useRef, type Dispatch, type PointerEvent, type ReactNode } from "react";

import { Placeholder } from "../Placeholder";
import { toGamePx } from "../stage";
import { useFit } from "../stageFitContext";
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
  screen,
  dispatch,
  children,
}: {
  id: WindowId;
  label: string;
  screen: ScreenState;
  dispatch: Dispatch<ScreenAction>;
  children?: ReactNode;
}) {
  const fit = useFit();
  const press = useRef<AbortController | null>(null);
  const rect = screen.windows[id];

  // Stop listening if the window goes away mid-press.
  useEffect(() => () => press.current?.abort(), []);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    dispatch({ type: "raise", id });
    if (e.button !== 0) return;

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
    <Placeholder
      label={label}
      rect={rect}
      className="cursor-grab touch-none bg-neutral-200"
      style={{ zIndex: screen.order.indexOf(id) + 1 }}
      onPointerDown={onPointerDown}
    >
      {children}
    </Placeholder>
  );
}
