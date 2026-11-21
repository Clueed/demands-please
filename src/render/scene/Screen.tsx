import { Check, ChevronRight, RotateCcw, X } from "lucide-react";
import { useReducer, useState } from "react";

import { CAPABILITIES } from "@/game/data";
import { currentDemand, HAPPINESS_SCALE, isOver } from "@/game/engine";
import type { Decision, GameState } from "@/game/types";
import { cn } from "@/lib/utils";

import { departmentColor, DEPARTMENT_SHORT } from "../departments";
import { money } from "../format";
import { agenda } from "../screen/calendar";
import { initialScreen, screenReducer } from "../screen/screen";
import { ScreenWindow } from "../screen/ScreenWindow";
import { control } from "../styles";
import { EndOfDay } from "./EndOfDay";

const capabilityName = (id: string) => CAPABILITIES.find((c) => c.id === id)?.name ?? id;
/** Appointments that fit the calendar window at once. */
const AGENDA_ROWS = 4;

/** The live workstation, with draggable application windows. */
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
  const appointments = agenda(state);
  const now = appointments.find((a) => a.status === "now");
  const nowIndex = now ? appointments.indexOf(now) : appointments.length;
  const first = Math.max(0, Math.min(nowIndex - 1, appointments.length - AGENDA_ROWS));
  const shown = appointments.slice(first, first + AGENDA_ROWS);
  const apps = state.portfolio.filter((a) => a.capabilityId === page);
  const win = { screen, dispatch };

  return (
    <div className="office-desktop absolute inset-0">
      <ScreenWindow id="calendar" label="Appointments" align="end" {...win}>
        <div className="office-toolbar text-right">Today · {state.queue.length} waiting</div>
        <ol className="office-agenda flex min-h-0 flex-1 flex-col overflow-hidden">
          {shown.map((a) => (
            <li key={a.demand.id} className={cn("office-appointment", `is-${a.status}`)}>
              <div className="flex items-center justify-end gap-2">
                <span className="office-label">
                  {a.status === "now" ? "At desk" : a.status === "done" ? a.outcome : ""}
                </span>
                <time>{a.time}</time>
              </div>
              <b className={cn("block", a.status === "done" && "line-through")}>
                {a.demand.requestedApp}
              </b>
              <p className="office-muted">{a.demand.requester.name}</p>
            </li>
          ))}
        </ol>
      </ScreenWindow>

      <ScreenWindow id="gauges" label="Overview" {...win}>
        <div className="office-metrics flex flex-1 flex-col gap-3 px-3 py-2">
          <div>
            <div className="office-label">License spend</div>
            <strong>{money(state.spent)}</strong>
            <div className="office-projection office-number">
              {demand ? `→ ${money(state.spent + demand.cost)} if approved` : "—"}
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <span className="office-label">IT NPS score</span>
              <b className="office-number">
                {state.happiness}/{HAPPINESS_SCALE.max}
              </b>
            </div>
            <div
              className="office-meter"
              role="meter"
              aria-label="IT NPS score"
              aria-valuemin={0}
              aria-valuemax={HAPPINESS_SCALE.max}
              aria-valuenow={state.happiness}
            >
              {Array.from({ length: HAPPINESS_SCALE.max }, (_, i) => (
                <span key={i} data-on={i < state.happiness} />
              ))}
            </div>
          </div>
        </div>
      </ScreenWindow>

      <ScreenWindow id="binder" label="Service catalog" {...win}>
        <div className="office-categories" role="group" aria-label="Filter software by team">
          {CAPABILITIES.map((c) => (
            <button
              key={c.id}
              className="office-category"
              title={c.name}
              aria-pressed={c.id === page}
              onClick={() => setPage(c.id)}
            >
              {DEPARTMENT_SHORT[c.id] ?? c.name}
            </button>
          ))}
        </div>
        <ul className="office-scroll min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          {apps.map((app) => (
            <li key={app.id} className="office-app-card">
              <div className="flex items-baseline justify-between gap-2">
                <b>{app.name}</b>
                <span className="office-number office-muted">{money(app.spend)}</span>
              </div>
              <p className="office-desc">{app.description}</p>
              <button
                className="office-offer"
                disabled={!demand}
                onClick={() => onDecide({ kind: "offer", appId: app.id })}
              >
                {demand ? "Offer instead" : "Offer"}
                <ChevronRight />
              </button>
            </li>
          ))}
        </ul>
      </ScreenWindow>

      {demand && (
        <ScreenWindow id="form" label="Demand" {...win}>
          <div className="office-toolbar flex items-center justify-between">
            <span>DM-{String(state.log.length + 1).padStart(3, "0")}</span>
            <span className="office-pending">Pending review</span>
          </div>
          <div className="office-form flex min-h-0 flex-1 flex-col gap-8 p-5">
            <div className="office-requester">
              <span
                className="office-avatar"
                style={{ background: departmentColor(demand.capabilityId) }}
                aria-hidden="true"
              >
                {demand.requester.name.slice(0, 1)}
              </span>
              <div>
                <b>{demand.requester.name}</b>
                <p className="office-muted">{demand.requester.role}</p>
              </div>
            </div>
            <section>
              <div className="office-label">Wants to buy</div>
              <h2 className="office-request-name">{demand.requestedApp}</h2>
              <div className="office-cost mt-3 flex items-baseline justify-between">
                <span className="office-muted">{capabilityName(demand.capabilityId)}</span>
                <b className="office-number">{money(demand.cost)}/yr</b>
              </div>
            </section>
            <section>
              <div className="office-label mb-2">Reason</div>
              <p className="office-justification">“{demand.reason}”</p>
            </section>
          </div>
          <div className="office-actions shrink-0 p-3">
            <div className="flex gap-2">
              <button
                className={`${control} office-approve flex-1`}
                onClick={() => onDecide({ kind: "buy" })}
              >
                <span>
                  <Check /> Approve
                </span>
              </button>
              <button
                className={`${control} office-decline flex-1`}
                onClick={() => onDecide({ kind: "decline" })}
              >
                <span>
                  <X /> Decline
                </span>
              </button>
            </div>
          </div>
        </ScreenWindow>
      )}

      <footer className="office-taskbar">
        <span className="office-start">DeptOS</span>
        <span className="flex-1" />
        <button className="office-taskbar-button" onClick={onRestart} title="Restart day">
          <RotateCcw aria-hidden="true" /> Restart day
        </button>
      </footer>
      {isOver(state) && <EndOfDay state={state} onRestart={onRestart} />}
    </div>
  );
}
