import { useReducer, useState } from "react";

import { CAPABILITIES } from "@/game/data";
import { currentDemand, HAPPINESS_SCALE, isOver } from "@/game/engine";
import type { Decision, GameState } from "@/game/types";

import { cn } from "@/lib/utils";

import { money } from "../format";
import { agenda } from "../screen/calendar";
import { initialScreen, screenReducer } from "../screen/screen";
import { ScreenWindow } from "../screen/ScreenWindow";
import { control } from "../styles";
import { EndOfDay } from "./EndOfDay";

const capabilityName = (id: string) => CAPABILITIES.find((c) => c.id === id)?.name ?? id;

/**
 * The monitor's screen: every window the player works with, all draggable,
 * and the end-of-day sheet above them once the day is over.
 */
export function Screen({
  state,
  onDecide,
  onRestart,
}: {
  state: GameState;
  onDecide: (decision: Decision) => void;
  onRestart: () => void;
}) {
  const [screen, dispatch] = useReducer(screenReducer, undefined, initialScreen);
  const [page, setPage] = useState(CAPABILITIES[0]?.id);
  const demand = currentDemand(state);
  const apps = state.portfolio.filter((a) => a.capabilityId === page);
  const win = { screen, dispatch };

  return (
    <div data-placeholder="screen" className="absolute inset-0 bg-neutral-500">
      <ScreenWindow id="calendar" label="today" {...win}>
        <ol className="flex min-h-0 flex-1 flex-col gap-px overflow-y-auto px-1 pb-1 text-game-sm">
          {agenda(state).map((a) => (
            <li
              key={a.demand.id}
              className={cn(
                "game-border shrink-0 px-1",
                a.status === "done" && "bg-neutral-300 text-neutral-500",
                a.status === "now" && "bg-neutral-100 font-bold",
                a.status === "later" && "bg-neutral-200",
              )}
            >
              {a.time} {capabilityName(a.demand.capabilityId)}
              <br />
              <span className={cn(a.status === "done" && "line-through")}>
                {a.demand.requestedApp}
              </span>
              {a.status === "done" && ` (${a.outcome})`}
            </li>
          ))}
        </ol>
      </ScreenWindow>

      <ScreenWindow id="gauges" label="gauges" {...win}>
        <div className="px-1">
          Spend {money(state.spent)}/yr
          <br />
          Happiness {state.happiness}/{HAPPINESS_SCALE.max}
        </div>
        <button className={`${control} mx-1 mt-1 self-start`} onClick={onRestart}>
          Restart
        </button>
      </ScreenWindow>

      <ScreenWindow id="binder" label="catalog" {...win}>
        <div className="flex flex-wrap gap-1 px-1">
          {CAPABILITIES.map((c) => (
            <button
              key={c.id}
              className={control}
              disabled={c.id === page}
              onClick={() => setPage(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
        <ul className="mt-1 min-h-0 flex-1 overflow-y-auto px-1">
          {apps.map((app) => (
            <li key={app.id} className="mb-2">
              <b>{app.name}</b> {money(app.spend)}/yr
              <br />
              <span className="text-game-sm">{app.tags.join(", ")}</span>
              <br />
              <button
                className={control}
                disabled={!demand}
                onClick={() => onDecide({ kind: "offer", appId: app.id })}
              >
                Offer instead
              </button>
            </li>
          ))}
        </ul>
      </ScreenWindow>

      {demand && (
        <ScreenWindow id="form" label="request form" {...win}>
          <div className="px-1">
            <b>{demand.requestedApp}</b>
            <br />
            {money(demand.cost)}/yr
            <p className="mt-2 text-game-sm">{demand.reason}</p>
          </div>
          {/* Stamps: later dragged onto the form, leaving a mark. */}
          <div className="absolute bottom-2 left-2 flex gap-2">
            <button className={control} onClick={() => onDecide({ kind: "buy" })}>
              Approve
            </button>
            <button className={control} onClick={() => onDecide({ kind: "decline" })}>
              Decline
            </button>
          </div>
        </ScreenWindow>
      )}

      {isOver(state) && <EndOfDay state={state} onRestart={onRestart} />}
    </div>
  );
}
