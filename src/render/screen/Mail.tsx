import {
  Archive,
  ArrowLeft,
  ClipboardList,
  Coffee,
  Flag,
  Inbox,
  OctagonAlert,
  RotateCcw,
  Sun,
  Target,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { capabilityName, STRATEGY } from "@/game/data";
import { dayDate, formatDay } from "@/game/time";
import type { GameState } from "@/game/types";
import { cn } from "@/lib/utils";

import { departmentColor } from "../departments";
import { control } from "../styles";
import { DayMailBody, RuleCard } from "./DayMail";
import { archivedMail, inbox, pendingMail, type Mail as MailItem, type MailKind } from "./mail";

type Folder = "inbox" | "archive";

/** Under a waiting email: what its button does, and the way back to it from another email. */
const ACTIONS: Partial<
  Record<MailKind, { label: string; hint: (day: number) => string; back: string }>
> = {
  morning: {
    label: "Start the day",
    hint: () => "Starts the clock.",
    back: "Back to briefing",
  },
  coffee: {
    label: "Go for coffee",
    hint: () => "Closes one finding.",
    back: "Back to coffee",
  },
  evening: {
    label: "Go home",
    hint: (day) => `Day ${day + 1} starts next.`,
    back: "Back to report",
  },
  ending: {
    label: "Play again",
    hint: () => "A new run from day 1.",
    back: "Back to results",
  },
};

const ICONS: Partial<Record<MailKind, typeof Sun>> = {
  morning: Sun,
  coffee: Coffee,
  evening: ClipboardList,
  strategy: Target,
};

/** The badge at the start of a row: a policy's rule number, or an icon for the kind of email. */
function Badge({ mail, waiting }: { mail: MailItem; waiting: boolean }) {
  const Icon =
    mail.kind === "ending" ? (mail.ending === "won" ? Flag : OctagonAlert) : ICONS[mail.kind];
  // Policy is the CIO's: solid like the rule numbers. The day's notices are paper, until one
  // waits (ochre). An outcome outranks waiting: the end of the run is green or red like its
  // stamp, a report with findings red like its verdict.
  const tone =
    mail.kind === "ending"
      ? mail.ending === "won"
        ? "is-won"
        : "is-lost"
      : mail.kind === "evening" && mail.findings > 0
        ? "is-findings"
        : waiting
          ? "is-waiting"
          : mail.kind === "policy" || mail.kind === "strategy"
            ? ""
            : mail.kind === "evening"
              ? "is-notice is-report"
              : "is-notice";
  return (
    <span className={cn("office-mail-badge", tone)} aria-hidden="true">
      {mail.kind === "policy" ? mail.rule.day : Icon && <Icon />}
    </span>
  );
}

/**
 * Group a newest-first list under headings: the archive by day; the inbox into today's mail
 * and the rules from before, whose badges already number them by day.
 */
function grouped(mails: MailItem[], folder: Folder, today: number) {
  const heading = (m: MailItem) =>
    folder === "archive" ? `Day ${m.day}` : m.day === today ? "Today" : "Earlier";
  const groups: { heading: string; mails: MailItem[] }[] = [];
  for (const m of mails) {
    const last = groups.at(-1);
    if (last?.heading === heading(m)) last.mails.push(m);
    else groups.push({ heading: heading(m), mails: [m] });
  }
  return groups;
}

/**
 * The mail app: the inbox or the archive on the left, the open email on the right.
 * The day's notices wait at the top of the inbox; archiving one moves the day along.
 */
export function Mail({
  state,
  onArchive,
  onRestart,
}: {
  state: GameState;
  /** Archive the waiting notice: start the day, have the coffee, or go home. */
  onArchive: () => void;
  onRestart: () => void;
}) {
  const pending = pendingMail(state);
  const [folder, setFolder] = useState<Folder>("inbox");
  const [openId, setOpenId] = useState<string | null>(null);

  // A new notice comes in: show it.
  const [shownPending, setShownPending] = useState(pending?.id);
  if (shownPending !== pending?.id) {
    setShownPending(pending?.id);
    if (pending) {
      setFolder("inbox");
      setOpenId(pending.id);
    }
  }

  const mails = folder === "inbox" ? inbox(state) : archivedMail(state);
  const open = mails.find((m) => m.id === openId) ?? mails[0];
  const action = pending && ACTIONS[pending.kind];

  // Keep the open email's row in view, e.g. after going back to the waiting one.
  // Only when the folder or the open email changes, not on every tick of the clock.
  const list = useRef<HTMLDivElement>(null);
  const shownId = open?.id;
  useEffect(() => {
    if (!shownId) return;
    list.current
      ?.querySelector(`[data-folder="${folder}"] [data-mail="${shownId}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [folder, shownId]);

  return (
    <div ref={list} className="office-mail-app flex min-h-0 flex-1">
      <div className="office-inbox flex min-h-0 flex-col">
        <div className="office-folders" role="tablist" aria-label="Folders">
          {(
            [
              ["inbox", "Inbox", Inbox],
              ["archive", "Archive", Archive],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              role="tab"
              className="office-folder"
              aria-selected={folder === id}
              onClick={() => setFolder(id)}
            >
              <Icon aria-hidden="true" /> {label}
            </button>
          ))}
        </div>
        {/* Keyed by folder, so each folder opens scrolled to its top. */}
        <div
          key={folder}
          data-folder={folder}
          className={cn(
            "office-scroll office-mail-list min-h-0 flex-1 overflow-y-auto",
            folder === "archive" && "is-archive",
            mails.length === 0 && "is-empty",
          )}
        >
          {grouped(mails, folder, state.day).map(({ heading, mails: group }) => (
            <section key={heading} aria-label={heading}>
              <h3 className="office-label office-mail-day">{heading}</h3>
              <ul>
                {group.map((m) => {
                  const waiting = m.id === pending?.id;
                  return (
                    <li key={m.id}>
                      <button
                        data-mail={m.id}
                        className={cn(
                          "office-inbox-item",
                          (m.kind === "policy" || m.kind === "strategy") &&
                            m.day === state.day &&
                            "is-new",
                          waiting && "is-waiting",
                        )}
                        aria-current={m === open}
                        onClick={() => setOpenId(m.id)}
                      >
                        <Badge mail={m} waiting={waiting} />
                        {/* No sender line: the badge says what kind of email it is. */}
                        <span className="office-inbox-subject min-w-0 flex-1">{m.short}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
          <div className="office-fade" aria-hidden="true" />
        </div>
      </div>
      {/* min-w-0: a long footer must not push the pane wider than the window. */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {open ? (
          <MailBody
            // A fresh scroll position for each email.
            key={open.id}
            mail={open}
            state={state}
          />
        ) : (
          <div className="office-mail flex-1">
            <header className="office-mail-header">
              <b className="office-mail-subject">Archive</b>
              <span className="office-mail-meta">Nothing archived yet</span>
            </header>
            <div className="office-mail-empty">
              <Archive aria-hidden="true" />
              <p className="office-muted">
                Briefings and day reports land here once you archive them.
              </p>
            </div>
          </div>
        )}
        {pending && action && (
          <footer className="office-mail-actions">
            {open?.id === pending.id ? (
              <>
                <span className="office-mail-hint">{action.hint(state.day)}</span>
                <button
                  className={cn(control, "office-next")}
                  onClick={pending.kind === "ending" ? onRestart : onArchive}
                >
                  {pending.kind === "ending" ? (
                    <RotateCcw aria-hidden="true" />
                  ) : (
                    <Archive aria-hidden="true" />
                  )}
                  {action.label}
                </button>
              </>
            ) : (
              <>
                <span className="office-mail-hint">Still waiting.</span>
                <button
                  className={cn(control, "office-next")}
                  onClick={() => {
                    setFolder("inbox");
                    setOpenId(pending.id);
                  }}
                >
                  <ArrowLeft aria-hidden="true" /> {action.back}
                </button>
              </>
            )}
          </footer>
        )}
      </div>
    </div>
  );
}

function MailBody({ mail, state }: { mail: MailItem; state: GameState }) {
  return (
    <article className="office-scroll office-mail min-h-0 flex-1 overflow-y-auto">
      {/* Stays at the top while the email scrolls, so you know what you're reading. */}
      <header className="office-mail-header">
        <b className="office-mail-subject">{mail.subject}</b>
        <span className="office-mail-meta">
          From {mail.from} ·{" "}
          <span className="whitespace-nowrap">{formatDay(dayDate(mail.day))}</span>
        </span>
      </header>
      <div className="office-mail-body">
        {mail.kind === "policy" ? (
          <>
            <p>The procurement policy has a new rule:</p>
            <RuleCard rule={mail.rule} isNew={mail.day === state.day} />
            {mail.rule.day > 1 && (
              <p>Earlier rules still apply. Their emails are further down your inbox.</p>
            )}
          </>
        ) : mail.kind === "strategy" ? (
          <>
            <p>This year we only buy new apps for these focus areas:</p>
            <ul className="flex flex-col gap-2">
              {STRATEGY.focus.map((id, i) => (
                <li key={id} className="office-card">
                  <span className="office-swatch" style={{ background: departmentColor(id) }} />
                  <div>
                    <b>{capabilityName(id)}</b>
                    <p className="office-muted">{STRATEGY.goals[i]}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p>Every other area: reuse what we have.</p>
          </>
        ) : (
          <DayMailBody mail={mail} state={state} />
        )}
        <p className="office-mail-sign">{mail.from}</p>
      </div>
      {/* Fades out whatever runs past the bottom, so it's clear the email scrolls. */}
      <div className="office-fade" aria-hidden="true" />
    </article>
  );
}
