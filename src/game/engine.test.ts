import { describe, expect, it } from "vitest";

import { ARCHETYPES, CAPABILITIES, CATALOG, DEPARTMENT_HEADS, STAFF } from "./data";
import {
  currentDemand,
  currentResolution,
  decide,
  FORGIVE_MINUTES,
  haveCoffee,
  newGame,
  next,
  nextDay,
  startDay,
  tick,
} from "./engine";
import { generateDays } from "./generate";
import { judge, RULES, verdict } from "./rules";
import { dayDate, DAY_END, DAY_START, DEMANDS_PER_DAY, LAST_DAY, FINDINGS_LIMIT } from "./time";
import type { Demand, GameState } from "./types";

/** A ticket that passes every rule. */
const valid = (over: Partial<Demand> = {}): Demand => ({
  id: "x",
  ticket: "REQ-1",
  requester: STAFF["sales-marketing"]![0]!,
  capabilityId: "sales-marketing",
  app: "PriceWise",
  vendor: "PriceWise Ltd",
  cost: 10_000,
  reason: "r",
  sponsor: DEPARTMENT_HEADS["sales-marketing"]!.name,
  monitorsEmployees: false,
  retires: "Campaign Hub",
  attachments: [
    {
      kind: "vendorSheet",
      vendor: "PriceWise Ltd",
      product: "PriceWise",
      price: 10_000,
      sso: true,
    },
    {
      kind: "certificate",
      vendor: "PriceWise Ltd",
      standard: "SOC 2 Type II",
      validUntil: "2030-01-01",
    },
  ],
  matchId: null,
  ...over,
});

const ids = (n: number) => Array.from({ length: n }, (_, i) => valid({ id: `d${i}` }));
/** A run whose every day holds `n` valid tickets, already at work on day 1. */
const working = (n = 3): GameState =>
  startDay(
    newGame(
      0,
      Array.from({ length: LAST_DAY }, () => ids(n)),
    ),
  );

describe("rules", () => {
  it("a valid ticket is approved on every day", () => {
    for (let day = 1; day <= LAST_DAY; day++)
      expect(verdict(valid(), day)).toEqual({ kind: "approve" });
  });

  it("a rule only counts from its day", () => {
    const noSponsor = valid({ sponsor: null });
    expect(verdict(noSponsor, 1).kind).toBe("decline");
    const outOfFocus = valid({ capabilityId: "hr", sponsor: DEPARTMENT_HEADS.hr!.name });
    expect(verdict(outOfFocus, 4).kind).toBe("approve");
    expect(verdict(outOfFocus, 5).kind).toBe("decline");
  });

  it("offering what we own is right from day 6, even outside the focus areas", () => {
    const owned = valid({ capabilityId: "hr", sponsor: null, matchId: "peoplebase" });
    expect(verdict(owned, 5).kind).toBe("decline");
    expect(verdict(owned, 6)).toEqual({ kind: "offer", appId: "peoplebase" });
    expect(judge(owned, { kind: "decline" }, 6)).toMatch(/PeopleBase/);
    expect(judge(owned, { kind: "offer", appId: "peoplebase" }, 6)).toBeNull();
  });

  it("a certificate goes stale on the day it expires", () => {
    const cert = {
      kind: "certificate",
      vendor: "PriceWise Ltd",
      standard: "ISO/IEC 27001",
    } as const;
    const ticket = valid({
      attachments: [valid().attachments[0]!, { ...cert, validUntil: dayDate(5) }],
    });
    expect(verdict(ticket, 5).kind).toBe("approve");
    expect(verdict(ticket, 6).kind).toBe("decline");
  });

  it("a business case must save five times the annual cost", () => {
    const sheet = { ...valid().attachments[0]!, price: 30_000 } as const;
    const withCase = (savings: number) =>
      valid({
        cost: 30_000,
        attachments: [
          { kind: "businessCase", app: "PriceWise", benefit: "b", savings },
          sheet,
          valid().attachments[1]!,
        ],
      });
    expect(verdict(withCase(150_000), 2).kind).toBe("approve");
    expect(judge(withCase(149_000), { kind: "approve" }, 2)).toMatch(/needs €150,000/);
    expect(judge(valid({ cost: 30_000, attachments: [sheet] }), { kind: "approve" }, 2)).toMatch(
      /without a business case/,
    );
  });

  it("are ten, one per day", () => {
    expect(RULES.map((r) => r.day)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
});

describe("generateDays", () => {
  const days = generateDays(42);

  it("is the same for the same seed", () => {
    expect(generateDays(42)).toEqual(days);
  });

  it("makes every day's tickets, with unique ticket numbers", () => {
    expect(days).toHaveLength(LAST_DAY);
    for (const d of days) expect(d).toHaveLength(DEMANDS_PER_DAY);
    const tickets = days.flat().map((d) => d.ticket);
    expect(new Set(tickets).size).toBe(tickets.length);
  });

  it("each ticket breaks at most one rule in force on its day", () => {
    const reasons = [1, 2, 3, 4, 5].flatMap((seed) =>
      generateDays(seed).flatMap((tickets, i) =>
        tickets.map((t) => {
          const v = verdict(t, i + 1);
          return v.kind === "decline" ? v.reasons.length : 0;
        }),
      ),
    );
    expect(Math.max(...reasons)).toBe(1);
  });

  it("mixes approvals and declines", () => {
    const kinds = days.flatMap((tickets, i) => tickets.map((t) => verdict(t, i + 1).kind));
    expect(kinds).toContain("approve");
    expect(kinds).toContain("decline");
    expect(kinds).toContain("offer");
  });
});

/** Approve the visitor at the desk and call in the next. */
const approve = (s: GameState) => next(decide(s, { kind: "approve" }));
/** Decline a valid ticket and call in the next: a finding. */
const wrong = (s: GameState) => next(decide(s, { kind: "decline" }));
const DAY = DAY_END - DAY_START;

describe("the day", () => {
  it("a decision is final; next calls in the following visitor", () => {
    let s = working();
    s = decide(s, { kind: "approve" });
    expect(currentResolution(s)?.finding).toBeNull();
    expect(decide(s, { kind: "decline" })).toBe(s);
    s = next(s);
    expect(currentDemand(s)?.id).toBe("d1");
  });

  it("next does nothing before a decision", () => {
    const s = working();
    expect(next(s)).toBe(s);
  });

  it("a visitor stays at the desk however long it takes", () => {
    const s = tick(working(), DAY - 1);
    expect(s).toMatchObject({ phase: "working", clock: DAY_END - 1 });
    expect(currentDemand(s)?.id).toBe("d0");
  });

  it("ends once everyone is seen", () => {
    expect(approve(working(1)).phase).toBe("dayEnd");
  });

  it("anyone still waiting at closing time loses the run to shadow IT", () => {
    const s = tick(approve(working(3)), DAY);
    expect(s).toMatchObject({ phase: "lost", lostTo: "shadowIT" });
    expect(s.queue.map((d) => d.id)).toEqual(["d1", "d2"]);
  });

  it("a decided visitor still at the desk at closing time doesn't count", () => {
    const s = tick(decide(approve(working(2)), { kind: "approve" }), DAY);
    expect(s.phase).toBe("dayEnd");
  });

  it("the next morning brings a fresh line", () => {
    let s = approve(approve(approve(working())));
    s = nextDay(s);
    expect(s).toMatchObject({ phase: "briefing", day: 2, clock: DAY_START });
    expect(s.queue.map((d) => d.id)).toEqual(["d0", "d1", "d2"]);
  });

  it("surviving the last day wins", () => {
    let s = working(1);
    for (let day = 1; day < LAST_DAY; day++) s = startDay(nextDay(approve(s)));
    expect(approve(s).phase).toBe("won");
  });
});

describe("findings", () => {
  it("the last finding allowed ends the run with an audit", () => {
    let s = working(10);
    for (let i = 1; i < FINDINGS_LIMIT; i++) s = wrong(s);
    expect(s.findings).toBe(FINDINGS_LIMIT - 1);
    expect(s.phase).toBe("working");
    s = decide(s, { kind: "decline" });
    expect(s).toMatchObject({ phase: "lost", lostTo: "audit", findings: FINDINGS_LIMIT });
  });

  it("seeing everyone an hour before closing leaves time for coffee with the auditor", () => {
    let s = wrong(wrong(tick(working(3), DAY - FORGIVE_MINUTES)));
    expect(s.findings).toBe(2);
    s = approve(s);
    expect(s).toMatchObject({ phase: "coffee", findings: 2 });
    expect(nextDay(s)).toBe(s);

    s = haveCoffee(s);
    expect(s).toMatchObject({ phase: "dayEnd", findings: 1, forgivenToday: true });
    // The latest finding is the one revisited.
    expect(s.log.map((r) => r.closed)).toEqual([false, true, false]);
    expect(haveCoffee(s)).toBe(s);
    expect(nextDay(s).forgivenToday).toBe(false);
  });

  it("coffee on the last day still wins", () => {
    let s = working(1);
    for (let day = 1; day < LAST_DAY; day++) s = startDay(nextDay(approve(s)));
    s = wrong(s);
    expect(s.phase).toBe("coffee");
    expect(haveCoffee(s)).toMatchObject({ phase: "won", findings: 0 });
  });

  it("less than an hour to spare closes nothing", () => {
    const s = approve(wrong(tick(working(2), DAY - FORGIVE_MINUTES + 1)));
    expect(s).toMatchObject({ phase: "dayEnd", findings: 1, forgivenToday: false });
  });

  it("with no findings, finishing early closes nothing", () => {
    const s = approve(working(1));
    expect(s).toMatchObject({ findings: 0, forgivenToday: false });
  });
});

describe("data", () => {
  it("every archetype's match points at a real catalog app and capability", () => {
    const apps = new Set(CATALOG.map((a) => a.id));
    const caps = new Set(CAPABILITIES.map((c) => c.id));
    expect(ARCHETYPES.filter((a) => a.matchId && !apps.has(a.matchId))).toEqual([]);
    expect(ARCHETYPES.filter((a) => !caps.has(a.capabilityId))).toEqual([]);
  });
});
