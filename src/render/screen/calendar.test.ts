import { describe, expect, it } from "vitest";

import { newGame, push, startDay, tick } from "@/game/engine";
import { generateDays } from "@/game/generate";
import { DAY_START, PUSH_MINUTES, SLOT_MINUTES } from "@/game/time";

import { HOUR_PX, timeline, TIMELINE_H, timelineY } from "./calendar";

const fullDay = () => {
  const days = generateDays(7).map((d) => [...d, ...d.slice(0, 1)]);
  return startDay(newGame(7, days));
};

describe("timeline", () => {
  it("lays the day out an hour per appointment from 09:00, the first one at the desk", () => {
    const t = timeline(fullDay());
    expect(t.blocks.map((b) => b.time).slice(0, 3)).toEqual(["09:00", "10:00", "11:00"]);
    expect(t.blocks.map((b) => b.y).slice(0, 3)).toEqual([0, HOUR_PX, 2 * HOUR_PX]);
    expect(t.blocks.filter((b) => b.atDesk)).toHaveLength(1);
    expect(t.blocks.at(-1)!.y + t.blocks.at(-1)!.h).toBe(TIMELINE_H);
    expect(t.afterHours).toBe(0);
  });

  it("moves the now line with the clock", () => {
    expect(timeline(tick(fullDay(), 30)).nowY).toBe(timelineY(DAY_START + 30));
  });

  it("pushing past closing time moves appointments after hours", () => {
    const t = timeline(push(push(fullDay())));
    expect(t.afterHours).toBe(1);
    expect(t.blocks[0]!.h).toBe(timelineY(DAY_START + SLOT_MINUTES + 2 * PUSH_MINUTES));
  });
});
