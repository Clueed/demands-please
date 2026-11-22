import type { Demand } from "@/game/types";
import { money } from "@/lib/format";

import { departmentColor } from "../departments";
import { lookFor } from "./person/look";
import { Person } from "./person/Person";
import { Px } from "./Px";

/** The visitor's chair: a high fabric back, the top showing over their shoulders. */
function Chair() {
  return (
    <>
      <Px d="M18 116h112v4h4v4h2v190H12V124h2v-4h4Z" fill="#3e3a35" />
      <Px d="M20 120h108v2h4v192H16V122h4Z" fill="#544f47" />
      <Px d="M20 118h108v2H20Zm-4 4h4v2h-4Zm112 0h4v2h-4Z" fill="#6a645a" />
      <Px d="M124 124h6v190h-6Z" fill="#5d574e" />
      <Px d="M24 134h96v2H24Zm0 14h96v2H24Zm0 14h96v2H24Z" fill="#5d574e" />
    </>
  );
}

/**
 * Whoever is at the desk, seated across from you with a printout. Drawn on a 148×314 grid;
 * the bottom 300 rows sit above the desk's far edge. Each person is put together from parts
 * (see `person/`), seeded by their name, so they look the same every time they come back.
 */
export function Visitor({ demand, ticket }: { demand: Demand | undefined; ticket: string }) {
  const stripe = departmentColor(demand?.capabilityId);

  return (
    <svg
      viewBox="0 14 148 300"
      className="size-full"
      shapeRendering="crispEdges"
      role="img"
      aria-label={
        demand
          ? `${demand.requester.name}, ${demand.requester.role}, holding a printout`
          : "Empty office chair"
      }
    >
      <Chair />
      {demand && (
        // Keyed by the ticket, so each new visitor walks up and sits down.
        <g key={demand.id}>
          <g className="visitor-arrive">
            <Person
              look={lookFor(demand.requester)}
              badge={
                <>
                  {/* Lanyard and badge, striped in the department's colour */}
                  <Px d="M52 160l14 50h16l14-50h-4l-12 46h-12l-12-46Z" fill={stripe} />
                  <Px d="M62 208h24v32H62Z" fill="#3a3530" />
                  <Px d="M64 210h20v28H64Z" fill="#e5e1cb" />
                  <Px d="M64 210h20v6H64Z" fill={stripe} />
                  <Px d="M66 218h8v10h-8Z" fill="#9aa69a" />
                  <Px d="M68 220h4v4h-4Z" fill="#c8a487" />
                  <Px d="M76 218h6v2h-6Zm0 4h6v2h-6Z" fill="#7a877c" />
                  <text x="74" y="236" textAnchor="middle" fontSize="5" fill="#2b3f39">
                    {demand.requester.name.split(" ").at(-1)?.toUpperCase()}
                  </text>
                </>
              }
              held={
                <>
                  {/* The printout, held up for you */}
                  <Px d="M44 270h60v44H44Z" fill="#3a3530" />
                  <Px d="M46 272h56v42H46Z" fill="#efe9d2" />
                  <Px d="M48 274h52v8H48Z" fill={stripe} />
                  <text x="50" y="281" fontSize="6" fill="#efe9d2">
                    {ticket}
                  </text>
                  <Px d="M48 286h24v12H48Z" fill="#c9cfbf" />
                  <Px d="M50 296l6-6 4 4 4-4 6 6Z" fill="#8e9f96" />
                  <Px
                    d="M76 286h22v2H76Zm0 4h20v2H76Zm0 4h22v2H76Zm-28 6h50v2H48Zm0 4h44v2H48Z"
                    fill="#9a9a86"
                  />
                </>
              }
            />
          </g>

          {/* The pitch, once they've sat down, before you've said a word */}
          <g transform="translate(-14 8)" className="visitor-pitch">
            <Px d="M38 18h104v2h2v20h-2v2H88l-14 18V42H38v-2h-2V20h2Z" fill="#2f3c3a" />
            <Px d="M38 20h104v20H86l-10 14V40H38Z" fill="#d8d7c3" />
            <text x="90" y="33" textAnchor="middle" fontSize="8" fill="#2b3f39">
              Only {money(demand.cost)} a year!
            </text>
          </g>
        </g>
      )}
    </svg>
  );
}
