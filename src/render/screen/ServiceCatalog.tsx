import { useRef } from "react";

import { CAPABILITIES } from "@/game/data";
import { activeCatalog } from "@/game/rules";

import { departmentColor } from "../departments";
import { AppIcon } from "./AppIcon";

/**
 * The service catalog, in the service desk tool: the apps the company already runs, by
 * department. Offering one decides the request at the desk.
 */
export function ServiceCatalog({
  retired,
  canOffer,
  onOffer,
}: {
  /** Catalog apps switched off this run: gone from the catalog. */
  retired: readonly string[];
  /** Whether there's an undecided request to offer an app for. */
  canOffer: boolean;
  onOffer: (appId: string) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  /**
   * Scrolls the catalog so a department's heading sits at the top. Not `scrollIntoView`: that
   * moves the stage too. The scroller is the sections' offset parent.
   */
  const jumpTo = (capabilityId: string) => {
    const section = scroller.current?.querySelector<HTMLElement>(
      `[data-department="${capabilityId}"]`,
    );
    if (section) scroller.current!.scrollTop = section.offsetTop;
  };

  return (
    <>
      <div className="office-catalog-bar">
        <div className="flex flex-wrap gap-1" aria-label="Jump to a department">
          {CAPABILITIES.map((c) => (
            <button key={c.id} className="office-jump" onClick={() => jumpTo(c.id)}>
              <span className="office-swatch" style={{ background: departmentColor(c.id) }} />
              {c.name}
            </button>
          ))}
        </div>
        <p className="office-muted">
          {canOffer
            ? "Offer instead decides the request, like Approve or Decline."
            : "No request in review. Offers open again with the next one."}
        </p>
      </div>
      <div
        ref={scroller}
        className="office-scroll office-page office-catalog relative min-h-0 flex-1 overflow-y-auto p-3"
      >
        {CAPABILITIES.map((c) => (
          <section key={c.id} data-department={c.id} className="mb-3">
            <h3 className="office-catalog-heading">{c.name}</h3>
            <ul>
              {activeCatalog(retired)
                .filter((a) => a.capabilityId === c.id)
                .map((app) => (
                  <li
                    key={app.id}
                    className="office-app-card"
                    style={{ borderLeftColor: departmentColor(c.id) }}
                  >
                    <div className="flex items-center gap-2">
                      <AppIcon name={app.name} />
                      <b className="flex-1">{app.name}</b>
                      <button
                        className="office-control office-offer"
                        aria-label={`Offer ${app.name} instead`}
                        disabled={!canOffer}
                        onClick={() => onOffer(app.id)}
                      >
                        Offer instead
                      </button>
                    </div>
                    <p className="office-desc">{app.description}</p>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
