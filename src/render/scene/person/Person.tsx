import type { ReactNode } from "react";

import type { Look } from "./look";
import {
  BEARDS,
  CUTS,
  EARRINGS,
  EYES,
  FOREARMS,
  GLASSES,
  HAIR_STYLES,
  HAND,
  HEAD,
  MOUTHS,
  NECKLACE,
  NOSES,
} from "./parts";
import { Shapes } from "./Shapes";

/** Where the head sits on the body: leaning in a little towards you. */
const HEAD_AT = "translate(-2 4)";
/** How far the visitor sinks into the chair. */
const SEATED = "translate(0 6)";

/**
 * A visitor put together from parts, seated in the chair and holding something up across
 * the desk. `badge` goes on the lanyard, `held` between the hands; both are drawn on top.
 */
export function Person({ look, badge, held }: { look: Look; badge: ReactNode; held: ReactNode }) {
  const hair = HAIR_STYLES[look.hairStyle];
  const eyes = EYES[look.eyes];
  const mouth = MOUTHS[look.mouth];
  const female = look.gender === "female";

  return (
    <g>
      <g transform={SEATED}>
        {hair.back && (
          <g transform={HEAD_AT}>
            <Shapes look={look} shapes={hair.back} />
          </g>
        )}
        <Shapes look={look} shapes={CUTS[look.cut].shapes} />
        {look.necklace && <Shapes look={look} shapes={NECKLACE} />}
        <g transform={HEAD_AT}>
          <Shapes look={look} shapes={hair.under} />
          <Shapes look={look} shapes={HEAD} />
          {look.beard && <Shapes look={look} shapes={BEARDS[look.beard]} />}
          <Shapes look={look} shapes={eyes.open} />
          {female && <Shapes look={look} shapes={[["hair.shade", eyes.lashes]]} />}
          <g className="visitor-blink">
            <Shapes look={look} shapes={eyes.blink} />
          </g>
          <Shapes look={look} shapes={[["skin.deep", NOSES[look.nose]]]} />
          <Shapes look={look} shapes={[["lip", mouth.lower], ...mouth.shapes]} />
          <Shapes look={look} shapes={hair.front} />
          {look.earrings && <Shapes look={look} shapes={EARRINGS} />}
          {look.glasses && <Shapes look={look} shapes={GLASSES[look.glasses]} />}
        </g>
        {badge}
      </g>
      <Shapes look={look} shapes={FOREARMS} />
      {held}
      <Shapes look={look} shapes={HAND} />
      {/* The far hand, higher, pushing the sheet towards you. */}
      <g transform="matrix(-1 0 0 1 148 -6)">
        <Shapes look={look} shapes={HAND} />
      </g>
    </g>
  );
}
