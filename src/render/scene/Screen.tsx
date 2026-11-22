import { useEffect, useReducer, useState } from "react";

import { currentDemand, currentResolution } from "@/game/engine";
import { isInForce, visibleAttachments } from "@/game/rules";
import { DAY_END, dayDate, FINDINGS_LIMIT, formatDay } from "@/game/time";
import type { AttachmentKind, Decision, GameState } from "@/game/types";
import { cn } from "@/lib/utils";

import { ConfirmRestart } from "../screen/ConfirmRestart";
import { LockScreen } from "../screen/LockScreen";
import { DOCUMENT_TITLES } from "../screen/attachments";
import { Document } from "../screen/Document";
import { Intranet } from "../screen/Intranet";
import { Mail } from "../screen/Mail";
import { OrgChart } from "../screen/OrgChart";
import { initialScreen, screenReducer } from "../screen/screen";
import { ServiceCatalog } from "../screen/ServiceCatalog";
import { ScreenWindow } from "../screen/ScreenWindow";
import { Ticket } from "../screen/Ticket";
import { Taskbar } from "../screen/Taskbar";
import { APPS, WINDOW_ICONS } from "../screen/windows";

export type ScreenHandlers = {
  onDecide: (decision: Decision) => void;
  onNext: () => void;
  onStart: () => void;
  onNextDay: () => void;
  onCoffee: () => void;
  onRestart: () => void;
  onPause: () => void;
};

/** The service desk workstation: the ticket, the other desktop apps, and any files opened. */
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

  /** The ticket's files opened at least once, so the file list can tick them off. */
  const [viewed, setViewed] = useState<AttachmentKind[]>([]);
  const openFile = (id: AttachmentKind) => {
    setViewed((v) => (v.includes(id) ? v : [...v, id]));
    dispatch({ type: "raise", id });
  };

  // A new ticket comes with its own files; put the last one's away.
  const [filesFor, setFilesFor] = useState(demand?.id);
  if (filesFor !== demand?.id) {
    setFilesFor(demand?.id);
    setViewed([]);
    dispatch({ type: "closeAttachments" });
  }

  const [confirmingRestart, setConfirmingRestart] = useState(false);
  // Between visitors, the day waits on an email: only Mail can be used until it's archived.
  const mailOnly = state.phase !== "working";
  const archive: Partial<Record<GameState["phase"], () => void>> = {
    briefing: on.onStart,
    coffee: on.onCoffee,
    dayEnd: on.onNextDay,
  };
  const onArchive = archive[state.phase];
  const apps = APPS.filter((a) => a.from <= state.day);
  const has = (id: string) => apps.some((a) => a.id === id);
  const top = screen.order.findLast((id) => has(id) || files.some((f) => f.kind === id));

  // Escape backs out of a restart, or puts away the file on top, like closing its window.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || paused) return;
      if (confirmingRestart) setConfirmingRestart(false);
      else dispatch({ type: "closeTopAttachment" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paused, confirmingRestart]);

  // Whoever's ticket is stamped isn't waiting, even after the run ended on that stamp.
  const decided = new Set(state.log.filter((r) => r.day === state.day).map((r) => r.demand.id));
  const waiting = state.queue.filter((d) => !decided.has(d.id)).length;
  // Less than an hour per visitor still waiting: the line won't be through by closing time.
  const behind = waiting > 0 && DAY_END - state.clock < waiting * 60;

  return (
    <div className="office-desktop absolute inset-0">
      {has("catalog") && (
        <ScreenWindow id="catalog" label="Service catalog" {...win}>
          <ServiceCatalog
            retired={state.retired}
            canOffer={!!demand && !resolution && isInForce("reuse", state.day)}
            onOffer={(appId) => on.onDecide({ kind: "offer", appId })}
          />
        </ScreenWindow>
      )}
      <ScreenWindow id="mail" label="Mail" pinned={mailOnly} {...win}>
        <Mail state={state} onArchive={() => onArchive?.()} onRestart={on.onRestart} />
      </ScreenWindow>
      <ScreenWindow id="org" label="Org chart" {...win}>
        <OrgChart />
      </ScreenWindow>
      {has("intranet") && (
        <ScreenWindow id="intranet" label="Intranet" {...win}>
          <Intranet />
        </ScreenWindow>
      )}

      <ScreenWindow id="ticket" label="Service desk" {...win}>
        {demand ? (
          <Ticket
            demand={demand}
            day={state.day}
            resolution={resolution}
            viewed={viewed}
            onOpen={openFile}
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

      {mailOnly && <div className="office-shade absolute inset-0 z-50" aria-hidden="true" />}

      <Taskbar
        minutes={state.clock}
        date={formatDay(dayDate(state.day))}
        tasks={[
          ...apps.map(({ id, label }) => ({ id, label, doc: false })),
          // Open documents too, as just an icon, so one buried under an app can be found again.
          ...opened.map((id) => ({ id, label: DOCUMENT_TITLES[id], doc: true })),
        ].map(({ id, label, doc }) => {
          const Icon = WINDOW_ICONS[id];
          return (
            <button
              key={id}
              className={cn("office-task", doc && "is-doc")}
              aria-label={label}
              aria-pressed={mailOnly ? id === "mail" : top === id}
              disabled={mailOnly && id !== "mail"}
              title={label}
              onClick={() => dispatch({ type: "raise", id })}
            >
              <Icon aria-hidden="true" />
              {!doc && <span>{label}</span>}
            </button>
          );
        })}
        onRestart={() => setConfirmingRestart(true)}
        onPause={on.onPause}
      >
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
      {confirmingRestart && (
        <ConfirmRestart
          onConfirm={() => {
            setConfirmingRestart(false);
            on.onRestart();
          }}
          onCancel={() => setConfirmingRestart(false)}
        />
      )}
      {paused && <LockScreen minutes={state.clock} onWake={on.onPause} />}
    </div>
  );
}
