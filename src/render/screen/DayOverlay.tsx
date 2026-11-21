import { Check, ChevronRight, Coffee, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";

import { summarizeDay, summarizeRun, type Summary } from "@/game/engine";
import { RULES } from "@/game/rules";
import { clock, dayDate, FINDINGS_LIMIT, formatDay, LAST_DAY } from "@/game/time";
import type { GameState, Resolution } from "@/game/types";
import { cn } from "@/lib/utils";

import { control } from "../styles";
import { ENDINGS } from "./endings";
import { stampOf } from "./stamp";

/**
 * Between visitors: the morning memo, the evening summary, and the end of the run.
 * Shown on the monitor above every window.
 */
export function DayOverlay({
  state,
  onStart,
  onNextDay,
  onCoffee,
  onRestart,
}: {
  state: GameState;
  onStart: () => void;
  onNextDay: () => void;
  onCoffee: () => void;
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

  if (state.phase === "coffee") {
    const last = state.log.findLast((r) => r.finding && !r.closed);
    return (
      <Sheet title={`Finished at ${clock(state.clock)} · ${date}`}>
        <p className="office-notice self-start">
          <Coffee aria-hidden="true" /> You finished early.
        </p>
        <p>You have some time to grab a coffee with the auditor.</p>
        <blockquote className="office-quote">
          “Love the bandwidth you freed up today. Let's take this offline and revisit your last
          audit finding. Going forward, I think we're aligned on this one, so I'll close it out.”
        </blockquote>
        {last && (
          <p className="office-muted">
            {last.demand.ticket}, {last.demand.app}: {last.finding}
          </p>
        )}
        <button className={cn(control, "office-next self-end")} onClick={onCoffee}>
          <Check aria-hidden="true" /> OK
        </button>
      </Sheet>
    );
  }

  if (state.phase === "dayEnd") {
    const today = summarizeDay(state);
    return (
      <Sheet title={`End of day ${state.day} · ${date}`}>
        <Stats summary={today} label="today" state={state} />
        <Forgiven state={state} />
        <WrongCalls wrong={today.wrong} />
        <button className={cn(control, "office-next self-end")} onClick={onNextDay}>
          Next day <ChevronRight aria-hidden="true" />
        </button>
      </Sheet>
    );
  }

  const ending = ENDINGS[state.lostTo ?? "won"];
  const run = summarizeRun(state);
  return (
    <Sheet title={ending.title}>
      <p className="office-label">{ending.from}</p>
      <p>{ending.text(state)}</p>
      <Stats summary={run} label="this run" state={state} />
      <WrongCalls wrong={run.wrong} withDay />
      <button className={cn(control, "office-next self-end")} onClick={onRestart}>
        <RotateCcw aria-hidden="true" /> Play again
      </button>
    </Sheet>
  );
}

function Stats({ summary, label, state }: { summary: Summary; label: string; state: GameState }) {
  const right = summary.decided - summary.wrong.length;
  const share = summary.decided ? Math.round((right / summary.decided) * 100) : 100;
  return (
    <dl className="office-fields">
      <dt className="office-label">Decided {label}</dt>
      <dd className="office-number">{summary.decided}</dd>
      <dt className="office-label">Right calls</dt>
      <dd className="office-number">
        {right} ({share}%)
      </dd>
      <dt className="office-label">Findings {label}</dt>
      <dd className="office-number">{summary.wrong.length}</dd>
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
      <p className="office-notice self-start">One finding closed over coffee.</p>
    )
  );
}

/** Each wrong call and why: what the auditor wrote up. */
function WrongCalls({ wrong, withDay = false }: { wrong: Resolution[]; withDay?: boolean }) {
  if (wrong.length === 0) return null;
  return (
    <section aria-label="Audit findings">
      <p className="office-label">Audit findings</p>
      <ol className="office-scroll office-findings overflow-y-auto">
        {wrong.map((r) => (
          <li key={r.demand.id} data-closed={r.closed}>
            <span className="office-muted">
              {withDay && `Day ${r.day} · `}
              {r.demand.ticket} · {r.demand.app} · {stampOf(r)}
              {r.closed && " · closed over coffee"}
            </span>
            <span>{r.finding}</span>
          </li>
        ))}
      </ol>
    </section>
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
