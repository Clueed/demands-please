import { Check, ChevronRight, Paperclip, X } from "lucide-react";
import type { ReactNode } from "react";

import { CATALOG, capabilityName } from "@/game/data";
import { visibleAttachments } from "@/game/rules";
import type { AttachmentKind, Demand, Resolution } from "@/game/types";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";

import { departmentColor } from "../departments";
import { control } from "../styles";
import { FILE_NAMES } from "./attachments";

/** Ticket fields that only show once a rule needs them. */
const FIELD_FROM = { monitors: 9, retires: 10 };

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="office-label">{label}</dt>
      <dd className="truncate">{children}</dd>
    </>
  );
}

function stampOf(resolution: Resolution) {
  const d = resolution.decision;
  if (d.kind === "approve") return "Approved";
  if (d.kind === "decline") return "Declined";
  return `Offered ${CATALOG.find((a) => a.id === d.appId)?.name ?? ""}`;
}

/**
 * The service desk's ticket view: one request, its fields, the files attached, and the
 * decision. Once stamped, the decision is final and "Next" calls in the next visitor.
 */
export function Ticket({
  demand,
  day,
  resolution,
  opened,
  onOpen,
  onApprove,
  onDecline,
  onNext,
}: {
  demand: Demand;
  day: number;
  resolution: Resolution | undefined;
  /** Attachments currently open in a window. */
  opened: AttachmentKind[];
  onOpen: (kind: AttachmentKind) => void;
  onApprove: () => void;
  onDecline: () => void;
  onNext: () => void;
}) {
  const files = visibleAttachments(demand, day);

  return (
    <>
      <div className="office-toolbar flex items-center justify-between">
        <span>{demand.ticket} · Software request</span>
        <span className={cn("office-status", resolution && "is-closed")}>
          {resolution ? "Resolved" : "In review"}
        </span>
      </div>
      <div className="office-ticket office-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
        <div className="office-requester">
          <span
            className="office-avatar"
            style={{ background: departmentColor(demand.capabilityId) }}
            aria-hidden="true"
          >
            {demand.requester.name.slice(0, 1)}
          </span>
          <div className="min-w-0">
            <b className="block truncate">{demand.requester.name}</b>
            <p className="office-muted truncate">{demand.requester.role}</p>
          </div>
        </div>

        <dl className="office-fields">
          <Field label="Dept.">{capabilityName(demand.capabilityId)}</Field>
          <Field label="Approver">
            {demand.sponsor ?? <span className="office-empty">none</span>}
          </Field>
          <Field label="App">
            <b>{demand.app}</b>
          </Field>
          <Field label="Vendor">{demand.vendor}</Field>
          <Field label="Cost/yr">
            <span className="office-number">{money(demand.cost)}</span>
          </Field>
          {day >= FIELD_FROM.monitors && (
            <Field label="Monitors staff">{demand.monitorsEmployees ? "Yes" : "No"}</Field>
          )}
          {day >= FIELD_FROM.retires && (
            <Field label="Retires">
              {demand.retires ?? <span className="office-empty">none</span>}
            </Field>
          )}
        </dl>

        <p className="office-justification">“{demand.reason}”</p>

        <section>
          <div className="office-label mb-1">Attachments ({files.length})</div>
          {files.length === 0 ? (
            <p className="office-empty">No files attached.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {files.map((f) => (
                <li key={f.kind}>
                  <button
                    className="office-file"
                    data-open={opened.includes(f.kind)}
                    onClick={() => onOpen(f.kind)}
                  >
                    <Paperclip aria-hidden="true" />
                    {FILE_NAMES[f.kind]}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="office-actions shrink-0 p-2">
        {resolution ? (
          <div className="flex items-center gap-2">
            <span className={cn("office-stamp flex-1 truncate", resolution.finding && "is-wrong")}>
              {stampOf(resolution)}
            </span>
            <button className={`${control} office-next`} onClick={onNext}>
              Next <ChevronRight aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button className={`${control} office-approve flex-1`} onClick={onApprove}>
              <span>
                <Check /> Approve
              </span>
            </button>
            <button className={`${control} office-decline flex-1`} onClick={onDecline}>
              <span>
                <X /> Decline
              </span>
            </button>
          </div>
        )}
        {resolution?.finding && (
          <p className="office-finding" role="alert">
            Audit finding: {resolution.finding}
          </p>
        )}
      </div>
    </>
  );
}
