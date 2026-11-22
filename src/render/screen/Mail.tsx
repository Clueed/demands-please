import { useState } from "react";

import { capabilityName, STRATEGY } from "@/game/data";
import { dayDate, formatDay } from "@/game/time";
import { cn } from "@/lib/utils";

import { departmentColor } from "../departments";
import { inbox, type Mail as MailItem } from "./mail";

/** The mail app: the inbox on the left, the open email on the right. Today's mail is new. */
export function Mail({ day }: { day: number }) {
  const mails = inbox(day);
  const [openId, setOpenId] = useState<string | null>(null);
  const open = mails.find((m) => m.id === openId) ?? mails[0];

  return (
    <div className="flex min-h-0 flex-1">
      <ul className="office-scroll office-inbox min-h-0 overflow-y-auto" aria-label="Inbox">
        {mails.map((m) => (
          <li key={m.id}>
            <button
              className={cn("office-inbox-item", m.day === day && "is-new")}
              aria-current={m === open}
              onClick={() => setOpenId(m.id)}
            >
              <span className="office-muted flex justify-between gap-2">
                <span className="truncate">{m.from}</span>
                <span>{m.day === day ? "Today" : `Day ${m.day}`}</span>
              </span>
              {m.kind === "policy" ? (
                <span className="office-inbox-subject">
                  <span className="office-rule-number">{m.rule.day}</span> {m.rule.title}
                </span>
              ) : (
                <span className="office-inbox-subject">{m.subject}</span>
              )}
            </button>
          </li>
        ))}
      </ul>
      {open && <MailBody mail={open} />}
    </div>
  );
}

function MailBody({ mail }: { mail: MailItem }) {
  return (
    <article className="office-scroll office-mail min-h-0 flex-1 overflow-y-auto">
      <header className="office-mail-header">
        <b className="block">{mail.subject}</b>
        <span className="office-muted">
          From {mail.from} · {formatDay(dayDate(mail.day))}
        </span>
      </header>
      <div className="flex flex-col gap-2 p-3 pb-6">
        {mail.kind === "policy" ? (
          <>
            <p>Dear colleagues,</p>
            <p>from today, the procurement policy has a new rule:</p>
            <div className="office-rule">
              <div className="flex items-baseline gap-2">
                <span className="office-rule-number">{mail.rule.day}</span>
                <b className="flex-1">{mail.rule.title}</b>
              </div>
              <p>{mail.rule.text}</p>
            </div>
            <p>Earlier rules still apply. Their emails are further down your inbox.</p>
          </>
        ) : (
          <>
            <p>Dear colleagues,</p>
            <p>this year we only buy new apps for these focus areas:</p>
            <ul className="flex flex-col gap-2">
              {STRATEGY.focus.map((id, i) => (
                <li key={id} className="office-card">
                  <span className="office-swatch" style={{ background: departmentColor(id) }} />
                  <div>
                    <b>{capabilityName(id)}</b>
                    <p className="office-muted">{STRATEGY.goals[i]}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p>Every other area: reuse what we have.</p>
          </>
        )}
        <p className="office-muted">CIO Office</p>
      </div>
      {/* Fades out whatever runs past the bottom, so it's clear the email scrolls. */}
      <div className="office-fade" aria-hidden="true" />
    </article>
  );
}
