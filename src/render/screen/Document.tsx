import type { ReactNode } from "react";

import type { Attachment, Demand } from "@/game/types";
import { formatDate } from "@/game/time";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <>
      <dt className="office-label">{label}</dt>
      <dd>{value}</dd>
    </>
  );
}

/** An attachment, drawn as the paper it would be printed on. */
export function Document({ attachment: a, demand }: { attachment: Attachment; demand: Demand }) {
  if (a.kind === "businessCase")
    return (
      <div className="office-doc">
        <p className="office-doc-head">Business case</p>
        <dl className="office-fields">
          <Row label="App" value={<b>{a.app}</b>} />
          <Row label="Need" value={demand.reason} />
          <Row label="Benefit" value={a.benefit} />
          <Row
            label="Savings"
            value={<span className="office-number">{money(a.savings)} / year</span>}
          />
        </dl>
      </div>
    );
  if (a.kind === "vendorSheet")
    return (
      <div className="office-doc">
        <p className="office-doc-head">{a.vendor}</p>
        <p className="office-label mb-2">Product fact sheet</p>
        <dl className="office-fields">
          <Row label="Product" value={<b>{a.product}</b>} />
          <Row label="Vendor" value={a.vendor} />
          <Row
            label="Price"
            value={<span className="office-number">{money(a.price)} / year</span>}
          />
          <Row label="SSO" value={a.sso ? "Supported (SAML, OIDC)" : "Not supported"} />
        </dl>
      </div>
    );
  if (a.kind === "certificate")
    return (
      <div className="office-doc office-certificate">
        <p className="office-label">Certificate</p>
        <p className="office-doc-head">{a.standard}</p>
        <p className="office-muted">
          {a.standard === "ISO/IEC 27001"
            ? "Information security management"
            : "Independent audit of security controls"}
        </p>
        <p className="mt-2">issued to</p>
        <b>{a.vendor}</b>
        <p className="mt-2">
          Valid until <b className="office-number">{formatDate(a.validUntil)}</b>
        </p>
        <span className="office-seal" aria-hidden="true" />
      </div>
    );
  return (
    <div className="office-doc">
      <p className="office-doc-head">Works council</p>
      <p className="office-label mb-2">Decision on monitoring software</p>
      <dl className="office-fields">
        <Row label="App" value={<b>{a.app}</b>} />
        <Row label="Date" value={formatDate(a.date)} />
      </dl>
      <span className={cn("office-doc-stamp", a.decision === "rejected" && "is-wrong")}>
        {a.decision}
      </span>
    </div>
  );
}
