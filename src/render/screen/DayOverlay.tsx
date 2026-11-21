import { ChevronRight, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";

import { summarizeDay } from "@/game/engine";
import { RULES } from "@/game/rules";
import { dayDate, FINDINGS_LIMIT, formatDay, LAST_DAY } from "@/game/time";
import type { GameState } from "@/game/types";
import { cn } from "@/lib/utils";

import { control } from "../styles";
import { ENDINGS } from "./endings";

/**
 * Between visitors: the morning memo, the evening summary, and the end of the run.
 * Shown on the monitor above every window.
 */
export function DayOverlay({
  state,
  onStart,
  onNextDay,
  onRestart,
}: {
  state: GameState;
  onStart: () => void;
  onNextDay: () => void;
  onRestart: () => void;
}) {
  const date = formatDay(dayDate(state.day));

  if (state.phase === "briefing") {
    const rule = RULES.find((r) => r.day === state.day);
    return (
      <Sheet title={`Day ${state.day} of ${LAST_DAY} · ${date}`}>
        <p className="office-label">Memo from the CIO</p>
        {rule && (
          <div className="office-rule is-new">
            <div className="flex items-baseline gap-2">
              <span className="office-rule-number">{rule.day}</span>
              <b className="flex-1">{rule.title}</b>
              <span className="office-new">New</span>
            </div>
            <p>{rule.text}</p>
          </div>
        )}
        {state.day === 1 && (
          <p className="office-muted">
            Approve or decline each request, then press Next. The office closes at 17:00, and anyone
            still waiting then goes off and buys their own tools. Wrong calls become audit findings;
            see everyone by 16:00 and one finding gets closed.
          </p>
        )}
        <p>{state.queue.length} visitors today. Closing time 17:00.</p>
        <button className={cn(control, "office-next self-end")} onClick={onStart}>
          Start the day <ChevronRight aria-hidden="true" />
        </button>
      </Sheet>
    );
  }

  if (state.phase === "dayEnd") {
    return (
      <Sheet title={`End of day ${state.day} · ${date}`}>
        <Stats state={state} />
        <Forgiven state={state} />
        <button className={cn(control, "office-next self-end")} onClick={onNextDay}>
          Next day <ChevronRight aria-hidden="true" />
        </button>
      </Sheet>
    );
  }

  const ending = ENDINGS[state.lostTo ?? "won"];
  return (
    <Sheet title={ending.title}>
      <p className="office-label">{ending.from}</p>
      <p>{ending.text(state)}</p>
      <Stats state={state} />
      <button className={cn(control, "office-next self-end")} onClick={onRestart}>
        <RotateCcw aria-hidden="true" /> Play again
      </button>
    </Sheet>
  );
}

function Stats({ state }: { state: GameState }) {
  const s = summarizeDay(state);
  return (
    <dl className="office-fields">
      <dt className="office-label">Decided today</dt>
      <dd className="office-number">{s.decided}</dd>
      <dt className="office-label">Findings today</dt>
      <dd className="office-number">{s.findings}</dd>
      <dt className="office-label">Open findings</dt>
      <dd className="office-number">
        {state.findings} / {FINDINGS_LIMIT}
      </dd>
    </dl>
  );
}

function Forgiven({ state }: { state: GameState }) {
  return (
    state.forgivenToday && (
      <p className="office-notice self-start">Everyone seen by 16:00: one finding closed.</p>
    )
  );
}

function Sheet({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="office-overlay absolute inset-0 z-50 grid place-items-center">
      <section className="office-window office-sheet flex flex-col" aria-label={title}>
        <div className="office-titlebar flex shrink-0 items-center px-4">{title}</div>
        <div className="flex flex-col gap-3 p-4">{children}</div>
      </section>
    </div>
  );
}
