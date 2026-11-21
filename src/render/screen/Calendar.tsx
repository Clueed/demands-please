import { Clock } from "lucide-react";

import { clock, dayDate, formatDay } from "@/game/time";
import type { GameState } from "@/game/types";
import { cn } from "@/lib/utils";

import { gamePx } from "../layout";
import { control } from "../styles";
import { timeline, TIMELINE_H } from "./calendar";

/**
 * Today's appointments on a timeline, with a line for "now" sliding down it. Hangs off the
 * left edge of the screen, so everything reads from the right.
 */
export function Calendar({ state, onPush }: { state: GameState; onPush: () => void }) {
  const t = timeline(state);
  const working = state.phase === "working";

  return (
    <>
      <div className="office-toolbar flex items-baseline justify-end gap-2">
        <span>{formatDay(dayDate(state.day))}</span>
        <b className="office-number">{clock(state.clock)}</b>
      </div>
      <div className="relative mx-2 mt-2 shrink-0" style={{ height: gamePx(TIMELINE_H) }}>
        {t.hours.map((h) => (
          <div key={h.label} className="office-hour" style={{ top: gamePx(h.y) }}>
            {h.label}
          </div>
        ))}
        <div className="office-past" style={{ height: gamePx(t.nowY) }} />
        {t.blocks.map((b) => (
          <div
            key={b.demand.id}
            className={cn("office-appointment", b.atDesk && "is-now")}
            style={{ top: gamePx(b.y), height: gamePx(b.h) }}
          >
            <b className="truncate">{b.demand.app}</b>
            {b.h >= 18 && (
              <span className="office-muted truncate">
                {b.atDesk ? "At desk" : b.time} · {b.demand.requester.name.split(" ").at(-1)}
              </span>
            )}
          </div>
        ))}
        <div className="office-now" style={{ top: gamePx(t.nowY) }} />
        <div className="office-closing" style={{ top: gamePx(TIMELINE_H) }} />
      </div>
      <div className="mt-auto flex flex-col items-end gap-1 p-2 text-right">
        <span className={cn("office-label", t.afterHours > 0 && "office-warning")}>
          {t.afterHours > 0 ? `${t.afterHours} after 17:00 → backlog` : "Closing 17:00"}
        </span>
        <button className={cn(control, "self-stretch")} disabled={!working} onClick={onPush}>
          <Clock aria-hidden="true" /> Push +30 min
        </button>
      </div>
    </>
  );
}
