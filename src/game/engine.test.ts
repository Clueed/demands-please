import { describe, expect, it } from "vitest";

import { ARCHETYPES, CAPABILITIES, CATALOG, DEPARTMENT_HEADS, STAFF } from "./data";
import {
  currentDemand,
  currentResolution,
  decide,
  FORGIVE_MINUTES,
  newGame,
  next,
  nextDay,
  push,
  schedule,
  startDay,
  tick,
} from "./engine";
import { generateDays } from "./generate";
import { judge, RULES, verdict } from "./rules";
import {
  BACKLOG_LIMIT,
  dayDate,
  DAY_END,
  DAY_START,
  DEMANDS_PER_DAY,
  LAST_DAY,
  MAX_MISTAKES,
  PUSH_MINUTES,
  SLOT_MINUTES,
} from "./time";
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

describe("the day", () => {
  it("a decision is final; next calls in the following visitor", () => {
    let s = working();
    s = decide(s, { kind: "approve" });
    expect(currentResolution(s)?.citation).toBeNull();
    expect(decide(s, { kind: "decline" })).toBe(s);
    s = next(s);
    expect(currentDemand(s)?.id).toBe("d1");
  });

  it("next does nothing before a decision", () => {
    const s = working();
    expect(next(s)).toBe(s);
  });

  it("an undecided visitor whose time runs out goes to the backlog", () => {
    const s = tick(working(), SLOT_MINUTES);
    expect(s.backlog.map((d) => d.id)).toEqual(["d0"]);
    expect(currentDemand(s)?.id).toBe("d1");
  });

  it("a decided visitor whose time runs out just leaves", () => {
    const s = tick(decide(working(), { kind: "approve" }), SLOT_MINUTES);
    expect(s.backlog).toEqual([]);
    expect(currentDemand(s)?.id).toBe("d1");
  });

  it("time saved carries over to the next appointment", () => {
    let s = tick(working(), 20);
    s = next(decide(s, { kind: "approve" }));
    expect(s.deadline).toBe(DAY_START + 2 * SLOT_MINUTES);
  });

  it("push gives more time and moves everyone after", () => {
    const s = push(working());
    expect(s.deadline).toBe(DAY_START + SLOT_MINUTES + PUSH_MINUTES);
    expect(schedule(s)[1]?.start).toBe(DAY_START + SLOT_MINUTES + PUSH_MINUTES);
  });

  it("appointments pushed past closing time are marked after hours", () => {
    let s = working(8);
    s = push(push(s));
    expect(schedule(s).filter((a) => a.afterHours)).toHaveLength(1);
  });

  it("ends early once everyone is seen", () => {
    let s = working(1);
    s = next(decide(s, { kind: "approve" }));
    expect(s.phase).toBe("dayEnd");
  });

  it("at closing time everyone left waiting goes to the backlog", () => {
    const s = tick(working(10), DAY_END - DAY_START);
    expect(s.phase).toBe("fired");
    expect(s.firedFor).toBe("backlog");
    expect(s.backlog.length).toBeGreaterThan(BACKLOG_LIMIT);
  });

  it("the backlog comes first the next morning", () => {
    let s = tick(working(), SLOT_MINUTES);
    s = next(decide(s, { kind: "approve" }));
    s = next(decide(s, { kind: "approve" }));
    expect(s.phase).toBe("dayEnd");
    s = nextDay(s);
    expect(s).toMatchObject({ phase: "briefing", day: 2, clock: DAY_START, backlog: [] });
    expect(s.queue.map((d) => d.id)).toEqual(["d0", "d0", "d1", "d2"]);
  });

  it("surviving the last day wins", () => {
    let s = working(1);
    for (let day = 1; day < LAST_DAY; day++)
      s = startDay(nextDay(next(decide(s, { kind: "approve" }))));
    s = next(decide(s, { kind: "approve" }));
    expect(s.phase).toBe("won");
  });
});

/** Decline a valid ticket, then let the visitor's time run out. */
const wrong = (s: GameState) => tick(decide(s, { kind: "decline" }), SLOT_MINUTES);

describe("mistakes", () => {
  it("one too many gets you fired", () => {
    let s = working(10);
    for (let i = 0; i < MAX_MISTAKES; i++) s = wrong(s);
    expect(s.mistakes).toBe(MAX_MISTAKES);
    expect(s.phase).toBe("working");
    s = decide(s, { kind: "decline" });
    expect(s).toMatchObject({ phase: "fired", firedFor: "mistakes" });
  });

  it("finishing an hour early takes back an earlier mistake, and spends the hour", () => {
    let s = next(decide(working(4), { kind: "decline" }));
    // Wrong at 09:00 and sent off at once, but a mistake never cancels itself.
    expect(s.mistakes).toBe(1);
    s = tick(s, 30);
    // 09:30, and this appointment runs until 11:00: 90 minutes early.
    s = next(decide(s, { kind: "approve" }));
    expect(s.mistakes).toBe(0);
    expect(s.forgivenAt).toBe(DAY_START + 30);
    expect(s.deadline).toBe(DAY_START + 3 * SLOT_MINUTES - FORGIVE_MINUTES);
  });

  it("takes back at most one mistake a day", () => {
    let s = working(6);
    // Blind and instant: every ticket declined at 09:00 and sent off at once.
    for (let i = 0; i < 4; i++) s = next(decide(s, { kind: "decline" }));
    expect(s.mistakes).toBe(3);
  });

  it("with no mistakes, time saved is kept", () => {
    let s = working(4);
    s = next(decide(s, { kind: "approve" }));
    s = next(decide(s, { kind: "approve" }));
    expect(s.deadline - s.clock).toBe(3 * SLOT_MINUTES);
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
