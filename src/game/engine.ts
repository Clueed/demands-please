import { clamp } from "@/lib/utils";

import type { CatalogApp, Decision, Demand, GameState, Outcome, Resolution } from "./types";

/** Happiness change per outcome. Money is always the demand's cost (bought) or 0. */
export const HAPPINESS: Record<Outcome, number> = {
  bought: 1,
  matched: 1,
  mismatched: -1,
  declined: -1,
};

/** Happiness is a 0–10 scale that starts in the middle. */
export const HAPPINESS_SCALE = { min: 0, max: 10, start: 5 };

const clampHappiness = (n: number) => clamp(n, HAPPINESS_SCALE.min, HAPPINESS_SCALE.max);

/** Total spend starts at what the existing portfolio already costs. */
export function newGame(demands: Demand[], catalog: CatalogApp[]): GameState {
  const startingSpend = catalog.reduce((sum, app) => sum + app.spend, 0);
  return {
    queue: [...demands],
    log: [],
    portfolio: [...catalog],
    startingSpend,
    spent: startingSpend,
    happiness: HAPPINESS_SCALE.start,
  };
}

export function currentDemand(state: GameState): Demand | undefined {
  return state.queue[0];
}

export function isOver(state: GameState): boolean {
  return state.queue.length === 0;
}

export function outcomeOf(demand: Demand, decision: Decision): Outcome {
  if (decision.kind === "buy") return "bought";
  if (decision.kind === "decline") return "declined";
  return decision.appId === demand.matchId ? "matched" : "mismatched";
}

/** Apply the player's decision to the demand at the desk and move the queue on. */
export function resolve(state: GameState, decision: Decision): GameState {
  const [demand, ...rest] = state.queue;
  if (!demand) return state;

  const outcome = outcomeOf(demand, decision);
  const happiness = clampHappiness(state.happiness + HAPPINESS[outcome]);
  const resolution: Resolution = {
    demand,
    decision,
    outcome,
    spent: outcome === "bought" ? demand.cost : 0,
    // The change actually applied, so 0 when already at the top or bottom of the scale.
    happiness: happiness - state.happiness,
  };

  return {
    ...state,
    queue: rest,
    log: [...state.log, resolution],
    portfolio: outcome === "bought" ? [...state.portfolio, toCatalogApp(demand)] : state.portfolio,
    spent: state.spent + resolution.spent,
    happiness,
  };
}

/** A bought app joins the portfolio; its price becomes its yearly spend. */
export function toCatalogApp(demand: Demand): CatalogApp {
  return {
    id: `bought-${demand.id}`,
    name: demand.requestedApp,
    capabilityId: demand.capabilityId,
    description: demand.reason,
    tags: [],
    spend: demand.cost,
  };
}

export type Summary = {
  spent: number;
  happiness: number;
  startingSpend: number;
  /** Total spend if every demand had simply been bought. */
  buyEverythingCost: number;
  matchesFound: number;
  matchesPossible: number;
};

export function summarize(state: GameState): Summary {
  const demands = state.log.map((r) => r.demand);
  return {
    spent: state.spent,
    happiness: state.happiness,
    startingSpend: state.startingSpend,
    buyEverythingCost: demands.reduce((sum, d) => sum + d.cost, state.startingSpend),
    matchesFound: state.log.filter((r) => r.outcome === "matched").length,
    matchesPossible: demands.filter((d) => d.matchId !== null).length,
  };
}
