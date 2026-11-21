import { describe, expect, it } from "vitest";

import { CAPABILITIES, CATALOG, DEMANDS } from "./data";
import { currentDemand, isOver, newGame, resolve, summarize } from "./engine";
import type { CatalogApp, Demand } from "./types";

const app = (id: string, spend: number): CatalogApp => ({
  id,
  name: id,
  capabilityId: "sales-marketing",
  description: "",
  tags: [],
  spend,
});
/** Existing portfolio costs 1000 per year. */
const catalog = [app("pipetrack", 600), app("other", 400)];

const withMatch: Demand = {
  id: "a",
  requester: { name: "R", role: "Role" },
  requestedApp: "X",
  reason: "r",
  capabilityId: "hr",
  cost: 100,
  matchId: "pipetrack",
};
const noMatch: Demand = {
  id: "b",
  requester: { name: "R", role: "Role" },
  requestedApp: "Y",
  reason: "r",
  capabilityId: "hr",
  cost: 50,
  matchId: null,
};

describe("portfolio", () => {
  it("a bought app joins the portfolio with its price as yearly spend", () => {
    const s = resolve(newGame([withMatch], catalog), { kind: "buy" });
    expect(s.portfolio).toHaveLength(3);
    expect(s.portfolio.at(-1)).toMatchObject({ name: "X", capabilityId: "hr", spend: 100 });
    expect(s.portfolio.reduce((sum, a) => sum + a.spend, 0)).toBe(s.spent);
  });

  it("declining or offering leaves the portfolio unchanged", () => {
    const g = newGame([withMatch, noMatch], catalog);
    const s = resolve(resolve(g, { kind: "decline" }), { kind: "offer", appId: "other" });
    expect(s.portfolio).toEqual(catalog);
  });
});

describe("newGame", () => {
  it("total spend starts at the existing portfolio spend", () => {
    expect(newGame([withMatch], catalog)).toMatchObject({ startingSpend: 1000, spent: 1000 });
  });

  it("happiness starts in the middle of the 0-10 scale", () => {
    expect(newGame([], catalog).happiness).toBe(5);
  });
});

/** Make the same decision on n identical demands. */
function play(n: number, kind: "buy" | "decline") {
  let s = newGame(
    Array.from({ length: n }, () => withMatch),
    catalog,
  );
  for (let i = 0; i < n; i++) s = resolve(s, { kind });
  return s;
}

describe("happiness scale", () => {
  it("stops at 10 and records no change once full", () => {
    const s = play(6, "buy");
    expect(s.happiness).toBe(10);
    expect(s.log.at(-1)?.happiness).toBe(0);
  });

  it("stops at 0", () => {
    expect(play(6, "decline").happiness).toBe(0);
  });
});

describe("resolve", () => {
  it("buying adds to spend and makes people happy", () => {
    const s = resolve(newGame([withMatch], catalog), { kind: "buy" });
    expect(s).toMatchObject({ spent: 1100, happiness: 6 });
    expect(s.log[0]?.outcome).toBe("bought");
  });

  it("offering the right app adds nothing and makes people happy", () => {
    const s = resolve(newGame([withMatch], catalog), { kind: "offer", appId: "pipetrack" });
    expect(s).toMatchObject({ spent: 1000, happiness: 6 });
    expect(s.log[0]?.outcome).toBe("matched");
  });

  it("offering the wrong app adds nothing but makes people unhappy", () => {
    const s = resolve(newGame([noMatch], catalog), { kind: "offer", appId: "pipetrack" });
    expect(s).toMatchObject({ spent: 1000, happiness: 4 });
    expect(s.log[0]?.outcome).toBe("mismatched");
  });

  it("declining adds nothing but makes people unhappy", () => {
    const s = resolve(newGame([withMatch], catalog), { kind: "decline" });
    expect(s).toMatchObject({ spent: 1000, happiness: 4 });
  });

  it("moves the queue on and ends when empty", () => {
    let s = newGame([withMatch, noMatch], catalog);
    s = resolve(s, { kind: "decline" });
    expect(currentDemand(s)).toBe(noMatch);
    s = resolve(s, { kind: "buy" });
    expect(isOver(s)).toBe(true);
    expect(resolve(s, { kind: "buy" })).toBe(s);
  });
});

describe("summarize", () => {
  it("compares against buying everything", () => {
    let s = newGame([withMatch, noMatch], catalog);
    s = resolve(s, { kind: "offer", appId: "pipetrack" });
    s = resolve(s, { kind: "buy" });
    expect(summarize(s)).toEqual({
      spent: 1050,
      happiness: 7,
      startingSpend: 1000,
      buyEverythingCost: 1150,
      matchesFound: 1,
      matchesPossible: 1,
    });
  });
});

describe("data", () => {
  it("every demand match points at a real catalog app", () => {
    const ids = new Set(CATALOG.map((a) => a.id));
    const dangling = DEMANDS.filter((d) => d.matchId !== null && !ids.has(d.matchId));
    expect(dangling).toEqual([]);
  });

  it("every demand belongs to a real capability", () => {
    const ids = new Set(CAPABILITIES.map((c) => c.id));
    expect(DEMANDS.filter((d) => !ids.has(d.capabilityId))).toEqual([]);
  });
});
