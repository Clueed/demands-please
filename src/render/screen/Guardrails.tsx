import { TECH_RADAR } from "@/game/data";

/** The enterprise architecture guardrails: the architects' tech radar. */
export function Guardrails() {
  return (
    <div className="office-scroll office-page min-h-0 flex-1 overflow-y-auto p-3">
      <p className="office-label mb-2">Tech radar</p>
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
    </div>
  );
}
