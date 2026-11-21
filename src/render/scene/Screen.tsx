import { useEffect, useReducer, useState } from "react";

import { currentDemand, currentResolution } from "@/game/engine";
import { isInForce, visibleAttachments } from "@/game/rules";
import { DAY_END, FINDINGS_LIMIT } from "@/game/time";
import type { AttachmentKind, Decision, GameState } from "@/game/types";
import { cn } from "@/lib/utils";

import { DayOverlay } from "../screen/DayOverlay";
import { LockScreen } from "../screen/LockScreen";
import { DOCUMENT_TITLES } from "../screen/attachments";
import { Document } from "../screen/Document";
import { Rulebook } from "../screen/Rulebook";
import { initialScreen, screenReducer } from "../screen/screen";
import { ScreenWindow } from "../screen/ScreenWindow";
import { Ticket } from "../screen/Ticket";
import { Taskbar } from "../screen/Taskbar";

export type ScreenHandlers = {
  onDecide: (decision: Decision) => void;
  onNext: () => void;
  onStart: () => void;
  onNextDay: () => void;
  onRestart: () => void;
  onPause: () => void;
};

/** The service desk workstation: ticket, rulebook and any files opened. */
export function Screen({
  state,
  paused,
  ...on
}: { state: GameState; paused: boolean } & ScreenHandlers) {
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

  // Escape puts away the file on top, like closing its window.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !paused) dispatch({ type: "closeTopAttachment" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paused]);

  const waiting = Math.max(0, state.queue.length - (resolution ? 1 : 0));
  // Less than an hour per visitor still waiting: the line won't be through by closing time.
  const behind = waiting > 0 && DAY_END - state.clock < waiting * 60;

  return (
    <div className="office-desktop absolute inset-0">
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

      <Taskbar minutes={state.clock} onRestart={on.onRestart} onPause={on.onPause}>
        <span className="office-tray" title="Open audit findings">
          Findings
          <span className="office-pips" aria-label={`${state.findings} of ${FINDINGS_LIMIT}`}>
            {Array.from({ length: FINDINGS_LIMIT }, (_, i) => (
              <span key={i} data-on={i < state.findings} />
            ))}
          </span>
        </span>
        <span
          className={cn("office-tray office-number", behind && "office-warning")}
          title="Visitors still waiting. Anyone left at 17:00 ends the run."
        >
          Waiting {waiting}
        </span>
      </Taskbar>
      {state.phase !== "working" && (
        <DayOverlay
          state={state}
          onStart={on.onStart}
          onNextDay={on.onNextDay}
          onRestart={on.onRestart}
        />
      )}
      {paused && <LockScreen minutes={state.clock} onWake={on.onPause} />}
    </div>
  );
}
