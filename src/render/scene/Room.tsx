import type { ReactNode } from "react";

import { FACES, rectStyle, REGIONS, roomLayout } from "../layout";
import { Placeholder } from "../Placeholder";
import { Shape } from "../Shape";
import { useFit } from "../stageFitContext";

/**
 * The player's view, sitting right at the desk: the wall, whoever sits across the desk, the desk
 * itself and the monitor on it. Drawn back to front, so later parts cover earlier ones.
 * `visitor` and `screen` are placed here and lay themselves out in their own coordinates.
 */
export function Room({ visitor, screen }: { visitor: ReactNode; screen: ReactNode }) {
  const room = roomLayout(useFit());

  return (
    <>
      <Placeholder label="wall" rect={room.wall} />
      <div className="absolute" style={rectStyle(room.visitor)}>
        {visitor}
      </div>

      <Shape label="desk" points={room.deskTop} />

      <Shape label="" points={FACES.standFoot} className="bg-neutral-600" />
      <Placeholder label="" rect={REGIONS.standNeck} className="bg-neutral-600" />
      <Shape label="" points={FACES.monitorSide} className="bg-neutral-800" />
      <Placeholder
        label="monitor"
        rect={REGIONS.monitor}
        className="items-center justify-end bg-neutral-700"
      />
      <div className="absolute overflow-hidden" style={rectStyle(REGIONS.screen)}>
        {screen}
      </div>
    </>
  );
}
