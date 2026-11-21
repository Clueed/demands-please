import { schedule } from "@/game/engine";
import { clock, DAY_END, DAY_START } from "@/game/time";
import type { Demand, GameState } from "@/game/types";

/** Game pixels per hour on the calendar's timeline. */
export const HOUR_PX = 22;
/** Height of the whole working day on the timeline. */
export const TIMELINE_H = ((DAY_END - DAY_START) / 60) * HOUR_PX;

/** Where a time of day sits on the timeline, in whole game pixels from its top. */
export const timelineY = (minutes: number) => Math.round(((minutes - DAY_START) / 60) * HOUR_PX);

export type CalendarBlock = {
  demand: Demand;
  /** Start time, e.g. "09:30". */
  time: string;
  y: number;
  h: number;
  atDesk: boolean;
};

/** Today's calendar: who's still to come, where "now" is, and who won't fit before closing. */
export function timeline(state: GameState) {
  const appointments = schedule(state);
  const blocks: CalendarBlock[] = appointments
    .filter((a) => !a.afterHours)
    .map((a) => {
      const y = timelineY(a.start);
      return {
        demand: a.demand,
        time: clock(a.start),
        y,
        h: timelineY(Math.min(a.end, DAY_END)) - y,
        atDesk: a.atDesk,
      };
    });
  return {
    hours: Array.from({ length: (DAY_END - DAY_START) / 60 }, (_, i) => ({
      label: clock(DAY_START + i * 60),
      y: i * HOUR_PX,
    })),
    nowY: timelineY(state.clock),
    blocks,
    /** Appointments pushed past closing time: they'll land in the backlog. */
    afterHours: appointments.filter((a) => a.afterHours).length,
  };
}
