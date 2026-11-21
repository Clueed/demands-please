import { useReducer, useState } from "react";

import { currentDemand, currentResolution, schedule } from "@/game/engine";
import { isInForce, visibleAttachments } from "@/game/rules";
import { SHADOW_IT_LIMIT, FINDINGS_LIMIT } from "@/game/time";
import type { AttachmentKind, Decision, GameState } from "@/game/types";
import { cn } from "@/lib/utils";

import { Calendar } from "../screen/Calendar";
import { DayOverlay } from "../screen/DayOverlay";
import { DOCUMENT_TITLES } from "../screen/attachments";
import { Document } from "../screen/Document";
import { Rulebook } from "../screen/Rulebook";
import { initialScreen, screenReducer } from "../screen/screen";
import { ScreenWindow } from "../screen/ScreenWindow";
import { Ticket } from "../screen/Ticket";
import { Taskbar } from "../screen/Taskbar";

/** How long, in game minutes, the "finding closed" notice stays up. */
const NOTICE_MINUTES = 90;

export type ScreenHandlers = {
  onDecide: (decision: Decision) => void;
  onNext: () => void;
  onPush: () => void;
  onStart: () => void;
  onNextDay: () => void;
  onRestart: () => void;
};

/** The service desk workstation: calendar, ticket, rulebook and any files opened. */
export function Screen({ state, ...on }: { state: GameState } & ScreenHandlers) {
  const [screen, dispatch] = useReducer(screenReducer, undefined, initialScreen);
  const demand = currentDemand(state);
  const resolution = currentResolution(state);
  const win = { screen, dispatch };
  const files = demand ? visibleAttachments(demand, state.day) : [];
  const opened = screen.order.filter((id): id is AttachmentKind =>
    files.some((f) => f.kind === id),
  );

  // A new ticket comes with its own files; put the last one's away.
  const [filesFor, setFilesFor] = useState(demand?.id);
  if (filesFor !== demand?.id) {
    setFilesFor(demand?.id);
    dispatch({ type: "closeAttachments" });
  }

  const backlog = state.backlog.length + schedule(state).filter((a) => a.afterHours).length;
  const forgiven = state.forgivenAt !== null && state.clock - state.forgivenAt < NOTICE_MINUTES;

  return (
    <div className="office-desktop absolute inset-0">
      <ScreenWindow id="calendar" label="Calendar" align="end" {...win}>
        <Calendar state={state} onPush={on.onPush} />
      </ScreenWindow>

      <ScreenWindow id="rulebook" label="Rulebook" {...win}>
        <Rulebook
          day={state.day}
          canOffer={!!demand && !resolution && isInForce("reuse", state.day)}
          onOffer={(appId) => on.onDecide({ kind: "offer", appId })}
        />
      </ScreenWindow>

      <ScreenWindow id="ticket" label="Service desk" {...win}>
        {demand ? (
          <Ticket
            demand={demand}
            day={state.day}
            resolution={resolution}
            opened={opened}
            onOpen={(id) => dispatch({ type: "raise", id })}
            onApprove={() => on.onDecide({ kind: "approve" })}
            onDecline={() => on.onDecide({ kind: "decline" })}
            onNext={on.onNext}
          />
        ) : (
          <p className="office-empty p-4">No open tickets.</p>
        )}
      </ScreenWindow>

      {demand &&
        files
          .filter((f) => screen.order.includes(f.kind))
          .map((f) => (
            <ScreenWindow
              key={f.kind}
              id={f.kind}
              label={DOCUMENT_TITLES[f.kind]}
              onClose={() => dispatch({ type: "close", id: f.kind })}
              {...win}
            >
              <div className="office-scroll min-h-0 flex-1 overflow-y-auto">
                <Document attachment={f} demand={demand} />
              </div>
            </ScreenWindow>
          ))}

      <Taskbar minutes={state.clock} onRestart={on.onRestart}>
        <span className="office-tray" title="Open audit findings">
          Findings
          <span className="office-pips" aria-label={`${state.findings} of ${FINDINGS_LIMIT}`}>
            {Array.from({ length: FINDINGS_LIMIT }, (_, i) => (
              <span key={i} data-on={i < state.findings} />
            ))}
          </span>
        </span>
        <span
          className={cn(
            "office-tray office-number",
            backlog >= SHADOW_IT_LIMIT && "office-warning",
          )}
          title="Requests carried over to tomorrow"
        >
          Backlog {backlog}/{SHADOW_IT_LIMIT}
        </span>
        {forgiven && <span className="office-notice">An hour early: finding closed</span>}
      </Taskbar>
      {state.phase !== "working" && (
        <DayOverlay
          state={state}
          onStart={on.onStart}
          onNextDay={on.onNextDay}
          onRestart={on.onRestart}
        />
      )}
    </div>
  );
}
