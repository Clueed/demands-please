import {
  decide,
  FORGIVE_MINUTES,
  haveCoffee,
  newGame,
  next,
  nextDay,
  startDay,
  tick,
} from "./engine";
import { verdict } from "./rules";
import { DAY_END, DAY_START, DEMANDS_PER_DAY, FINDINGS_LIMIT } from "./time";
import type { Decision, Demand, GameState } from "./types";

/** Phases a run can be seeded into. */
export const SEED_PHASES = ["briefing", "working", "coffee", "dayEnd", "lost", "won"] as const;
export type SeedPhase = (typeof SEED_PHASES)[number];

/** Where to seed a run, for debugging. Everything is optional. */
export type SeedOptions = {
  /** The run's random seed, so the same tickets come up again. Random if left out. */
  seed?: number;
  /** The day to land on, 1 to `LAST_DAY`. */
  day?: number;
  /** Visitors already seen today. Implies the "working" phase. */
  ticket?: number;
  /** Open audit findings, from wrong calls on the tickets just before. Below the limit. */
  findings?: number;
  /**
   * Where in the day to stop. "coffee" rushes through the day to leave time for coffee with
   * the auditor (with at least one finding); "lost" makes wrong calls until the audit ends it.
   */
  phase?: SeedPhase;
  /** Game clock while working, in minutes since midnight. */
  clock?: number;
};

/** Time each ticket takes while seeding: the day ends with too little to spare for coffee. */
const MINUTES_PER_TICKET =
  Math.floor((DAY_END - DAY_START - FORGIVE_MINUTES) / DEMANDS_PER_DAY) + 1;
/** Time each ticket takes on a day seeded to end in coffee: well over an hour to spare. */
const RUSHED_MINUTES_PER_TICKET = 30;

/** The right call on a ticket, or a wrong one. */
function call(demand: Demand, game: GameState, right: boolean): Decision {
  const v = verdict(demand, game.day, game.retired);
  if (right) return v.kind === "decline" ? { kind: "decline" } : v;
  return v.kind === "approve" ? { kind: "decline" } : { kind: "approve" };
}

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(lo, Math.floor(n)), hi);

/**
 * A run played up to a given point by the engine itself, so its log, clock and findings are
 * what real play would leave. Calls are right, except the last `findings` before the stop.
 */
export function seedRun(options: SeedOptions = {}): GameState {
  const seed = options.seed ?? Math.floor(Math.random() * 2 ** 32);
  const start = newGame(seed);
  const lastDay = start.days.length;
  const phase: SeedPhase = options.phase ?? (options.ticket != null ? "working" : "briefing");
  const day = phase === "won" ? lastDay : clamp(options.day ?? 1, 1, lastDay);
  const today = start.days[day - 1] ?? [];

  const seenToday = {
    briefing: 0,
    working: clamp(options.ticket ?? 0, 0, Math.max(0, today.length - 1)),
    coffee: today.length,
    dayEnd: today.length,
    won: today.length,
    lost: clamp(options.ticket ?? 0, 0, today.length),
  }[phase];
  const before = start.days.slice(0, day - 1).reduce((n, d) => n + d.length, 0) + seenToday;
  const findings = clamp(options.findings ?? 0, phase === "coffee" ? 1 : 0, FINDINGS_LIMIT - 1);
  const wrong = phase === "lost" ? FINDINGS_LIMIT : findings;
  // "lost" carries on past the stop with wrong calls until the audit ends the run.
  const total = phase === "lost" ? Math.max(before, FINDINGS_LIMIT) : before;
  const firstWrong = total - wrong;

  let game = start;
  let made = 0;
  // Bounded, so a rule change in the engine can't hang the page.
  for (let guard = 0; made < total && guard < 10_000; guard++) {
    if (game.phase === "lost" || game.phase === "won") break;
    if (game.phase === "briefing") game = startDay(game);
    else if (game.phase === "dayEnd") game = nextDay(game);
    // Not reached with the usual pace, but if it is, have the coffee and carry on.
    else if (game.phase === "coffee") game = haveCoffee(game);
    else {
      const demand = game.queue[0];
      if (!demand) break;
      const rushed = phase === "coffee" && game.day === day;
      game = tick(game, rushed ? RUSHED_MINUTES_PER_TICKET : MINUTES_PER_TICKET);
      game = next(decide(game, call(demand, game, made < firstWrong)));
      made++;
    }
  }

  // Walk on to the phase asked for: the next briefing, or into the day.
  if (phase !== "dayEnd" && game.phase === "dayEnd") game = nextDay(game);
  if (phase === "working" && game.phase === "briefing") game = startDay(game);
  if (phase === "working" && game.phase === "working" && options.clock != null) {
    game = { ...game, clock: Math.min(Math.max(DAY_START, options.clock), DAY_END - 1) };
  }
  return game;
}

/** "13:30" or "810" as minutes since midnight. */
function parseClock(value: string): number | undefined {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value);
  const minutes = m ? Number(m[1]) * 60 + Number(m[2]) : Number(value);
  return Number.isFinite(minutes) ? minutes : undefined;
}

const toNumber = (value: string | null) => {
  if (value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

/**
 * Seed options from a URL query, e.g. `?day=4&ticket=2&findings=1`, or null if it names none.
 * Unknown values are dropped rather than refused.
 */
export function parseSeed(params: URLSearchParams): SeedOptions | null {
  const phase = params.get("phase");
  const clock = params.get("clock");
  const options: SeedOptions = {
    seed: toNumber(params.get("seed")),
    day: toNumber(params.get("day")),
    ticket: toNumber(params.get("ticket")),
    findings: toNumber(params.get("findings")),
    phase: SEED_PHASES.find((p) => p === phase),
    clock: clock ? parseClock(clock) : undefined,
  };
  const set = Object.entries(options).filter(([, v]) => v !== undefined);
  return set.length > 0 ? (Object.fromEntries(set) as SeedOptions) : null;
}
