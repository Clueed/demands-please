import type { Capability, CatalogApp } from "./types.ts";

export const CAPABILITIES: Capability[] = [
  { id: "sales-marketing", name: "Sales & Marketing" },
  { id: "finance", name: "Finance" },
  { id: "hr", name: "HR" },
  { id: "manufacturing", name: "Manufacturing" },
];

export const capabilityName = (id: string) => CAPABILITIES.find((c) => c.id === id)?.name ?? id;

/** The org chart: whose signature counts for each department. */
export const DEPARTMENT_HEADS: Record<string, { name: string; title: string }> = {
  "sales-marketing": { name: "Julia Weber", title: "Head of Sales & Marketing" },
  finance: { name: "Martin Krause", title: "Head of Finance" },
  hr: { name: "Sabine Roth", title: "Head of HR" },
  manufacturing: { name: "Dirk Lehmann", title: "Head of Manufacturing" },
};

/** People who bring requests to the desk. None of them can approve their own. */
export const STAFF: Record<string, { name: string; role: string }[]> = {
  "sales-marketing": [
    { name: "Stefan Kühn", role: "Marketing Lead" },
    { name: "Marco Rossi", role: "Sales Manager" },
    { name: "Noah Becker", role: "Social Media Manager" },
  ],
  finance: [
    { name: "Tomasz Nowak", role: "Finance Controller" },
    { name: "Clara Wendt", role: "Procurement Analyst" },
    { name: "Ines Haas", role: "Accountant" },
  ],
  hr: [
    { name: "Aylin Demir", role: "HR Business Partner" },
    { name: "Felix Hahn", role: "Team Lead, Support" },
    { name: "Mira Schulz", role: "Recruiter" },
  ],
  manufacturing: [
    { name: "Lena Brandt", role: "Design Engineer" },
    { name: "Jens Vogel", role: "Maintenance Lead" },
    { name: "Petra Lange", role: "Quality Manager" },
  ],
};

/** This year's IT strategy: the only areas where new apps get bought. */
export const STRATEGY = {
  focus: ["sales-marketing", "manufacturing"],
  goals: ["Win more customers online", "Modernise the shop floor"],
};

/** The tech radar. Vendors on hold are not bought from any more. */
export const TECH_RADAR = {
  adopt: ["Northwind Software", "Brightline Apps", "Tessel GmbH"],
  hold: ["Monolith Systems", "DataHoard Inc.", "LockStep Software AG", "Legacy Logic Ltd"],
};

/** A request for an app nobody has asked for yet. */
export const MADE_UP_APPS = ["FaxMaster 2000", "OldBooks Classic", "PaperTrail Desk"];

/** The apps the company already owns. */
export const CATALOG: CatalogApp[] = [
  // Sales & Marketing
  {
    id: "pipetrack",
    name: "PipeTrack CRM",
    capabilityId: "sales-marketing",
    description: "Tracks customers, contacts and every call or meeting with them.",
  },
  {
    id: "campaign-hub",
    name: "Campaign Hub",
    capabilityId: "sales-marketing",
    description: "Sends email campaigns and newsletters to customer lists.",
  },
  {
    id: "social-scheduler",
    name: "Social Scheduler",
    capabilityId: "sales-marketing",
    description: "Plans and publishes posts across social media channels.",
  },
  // Finance
  {
    id: "ledgerone",
    name: "LedgerOne",
    capabilityId: "finance",
    description: "Company bookkeeping: invoices, payments and accounts.",
  },
  {
    id: "spendly",
    name: "Spendly",
    capabilityId: "finance",
    description: "Employees photograph receipts on their phone and get reimbursed.",
  },
  {
    id: "budgetboard",
    name: "BudgetBoard",
    capabilityId: "finance",
    description: "Department budgets, forecasts and monthly reports.",
  },
  // HR
  {
    id: "peoplebase",
    name: "PeopleBase",
    capabilityId: "hr",
    description: "Employee records and the company org chart.",
  },
  {
    id: "hire-funnel",
    name: "Hire Funnel",
    capabilityId: "hr",
    description: "Publishes job ads and tracks applicants through interviews.",
  },
  {
    id: "timeoff-tracker",
    name: "TimeOff Tracker",
    capabilityId: "hr",
    description: "Vacation requests, sick days and a team absence calendar.",
  },
  // Manufacturing
  {
    id: "lineview",
    name: "LineView MES",
    capabilityId: "manufacturing",
    description: "Plans production orders and shows shop floor status live.",
  },
  {
    id: "partskeeper",
    name: "PartsKeeper",
    capabilityId: "manufacturing",
    description: "Inventory of spare parts with stock levels and storage locations.",
  },
  {
    id: "qualitycheck",
    name: "QualityCheck",
    capabilityId: "manufacturing",
    description: "Digital inspection checklists and defect tracking.",
  },
];

/** A kind of request people make. The generator turns these into tickets. */
export type Archetype = {
  app: string;
  vendor: string;
  capabilityId: string;
  reason: string;
  benefit: string;
  /** Typical price per year; each ticket varies it a little. */
  cost: number;
  monitorsEmployees: boolean;
  /** The catalog app that already does this, or null. */
  matchId: string | null;
};

export const ARCHETYPES: Archetype[] = [
  // Already covered by the catalog: the right answer is to offer what we have.
  {
    app: "MailBlast Pro",
    vendor: "MailBlast Ltd",
    capabilityId: "sales-marketing",
    reason: "We want to send a monthly newsletter to all our customers.",
    benefit: "Keeps customers coming back.",
    cost: 12_000,
    monitorsEmployees: false,
    matchId: "campaign-hub",
  },
  {
    app: "LeadMagnet CRM",
    vendor: "LeadMagnet GmbH",
    capabilityId: "sales-marketing",
    reason: "Sales reps keep losing track of which customers they already called.",
    benefit: "No more double calls to the same customer.",
    cost: 26_000,
    monitorsEmployees: false,
    matchId: "pipetrack",
  },
  {
    app: "Instaplanner",
    vendor: "Instaplanner Inc.",
    capabilityId: "sales-marketing",
    reason: "Marketing wants to plan our Instagram and LinkedIn posts ahead.",
    benefit: "A steady stream of posts without weekend work.",
    cost: 6_000,
    monitorsEmployees: false,
    matchId: "social-scheduler",
  },
  {
    app: "ExpenseSnap",
    vendor: "Snap Finance AB",
    capabilityId: "finance",
    reason: "Our field staff need to hand in receipts from their phones.",
    benefit: "Receipts arrive in days instead of weeks.",
    cost: 8_000,
    monitorsEmployees: false,
    matchId: "spendly",
  },
  {
    app: "ForecastPro",
    vendor: "Brightline Apps",
    capabilityId: "finance",
    reason: "Department heads want to see their budget against actual spend.",
    benefit: "Overspending shows up before the quarter ends.",
    cost: 15_000,
    monitorsEmployees: false,
    matchId: "budgetboard",
  },
  {
    app: "RecruitRocket",
    vendor: "Rocket HR Ltd",
    capabilityId: "hr",
    reason: "We have 15 open positions and track applicants in spreadsheets.",
    benefit: "Hires in weeks, not months.",
    cost: 20_000,
    monitorsEmployees: false,
    matchId: "hire-funnel",
  },
  {
    app: "VacayPlanner",
    vendor: "Vacay Software",
    capabilityId: "hr",
    reason: "Team leads want to see who is on holiday next month.",
    benefit: "No more understaffed weeks.",
    cost: 5_000,
    monitorsEmployees: false,
    matchId: "timeoff-tracker",
  },
  {
    app: "Org Chartify",
    vendor: "Tessel GmbH",
    capabilityId: "hr",
    reason: "Nobody knows who reports to whom since the reorganisation.",
    benefit: "New hires find the right people on day one.",
    cost: 9_000,
    monitorsEmployees: false,
    matchId: "peoplebase",
  },
  {
    app: "StockSense",
    vendor: "Northwind Software",
    capabilityId: "manufacturing",
    reason: "Maintenance can't find spare parts and keeps reordering them.",
    benefit: "Fewer rush orders for parts we already have.",
    cost: 15_000,
    monitorsEmployees: false,
    matchId: "partskeeper",
  },
  {
    app: "DefectLens",
    vendor: "DefectLens AG",
    capabilityId: "manufacturing",
    reason: "The quality team still writes inspection results on paper.",
    benefit: "Defects traced back to their batch in minutes.",
    cost: 18_000,
    monitorsEmployees: false,
    matchId: "qualitycheck",
  },
  {
    app: "FloorBoard",
    vendor: "Floorboard Systems",
    capabilityId: "manufacturing",
    reason: "Shift leads want a live view of which orders run on which line.",
    benefit: "Line stoppages spotted right away.",
    cost: 40_000,
    monitorsEmployees: false,
    matchId: "lineview",
  },

  // Genuinely new needs.
  {
    app: "PriceWise",
    vendor: "PriceWise Ltd",
    capabilityId: "sales-marketing",
    reason: "Quotes for customers take three days because prices live in Excel.",
    benefit: "Quotes go out the same day.",
    cost: 32_000,
    monitorsEmployees: false,
    matchId: null,
  },
  {
    app: "WebinarDeck",
    vendor: "Brightline Apps",
    capabilityId: "sales-marketing",
    reason: "Marketing wants to run product webinars for up to 500 people.",
    benefit: "Reaches customers we can't visit in person.",
    cost: 9_000,
    monitorsEmployees: false,
    matchId: null,
  },
  {
    app: "ShopFront",
    vendor: "Northwind Software",
    capabilityId: "sales-marketing",
    reason: "Customers want to reorder spare parts online instead of by phone.",
    benefit: "New online sales channel.",
    cost: 45_000,
    monitorsEmployees: false,
    matchId: null,
  },
  {
    app: "CallCoach",
    vendor: "CallCoach GmbH",
    capabilityId: "sales-marketing",
    reason: "We want to record sales calls and score each rep's pitch.",
    benefit: "New reps learn from the best calls.",
    cost: 22_000,
    monitorsEmployees: true,
    matchId: null,
  },
  {
    app: "RouteRep",
    vendor: "Tessel GmbH",
    capabilityId: "sales-marketing",
    reason: "Sales wants to see on a map where field reps are during the day.",
    benefit: "Shorter routes, more visits per day.",
    cost: 14_000,
    monitorsEmployees: true,
    matchId: null,
  },
  {
    app: "3D Print Studio",
    vendor: "Layerworks BV",
    capabilityId: "manufacturing",
    reason: "Engineering wants to design and print prototype parts in-house.",
    benefit: "Prototypes in days instead of weeks.",
    cost: 30_000,
    monitorsEmployees: false,
    matchId: null,
  },
  {
    app: "MaintainIQ",
    vendor: "Northwind Software",
    capabilityId: "manufacturing",
    reason: "Machines break down without warning and stop the whole line.",
    benefit: "Repairs planned before machines fail.",
    cost: 38_000,
    monitorsEmployees: false,
    matchId: null,
  },
  {
    app: "EnergyMeter",
    vendor: "Voltaic Labs",
    capabilityId: "manufacturing",
    reason: "Our power bill doubled and nobody knows which machines use the most.",
    benefit: "Cuts the energy bill.",
    cost: 11_000,
    monitorsEmployees: false,
    matchId: null,
  },
  {
    app: "ShiftPlanner",
    vendor: "Brightline Apps",
    capabilityId: "manufacturing",
    reason: "Shift plans are on a whiteboard and workers clock in on paper.",
    benefit: "Every shift fully staffed.",
    cost: 16_000,
    monitorsEmployees: true,
    matchId: null,
  },
  {
    app: "LabelForge",
    vendor: "Tessel GmbH",
    capabilityId: "manufacturing",
    reason: "Shipping labels are typed by hand and parcels get lost.",
    benefit: "No more parcels sent to the wrong address.",
    cost: 7_000,
    monitorsEmployees: false,
    matchId: null,
  },
  {
    app: "ContractAI",
    vendor: "Lexa Analytics",
    capabilityId: "finance",
    reason: "Legal wants supplier contracts reviewed automatically.",
    benefit: "Risky contract clauses caught before signing.",
    cost: 40_000,
    monitorsEmployees: false,
    matchId: null,
  },
  {
    app: "TaxRadar",
    vendor: "Fiskal Software",
    capabilityId: "finance",
    reason: "We now sell in nine countries and VAT rules keep changing.",
    benefit: "No more late VAT filings.",
    cost: 13_000,
    monitorsEmployees: false,
    matchId: null,
  },
  {
    app: "TreasuryOne",
    vendor: "Northwind Software",
    capabilityId: "finance",
    reason: "Our cash sits in six banks and we check each one by hand.",
    benefit: "Cash position at a glance every morning.",
    cost: 28_000,
    monitorsEmployees: false,
    matchId: null,
  },
  {
    app: "LearnLoop",
    vendor: "LearnLoop Ltd",
    capabilityId: "hr",
    reason: "Safety training is still done with printed slides.",
    benefit: "Training tracked for every employee.",
    cost: 12_000,
    monitorsEmployees: false,
    matchId: null,
  },
  {
    app: "MoodPulse",
    vendor: "Pulse Analytics",
    capabilityId: "hr",
    reason: "We want to measure team mood from chat activity every week.",
    benefit: "Spot burnout before people quit.",
    cost: 10_000,
    monitorsEmployees: true,
    matchId: null,
  },
  {
    app: "BenefitsHub",
    vendor: "Brightline Apps",
    capabilityId: "hr",
    reason: "Employees email HR to ask about bike leasing and pension plans.",
    benefit: "Fewer emails to HR.",
    cost: 8_000,
    monitorsEmployees: false,
    matchId: null,
  },
];
