import { HAPPINESS_SCALE, summarize } from "@/game/engine";
import type { GameState } from "@/game/types";

import { cn } from "@/lib/utils";

import { money } from "../format";
import { REGIONS } from "../layout";
import { Placeholder } from "../Placeholder";
import { control } from "../styles";

const SHEET = { w: 240, h: 160 };

/** Shown on the monitor, above every window, once the queue is empty. */
export function EndOfDay({ state, onRestart }: { state: GameState; onRestart: () => void }) {
  const s = summarize(state);
  return (
    <div className="absolute inset-0 z-50 bg-neutral-900/60">
      <Placeholder
        label="end-of-day report"
        rect={{
          x: (REGIONS.screen.w - SHEET.w) / 2,
          y: (REGIONS.screen.h - SHEET.h) / 2,
          ...SHEET,
        }}
        className="bg-neutral-100"
      >
        <p className="px-1">
          License spend {money(s.spent)}/yr
          <br />
          (started {money(s.startingSpend)}, buy-all {money(s.buyEverythingCost)})
          <br />
          IT NPS score {s.happiness}/{HAPPINESS_SCALE.max}
          <br />
          Matches {s.matchesFound} of {s.matchesPossible}
        </p>
        <button className={cn(control, "mx-1 mt-2 self-start bg-neutral-200")} onClick={onRestart}>
          Play again
        </button>
      </Placeholder>
    </div>
  );
}
