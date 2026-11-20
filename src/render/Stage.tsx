import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

import { gamePx } from "./layout";
import { fitStage, type StageFit } from "./stage";
import { StageFitContext } from "./stageFitContext";

const measure = () => fitStage(window.innerWidth, window.innerHeight);

/** Recomputes the zoom whenever the viewport is resized. */
function useStageFit(): StageFit {
  const [fit, setFit] = useState(measure);

  useEffect(() => {
    const update = () => setFit(measure());
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return fit;
}

/**
 * The game window, sized to the viewport. Everything inside is measured in game pixels:
 * `--game-px` is one game pixel in CSS pixels, and Tailwind's spacing scale is rebased
 * onto it, so `p-2` means 2 game pixels and `w-12` means 12.
 */
export function Stage({ children }: { children: ReactNode }) {
  const fit = useStageFit();

  const style = {
    "--game-px": `${fit.cssPx}px`,
    "--spacing": "var(--game-px)",
    left: fit.left,
    top: fit.top,
    width: gamePx(fit.width),
    height: gamePx(fit.height),
  } as CSSProperties;

  return (
    <StageFitContext value={fit}>
      {/* Bars around the game window. Placeholder: the frame around it is a style decision. */}
      <div className="fixed inset-0 overflow-hidden bg-neutral-900">
        <div
          className="absolute overflow-hidden font-game text-game select-none [image-rendering:pixelated]"
          style={style}
        >
          {children}
        </div>
      </div>
    </StageFitContext>
  );
}
