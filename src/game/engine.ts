import { generateDays } from "./generate";
import { judge } from "./rules";
import {
  BACKLOG_LIMIT,
  DAY_END,
  DAY_START,
  LAST_DAY,
  MAX_MISTAKES,
  PUSH_MINUTES,
  SLOT_MINUTES,
} from "./time";
import type { Decision, Demand, GameState, Resolution } from "./types";

/**
 * Finishing this far ahead of schedule, with a mistake on record, takes the mistake back.
 * Once a day at most: otherwise rushing through blind would clear every mistake it makes.
 */
export const FORGIVE_MINUTES = 60;

/** A run, waiting at the first morning's briefing. */
export function newGame(seed: number, days: Demand[][] = generateDays(seed)): GameState {
  return {
    phase: "briefing",
    day: 1,
    clock: DAY_START,
    deadline: DAY_START + SLOT_MINUTES,
    queue: days[0] ?? [],
    backlog: [],
    log: [],
    mistakes: 0,
    forgivenAt: null,
    days,
    firedFor: null,
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

/** Stamp the request at the desk. It stays there until "next" or its time runs out. */
export function decide(state: GameState, decision: Decision): GameState {
  const demand = currentDemand(state);
  if (!demand || currentResolution(state)) return state;

  const citation = judge(demand, decision, state.day);
  const resolution: Resolution = { demand, decision, day: state.day, at: state.clock, citation };
  const mistakes = state.mistakes + (citation ? 1 : 0);
  return {
    ...state,
    log: [...state.log, resolution],
    mistakes,
    ...(mistakes > MAX_MISTAKES && { phase: "fired", firedFor: "mistakes" }),
  };
}

/**
 * Send the visitor off and call in the next one. Their appointment keeps its slot, so time
 * saved now carries over. Saving a whole hour with a mistake on record takes the mistake
 * back instead, once a day; the hour is spent on it.
 */
export function next(state: GameState): GameState {
  const resolution = currentResolution(state);
  if (!resolution) return state;
  // Only a mistake made before this ticket; else a quick wrong guess would cancel itself.
  const earlier = state.mistakes - (resolution.citation ? 1 : 0);
  const forgive =
    earlier > 0 && state.forgivenAt === null && state.deadline - state.clock >= FORGIVE_MINUTES;
  return advance({
    ...state,
    queue: state.queue.slice(1),
    deadline: state.deadline + SLOT_MINUTES - (forgive ? FORGIVE_MINUTES : 0),
    mistakes: state.mistakes - (forgive ? 1 : 0),
    forgivenAt: forgive ? state.clock : state.forgivenAt,
  });
}

/** Give the visitor more time; every appointment after theirs moves back too. */
export function push(state: GameState): GameState {
  if (!currentDemand(state)) return state;
  return { ...state, deadline: state.deadline + PUSH_MINUTES };
}

/** Run the clock forward. */
export function tick(state: GameState, minutes: number): GameState {
  if (state.phase !== "working") return state;
  return advance({ ...state, clock: Math.min(DAY_END, state.clock + minutes) });
}

/**
 * Settle the clock: anyone whose time is up leaves, undecided ones into the backlog, and the
 * day ends at closing time or once nobody's waiting.
 */
function advance(state: GameState): GameState {
  let s = state;
  while (s.queue.length > 0 && s.clock >= s.deadline && s.clock < DAY_END) {
    const [demand, ...rest] = s.queue;
    s = {
      ...s,
      queue: rest,
      backlog: currentResolution(s) || !demand ? s.backlog : [...s.backlog, demand],
      deadline: s.deadline + SLOT_MINUTES,
    };
  }
  if (s.queue.length > 0 && s.clock < DAY_END) return s;
  return endDay(s);
}

function endDay(state: GameState): GameState {
  const [first, ...rest] = state.queue;
  const leftover = first && !currentResolution(state) ? state.queue : rest;
  const backlog = [...state.backlog, ...leftover];
  const fired = backlog.length > BACKLOG_LIMIT;
  return {
    ...state,
    queue: [],
    backlog,
    phase: fired ? "fired" : state.day === LAST_DAY ? "won" : "dayEnd",
    firedFor: fired ? "backlog" : null,
  };
}

/** Next morning: yesterday's backlog comes first, then today's new requests. */
export function nextDay(state: GameState): GameState {
  if (state.phase !== "dayEnd") return state;
  const day = state.day + 1;
  return {
    ...state,
    phase: "briefing",
    day,
    clock: DAY_START,
    deadline: DAY_START + SLOT_MINUTES,
    queue: [...state.backlog, ...(state.days[day - 1] ?? [])],
    backlog: [],
    forgivenAt: null,
  };
}

/**
 * Where everyone still waiting is in the calendar. The one at the desk runs until the
 * deadline, the rest follow an hour each. Anyone starting after closing time won't be seen.
 */
export function schedule(state: GameState) {
  return state.queue.map((demand, i) => {
    const start =
      i === 0
        ? Math.min(state.clock, state.deadline - SLOT_MINUTES)
        : state.deadline + (i - 1) * SLOT_MINUTES;
    const end = i === 0 ? state.deadline : start + SLOT_MINUTES;
    return { demand, start, end, atDesk: i === 0, afterHours: start >= DAY_END };
  });
}

export type DaySummary = { decided: number; mistakes: number; backlog: number };

export function summarizeDay(state: GameState): DaySummary {
  const today = state.log.filter((r) => r.day === state.day);
  return {
    decided: today.length,
    mistakes: today.filter((r) => r.citation).length,
    backlog: state.backlog.length,
  };
}

/** Skip straight to a day's briefing with a clean record, for playtesting. */
export function jumpToDay(state: GameState, day: number): GameState {
  const d = Math.min(Math.max(1, Math.floor(day)), state.days.length);
  return { ...state, day: d, queue: state.days[d - 1] ?? [] };
}
