/** A business area, e.g. Sales & Marketing or Manufacturing. One catalog page per capability. */
export type Capability = {
  id: string;
  name: string;
};

/** An application already in the portfolio. Already paid for, so offering it costs nothing. */
export type CatalogApp = {
  id: string;
  name: string;
  capabilityId: string;
  description: string;
  tags: string[];
  /** What the company already pays for this app per year. */
  spend: number;
};

/** A request handed over the desk: "please buy us X, because Y". */
export type Demand = {
  id: string;
  requestedApp: string;
  reason: string;
  /** Catalog page the app joins if bought. */
  capabilityId: string;
  /** What buying the requested app would cost per year. */
  cost: number;
  /** Hidden from the player: the catalog app that fits, or null if nothing fits. */
  matchId: string | null;
};

export type Decision = { kind: "buy" } | { kind: "decline" } | { kind: "offer"; appId: string };

export type Outcome = "bought" | "matched" | "mismatched" | "declined";

export type Resolution = {
  demand: Demand;
  decision: Decision;
  outcome: Outcome;
  spent: number;
  happiness: number;
};

export type GameState = {
  /** Waiting demands. The first one is at the desk. */
  queue: Demand[];
  log: Resolution[];
  /** Apps the company owns: the starting catalog plus everything bought today. */
  portfolio: CatalogApp[];
  /** Yearly spend on the existing portfolio when the day started. */
  startingSpend: number;
  /** Total yearly spend: starting spend plus everything bought today. */
  spent: number;
  happiness: number;
};
