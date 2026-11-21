import type { Demand } from "@/game/types";

import { departmentColor } from "../departments";
import { money } from "../format";
import { Px } from "./Px";

const FONT = "'Office Pixel', 'Geist Variable', monospace";

/**
 * One fixed portrait for the art-direction draft: a hopeful employee leaning in with a
 * printout. Drawn on a 148×314 grid; the bottom 300 rows sit above the desk's far edge.
 * Every shape is snapped to the shared art grid, so it matches the props on the desk.
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
      {/* Chair */}
      <Px d="M8 140h132v4h4v170H4V144h4Z" fill="#3e3a35" />
      <Px d="M10 142h128v2H10Z" fill="#6a645a" />
      <Px d="M12 148h124v166H12Z" fill="#544f47" />
      <Px d="M16 152h116v2H16Zm0 12h116v2H16Zm0 12h116v2H16Z" fill="#5d574e" />
      {demand && (
        <g>
          {/* Jacket, lit from the window on the right. */}
          <Px d="M48 146h50l28 16 12 46 4 106H6l4-106 14-46Z" fill="#2f4442" />
          <Px d="M46 150h52l24 18 8 90-6 56H24l-6-56 10-90Z" fill="#5f7a72" />
          <Px d="M48 152h18v162H28l-4-110 8-34Z" fill="#536d68" />
          <Px d="M90 152h12l18 18 10 88-6 56H90Z" fill="#6e8a7f" />
          {/* Lapels and a fold where the jacket creases at the waist */}
          <Px d="M38 156h4l22 72h-4Zm72 0h-4l-22 72h4Z" fill="#3c5551" />
          <Px d="M42 156h4l20 66h-2Zm64 0h-4l-20 66h2Z" fill="#7a958a" />
          <Px d="M36 262h14v2H36Zm62 6h14v2H98Z" fill="#4a635d" />
          {/* Folds at the armpits and the elbows, so the forearms read */}
          <Px d="M26 196h6v2h-2v10h-4Zm96 0h-6v2h2v10h4Z" fill="#3c5551" />
          <Px d="M22 238h8v2h-6v6h-2Zm104 0h-8v2h6v6h2Z" fill="#3c5551" />
          {/* Neck and collar */}
          <Px d="M58 128h32v32l-16 16-16-16Z" fill="#b58a72" />
          <Px d="M58 130h32v14H66Z" fill="#946f5c" />
          <Px d="M48 150l10-6 16 26-16 16-16-26Zm44-6 10 10-10 28-18-12Z" fill="#c9cfbf" />
          <Px d="M56 146l18 24-2 4-18-24Zm36-2 2 4-20 24-2-4Z" fill="#9ea89a" />

          {/* Head and face, leaning in a little towards you. */}
          <g transform="translate(-2 4)">
            <Px d="M38 98h8v18h-8Zm58 0h8v18h-8Z" fill="#3a3530" />
            <Px d="M44 80h54v56l-16 12H60l-16-12Z" fill="#3a3530" />
            <Px d="M40 100h6v14h-6Z" fill="#aa8670" />
            <Px d="M96 100h6v14h-6Z" fill="#c39f84" />
            <Px d="M42 104h2v6h-2Z" fill="#90694f" />
            <Px d="M98 104h2v6h-2Z" fill="#a37a62" />
            <Px d="M46 82h50v54l-14 10H60l-14-10Z" fill="#c8a487" />
            {/* Light from the window on the right: form shadow down the left and jaw. */}
            <Px d="M46 90h4v36h2v8l10 8h18v2H60l-14-10Z" fill="#b58f74" />
            {/* Hair, and the shade it casts on the forehead */}
            <Px d="M42 98h8V86h12v-6h30v6h4v14h4V76h-6v-8H56v4H42Z" fill="#42413a" />
            <Px d="M50 76h12v-4h28v4H66v6H50Z" fill="#5d594b" />
            <Px d="M92 70h6v6h-6Z" fill="#33322d" />
            <Px d="M50 86h12v2H50Zm12-6h30v2H62Zm30 6h4v2h-4Z" fill="#b58f74" />
            {/* Brows: the near one level, the far one cocked high */}
            <Px
              d="M52 98h6v2h-6Zm6-2h6v2h-6Zm22-4h4v2h-4Zm4-2h6v2h-6Zm6 2h4v2h-4Z"
              fill="#4a3f36"
            />
            {/* Eyes: a hopeful half-squint on the near side, wide open on the far side */}
            <Px d="M54 104h8v4h-8Zm26-2h8v6h-8Z" fill="#f1ecd9" />
            <Px d="M54 102h8v2h-8Z" fill="#aa8670" />
            <Px d="M56 104h4v4h-4Zm26-2h4v6h-4Z" fill="#2c3431" />
            <Px d="M84 102h2v2h-2Z" fill="#f1ecd9" />
            {/* Nose */}
            <Px d="M70 106h4v10h4v4h-8Z" fill="#aa8670" />
            {/* Cheeks and a lopsided, slightly too eager smile */}
            <Px d="M50 118h6v2h-6Zm34-2h6v2h-6Z" fill="#bf9a80" />
            <Px d="M64 126h12v-2h4v-2h2v4l-4 4H66l-2-2Z" fill="#5a3c32" />
            <Px d="M68 126h8v2h-8Z" fill="#e8dfc8" />
            <Px d="M66 132h10v2H66Z" fill="#aa8670" />
          </g>

          {/* Lanyard and badge, striped in the department's colour */}
          <Px d="M52 160l14 50h16l14-50h-4l-12 46h-12l-12-46Z" fill={stripe} />
          <Px d="M62 208h24v32H62Z" fill="#3a3530" />
          <Px d="M64 210h20v28H64Z" fill="#e5e1cb" />
          <Px d="M64 210h20v6H64Z" fill={stripe} />
          <Px d="M66 218h8v10h-8Z" fill="#9aa69a" />
          <Px d="M68 220h4v4h-4Z" fill="#c8a487" />
          <Px d="M76 218h6v2h-6Zm0 4h6v2h-6Z" fill="#7a877c" />
          <text x="74" y="236" textAnchor="middle" fontFamily={FONT} fontSize="5" fill="#2b3f39">
            {demand.requester.name.split(" ").at(-1)?.toUpperCase()}
          </text>

          {/* Forearms reaching to the desk, outlined so the hands clearly belong to them */}
          <Px d="M24 208l8 66 20 18-6 24H10l4-84Zm100 0-8 66-20 18 6 24h36l-4-84Z" fill="#2f4442" />
          <Px d="M26 212l6 62 16 16-4 24H14l4-82Zm96 0-6 62-16 16 4 24h30l-4-82Z" fill="#465f58" />
          <Px d="M28 240h2l2 30h-2Zm90 0h2l-2 30h-2Z" fill="#3a524c" />

          {/* The printout, held up for you */}
          <Px d="M44 270h60v44H44Z" fill="#3a3530" />
          <Px d="M46 272h56v42H46Z" fill="#efe9d2" />
          <Px d="M48 274h52v8H48Z" fill={stripe} />
          <text x="50" y="281" fontFamily={FONT} fontSize="6" fill="#efe9d2">
            {ticket}
          </text>
          <Px d="M48 286h24v12H48Z" fill="#c9cfbf" />
          <Px d="M50 296l6-6 4 4 4-4 6 6Z" fill="#8e9f96" />
          <Px
            d="M76 286h22v2H76Zm0 4h20v2H76Zm0 4h22v2H76Zm-28 6h50v2H48Zm0 4h44v2H48Z"
            fill="#9a9a86"
          />
          {/* Hands gripping the sheet, the far one higher, pushing it towards you */}
          <Px d="M34 286h16v22h-8l-8-8Z" fill="#3a3530" />
          <Px d="M36 288h12v18h-6l-6-6Z" fill="#bf9c82" />
          <Px d="M44 290h6v2h-6Zm0 4h6v2h-6Zm0 4h6v2h-6Z" fill="#c8a487" />
          <Px d="M46 284h4v8h-4Z" fill="#dab49a" />
          <Px d="M36 300l6 6h6v2h-8l-6-6Z" fill="#a37a62" />
          <g transform="translate(0 -6)">
            <Px d="M114 286H98v22h8l8-8Z" fill="#3a3530" />
            <Px d="M112 288h-12v18h6l6-6Z" fill="#bf9c82" />
            <Px d="M98 290h6v2h-6Zm0 4h6v2h-6Zm0 4h6v2h-6Z" fill="#c8a487" />
            <Px d="M98 284h4v8h-4Z" fill="#dab49a" />
            <Px d="M112 300l-6 6h-6v2h8l6-6Z" fill="#a37a62" />
          </g>

          {/* The pitch, before you've said a word */}
          <g transform="translate(-14 8)">
            <Px d="M38 18h104v2h2v20h-2v2H88l-14 18V42H38v-2h-2V20h2Z" fill="#2f3c3a" />
            <Px d="M38 20h104v20H86l-10 14V40H38Z" fill="#d8d7c3" />
            <text x="90" y="33" textAnchor="middle" fontFamily={FONT} fontSize="8" fill="#2b3f39">
              Only {money(demand.cost)} a year!
            </text>
          </g>
        </g>
      )}
    </svg>
  );
}
