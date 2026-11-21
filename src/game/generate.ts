import {
  ARCHETYPES,
  CATALOG,
  DEPARTMENT_HEADS,
  MADE_UP_APPS,
  STAFF,
  STRATEGY,
  TECH_RADAR,
  type Archetype,
} from "./data";
import { attachment, BUSINESS_CASE_THRESHOLD, isInForce, rulesInForce, type RuleId } from "./rules";
import { addDays, dayDate, DEMANDS_PER_DAY, LAST_DAY } from "./time";
import type { Attachment, Demand } from "./types";

/** A small seeded random generator (mulberry32), so a run can be replayed from its seed. */
export function rng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pick = <T>(items: readonly T[]): T => {
    if (items.length === 0) throw new Error("pick from an empty list");
    return items[Math.floor(next() * items.length)]!;
  };
  return { next, pick, chance: (p: number) => next() < p };
}

export type Rng = ReturnType<typeof rng>;

/** Share of tickets that break a rule. */
const FLAW_CHANCE = 0.5;
/** Of those, the share that break the rule that's new today, so it gets practised. */
const NEWEST_RULE_CHANCE = 0.5;

/** Rules a ticket can break by its fields. Reuse is a property of the archetype instead. */
type FlawRule = Exclude<RuleId, "reuse">;

const isFocus = (a: Archetype) => STRATEGY.focus.includes(a.capabilityId);
const roundTo = (n: number, step: number) => Math.round(n / step) * step;

/** A ticket that passes every rule there is. Flaws are applied on top. */
function validDemand(a: Archetype, r: Rng, day: number, ticket: number): Demand {
  const cost = roundTo(a.cost * (0.8 + r.next() * 0.4), 500);
  const today = dayDate(day);
  const attachments: Attachment[] = [
    { kind: "vendorSheet", vendor: a.vendor, product: a.app, price: cost, sso: true },
    {
      kind: "certificate",
      vendor: a.vendor,
      standard: r.chance(0.5) ? "ISO/IEC 27001" : "SOC 2 Type II",
      validUntil: addDays(today, 90 + Math.floor(r.next() * 600)),
    },
  ];
  if (cost > BUSINESS_CASE_THRESHOLD || r.chance(0.3))
    attachments.unshift({ kind: "businessCase", app: a.app, benefit: a.benefit });
  if (a.monitorsEmployees)
    attachments.push({
      kind: "worksCouncil",
      app: a.app,
      decision: "approved",
      date: addDays(today, -(3 + Math.floor(r.next() * 40))),
    });

  return {
    id: `t${ticket}`,
    ticket: `REQ-${ticket}`,
    requester: r.pick(STAFF[a.capabilityId] ?? []),
    capabilityId: a.capabilityId,
    app: a.app,
    vendor: a.vendor,
    cost,
    reason: a.reason,
    sponsor: DEPARTMENT_HEADS[a.capabilityId]?.name ?? null,
    monitorsEmployees: a.monitorsEmployees,
    retires: r.pick(CATALOG.filter((c) => c.capabilityId === a.capabilityId)).name,
    attachments,
    matchId: a.matchId,
  };
}

/** Swap one attachment of the same kind for another. */
function replace(d: Demand, next: Attachment): Attachment[] {
  return d.attachments.map((a) => (a.kind === next.kind ? next : a));
}

const isFlawRule = (id: RuleId): id is FlawRule => id !== "reuse";

/** How to break each rule. Each changes only what it needs; the rest of the ticket stays valid. */
const FLAWS: Record<FlawRule, (d: Demand, r: Rng, today: string) => Demand> = {
  sponsor: (d, r) => {
    const otherHeads = Object.entries(DEPARTMENT_HEADS)
      .filter(([id]) => id !== d.capabilityId)
      .map(([, h]) => h.name);
    const colleagues = (STAFF[d.capabilityId] ?? []).map((s) => s.name);
    return { ...d, sponsor: r.pick([null, r.pick(otherHeads), r.pick(colleagues)]) };
  },
  businessCase: (d, r) => {
    const cost = roundTo(BUSINESS_CASE_THRESHOLD + 1_000 + r.next() * 30_000, 500);
    const attachments = d.attachments
      .filter((a) => a.kind !== "businessCase")
      .map((a) => (a.kind === "vendorSheet" ? { ...a, price: cost } : a));
    return { ...d, cost, attachments };
  },
  vendorMatch: (d, r) => {
    const sheet = attachment(d, "vendorSheet");
    if (!sheet) return d;
    const which = r.pick(["product", "vendor", "price"] as const);
    const changed =
      which === "product"
        ? { ...sheet, product: `${d.app} ${r.pick(["Pro", "Plus", "Enterprise"])}` }
        : which === "vendor"
          ? { ...sheet, vendor: r.pick(TECH_RADAR.adopt.filter((v) => v !== d.vendor)) }
          : { ...sheet, price: d.cost + roundTo(2_000 + r.next() * 15_000, 500) };
    return { ...d, attachments: replace(d, changed) };
  },
  certificate: (d, r, today) => {
    const cert = attachment(d, "certificate");
    if (!cert || r.chance(0.25))
      return { ...d, attachments: d.attachments.filter((a) => a.kind !== "certificate") };
    const validUntil = addDays(today, -(1 + Math.floor(r.next() * 120)));
    return { ...d, attachments: replace(d, { ...cert, validUntil }) };
  },
  // Broken by picking an archetype outside the focus areas instead.
  strategy: (d) => d,
  sso: (d) => {
    const sheet = attachment(d, "vendorSheet");
    return sheet ? { ...d, attachments: replace(d, { ...sheet, sso: false }) } : d;
  },
  techRadar: (d, r) => {
    const vendor = r.pick(TECH_RADAR.hold);
    const attachments = d.attachments.map((a) =>
      a.kind === "vendorSheet" || a.kind === "certificate" ? { ...a, vendor } : a,
    );
    return { ...d, vendor, attachments };
  },
  worksCouncil: (d, r) => {
    const approval = attachment(d, "worksCouncil");
    const how = r.pick(["missing", "rejected", "otherApp"] as const);
    if (how === "missing" || !approval)
      return { ...d, attachments: d.attachments.filter((a) => a.kind !== "worksCouncil") };
    const changed =
      how === "rejected"
        ? { ...approval, decision: "rejected" as const }
        : { ...approval, app: r.pick(ARCHETYPES.filter((a) => a.app !== d.app)).app };
    return { ...d, attachments: replace(d, changed) };
  },
  retire: (d, r) => {
    const otherArea = CATALOG.filter((c) => c.capabilityId !== d.capabilityId);
    return { ...d, retires: r.pick([null, r.pick(otherArea).name, r.pick(MADE_UP_APPS)]) };
  },
};

const applyFlaw = (d: Demand, rule: FlawRule, r: Rng, day: number) =>
  FLAWS[rule](d, r, dayDate(day));

/**
 * One new ticket for `day`. `used` holds the apps already asked for today, so the same request
 * doesn't come in twice.
 */
function generateDemand(r: Rng, day: number, ticket: number, used: Set<string>): Demand {
  const fresh = (list: Archetype[]) => {
    const unused = list.filter((a) => !used.has(a.app));
    return unused.length > 0 ? unused : list;
  };
  const rules = rulesInForce(day);
  const newest = rules.at(-1)!;
  const flawRules = rules.map((rule) => rule.id).filter(isFlawRule);

  // From day 6 some requests are for something we already own; the answer is to offer it.
  if (isInForce("reuse", day) && r.chance(newest.id === "reuse" ? 0.4 : 0.2)) {
    const demand = validDemand(r.pick(fresh(ARCHETYPES.filter((a) => a.matchId))), r, day, ticket);
    // Half of them also break a rule, as bait: offering is still right.
    return r.chance(0.5) ? applyFlaw(demand, r.pick(flawRules), r, day) : demand;
  }

  const flaw = r.chance(FLAW_CHANCE)
    ? isFlawRule(newest.id) && r.chance(NEWEST_RULE_CHANCE)
      ? newest.id
      : r.pick(flawRules)
    : null;

  const strategyInForce = isInForce("strategy", day);
  const candidates = ARCHETYPES.filter(
    (a) =>
      !a.matchId &&
      (flaw === "strategy" ? !isFocus(a) : !strategyInForce || isFocus(a)) &&
      (flaw !== "worksCouncil" || a.monitorsEmployees),
  );
  const demand = validDemand(r.pick(fresh(candidates)), r, day, ticket);
  return flaw ? applyFlaw(demand, flaw, r, day) : demand;
}

/** New tickets for every day of the run. */
export function generateDays(seed: number): Demand[][] {
  const r = rng(seed);
  let ticket = 1001;
  return Array.from({ length: LAST_DAY }, (_, i) => {
    const used = new Set<string>();
    return Array.from({ length: DEMANDS_PER_DAY }, () => {
      const demand = generateDemand(r, i + 1, ticket++, used);
      used.add(demand.app);
      return demand;
    });
  });
}
