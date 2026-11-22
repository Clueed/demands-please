/** A business area, e.g. Sales & Marketing or Manufacturing. Also the requester's department. */
export type Capability = {
  id: string;
  name: string;
};

/** Who someone is, as far as their portrait goes. */
export type Gender = "female" | "male";

/** Someone who brings requests to the desk. */
export type Person = { name: string; role: string; gender: Gender };

/** An application already in the portfolio. */
export type CatalogApp = {
  id: string;
  name: string;
  capabilityId: string;
  description: string;
};

/** A document attached to a ticket. Each kind only shows up from the day a rule needs it. */
export type Attachment =
  | {
      kind: "businessCase";
      app: string;
      benefit: string;
      /** What the app is expected to save per year. */
      savings: number;
    }
  | {
      kind: "vendorSheet";
      vendor: string;
      product: string;
      /** Price per year, as quoted by the vendor. */
      price: number;
      sso: boolean;
    }
  | {
      kind: "certificate";
      vendor: string;
      standard: "ISO/IEC 27001" | "SOC 2 Type II";
      /** ISO date, e.g. "2027-03-31". */
      validUntil: string;
    }
  | {
      kind: "worksCouncil";
      app: string;
      decision: "approved" | "rejected";
      /** ISO date. */
      date: string;
    };

export type AttachmentKind = Attachment["kind"];

/** A software request ticket: "please buy us X, because Y". */
export type Demand = {
  id: string;
  /** Ticket number shown to the player, e.g. "DM-1004". */
  ticket: string;
  requester: Person;
  /** The requester's department, which is also the business area the app would serve. */
  capabilityId: string;
  app: string;
  vendor: string;
  /** What the app would cost per year. */
  cost: number;
  reason: string;
  /** Who approved the request, or null if nobody did. */
  sponsor: string | null;
  monitorsEmployees: boolean;
  /** The app the requester offers to switch off in return, or null. */
  retires: string | null;
  attachments: Attachment[];
  /** Hidden from the player: the catalog app that already covers the need, or null. */
  matchId: string | null;
};

export type Decision = { kind: "approve" } | { kind: "decline" } | { kind: "offer"; appId: string };

export type Resolution = {
  demand: Demand;
  decision: Decision;
  day: number;
  /** Game clock (minutes since midnight) when it was decided. */
  at: number;
  /** Why the decision was wrong, or null if it was right. */
  finding: string | null;
  /** The day the finding was closed over coffee with the auditor, or null while it's open. */
  closedOn: number | null;
};

export type Phase =
  /** Reading today's memo before the first visitor. */
  | "briefing"
  | "working"
  /** Everyone's seen early, with a finding open: coffee with the auditor closes one. */
  | "coffee"
  /** Day's over: the summary before the next briefing. */
  | "dayEnd"
  | "lost"
  | "won";

export type GameState = {
  phase: Phase;
  /** 1 to `LAST_DAY`. */
  day: number;
  /** Minutes since midnight, fractional while the clock runs. */
  clock: number;
  /** Today's line of visitors. The first one is at the desk. */
  queue: Demand[];
  /** Every decision this run. */
  log: Resolution[];
  findings: number;
  /** Catalog apps (by name) switched off this run, in return for an approved app. */
  retired: string[];
  /** Whether coffee with the auditor closed a finding today. */
  forgivenToday: boolean;
  /** New requests for every day, generated when the run starts. */
  days: Demand[][];
  lostTo: "audit" | "shadowIT" | null;
};
