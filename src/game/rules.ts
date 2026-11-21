import { money } from "@/lib/format";

import { CATALOG, capabilityName, DEPARTMENT_HEADS, STRATEGY, TECH_RADAR } from "./data";
import { dayDate, formatDate } from "./time";
import type { Attachment, AttachmentKind, Decision, Demand } from "./types";

export const BUSINESS_CASE_THRESHOLD = 25_000;
/** A business case must save this many times the annual cost, to pay for the rollout too. */
export const BUSINESS_CASE_MULTIPLE = 5;

export type RuleId =
  | "sponsor"
  | "businessCase"
  | "vendorMatch"
  | "certificate"
  | "strategy"
  | "reuse"
  | "sso"
  | "techRadar"
  | "worksCouncil"
  | "retire";

export type Rule = {
  id: RuleId;
  /** The day it comes into force. */
  day: number;
  title: string;
  /** The line in the policy memo. */
  text: string;
  /**
   * Why a request breaks this rule, or null if it doesn't. Checked against the date it's
   * decided on, so an old ticket can go stale overnight. Reuse has no check: it's judged apart.
   */
  check?: (demand: Demand, today: string) => string | null;
};

/** The first attachment of a kind, typed. */
export function attachment<K extends AttachmentKind>(demand: Demand, kind: K) {
  return demand.attachments.find((a): a is Extract<Attachment, { kind: K }> => a.kind === kind);
}

export const RULES: Rule[] = [
  {
    id: "sponsor",
    day: 1,
    title: "Department head signs",
    text: "Every request needs approval from the head of the requester's department. Check the org chart.",
    check: (d) => {
      const head = DEPARTMENT_HEADS[d.capabilityId]?.name;
      if (d.sponsor === head) return null;
      return d.sponsor
        ? `${d.sponsor} can't approve for ${capabilityName(d.capabilityId)}.`
        : "Nobody approved the request.";
    },
  },
  {
    id: "businessCase",
    day: 2,
    title: "Business case",
    text: `Requests over ${money(BUSINESS_CASE_THRESHOLD)} a year need a business case that saves at least ${BUSINESS_CASE_MULTIPLE}× the annual cost.`,
    check: (d) => {
      if (d.cost <= BUSINESS_CASE_THRESHOLD) return null;
      const bc = attachment(d, "businessCase");
      if (!bc) return `Over ${money(BUSINESS_CASE_THRESHOLD)} a year without a business case.`;
      const needed = d.cost * BUSINESS_CASE_MULTIPLE;
      return bc.savings < needed
        ? `The business case saves ${money(bc.savings)} a year; it needs ${money(needed)}, ${BUSINESS_CASE_MULTIPLE}× the cost.`
        : null;
    },
  },
  {
    id: "vendorMatch",
    day: 3,
    title: "Ticket matches quote",
    text: "App, vendor and price on the ticket must match the vendor fact sheet.",
    check: (d) => {
      const sheet = attachment(d, "vendorSheet");
      if (!sheet) return "No vendor fact sheet attached.";
      if (sheet.product !== d.app) return `The fact sheet is for ${sheet.product}, not ${d.app}.`;
      if (sheet.vendor !== d.vendor)
        return `The fact sheet is from ${sheet.vendor}, not ${d.vendor}.`;
      if (sheet.price !== d.cost)
        return `The vendor quotes ${money(sheet.price)}, the ticket says ${money(d.cost)}.`;
      return null;
    },
  },
  {
    id: "certificate",
    day: 4,
    title: "Valid security certificate",
    text: "The vendor's security certificate (ISO 27001 or SOC 2) must be valid today.",
    check: (d, today) => {
      const cert = attachment(d, "certificate");
      if (!cert) return "No security certificate attached.";
      return cert.validUntil < today
        ? `The security certificate expired on ${formatDate(cert.validUntil)}.`
        : null;
    },
  },
  {
    id: "strategy",
    day: 5,
    title: "Strategic fit",
    text: "Only buy new apps in this year's focus areas. See the strategy.",
    check: (d) =>
      STRATEGY.focus.includes(d.capabilityId)
        ? null
        : `${capabilityName(d.capabilityId)} isn't a focus area this year.`,
  },
  {
    id: "reuse",
    day: 6,
    title: "Reuse first",
    text: "If an app in the catalog already does the job, offer it instead. That's allowed in any area.",
  },
  {
    id: "sso",
    day: 7,
    title: "Single sign-on",
    text: "New apps must support single sign-on (SSO). See the vendor fact sheet.",
    check: (d) =>
      attachment(d, "vendorSheet")?.sso === false
        ? `${d.app} doesn't support single sign-on.`
        : null,
  },
  {
    id: "techRadar",
    day: 8,
    title: "Tech radar",
    text: "Don't buy from vendors on hold. See the tech radar.",
    check: (d) =>
      TECH_RADAR.hold.includes(d.vendor) ? `${d.vendor} is on hold on the tech radar.` : null,
  },
  {
    id: "worksCouncil",
    day: 9,
    title: "Works council",
    text: "Apps that monitor employees need the works council's approval attached.",
    check: (d) => {
      if (!d.monitorsEmployees) return null;
      const approval = attachment(d, "worksCouncil");
      if (!approval)
        return `${d.app} monitors employees, but the works council hasn't approved it.`;
      if (approval.app !== d.app)
        return `The works council approved ${approval.app}, not ${d.app}.`;
      if (approval.decision !== "approved") return `The works council rejected ${d.app}.`;
      return null;
    },
  },
  {
    id: "retire",
    day: 10,
    title: "One in, one out",
    text: "Every new app must retire an app from the same area in the catalog.",
    check: (d) => {
      if (!d.retires) return "The ticket doesn't name an app to retire.";
      const app = CATALOG.find((a) => a.name === d.retires);
      if (!app) return `${d.retires} isn't in the catalog.`;
      if (app.capabilityId !== d.capabilityId)
        return `${d.retires} belongs to ${capabilityName(app.capabilityId)}, not ${capabilityName(d.capabilityId)}.`;
      return null;
    },
  },
];

export const rulesInForce = (day: number) => RULES.filter((r) => r.day <= day);
export const isInForce = (id: RuleId, day: number) => rulesInForce(day).some((r) => r.id === id);

/** The day each attachment kind first shows up on tickets: when the first rule needs it. */
export const ATTACHMENT_FROM: Record<AttachmentKind, number> = {
  businessCase: 2,
  vendorSheet: 3,
  certificate: 4,
  worksCouncil: 9,
};

/** Attachments the player can see on a given day. */
export const visibleAttachments = (demand: Demand, day: number) =>
  demand.attachments.filter((a) => ATTACHMENT_FROM[a.kind] <= day);

export type Verdict =
  | { kind: "offer"; appId: string }
  | { kind: "approve" }
  | { kind: "decline"; reasons: string[] };

/** The right call on a request, by the rules in force on `day`. */
export function verdict(demand: Demand, day: number): Verdict {
  if (demand.matchId && isInForce("reuse", day)) return { kind: "offer", appId: demand.matchId };
  const today = dayDate(day);
  const reasons = rulesInForce(day).flatMap((r) => r.check?.(demand, today) ?? []);
  return reasons.length ? { kind: "decline", reasons } : { kind: "approve" };
}

const appName = (id: string) => CATALOG.find((a) => a.id === id)?.name ?? id;

/** Why a decision was wrong, or null if it was right. */
export function judge(demand: Demand, decision: Decision, day: number): string | null {
  const right = verdict(demand, day);

  if (right.kind === "offer") {
    if (decision.kind === "offer" && decision.appId === right.appId) return null;
    if (decision.kind === "offer")
      return `${appName(decision.appId)} doesn't do this; ${appName(right.appId)} does.`;
    return `We already own ${appName(right.appId)}. Offer it instead.`;
  }
  if (decision.kind === "offer") return `${appName(decision.appId)} doesn't cover this need.`;
  if (right.kind === "approve")
    return decision.kind === "approve"
      ? null
      : "Nothing was wrong with it. It should have been approved.";
  return decision.kind === "decline" ? null : (right.reasons[0] ?? null);
}
