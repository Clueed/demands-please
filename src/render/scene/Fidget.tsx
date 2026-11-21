import { useRef, useState, type ReactNode } from "react";

import { ART_PX } from "./pixel";

/** Where on the desk props may be dragged, in game coordinates. */
export type DeskBounds = { left: number; right: number; top: number; bottom: number };

type Drag = {
  pointer: number;
  /** Where the press started on screen, to tell a tap from a drag. */
  screen: readonly [number, number];
  from: DOMPoint;
  origin: readonly [number, number];
  /** Allowed offsets, so the prop's footprint stays on the desk. */
  min: readonly [number, number];
  max: readonly [number, number];
  moved: boolean;
};

const snap = (n: number) => Math.round(n / ART_PX) * ART_PX;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
/** Screen pixels the pointer may wander before a tap becomes a drag. */
const SLOP = 4;

function toGame(svg: SVGSVGElement, x: number, y: number) {
  const ctm = svg.getScreenCTM();
  return ctm ? new DOMPoint(x, y).matrixTransform(ctm.inverse()) : new DOMPoint(x, y);
}

function boundsOf(svg: SVGSVGElement, box: DOMRect): DeskBounds {
  const tl = toGame(svg, box.left, box.top);
  const br = toGame(svg, box.right, box.bottom);
  return { left: tl.x, right: br.x, top: tl.y, bottom: br.y };
}

/**
 * A desk prop you can poke and push around. A tap replays its little animation (named by
 * `kind`, styled in index.css) and hands the poke count to the art; a drag slides it across
 * the desk, snapped to the art grid and kept inside `bounds`.
 */
export function Fidget({
  kind,
  transform,
  label,
  bounds,
  children,
}: {
  kind: string;
  transform: string;
  label: string;
  /**
   * Where it may be dragged: the desk, or `"parent"` to stay on the prop it sits on
   * (the mouse on its pad), marked by a `fidget-surface` shape inside it. Leave out to make the prop pokeable but fixed in place.
   */
  bounds?: DeskBounds | "parent";
  children: ReactNode | ((pokes: number) => ReactNode);
}) {
  const [pokes, setPokes] = useState(0);
  const [offset, setOffset] = useState<readonly [number, number]>([0, 0]);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<Drag | null>(null);

  return (
    <g
      transform={`${transform} translate(${offset[0]} ${offset[1]})`}
      className={dragging ? "fidget-dragging" : undefined}
    >
      <g
        // Remounting restarts the CSS animation on every poke.
        key={pokes}
        className={`fidget fidget-${kind}${pokes ? " is-poked" : ""}${pokes % 2 ? " is-odd" : ""}`}
        onPointerDown={(e) => {
          const svg = e.currentTarget.ownerSVGElement;
          if (!svg || e.button !== 0) return;
          e.stopPropagation();
          const holder = e.currentTarget.parentElement?.closest(".fidget");
          const b =
            bounds === "parent" && holder
              ? boundsOf(
                  svg,
                  (holder.querySelector(".fidget-surface") ?? holder).getBoundingClientRect(),
                )
              : bounds && bounds !== "parent"
                ? bounds
                : { left: -Infinity, right: Infinity, top: -Infinity, bottom: Infinity };
          e.currentTarget.setPointerCapture(e.pointerId);
          const box = e.currentTarget.getBoundingClientRect();
          const tl = toGame(svg, box.left, box.top);
          const br = toGame(svg, box.right, box.bottom);
          drag.current = {
            pointer: e.pointerId,
            screen: [e.clientX, e.clientY],
            from: toGame(svg, e.clientX, e.clientY),
            origin: offset,
            // A prop that starts off the desk (the note on the monitor) may stay where it is.
            min: [
              Math.min(offset[0], offset[0] + b.left - tl.x),
              // Props on the desk may poke past its back edge; one sitting on a prop stays on it.
              Math.min(offset[1], offset[1] + b.top - (bounds === "parent" ? tl.y : br.y)),
            ],
            max: [
              Math.max(offset[0], offset[0] + b.right - br.x),
              Math.max(offset[1], offset[1] + b.bottom - br.y),
            ],
            moved: false,
          };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          const svg = e.currentTarget.ownerSVGElement;
          if (!d || !svg || d.pointer !== e.pointerId) return;
          if (!bounds) return;
          if (!d.moved && Math.hypot(e.clientX - d.screen[0], e.clientY - d.screen[1]) < SLOP)
            return;
          if (!d.moved) setDragging(true);
          d.moved = true;
          const at = toGame(svg, e.clientX, e.clientY);
          setOffset([
            snap(clamp(d.origin[0] + at.x - d.from.x, d.min[0], d.max[0])),
            snap(clamp(d.origin[1] + at.y - d.from.y, d.min[1], d.max[1])),
          ]);
        }}
        onPointerUp={(e) => {
          const d = drag.current;
          if (!d || d.pointer !== e.pointerId) return;
          drag.current = null;
          setDragging(false);
          if (!d.moved) setPokes((n) => n + 1);
        }}
        onPointerCancel={() => {
          drag.current = null;
          setDragging(false);
        }}
      >
        <title>{label}</title>
        {typeof children === "function" ? children(pokes) : children}
      </g>
    </g>
  );
}
