import { useEffect } from "react";

import type { Person as Employee } from "@/game/types";

import { departmentColor } from "./departments";
import { gamePx } from "./layout";
import { lookFor } from "./scene/person/look";
import { Person } from "./scene/person/Person";
import { Px } from "./scene/Px";
import { useFit } from "./stageFitContext";

/** Where the far edge of the counter meets the wall, as in the room. */
const DESK_BACK = 300;

/**
 * The line at the desk, furthest first: who, how big, and how far right of centre. The front of
 * the line stands just right of the title, and it stretches off past the right edge.
 */
type InLineProps = {
  person: Pick<Employee, "name" | "gender">;
  dept: string;
  scale: number;
  x: number;
};

const QUEUE: InLineProps[] = [
  { person: { name: "Felix Hahn", gender: "male" }, dept: "hr", scale: 0.28, x: 560 },
  { person: { name: "Ines Haas", gender: "female" }, dept: "finance", scale: 0.32, x: 510 },
  { person: { name: "Noah Becker", gender: "male" }, dept: "sales-marketing", scale: 0.36, x: 456 },
  { person: { name: "Dirk Lehmann", gender: "male" }, dept: "manufacturing", scale: 0.42, x: 396 },
  { person: { name: "Mira Schulz", gender: "female" }, dept: "hr", scale: 0.5, x: 316 },
  { person: { name: "Clara Wendt", gender: "female" }, dept: "finance", scale: 0.6, x: 238 },
  { person: { name: "Marco Rossi", gender: "male" }, dept: "sales-marketing", scale: 0.74, x: 144 },
  {
    person: { name: "Hannah Scholz", gender: "female" },
    dept: "sales-marketing",
    scale: 0.92,
    x: 30,
  },
];

/** One of the line, holding up their request with its ticket number. */
function InLine({ person, dept, scale, ticket }: InLineProps & { ticket: string }) {
  const stripe = departmentColor(dept);
  return (
    <g transform={`scale(${scale})`}>
      <Person
        look={lookFor(person)}
        badge={
          <>
            <Px d="M52 160l14 50h16l14-50h-4l-12 46h-12l-12-46Z" fill={stripe} />
            <Px d="M62 208h24v32H62Z" fill="#3a3530" />
            <Px d="M64 210h20v28H64Z" fill="#e5e1cb" />
            <Px d="M64 210h20v6H64Z" fill={stripe} />
          </>
        }
        held={
          <>
            <Px d="M44 270h60v44H44Z" fill="#3a3530" />
            <Px d="M46 272h56v42H46Z" fill="#efe9d2" />
            <Px d="M48 274h52v8H48Z" fill={stripe} />
            <text x="50" y="281" fontSize="6" fill="#efe9d2">
              {ticket}
            </text>
            <Px d="M48 286h50v2H48Zm0 4h40v2H48Zm0 4h46v2H48Zm0 6h30v2H48Z" fill="#9a9a86" />
          </>
        }
      />
    </g>
  );
}

/** A form lying on the desk, stamped. */
function Stamped({
  x,
  y,
  turn,
  word,
  ink,
}: {
  x: number;
  y: number;
  turn: number;
  word: string;
  ink: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${turn})`}>
      <rect x="-4" y="4" width="92" height="42" fill="#9f8462" />
      <rect width="92" height="42" fill="#efe9d2" />
      <rect x="6" y="6" width="50" height="4" fill="#9a9a86" />
      <rect x="6" y="14" width="76" height="2" fill="#c9cfbf" />
      <rect x="6" y="20" width="70" height="2" fill="#c9cfbf" />
      <rect x="6" y="26" width="74" height="2" fill="#c9cfbf" />
      <g transform="translate(46 30) rotate(-12)" opacity="0.88">
        <rect x="-40" y="-11" width="80" height="20" fill="none" stroke={ink} strokeWidth="3" />
        <text textAnchor="middle" y="5" fontSize="13" fontWeight="800" fill={ink} letterSpacing="1">
          {word}
        </text>
      </g>
    </g>
  );
}

/**
 * The title screen, and the picture links unfurl to (`public/og-image.png` is a screenshot of
 * it): the desk, a line of people with requests stretching back, and a button to clock in.
 *
 * Slack's compact unfurl crops the card to its middle square (360 game px at 1200×630), so the
 * title, the button and the front of the line all sit within 180 of the centre.
 */
export function TitleScreen({ resume, onStart }: { resume: boolean; onStart: () => void }) {
  const { width, height } = useFit();
  const mid = Math.round(width / 2);
  const left = mid - 178;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      onStart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onStart]);

  return (
    <>
      <svg
        className="absolute inset-0 size-full"
        viewBox={`0 0 ${width} ${height}`}
        shapeRendering="crispEdges"
        role="img"
        aria-label="A line of employees holding software requests waits at the IT demand desk, where forms lie stamped Approved and Declined."
      >
        <defs>
          <pattern id="title-wall" width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill="#bac0ad" />
            <rect width="2" height="2" fill="#b3b9a6" />
            <rect x="4" y="4" width="2" height="2" fill="#b3b9a6" />
          </pattern>
          <pattern id="title-blinds" width="100" height="12" patternUnits="userSpaceOnUse">
            <rect width="100" height="12" fill="#d2d8c6" />
            <rect y="8" width="100" height="2" fill="#8e9f96" />
            <rect y="10" width="100" height="2" fill="#e3e6d3" />
          </pattern>
          <pattern id="title-laminate" width="94" height="14" patternUnits="userSpaceOnUse">
            <rect width="94" height="14" fill="#ad9674" />
            <path d="M0 2h36v2H0Zm44 0h50v2H44ZM12 8h58v2H12Z" fill="#a68f6e" />
          </pattern>
        </defs>

        <rect width={width} height={height} fill="url(#title-wall)" />
        {/* The window behind the line, light from the right. */}
        <rect x={mid + 150} y="24" width="220" height="164" fill="#7b897f" />
        <rect x={mid + 156} y="28" width="208" height="154" fill="url(#title-blinds)" />
        <rect x={mid + 258} y="28" width="4" height="154" fill="#89968b" />
        <rect x={mid + 146} y="186" width="228" height="6" fill="#dad9c3" />
        <rect x={mid + 146} y="192" width="228" height="2" fill="#9aa392" />

        {/* The office clock, on the dot of nine. */}
        <g transform={`translate(${mid - 280} 52)`}>
          <rect width="40" height="40" fill="#2f3c3a" />
          <rect x="2" y="2" width="36" height="36" fill="#e5e1cb" />
          <rect x="19" y="4" width="2" height="4" fill="#7a877c" />
          <rect x="19" y="32" width="2" height="4" fill="#7a877c" />
          <rect x="4" y="19" width="4" height="2" fill="#7a877c" />
          <rect x="32" y="19" width="4" height="2" fill="#7a877c" />
          <rect x="19" y="8" width="2" height="12" fill="#2b3f39" />
          <rect x="10" y="19" width="10" height="2" fill="#2b3f39" />
          <rect x="18" y="18" width="4" height="4" fill="#a33a2c" />
        </g>
        <rect y="220" width={width} height={DESK_BACK - 220} fill="#8d9c8e" />
        <rect y="220" width={width} height="4" fill="#6a7c73" />
        <rect y="224" width={width} height="2" fill="#aab4a0" />

        {/* The line, furthest first, so the nearer ones stand in front. */}
        {QUEUE.map((q, i) => (
          <g key={q.person.name} transform={`translate(${mid + q.x} ${DESK_BACK - 314 * q.scale})`}>
            <InLine {...q} ticket={`DM-${String(42 + QUEUE.length - 1 - i).padStart(4, "0")}`} />
          </g>
        ))}

        {/* The one at the front has a pitch ready. */}
        <g transform={`translate(${mid + 37} 36)`}>
          <Px d="M0 0h112v2h2v22h-2v2H64l-14 16V26H0v-2h-2V2h2Z" fill="#2f3c3a" />
          <Px d="M0 2h112v22H62l-10 12V24H0Z" fill="#d8d7c3" />
          <text x="56" y="16" textAnchor="middle" fontSize="8" fill="#2b3f39">
            Just one more tool!
          </text>
        </g>

        {/* The counter, running out of view. */}
        <Px d={`M0 ${DESK_BACK}H${width}V${height}H0Z`} fill="url(#title-laminate)" />
        <rect y={DESK_BACK} width={width} height="2" fill="#e2c49a" />
        <rect y={DESK_BACK + 2} width={width} height="2" fill="#a88b68" />

        <Stamped x={left + 8} y={DESK_BACK + 8} turn={-4} word="DECLINED" ink="#a33a2c" />
        <Stamped x={left + 116} y={DESK_BACK + 6} turn={3} word="APPROVED" ink="#2e6b52" />

        {/* The title, set like a sign on the wall. */}
        <g transform={`translate(${left} 0)`}>
          <text x="4" y="92" fontSize="44" fontWeight="800" fill="#20332f" letterSpacing="-1">
            DEMANDS,
          </text>
          <text x="4" y="138" fontSize="44" fontWeight="800" fill="#a33a2c" letterSpacing="-1">
            PLEASE
          </text>
          <rect x="6" y="150" width="190" height="3" fill="#20332f" />
          <text x="6" y="168" fontSize="9" fill="#2b3f39">
            Run the IT demand desk for 10 days.
          </text>
          <text x="6" y="181" fontSize="9" fill="#2b3f39">
            Approve or decline. Survive the audit.
          </text>
        </g>
      </svg>

      <button
        type="button"
        className="title-start"
        style={{ left: gamePx(left + 6), top: gamePx(222) }}
        onClick={onStart}
      >
        {resume ? "Continue shift" : "Start shift"}
      </button>
    </>
  );
}
