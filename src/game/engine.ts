import { generateDays } from "./generate";
import { judge } from "./rules";
import { DAY_END, DAY_START, LAST_DAY, FINDINGS_LIMIT } from "./time";
import type { Decision, Demand, GameState, Resolution } from "./types";

/**
 * Seeing everyone this long before closing time, with a finding on record, closes one finding.
 * It's checked as the day ends, so it can happen at most once a day.
 */
export const FORGIVE_MINUTES = 60;

/** A run, waiting at the first morning's briefing. */
export function newGame(seed: number, days: Demand[][] = generateDays(seed)): GameState {
  return {
    phase: "briefing",
    day: 1,
    clock: DAY_START,
    queue: days[0] ?? [],
    log: [],
    findings: 0,
    forgivenToday: false,
    days,
    lostTo: null,
  };
}

export function currentDemand(state: GameState): Demand | undefined {
  return state.phase === "working" ? state.queue[0] : undefined;
}

/** The decision already made on the request at the desk, if any. */
export function currentResolution(state: GameState): Resolution | undefined {
  const demand = currentDemand(state);
  const last = state.log.at(-1);
  return demand && last?.demand.id === demand.id && last.day === state.day ? last : undefined;
}

/** The briefing is read: the clock starts. */
export function startDay(state: GameState): GameState {
  if (state.phase !== "briefing") return state;
  return { ...state, phase: "working" };
}

/** Stamp the request at the desk. It stays there until "next". */
export function decide(state: GameState, decision: Decision): GameState {
  const demand = currentDemand(state);
  if (!demand || currentResolution(state)) return state;

  const finding = judge(demand, decision, state.day);
  const resolution: Resolution = { demand, decision, day: state.day, at: state.clock, finding };
  const findings = state.findings + (finding ? 1 : 0);
  return {
    ...state,
    log: [...state.log, resolution],
    findings,
    ...(findings >= FINDINGS_LIMIT && { phase: "lost", lostTo: "audit" }),
  };
}

/** Send the visitor off and call in the next one. The last one out ends the day. */
export function next(state: GameState): GameState {
  if (!currentResolution(state)) return state;
  const queue = state.queue.slice(1);
  return queue.length > 0 ? { ...state, queue } : endDay({ ...state, queue });
}

/** Run the clock forward. Anyone still waiting at closing time ends the run. */
export function tick(state: GameState, minutes: number): GameState {
  if (state.phase !== "working") return state;
  const clock = Math.min(DAY_END, state.clock + minutes);
  if (clock < DAY_END) return { ...state, clock };
  // Whoever is at the desk with a decision already made doesn't count as waiting.
  const waiting = currentResolution(state) ? state.queue.slice(1) : state.queue;
  return waiting.length > 0
    ? { ...state, clock, queue: waiting, phase: "lost", lostTo: "shadowIT" }
    : endDay({ ...state, clock, queue: [] });
}

/** Everyone's seen. An hour to spare closes a finding. */
function endDay(state: GameState): GameState {
  const forgive = state.findings > 0 && DAY_END - state.clock >= FORGIVE_MINUTES;
  return {
    ...state,
    findings: state.findings - (forgive ? 1 : 0),
    forgivenToday: forgive,
    phase: state.day === LAST_DAY ? "won" : "dayEnd",
  };
}

/** Next morning: a fresh line of requests. */
export function nextDay(state: GameState): GameState {
  if (state.phase !== "dayEnd") return state;
  const day = state.day + 1;
  return {
    ...state,
    phase: "briefing",
    day,
    clock: DAY_START,
    queue: state.days[day - 1] ?? [],
    forgivenToday: false,
  };
}

export type DaySummary = { decided: number; findings: number };

export function summarizeDay(state: GameState): DaySummary {
  const today = state.log.filter((r) => r.day === state.day);
  return {
    decided: today.length,
    findings: today.filter((r) => r.finding).length,
  };
}

/** Skip straight to a day's briefing with a clean record, for playtesting. */
export function jumpToDay(state: GameState, day: number): GameState {
  const d = Math.min(Math.max(1, Math.floor(day)), state.days.length);
  return { ...state, day: d, queue: state.days[d - 1] ?? [] };
}
