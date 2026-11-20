import { describe, expect, it } from "vitest";

import { CATALOG, DEMANDS } from "@/game/data";
import { newGame, resolve } from "@/game/engine";

import { agenda, clock } from "./calendar";

describe("clock", () => {
  it("formats minutes since midnight", () => {
    expect(clock(9 * 60)).toBe("09:00");
    expect(clock(13 * 60 + 30)).toBe("13:30");
  });
});

describe("agenda", () => {
  it("lists every demand in half-hour slots from 09:00, first one now", () => {
    const day = agenda(newGame(DEMANDS, CATALOG));
    expect(day).toHaveLength(DEMANDS.length);
    expect(day.map((a) => a.time).slice(0, 3)).toEqual(["09:00", "09:30", "10:00"]);
    expect(day.map((a) => a.status)).toEqual(["now", ...DEMANDS.slice(1).map(() => "later")]);
  });

  it("keeps resolved appointments in their slot, marked done with the outcome", () => {
    const state = resolve(newGame(DEMANDS, CATALOG), { kind: "decline" });
    const [first, second] = agenda(state);
    expect(first).toMatchObject({
      time: "09:00",
      demand: DEMANDS[0],
      status: "done",
      outcome: "declined",
    });
    expect(second).toMatchObject({ time: "09:30", demand: DEMANDS[1], status: "now" });
  });
});
