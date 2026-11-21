import { ChevronRight } from "lucide-react";
import { useState } from "react";

import { CAPABILITIES, capabilityName, DEPARTMENT_HEADS, STRATEGY, TECH_RADAR } from "@/game/data";
import { activeCatalog, rulesInForce } from "@/game/rules";
import { cn } from "@/lib/utils";

import { departmentColor } from "../departments";
import { AppIcon } from "./AppIcon";

/** Rulebook tabs and the day each one is first needed. */
const TABS = [
  { id: "rules", label: "Rules", from: 1 },
  { id: "org", label: "Org", from: 1 },
  { id: "strategy", label: "Strategy", from: 5 },
  { id: "catalog", label: "Catalog", from: 6 },
  { id: "radar", label: "Radar", from: 8 },
] as const;

type TabId = (typeof TABS)[number]["id"];

/** The policy binder: today's rules and the reference pages they point to. */
export function Rulebook({
  day,
  retired,
  canOffer,
  onOffer,
}: {
  day: number;
  /** Catalog apps switched off this run: gone from the catalog. */
  retired: readonly string[];
  /** Whether there's an undecided request to offer an app for. */
  canOffer: boolean;
  onOffer: (appId: string) => void;
}) {
  const [tab, setTab] = useState<TabId>("rules");
  const rules = rulesInForce(day);

  return (
    <>
      <div className="office-categories" role="tablist" aria-label="Rulebook sections">
        {TABS.filter((t) => t.from <= day).map((t) => (
          <button
            key={t.id}
            role="tab"
            className={cn("office-category", t.from === day && t.id !== "rules" && "is-new")}
            aria-selected={t.id === tab}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="office-scroll office-rulebook min-h-0 flex-1 overflow-y-auto p-3">
        {tab === "rules" && (
          <ol className="flex flex-col gap-2">
            {rules.map((r) => (
              <li key={r.id} className={cn("office-rule", r.day === day && "is-new")}>
                <div className="flex items-baseline gap-2">
                  <span className="office-rule-number">{r.day}</span>
                  <b className="flex-1">{r.title}</b>
                  {r.day === day && <span className="office-new">New</span>}
                </div>
                <p>{r.text}</p>
              </li>
            ))}
          </ol>
        )}

        {tab === "org" && (
          <>
            <p className="office-label mb-2">Department heads</p>
            <ul className="flex flex-col gap-2">
              {CAPABILITIES.map((c) => (
                <li key={c.id} className="office-card">
                  <span className="office-swatch" style={{ background: departmentColor(c.id) }} />
                  <div>
                    <b>{DEPARTMENT_HEADS[c.id]?.name}</b>
                    <p className="office-muted">{DEPARTMENT_HEADS[c.id]?.title}</p>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {tab === "strategy" && (
          <>
            <p className="office-label mb-2">IT strategy 2026</p>
            <p className="mb-3">New apps are only bought for these focus areas:</p>
            <ul className="mb-3 flex flex-col gap-2">
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
            <p className="office-muted">Every other area: reuse what we have.</p>
          </>
        )}

        {tab === "catalog" &&
          CAPABILITIES.map((c) => (
            <section key={c.id} className="mb-3">
              <p className="office-label">{c.name}</p>
              <ul>
                {activeCatalog(retired)
                  .filter((a) => a.capabilityId === c.id)
                  .map((app) => (
                    <li key={app.id} className="office-app-card">
                      <b className="flex items-center gap-2">
                        <AppIcon name={app.name} />
                        {app.name}
                      </b>
                      <p className="office-desc">{app.description}</p>
                      <button
                        className="office-offer"
                        disabled={!canOffer}
                        onClick={() => onOffer(app.id)}
                      >
                        Offer instead
                        <ChevronRight />
                      </button>
                    </li>
                  ))}
              </ul>
            </section>
          ))}

        {tab === "radar" && (
          <>
            <p className="office-label mb-1">Hold: don't buy</p>
            <ul className="office-radar is-hold mb-3">
              {TECH_RADAR.hold.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
            <p className="office-label mb-1">Adopt</p>
            <ul className="office-radar">
              {TECH_RADAR.adopt.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
