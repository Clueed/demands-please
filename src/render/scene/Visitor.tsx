import type { Demand } from "@/game/types";

import { VISITOR_PARTS } from "../layout";
import { Placeholder } from "../Placeholder";

/**
 * The person sitting across the desk, next to the monitor.
 * Drawn before the desk, which hides everything below its far edge.
 */
export function Visitor({ demand }: { demand: Demand | undefined }) {
  return (
    <>
      <Placeholder label="chair" rect={VISITOR_PARTS.chair} className="bg-neutral-500" />
      {demand && (
        <>
          {/* Portrait: later assembled from parts, seeded by demand.id. */}
          <Placeholder label="person" rect={VISITOR_PARTS.body} className="bg-neutral-400" />
          <Placeholder label="" rect={VISITOR_PARTS.head} className="bg-neutral-400" />
        </>
      )}
    </>
  );
}
