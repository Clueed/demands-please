import { summarizeDay } from "@/game/engine";
import { RULES, type Rule } from "@/game/rules";
import { LAST_DAY } from "@/game/time";
import type { GameState } from "@/game/types";

import { ENDINGS, type EndingId } from "./endings";

/**
 * An email. Policy updates and the IT strategy stay in the inbox for reference. The day's
 * notices (the morning briefing, coffee with the auditor, the evening report) wait in the
 * inbox until archived, which moves the day along; the archive keeps them to reread.
 */
export type Mail = {
  id: string;
  /** The day it arrived. */
  day: number;
  from: string;
  subject: string;
  /** The subject as the list shows it, under its day's heading: no need to repeat the day. */
  short: string;
} & (
  | { kind: "policy"; rule: Rule }
  | { kind: "strategy" }
  | { kind: "morning" }
  | { kind: "coffee" }
  | { kind: "evening"; findings: number }
  | { kind: "ending"; ending: EndingId }
);

export type MailKind = Mail["kind"];

/** Which comes first on the same day. */
const ORDER: Record<MailKind, number> = {
  morning: 0,
  policy: 1,
  strategy: 2,
  coffee: 3,
  evening: 4,
  ending: 5,
};

/** The day the CIO sends round this year's IT strategy: the day the rule needing it starts. */
const STRATEGY_DAY = RULES.find((r) => r.id === "strategy")?.day ?? 1;

const REFERENCE_MAIL: Mail[] = [
  ...RULES.map((rule): Mail => ({
    id: `policy-${rule.id}`,
    day: rule.day,
    from: "CIO Office",
    subject: `IT governance update: ${rule.title}`,
    short: rule.title,
    kind: "policy",
    rule,
  })),
  {
    id: "strategy",
    day: STRATEGY_DAY,
    from: "CIO Office",
    subject: "IT strategy 2026",
    short: "IT strategy 2026",
    kind: "strategy",
  },
];

/** In the list, a briefing goes by the day's visitors: its rule has an email of its own. */
const morningMail = (state: GameState, day: number): Mail => ({
  id: `morning-${day}`,
  day,
  from: "CIO Office",
  subject: `Day ${day} of ${LAST_DAY}: briefing`,
  short: `${state.days[day - 1]?.length ?? 0} visitors`,
  kind: "morning",
});

/** An invitation while it waits; once had, it's the record of the finding it closed. */
const coffeeMail = (day: number, had: boolean): Mail => ({
  id: `coffee-${day}`,
  day,
  from: "Internal audit",
  subject: had ? "Coffee: one finding closed" : "Coffee?",
  short: had ? "One finding closed" : "Coffee?",
  kind: "coffee",
});

/** The report's subject says how the day went, so reports tell apart in the list. The list
 * leads with what changes from day to day; the badge says what kind of email it is. */
const eveningMail = (state: GameState, day: number): Mail => {
  const wrong = summarizeDay(state, day).wrong.length;
  const outcome = wrong === 0 ? "no findings" : `${wrong} finding${wrong === 1 ? "" : "s"}`;
  return {
    id: `evening-${day}`,
    day,
    from: "Service desk",
    subject: `Day ${day} report: ${outcome}`,
    short: wrong === 0 ? "No findings" : outcome,
    kind: "evening",
    findings: wrong,
  };
};

const endingMail = (day: number, ending: EndingId): Mail => ({
  id: `ending-${ending}`,
  day,
  from: ENDINGS[ending].from,
  subject: ENDINGS[ending].title,
  short: ENDINGS[ending].title,
  kind: "ending",
  ending,
});

/** Newest first. */
const newestFirst = (mails: Mail[]) =>
  mails.toSorted((a, b) => b.day - a.day || ORDER[b.kind] - ORDER[a.kind]);

/** The notice the run is waiting on to be archived, or null while the day is under way. */
export function pendingMail(state: GameState): Mail | null {
  const { day, phase } = state;
  if (phase === "working") return null;
  if (phase === "briefing") return morningMail(state, day);
  if (phase === "coffee") return coffeeMail(day, false);
  if (phase === "dayEnd") return eveningMail(state, day);
  return endingMail(day, state.lostTo ?? "won");
}

/** The day's notices already archived, newest first. Worked out from the run, so a reload keeps them. */
export function archivedMail(state: GameState): Mail[] {
  const mails: Mail[] = [];
  for (let day = 1; day <= state.day; day++) {
    const today = day === state.day;
    if (!today || state.phase !== "briefing") {
      // In the archive, a briefing goes by its rule, so the days tell apart.
      const morning = morningMail(state, day);
      const rule = RULES.find((r) => r.day === day);
      mails.push(rule ? { ...morning, short: rule.title } : morning);
    }
    if (state.log.some((r) => r.closedOn === day)) mails.push(coffeeMail(day, true));
    if (!today) mails.push(eveningMail(state, day));
  }
  return newestFirst(mails);
}

/** The inbox: the notice waiting to be archived on top, then the policy mail received so far. */
export function inbox(state: GameState): Mail[] {
  const pending = pendingMail(state);
  const reference = newestFirst(REFERENCE_MAIL.filter((m) => m.day <= state.day));
  return pending ? [pending, ...reference] : reference;
}
