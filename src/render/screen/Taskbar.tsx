import { RotateCcw } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { clock } from "@/game/time";

/** The start button's orb, drawn on the art grid: one game pixel per cell. */
const ORB = "M2 0h4v1h1v1h1v4h-1v1h-1v1H2v-1H1v-1H0V2h1V1h1Z";
const ORB_SHINE = "M2 2h2v1H3v1H2Z";

/**
 * The dock along the bottom of the screen: the start orb (its menu restarts the game) on the
 * left, whatever the game shows in the middle, and the clock on the right.
 */
export function Taskbar({
  minutes,
  onRestart,
  children,
}: {
  minutes: number;
  onRestart: () => void;
  children: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <footer className="office-taskbar">
      <button
        className="office-start"
        aria-label="Start"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <svg viewBox="0 0 8 8" shapeRendering="crispEdges" aria-hidden="true">
          <path d={ORB} className="office-orb" />
          <path d={ORB_SHINE} className="office-orb-shine" />
        </svg>
      </button>
      {menuOpen && (
        <>
          {/* Clicking anywhere else closes the menu. */}
          <div className="fixed inset-0" onClick={() => setMenuOpen(false)} />
          <div className="office-start-menu" role="menu">
            <button
              role="menuitem"
              className="office-menu-item"
              onClick={() => {
                setMenuOpen(false);
                onRestart();
              }}
            >
              <RotateCcw aria-hidden="true" /> Restart game
            </button>
          </div>
        </>
      )}
      {children}
      <span className="flex-1" />
      <time className="office-tray office-clock office-number">{clock(minutes)}</time>
    </footer>
  );
}
