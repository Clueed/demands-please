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
import {
  attachment,
  BUSINESS_CASE_MULTIPLE,
  BUSINESS_CASE_THRESHOLD,
  isInForce,
  rulesInForce,
  type RuleId,
} from "./rules";
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
/**
 * Of those, the share that break the rule that's new today, so it gets practised. It falls over
 * the run, so the older rules keep coming back and checking only today's rule stops working.
 */
const newestRuleChance = (day: number) => 0.5 - (0.3 * (day - 1)) / (LAST_DAY - 1);
/**
 * Share of tickets made hard to call: a flaw by a hair, or a pass by a hair. None on the first
 * two days, rising to three in four by day 8.
 */
const closeCallChance = (day: number) => Math.min(0.75, Math.max(0, (day - 2) / 8));
/** Share of vendors whose security certificate runs out before or during the run. */
const EXPIRING_CERT_CHANCE = 0.3;
/** Share of apps that don't track employees but come with a works council approval anyway. */
const DECOY_APPROVAL_CHANCE = 0.2;

/** Rules a ticket can break by its fields. Reuse is a property of the archetype instead. */
type FlawRule = Exclude<RuleId, "reuse">;

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

/**
 * What stays the same all run, so the same app or vendor never contradicts itself: each app's
 * price and each vendor's certificate. Some certificates run out mid-run, so a vendor that was
 * fine on Monday can fail on Thursday.
 */
type World = {
  price: Record<string, number>;
  certs: Record<string, { standard: "ISO/IEC 27001" | "SOC 2 Type II"; validUntil: string }>;
};

function makeWorld(r: Rng): World {
  const price = Object.fromEntries(
    ARCHETYPES.map((a) => [a.app, roundTo(a.cost * (0.8 + r.next() * 0.4), 1_000)]),
  );
  const vendors = [...new Set([...ARCHETYPES.map((a) => a.vendor), ...TECH_RADAR.adopt])];
  const first = dayDate(1);
  const last = dayDate(LAST_DAY);
  const certs = Object.fromEntries(
    vendors.map((v) => {
      const expiring = r.chance(EXPIRING_CERT_CHANCE);
      // Expiring ones run out somewhere between two months before day 1 and the last day.
      const validUntil = expiring
        ? addDays(first, -60 + Math.floor(r.next() * (60 + daysBetween(first, last))))
        : addDays(last, 90 + Math.floor(r.next() * 600));
      const standard = r.chance(0.5) ? ("ISO/IEC 27001" as const) : ("SOC 2 Type II" as const);
      return [v, { standard, validUntil }];
    }),
  );
  const world = { price, certs };

  // Expired certificates mustn't leave too few apps to approve on the last day: renew some.
  for (const a of ARCHETYPES) {
    if (candidates(world, LAST_DAY, null, false).length >= MIN_VALID_APPS) break;
    const cert = certs[a.vendor];
    if (cert && cert.validUntil < last) cert.validUntil = addDays(last, 90);
  }
  return world;
}

/** Apps that must still pass every rule on the last day, so the days don't repeat too much. */
const MIN_VALID_APPS = 5;

const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(to) - Date.parse(from)) / (24 * 60 * 60 * 1000));

/** Savings that clear the bar, by up to half again, so the check isn't always a close call. */
const enoughSavings = (cost: number, r: Rng) =>
  Math.ceil((cost * BUSINESS_CASE_MULTIPLE * (1 + r.next() * 0.5)) / 1_000) * 1_000;

/** Savings that clear the bar by a hair: under 4% over it. */
const justEnoughSavings = (cost: number, r: Rng) =>
  Math.ceil((cost * BUSINESS_CASE_MULTIPLE * (1 + r.next() * 0.04)) / 1_000) * 1_000;

/**
 * Savings that look healthy but miss the bar: between 2× and just under the multiple, or on a
 * close call within 6% of it, so only doing the sum catches it.
 */
function tooLittleSavings(cost: number, r: Rng, close: boolean) {
  const needed = cost * BUSINESS_CASE_MULTIPLE;
  const multiple = close
    ? BUSINESS_CASE_MULTIPLE * (0.94 + r.next() * 0.05)
    : 2 + r.next() * (BUSINESS_CASE_MULTIPLE - 2);
  return Math.min(Math.floor((cost * multiple) / 1_000) * 1_000, needed - 1_000);
}

/**
 * Rules an app passes or fails as it is, whatever the ticket says: its area, its vendor, its
 * single sign-on and its vendor's certificate. Breaking one means picking an app that fails it.
 */
const APP_RULES = {
  strategy: (a) => STRATEGY.focus.includes(a.capabilityId),
  sso: (a) => a.sso,
  techRadar: (a) => !TECH_RADAR.hold.includes(a.vendor),
  certificate: (a, w, today) => (w.certs[a.vendor]?.validUntil ?? "") >= today,
} satisfies Partial<Record<FlawRule, (a: Archetype, w: World, today: string) => boolean>>;

const APP_RULE_IDS = [
  "strategy",
  "sso",
  "techRadar",
  "certificate",
] as const satisfies (keyof typeof APP_RULES)[];

/** What the day's tickets have used up, so the day doesn't repeat itself. */
type Today = {
  /** Apps already asked for. */
  apps: Set<string>;
  /** Catalog apps already named to retire or to offer: each goes at most once a day. */
  catalog: Set<string>;
  /** People already at the desk today: everyone comes at most once a day. */
  people: Set<string>;
};

/** A catalog app of the area to retire, one nobody else has claimed today if there is one. */
function pickRetiree(r: Rng, capabilityId: string, today: Today) {
  const area = CATALOG.filter((c) => c.capabilityId === capabilityId);
  const free = area.filter((c) => !today.catalog.has(c.name));
  return r.pick(free.length > 0 ? free : area).name;
}

/** A ticket that passes every rule there is but the app's own. Flaws are applied on top. */
function validDemand(
  a: Archetype,
  w: World,
  r: Rng,
  day: number,
  ticket: number,
  today: Today,
): Demand {
  const cost = w.price[a.app] ?? a.cost;
  const date = dayDate(day);
  const cert = w.certs[a.vendor];
  const attachments: Attachment[] = [
    { kind: "vendorSheet", vendor: a.vendor, product: a.app, price: cost, sso: a.sso },
  ];
  if (cert) attachments.push({ kind: "certificate", vendor: a.vendor, ...cert });
  if (cost > BUSINESS_CASE_THRESHOLD || r.chance(0.3))
    attachments.unshift({
      kind: "businessCase",
      app: a.app,
      benefit: a.benefit,
      // On a close call the case only just clears the bar: it looks wrong and isn't.
      savings: r.chance(closeCallChance(day)) ? justEnoughSavings(cost, r) : enoughSavings(cost, r),
    });
  if (a.monitorsEmployees || r.chance(DECOY_APPROVAL_CHANCE))
    attachments.push({
      kind: "worksCouncil",
      app: a.app,
      decision: "approved",
      date: addDays(date, -(3 + Math.floor(r.next() * 40))),
    });

  return {
    id: `t${ticket}`,
    ticket: `DM-${ticket}`,
    requester: r.pick(freshPeople(a.capabilityId, today)),
    capabilityId: a.capabilityId,
    app: a.app,
    vendor: a.vendor,
    cost,
    reason: a.reason,
    sponsor: DEPARTMENT_HEADS[a.capabilityId]?.name ?? null,
    monitorsEmployees: a.monitorsEmployees,
    retires: pickRetiree(r, a.capabilityId, today),
    attachments,
    matchId: a.matchId,
  };
}

/** Swap one attachment of the same kind for another. */
function replace(d: Demand, next: Attachment): Attachment[] {
  return d.attachments.map((a) => (a.kind === next.kind ? next : a));
}

const isFlawRule = (id: RuleId): id is FlawRule => id !== "reuse";

const withoutAttachment = (d: Demand, kind: Attachment["kind"]) => ({
  ...d,
  attachments: d.attachments.filter((a) => a.kind !== kind),
});

/**
 * How to break each rule on the ticket itself. Each changes only what it needs; the rest stays
 * valid. Rules about the app (`APP_RULES`) are broken by the choice of app instead, apart from
 * the certificate, which can also just be missing.
 */
/** Rules with a by-a-hair way to break them in `FIELD_FLAWS`, for close calls. */
const SUBTLE_RULES: FlawRule[] = ["businessCase", "vendorMatch", "certificate"];

type FieldFlaw = (d: Demand, r: Rng, ctx: { today: Today; world: World; close: boolean }) => Demand;

const FIELD_FLAWS: Partial<Record<FlawRule, FieldFlaw>> = {
  sponsor: (d, r) => {
    const otherHeads = Object.entries(DEPARTMENT_HEADS)
      .filter(([id]) => id !== d.capabilityId)
      .map(([, h]) => h.name);
    const colleagues = (STAFF[d.capabilityId] ?? []).map((s) => s.name);
    return { ...d, sponsor: r.pick([null, r.pick(otherHeads), r.pick(colleagues)]) };
  },
  businessCase: (d, r, { close }) => {
    // Mostly a case whose numbers don't add up, so it's worth reading; sometimes none at all.
    const without = withoutAttachment(d, "businessCase");
    if (!r.chance(0.7)) return without;
    const benefit = ARCHETYPES.find((a) => a.app === d.app)?.benefit ?? "";
    const savings = tooLittleSavings(d.cost, r, close);
    return {
      ...without,
      attachments: [{ kind: "businessCase", app: d.app, benefit, savings }, ...without.attachments],
    };
  },
  vendorMatch: (d, r, { close }) => {
    const sheet = attachment(d, "vendorSheet");
    if (!sheet) return d;
    const which = close ? "price" : r.pick(["product", "vendor", "price"] as const);
    if (which === "price") {
      // Just under the business case line, so the ticket looks like it doesn't need one. It does.
      if (close && d.cost > BUSINESS_CASE_THRESHOLD && r.chance(0.5)) {
        const cost = BUSINESS_CASE_THRESHOLD - roundTo(r.next() * 3_000, 500);
        return { ...withoutAttachment(d, "businessCase"), cost };
      }
      // The requester rounds the price down on the ticket; the vendor's quote is the real one.
      // On a close call by only a little.
      const cut = close
        ? roundTo(500 + r.next() * 1_000, 500)
        : roundTo(2_000 + r.next() * Math.min(13_000, d.cost / 3), 500);
      return { ...d, cost: d.cost - cut };
    }
    const changed =
      which === "product"
        ? { ...sheet, product: `${d.app} ${r.pick(["Pro", "Plus", "Enterprise"])}` }
        : { ...sheet, vendor: r.pick(TECH_RADAR.adopt.filter((v) => v !== d.vendor)) };
    return { ...d, attachments: replace(d, changed) };
  },
  certificate: (d, r, { world, close }) => {
    // On a close call a valid certificate is attached, only it's another vendor's.
    const others = Object.entries(world.certs).filter(
      ([v, c]) => v !== d.vendor && c.validUntil >= dayDate(LAST_DAY),
    );
    if (!close || others.length === 0) return withoutAttachment(d, "certificate");
    const [vendor, cert] = r.pick(others);
    return { ...d, attachments: replace(d, { kind: "certificate", vendor, ...cert }) };
  },
  worksCouncil: (d, r) => {
    const approval = attachment(d, "worksCouncil");
    const how = r.pick(["missing", "rejected", "otherApp"] as const);
    if (how === "missing" || !approval) return withoutAttachment(d, "worksCouncil");
    const changed =
      how === "rejected"
        ? { ...approval, decision: "rejected" as const }
        : { ...approval, app: r.pick(ARCHETYPES.filter((a) => a.app !== d.app)).app };
    return { ...d, attachments: replace(d, changed) };
  },
  retire: (d, r, { today }) => {
    const otherArea = CATALOG.filter(
      (c) => c.capabilityId !== d.capabilityId && !today.catalog.has(c.name),
    );
    const options = [
      null,
      r.pick(MADE_UP_APPS),
      ...(otherArea.length ? [r.pick(otherArea).name] : []),
    ];
    return { ...d, retires: r.pick(options) };
  },
};

/**
 * Apps a ticket may be for: passing every app rule in force, except `flaw`, which it fails.
 * A broken business case needs an app pricey enough to need one; broken works council
 * approval, an app that tracks employees.
 */
function candidates(w: World, day: number, flaw: FlawRule | null, certExpired: boolean) {
  const today = dayDate(day);
  return ARCHETYPES.filter((a) => {
    if (a.matchId) return false;
    for (const id of APP_RULE_IDS) {
      if (!isInForce(id, day)) continue;
      const shouldFail = id === flaw && (id !== "certificate" || certExpired);
      if (APP_RULES[id](a, w, today) === shouldFail) return false;
    }
    if (flaw === "businessCase") return (w.price[a.app] ?? 0) > BUSINESS_CASE_THRESHOLD;
    if (flaw === "worksCouncil") return a.monitorsEmployees;
    return true;
  });
}

/** The day's tickets so far haven't asked for it yet, if that leaves anything. */
const fresh = (list: Archetype[], today: Today) => {
  const unused = list.filter((a) => !today.apps.has(a.app));
  return unused.length > 0 ? unused : list;
};

/** One new ticket for `day`. */
function generateDemand(w: World, r: Rng, day: number, ticket: number, today: Today): Demand {
  const rules = rulesInForce(day);
  const newest = rules.at(-1)!;
  const flawRules = rules.map((rule) => rule.id).filter(isFlawRule);

  // From day 6 some requests are for something we already own; the answer is to offer it.
  const owned = ARCHETYPES.filter(
    (a) => a.matchId && !today.catalog.has(CATALOG.find((c) => c.id === a.matchId)?.name ?? ""),
  );
  if (isInForce("reuse", day) && owned.length && r.chance(newest.id === "reuse" ? 0.4 : 0.2)) {
    const a = r.pick(fresh(owned, today));
    const demand = validDemand(a, w, r, day, ticket, today);
    // Half of them also break a rule on the ticket, as bait: offering is still right.
    const bait = flawRules.filter((id) => FIELD_FLAWS[id] && id !== "worksCouncil");
    const flaw = r.chance(0.5) && bait.length ? r.pick(bait) : null;
    return flaw ? FIELD_FLAWS[flaw]!(demand, r, { today, world: w, close: false }) : demand;
  }

  // A close call breaks an older rule by a hair, among those that can be: one easy to miss.
  const close = r.chance(closeCallChance(day));
  const subtle = flawRules.filter((id) => SUBTLE_RULES.includes(id) && id !== newest.id);
  let flaw = r.chance(FLAW_CHANCE)
    ? isFlawRule(newest.id) && r.chance(newestRuleChance(day))
      ? newest.id
      : r.pick(close && subtle.length ? subtle : flawRules)
    : null;
  // A broken certificate is an expired one when some vendor's has run out, else a missing one.
  // On a close call, it's there and valid, only issued to someone else.
  let certExpired = flaw === "certificate" && !close && r.chance(0.7);
  let apps = candidates(w, day, flaw, certExpired);
  if (apps.length === 0 && certExpired) {
    certExpired = false;
    apps = candidates(w, day, flaw, certExpired);
  }
  if (apps.length === 0) {
    flaw = null;
    apps = candidates(w, day, null, false);
  }

  const demand = validDemand(r.pick(fresh(apps, today)), w, r, day, ticket, today);
  const breakField = flaw && !(flaw === "certificate" && certExpired) && FIELD_FLAWS[flaw];
  return breakField ? breakField(demand, r, { today, world: w, close }) : demand;
}

/** The department's people who haven't been to the desk today, or all of them if everyone has. */
function freshPeople(capabilityId: string, today: Today) {
  const staff = STAFF[capabilityId] ?? [];
  const notYet = staff.filter((p) => !today.people.has(p.name));
  return notYet.length > 0 ? notYet : staff;
}

/** New tickets for every day of the run. */
export function generateDays(seed: number): Demand[][] {
  const r = rng(seed);
  const world = makeWorld(r);
  let ticket = 1001;
  return Array.from({ length: LAST_DAY }, (_, i) => {
    const today: Today = { apps: new Set(), catalog: new Set(), people: new Set() };
    return Array.from({ length: DEMANDS_PER_DAY }, () => {
      const demand = generateDemand(world, r, i + 1, ticket++, today);
      today.apps.add(demand.app);
      today.people.add(demand.requester.name);
      if (demand.retires) today.catalog.add(demand.retires);
      const offered = CATALOG.find((c) => c.id === demand.matchId);
      if (offered) today.catalog.add(offered.name);
      return demand;
    });
  });
}
