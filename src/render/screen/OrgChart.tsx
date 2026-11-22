import { CAPABILITIES, DEPARTMENT_HEADS } from "@/game/data";

import { departmentColor } from "../departments";

/** At the top of the chart, so the department heads hang off someone. */
const MANAGING_DIRECTOR = { name: "Katrin Albers", title: "Managing Director" };

/**
 * The org chart, as the company directory would have it: the managing director and the head
 * of each department under her. Whoever heads the requester's department signs the request.
 */
export function OrgChart() {
  return (
    <div className="office-scroll office-page min-h-0 flex-1 overflow-y-auto p-3">
      <div className="office-card office-org-box">
        <div>
          <b className="block">{MANAGING_DIRECTOR.name}</b>
          <p className="office-muted">{MANAGING_DIRECTOR.title}</p>
        </div>
      </div>
      <ul className="office-org">
        {CAPABILITIES.map((c) => {
          const head = DEPARTMENT_HEADS[c.id];
          return (
            <li key={c.id}>
              <div className="office-card office-org-box">
                <span className="office-swatch" style={{ background: departmentColor(c.id) }} />
                <div>
                  <p className="office-label">{c.name}</p>
                  <b className="block">{head?.name}</b>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
