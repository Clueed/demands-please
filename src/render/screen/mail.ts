import { RULES, type Rule } from "@/game/rules";

/** An email in the inbox. Policy updates arrive on the morning a rule comes in. */
export type Mail = {
  id: string;
  /** The day it arrived. */
  day: number;
  from: string;
  subject: string;
} & ({ kind: "policy"; rule: Rule } | { kind: "strategy" });

/** The day the CIO sends round this year's IT strategy: the day the rule needing it starts. */
const STRATEGY_DAY = RULES.find((r) => r.id === "strategy")?.day ?? 1;

const ALL_MAIL: Mail[] = [
  ...RULES.map((rule): Mail => ({
    id: `policy-${rule.id}`,
    day: rule.day,
    from: "CIO Office",
    subject: `Policy update: ${rule.title}`,
    kind: "policy",
    rule,
  })),
  {
    id: "strategy",
    day: STRATEGY_DAY,
    from: "CIO Office",
    subject: "IT strategy 2026",
    kind: "strategy",
  },
];

/** Everything received by today, newest first. */
export const inbox = (day: number): Mail[] =>
  ALL_MAIL.filter((m) => m.day <= day).toSorted((a, b) => b.day - a.day);
