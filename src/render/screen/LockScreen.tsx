import { useEffect } from "react";

import { clock } from "@/game/time";

/**
 * The monitor switched off for a break: the game clock slows to real time behind it. A click on the
 * screen, any key, or the power light again brings the desk back.
 */
export function LockScreen({ minutes, onWake }: { minutes: number; onWake: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      e.preventDefault();
      onWake();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onWake]);

  return (
    <button className="office-lock" onClick={onWake} aria-label="Paused. Wake the monitor">
      <time className="office-lock-clock office-number">{clock(minutes)}</time>
      <span>On a break</span>
      <span className="office-lock-hint">Click to get back to work</span>
    </button>
  );
}
