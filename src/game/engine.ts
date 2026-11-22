import { generateDays } from "./generate";
import { CATALOG } from "./data";
import { isInForce, judge } from "./rules";
import { DAY_END, DAY_START, LAST_DAY, FINDINGS_LIMIT } from "./time";
import type { Decision, Demand, GameState, Resolution } from "./types";

/**
 * Seeing everyone this long before closing time, with a finding on record, leaves time for a
 * coffee with the auditor, which closes one finding. At most once a day.
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
    retired: [],
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

  const finding = judge(demand, decision, state.day, state.retired);
  const resolution: Resolution = {
    demand,
    decision,
    day: state.day,
    at: state.clock,
    finding,
    closedOn: null,
  };
  const findings = state.findings + (finding ? 1 : 0);
  return {
    ...state,
    log: [...state.log, resolution],
    findings,
    retired: retiring(state, demand, decision)
      ? [...state.retired, demand.retires!]
      : state.retired,
    ...(findings >= FINDINGS_LIMIT && { phase: "lost", lostTo: "audit" }),
  };
}

/** One in, one out: an approved app switches off the catalog app it named, if there is one. */
function retiring(state: GameState, demand: Demand, decision: Decision) {
  return (
    decision.kind === "approve" &&
    isInForce("retire", state.day) &&
    !!demand.retires &&
    !state.retired.includes(demand.retires) &&
    CATALOG.some((a) => a.name === demand.retires)
  );
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

const dayOver = (state: GameState) => (state.day === LAST_DAY ? "won" : "dayEnd");

/** Everyone's seen. With an hour to spare and a finding open, the auditor has time for coffee. */
function endDay(state: GameState): GameState {
  const coffee = state.findings > 0 && DAY_END - state.clock >= FORGIVE_MINUTES;
  return { ...state, phase: coffee ? "coffee" : dayOver(state) };
}

/** Coffee with the auditor: the latest open finding gets closed. */
export function haveCoffee(state: GameState): GameState {
  if (state.phase !== "coffee") return state;
  const i = state.log.findLastIndex((r) => r.finding && r.closedOn === null);
  const log = state.log.map((r, j) => (j === i ? { ...r, closedOn: state.day } : r));
  return {
    ...state,
    log,
    findings: state.findings - 1,
    forgivenToday: true,
    phase: dayOver(state),
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

export type Summary = {
  decided: number;
  /** The wrong calls, oldest first. */
  wrong: Resolution[];
};

const summarize = (log: Resolution[]): Summary => ({
  decided: log.length,
  wrong: log.filter((r) => r.finding),
});

/** One day's decisions, today's unless another is named. */
export const summarizeDay = (state: GameState, day = state.day) =>
  summarize(state.log.filter((r) => r.day === day));

/** Findings still open at the end of a day: wrong calls up to then, less those closed over coffee. */
export const openFindingsAfter = (state: GameState, day: number) =>
  state.log.filter((r) => r.finding && r.day <= day && (r.closedOn === null || r.closedOn > day))
    .length;

export const summarizeRun = (state: GameState) => summarize(state.log);
