import { describe, expect, it } from "vitest";

import { parseSeed, seedRun } from "./debug";
import { currentDemand, decide, haveCoffee, next } from "./engine";
import { verdict } from "./rules";
import { DAY_START, FINDINGS_LIMIT, LAST_DAY } from "./time";

describe("seedRun", () => {
  it("starts at the first briefing by default", () => {
    const game = seedRun({ seed: 1 });
    expect(game).toMatchObject({ phase: "briefing", day: 1, findings: 0, log: [] });
  });

  it("lands on a day's briefing with every earlier ticket decided", () => {
    const game = seedRun({ seed: 1, day: 4 });
    expect(game).toMatchObject({ phase: "briefing", day: 4, clock: DAY_START, findings: 0 });
    const earlier = game.days.slice(0, 3).flat();
    expect(game.log.map((r) => r.demand.id)).toEqual(earlier.map((d) => d.id));
    expect(game.queue).toEqual(game.days[3]);
  });

  it("is the same run for the same seed", () => {
    expect(seedRun({ seed: 9, day: 3 })).toEqual(seedRun({ seed: 9, day: 3 }));
  });

  it("stops mid-day with the given visitors seen", () => {
    const game = seedRun({ seed: 2, day: 3, ticket: 2 });
    expect(game).toMatchObject({ phase: "working", day: 3 });
    expect(game.queue[0]).toEqual(game.days[2]![2]);
    expect(game.clock).toBeGreaterThan(DAY_START);
  });

  it("makes the wrong calls just before the stop for findings", () => {
    const game = seedRun({ seed: 3, day: 2, ticket: 1, findings: 2 });
    expect(game.findings).toBe(2);
    expect(game.log.slice(-2).every((r) => r.finding)).toBe(true);
    expect(game.log.slice(0, -2).every((r) => !r.finding)).toBe(true);
  });

  it("keeps findings below the limit unless asked to lose", () => {
    expect(seedRun({ seed: 3, day: 2, findings: 9 }).findings).toBe(FINDINGS_LIMIT - 1);
    expect(seedRun({ seed: 3, day: 2, phase: "lost" })).toMatchObject({
      phase: "lost",
      lostTo: "audit",
      findings: FINDINGS_LIMIT,
    });
  });

  it("can stop at the end of a day, or of the run", () => {
    expect(seedRun({ seed: 4, day: 5, phase: "dayEnd" })).toMatchObject({
      phase: "dayEnd",
      day: 5,
    });
    expect(seedRun({ seed: 4, phase: "won" })).toMatchObject({ phase: "won", day: LAST_DAY });
  });

  it("can stop at coffee with the auditor, with a finding to close", () => {
    const game = seedRun({ seed: 4, day: 3, phase: "coffee" });
    expect(game).toMatchObject({ phase: "coffee", day: 3, findings: 1 });
    expect(haveCoffee(game)).toMatchObject({ phase: "dayEnd", findings: 0 });
  });

  it("sets the clock while working", () => {
    expect(seedRun({ seed: 5, day: 2, phase: "working", clock: 15 * 60 }).clock).toBe(15 * 60);
  });

  it("can be played on from where it stops", () => {
    let game = seedRun({ seed: 6, day: 6, ticket: 3 });
    const demand = currentDemand(game)!;
    const right = verdict(demand, game.day);
    game = next(decide(game, right.kind === "decline" ? { kind: "decline" } : right));
    expect(game.findings).toBe(0);
    expect(game.queue[0]).toEqual(game.days[5]![4]);
  });
});

describe("parseSeed", () => {
  it("is null without seed options", () => {
    expect(parseSeed(new URLSearchParams(""))).toBeNull();
    expect(parseSeed(new URLSearchParams("debug"))).toBeNull();
  });

  it("reads the options it knows, dropping bad values", () => {
    expect(
      parseSeed(new URLSearchParams("seed=7&day=4&ticket=2&findings=1&phase=working&clock=13:30")),
    ).toEqual({ seed: 7, day: 4, ticket: 2, findings: 1, phase: "working", clock: 13 * 60 + 30 });
    expect(parseSeed(new URLSearchParams("day=x&phase=nap&ticket=1"))).toEqual({ ticket: 1 });
  });
});
