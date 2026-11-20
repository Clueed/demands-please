import type { Demand, GameState, Outcome } from "@/game/types";

/** Today's appointments start at 09:00 and come every 30 minutes, one per demand. */
const DAY_START = 9 * 60;
const SLOT_MINUTES = 30;

type Appointment = {
  /** Start time, e.g. "09:30". */
  time: string;
  demand: Demand;
} & (
  | { status: "done"; outcome: Outcome }
  /** Sitting at the desk right now. */
  | { status: "now" }
  | { status: "later" }
);

const pad = (n: number) => String(n).padStart(2, "0");

/** Minutes since midnight as a 24-hour clock time. */
export function clock(minutes: number): string {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

/** Today's calendar, top to bottom: everyone already seen, then whoever is waiting. */
export function agenda(state: GameState): Appointment[] {
  const seen = state.log.map((r) => ({
    demand: r.demand,
    status: "done" as const,
    outcome: r.outcome,
  }));
  const waiting = state.queue.map((demand, i) => ({
    demand,
    status: i === 0 ? ("now" as const) : ("later" as const),
  }));
  return [...seen, ...waiting].map((a, i) => ({
    ...a,
    time: clock(DAY_START + i * SLOT_MINUTES),
  }));
}
