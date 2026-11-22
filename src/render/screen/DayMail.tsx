import { CircleAlert, CircleCheck, Coffee, TriangleAlert } from "lucide-react";

import { openFindingsAfter, summarizeDay, summarizeRun, type Summary } from "@/game/engine";
import { RULES, type Rule } from "@/game/rules";
import { FINDINGS_LIMIT } from "@/game/time";
import type { GameState, Resolution } from "@/game/types";
import { cn } from "@/lib/utils";

import { ENDINGS } from "./endings";
import type { Mail } from "./mail";
import { stampOf } from "./stamp";

/** A policy rule, boxed. Ochre on the day it comes in, like everything else that's new. */
export function RuleCard({ rule, isNew }: { rule: Rule; isNew: boolean }) {
  return (
    <div className={cn("office-rule", isNew && "is-new")}>
      <div className="flex items-baseline gap-2">
        <span className="office-rule-number">{rule.day}</span>
        <b className="flex-1">{rule.title}</b>
      </div>
      <p>{rule.text}</p>
    </div>
  );
}

/** How the desk works, for the first morning. One point per line, so it scans. */
const HOW_IT_WORKS: [string, string][] = [
  ["Visitors", "Approve, decline, then Next."],
  ["Clock", "Runs to 17:00. Anyone left buys their own tools."],
  ["Findings", `Wrong calls become findings. ${FINDINGS_LIMIT}\u00a0end the run.`],
];

/** What the day's notices say: the morning briefing, coffee, the evening report, the end of the run. */
export function DayMailBody({ mail, state }: { mail: Mail; state: GameState }) {
  const { day } = mail;

  if (mail.kind === "morning") {
    const rule = RULES.find((r) => r.day === day);
    const visitors = state.days[day - 1]?.length ?? 0;
    return (
      <>
        <p>
          Good morning! <b>{visitors} visitors</b> are coming to the service desk today. The office
          closes at 17:00.
        </p>
        {rule && (
          <>
            <p>The procurement policy has a new rule:</p>
            <RuleCard rule={rule} isNew={day === state.day} />
          </>
        )}
        {/* The first morning explains the desk, after the rule it's about to apply. */}
        {day === 1 && (
          <>
            <p className="office-label">How the desk works</p>
            <dl className="office-howto">
              {HOW_IT_WORKS.map(([term, text]) => (
                <div key={term}>
                  <dt>{term}</dt>
                  <dd>{text}</dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </>
    );
  }

  if (mail.kind === "coffee") {
    // Waiting on coffee, it's the latest open finding; once archived, the one it closed.
    const closed = state.log.find((r) => r.closedOn === day);
    const finding = closed ?? state.log.findLast((r) => r.finding && r.closedOn === null);
    return (
      <>
        <p>You finished early, so there's time for a coffee with the auditor.</p>
        {finding && (
          <WrongCalls
            wrong={[finding]}
            asOf={day}
            closing
            label={closed ? "Closed over coffee" : "Closes over coffee"}
          />
        )}
        <blockquote className="office-quote">
          “Love the bandwidth you freed up today. Let's take this offline and revisit your last
          audit finding. Going forward, I think we're aligned on this one, so I'll close it out.”
        </blockquote>
      </>
    );
  }

  if (mail.kind === "evening") {
    const summary = summarizeDay(state, day);
    const open = openFindingsAfter(state, day);
    return (
      <>
        <Verdict summary={summary} open={open} />
        <Stats summary={summary} label="today" open={open} />
        {state.log.some((r) => r.closedOn === day) && (
          <p className="office-notice self-start">
            <Coffee aria-hidden="true" /> One finding closed over coffee.
          </p>
        )}
        <WrongCalls wrong={summary.wrong} asOf={day} />
      </>
    );
  }

  if (mail.kind === "ending") {
    const ending = ENDINGS[mail.ending];
    const run = summarizeRun(state);
    return (
      <>
        <p className={cn("office-mail-stamp", mail.ending !== "won" && "is-wrong")}>
          {ending.stamp}
        </p>
        <p>{ending.text(state)}</p>
        <p className="office-label">This run</p>
        <Stats summary={run} label="this run" open={state.findings} />
        <WrongCalls wrong={run.wrong} asOf={day} withDay />
      </>
    );
  }

  return null;
}

/** The day's outcome in one line, coloured by how close the run is to the audit limit. */
function Verdict({ summary, open }: { summary: Summary; open: number }) {
  const wrong = summary.wrong.length;
  const danger = open >= FINDINGS_LIMIT - 1;
  const [Icon, tone, text] =
    wrong === 0 && !danger
      ? [CircleCheck, "is-good", "A clean day: no audit findings."]
      : danger
        ? [
            TriangleAlert,
            "is-danger",
            `${wrong > 0 ? `${wrong} finding${wrong === 1 ? "" : "s"}. ` : ""}One more ends the run.`,
          ]
        : [CircleAlert, "is-warn", `${wrong} audit finding${wrong === 1 ? "" : "s"} today.`];
  return (
    <p className={cn("office-verdict", tone)}>
      <Icon aria-hidden="true" /> {text}
    </p>
  );
}

/** Findings open out of the limit, as the taskbar shows them. */
function Pips({ open }: { open: number }) {
  return (
    <span className="office-pips" aria-label={`${open} of ${FINDINGS_LIMIT}`}>
      {Array.from({ length: FINDINGS_LIMIT }, (_, i) => (
        <span key={i} data-on={i < open} />
      ))}
    </span>
  );
}

function Stats({ summary, label, open }: { summary: Summary; label: string; open: number }) {
  const right = summary.decided - summary.wrong.length;
  const share = summary.decided ? Math.round((right / summary.decided) * 100) : 100;
  return (
    <dl className="office-stats">
      <dt>Decided {label}</dt>
      <dd>{summary.decided}</dd>
      <dt>Right calls</dt>
      <dd>
        {right} ({share}%)
      </dd>
      <dt>Findings {label}</dt>
      <dd>{summary.wrong.length}</dd>
      <dt>Open findings</dt>
      <dd className="flex items-center gap-2">
        <Pips open={open} /> {open} of {FINDINGS_LIMIT}
      </dd>
    </dl>
  );
}

/** Each wrong call and why: what the auditor wrote up, struck through if closed by `asOf`. */
function WrongCalls({
  wrong,
  asOf,
  withDay = false,
  closing = false,
  label = "Audit findings",
}: {
  wrong: Resolution[];
  asOf: number;
  withDay?: boolean;
  /** About to be closed over coffee: good news, so not in alarm red. */
  closing?: boolean;
  label?: string;
}) {
  if (wrong.length === 0) return null;
  return (
    <section aria-label={label} className="flex flex-col gap-1">
      <p className="office-label">{label}</p>
      <ol className="office-findings">
        {wrong.map((r) => {
          const closed = r.closedOn !== null && r.closedOn <= asOf;
          return (
            <li key={r.demand.id} data-closed={closed} data-closing={closing && !closed}>
              {/* Two groups, spaced apart, that wrap only between them: the ticket, then the call. */}
              <span className="office-findings-meta">
                {[
                  [withDay && `Day ${r.day}`, r.demand.ticket],
                  [r.demand.app, stampOf(r)],
                  [closed && "closed over coffee"],
                ]
                  .map((group) => group.filter((part) => typeof part === "string").join(" · "))
                  .filter(Boolean)
                  .map((group) => (
                    <span key={group} className="whitespace-nowrap">
                      {group}
                    </span>
                  ))}
              </span>
              <span>{r.finding}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
