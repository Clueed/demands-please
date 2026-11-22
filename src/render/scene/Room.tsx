import type { ReactNode } from "react";

import { FACES, rectStyle, REGIONS, roomLayout } from "../layout";
import { useFit } from "../stageFitContext";
import { ART_PX } from "./pixel";
import { Fidget } from "./Fidget";
import { Keyboard } from "./Keyboard";
import { Px } from "./Px";

/** Shadows fall down and to the left, away from the window on the right. */
const SHADOW = "#9f8462";

const poly = (points: readonly (readonly [number, number])[]) =>
  `M${points.map((p) => p.join(" ")).join("L")}Z`;
/** Rounds a position onto the art grid, so props line up with each other. */
const snap = (n: number) => Math.round(n / ART_PX) * ART_PX;

/**
 * Office illustration in the same game coordinates as the interactive display.
 * Every prop is snapped to the shared art grid and drawn from the same slightly-above view:
 * a top face, a front edge, and a shadow down and to the left.
 */
export function Room({
  visitor,
  screen,
  paused,
  onPower,
}: {
  visitor: ReactNode;
  screen: ReactNode;
  /** The monitor is off: the power light turns amber and breathes, like standby. */
  paused: boolean;
  onPower: () => void;
}) {
  const fit = useFit();
  const room = roomLayout(fit);
  const { width, height } = fit;
  const officeX = room.visitor.x;
  const deskBack = room.visitor.h;
  const { monitor, screen: display, standNeck } = REGIONS;
  const monitorRight = monitor.x + monitor.w;
  const monitorBottom = monitor.y + monitor.h;
  const windowX = officeX + 60;
  /** Taller windows show more desk; spread the props on it down to fill it. */
  const drop = snap(Math.max(0, (height - 360) / 2));
  const at = (x: number, y: number) => `translate(${snap(x)} ${snap(y)})`;
  const foot = FACES.standFoot;
  /** Props can be pushed anywhere on the desk top, back edge to front. */
  const desk = { left: 0, right: width, top: deskBack + 4, bottom: height - 8 };

  return (
    <>
      <svg
        className="absolute inset-0 size-full"
        viewBox={`0 0 ${width} ${height}`}
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        <defs>
          <pattern id="wall-grain" width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill="#bac0ad" />
            <rect width="2" height="2" fill="#b3b9a6" />
            <rect x="4" y="4" width="2" height="2" fill="#b3b9a6" />
          </pattern>
          <pattern id="blinds" width="100" height="12" patternUnits="userSpaceOnUse">
            <rect width="100" height="12" fill="#d2d8c6" />
            <rect y="8" width="100" height="2" fill="#8e9f96" />
            <rect y="10" width="100" height="2" fill="#e3e6d3" />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#wall-grain)" />

        {/* Window with blinds behind the visitor, light falling in from the right. */}
        <rect x={windowX} y="30" width="180" height="158" fill="#7b897f" />
        <rect x={windowX + 6} y="34" width="168" height="148" fill="url(#blinds)" />
        <rect x={windowX + 88} y="34" width="4" height="148" fill="#89968b" />
        <rect x={windowX + 154} y="36" width="2" height="130" fill="#747f72" />
        {/* Now and then a cloud passes and the light through the blinds dims. */}
        <rect
          x={windowX + 6}
          y="34"
          width="168"
          height="148"
          fill="#5f6d6a"
          className="window-cloud"
        />
        <rect x={windowX - 4} y="186" width="188" height="6" fill="#dad9c3" />
        <rect x={windowX - 4} y="192" width="188" height="2" fill="#9aa392" />

        {/* Wainscot along the wall behind the desk. */}
        <rect y="220" width={width} height={deskBack - 220} fill="#8d9c8e" />
        <rect y="220" width={width} height="4" fill="#6a7c73" />
        <rect y="224" width={width} height="2" fill="#aab4a0" />
        <rect x={officeX - 4} y="226" width="2" height={deskBack - 226} fill="#7c8c7e" />
        <rect x={officeX + 160} y="226" width="2" height={deskBack - 226} fill="#7c8c7e" />
      </svg>
      <div className="absolute" style={rectStyle(room.visitor)}>
        {visitor}
      </div>
      <svg
        className="pointer-events-none absolute inset-0 size-full"
        viewBox={`0 0 ${width} ${height}`}
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        <defs>
          <pattern id="laminate" width="94" height="14" patternUnits="userSpaceOnUse">
            <rect width="94" height="14" fill="#ad9674" />
            <path d="M0 2h36v2H0Zm44 0h50v2H44ZM12 8h58v2H12Z" fill="#a68f6e" />
          </pattern>
        </defs>
        <Px d={poly(room.deskTop)} fill="url(#laminate)" />
        {/* The far edge of the desk, lit from the window. */}
        <rect x="4" y={deskBack} width={width - 8} height="2" fill="#e2c49a" />
        <rect x="4" y={deskBack + 2} width={width - 8} height="2" fill="#a88b68" />
        {/* The near edge of the desk, where a taller window shows it. */}
        <rect x="0" y={height - 6} width={width} height="6" fill="#8f7556" />
        <rect x="0" y={height - 8} width={width} height="2" fill="#d2b286" />

        {/* Where the visitor's arms and printout rest on the far edge. */}
        <rect x={officeX + 10} y={deskBack + 4} width="128" height="2" fill="#a28666" />
        <rect x={officeX + 42} y={deskBack + 4} width="60" height="4" fill="#94795a" />

        {/* Monitor shadow on the desk, then the stand: foot, its top face, neck. */}
        <Px
          d={`M${monitor.x + 16} ${deskBack + 4}H${monitorRight}l-8 8H${monitor.x + 8}Z`}
          fill="#a48a68"
        />
        <Px d={poly(foot.map(([x, y]) => [x - 4, y + 4] as const))} fill={SHADOW} />
        <Px d={poly(foot)} fill="#2f3c3a" />
        <rect
          x={foot[0][0]}
          y={foot[0][1]}
          width={foot[1][0] - foot[0][0]}
          height="2"
          fill="#53615a"
        />
        <rect
          x={standNeck.x}
          y={standNeck.y}
          width={standNeck.w}
          height={standNeck.h}
          fill="#293635"
        />
        <rect x={standNeck.x + 2} y={standNeck.y} width="2" height={standNeck.h} fill="#3c4a47" />

        {/* The monitor itself: bezel, recessed screen, chin. */}
        <rect x={monitor.x} y={monitor.y} width={monitor.w} height={monitor.h} fill="#354342" />
        <rect x={monitor.x} y={monitor.y} width={monitor.w} height="2" fill="#5c6964" />
        <rect x={monitor.x} y={monitor.y} width="2" height={monitor.h} fill="#46544f" />
        <rect
          x={display.x - 2}
          y={display.y - 2}
          width={display.w + 4}
          height={display.h + 4}
          fill="#1f2b2a"
        />
        <rect x={monitor.x} y={monitorBottom - 2} width={monitor.w} height="2" fill="#2a3635" />
        <Fidget
          kind={paused ? "led-standby" : "led"}
          transform=""
          label={
            paused ? "Power light. Press to wake the monitor." : "Power light. Press for a break."
          }
          onPoke={onPower}
        >
          {/* A bigger, invisible hit area around the tiny light. */}
          <rect
            x={monitorRight - 22}
            y={monitorBottom - 10}
            width="12"
            height="6"
            fill="transparent"
          />
          <rect
            x={monitorRight - 18}
            y={monitorBottom - 8}
            width="4"
            height="2"
            fill={paused ? "#d9a55a" : "#b8c998"}
          />
        </Fidget>
        <rect x={monitorRight - 30} y={monitorBottom - 8} width="8" height="2" fill="#45524e" />

        {/* A sticky note taped to the chin, the department's whole policy. */}
        <Fidget
          kind="note"
          bounds={desk}
          transform={at(monitorRight - 118, monitorBottom - 10)}
          label="A sticky note. It says no."
        >
          <Px d="M0 2L26 0v22L6 24 0 18Z" fill="#cdbb86" />
          <Px d="M0 2L26 0v4L0 6Z" fill="#b8a670" />
          <Px d="M0 18h6v6Z" fill="#a8975f" className="fx-keep" />
          <Px d="M0 16h8v8H4Z" fill="#e0d29e" className="fx fx-curl" />
          {/* A strip of tape holding it to the chin */}
          <Px d="M6 -2h14v6H6Z" fill="#d9d6c2" />
          <Px d="M6 2h14v2H6Z" fill="#b9b6a2" />
          <text
            x="13"
            y="17"
            textAnchor="middle"

            fontSize="10"
            fontWeight="600"
            fill="#5b4c2a"
          >
            NO.
          </text>
        </Fidget>

        {/* In-tray, overflowing, in front of the monitor. */}
        <Fidget
          kind="tray"
          bounds={desk}
          transform={at(monitor.x + 10, deskBack + 4)}
          label="The in-tray. Still overflowing."
        >
          <Px d="M-8 14h72l4 12H-12Z" fill={SHADOW} />
          <Px d="M4 -4h52l4 10H0Z" fill="#ddd6bb" />
          <g className="fx-sheet">
            <Px d="M2 0h56l4 10H-2Z" fill="#e8e1c8" />
            <Px d="M8 2h30v2H8Zm2 4h24v2H10Z" fill="#aaa88f" />
          </g>
          <Px d="M40 -6h16l2 8H38Z" fill="#cdbb86" className="fx-tab" />
          <Px d="M0 10h68l4 12H-4Z" fill="#4c5d57" />
          <Px d="M0 10h68v2H0Z" fill="#6c7e75" />
          <Px d="M26 14h16v6H26Z" fill="#d9d4ba" />
          <text x="34" y="19" textAnchor="middle" fontSize="5" fill="#3c4b46">
            IN
          </text>
        </Fidget>

        {/* A plant that gave up some time ago: a pot seen from above, one stem bent over. */}
        <Fidget
          kind="plant"
          bounds={desk}
          transform={at(monitor.x + 88, deskBack - 12)}
          label="A plant, mostly"
        >
          {(pokes) => (
            <>
              <Px d="M0 32h20l-2 4H-4Z" fill={SHADOW} />
              <Px d="M0 16h24v6h-2l-2 12H4L2 22H0Z" fill="#4a3127" />
              <Px d="M2 18h20v4H2Z" fill="#b07d5f" />
              <Px d="M4 18h16v2H4Z" fill="#5a4130" />
              <Px d="M4 22h16l-2 10H6Z" fill="#9a6a4f" />
              <Px d="M14 22h4l-2 10h-2Z" fill="#865a43" />
              <g className="fx-stem">
                <Px d="M10 6h2v12h-2Zm2-2h6v2h-6Zm6 2h2v4h-2Z" fill="#6b6a45" />
                <Px d="M18 10h4v6h-2v-2h-2ZM6 8h4v2H8v4H6Z" fill="#8a8650" />
                <Px d="M12 6h4v2h2v4h-2v-2h-2Z" fill="#9a9358" />
              </g>
              {pokes > 0 && pokes % 3 === 0 && (
                <Px d="M18 10h4v2h-4Z" fill="#a39c5c" className="fx fx-leaf" />
              )}
            </>
          )}
        </Fidget>

        {/* Nameplate: its top face and the front, facing the visitor. */}
        <Fidget
          kind="nameplate"
          bounds={desk}
          transform={at(18, 334 + drop)}
          label="Your nameplate"
        >
          <Px d="M-8 14h86l-2 6H-12Z" fill={SHADOW} />
          <Px d="M0 4h80l4 12H-4Z" fill="#3c4b46" />
          <Px d="M2 0h76l2 4H0Z" fill="#5d6d66" />
          <text x="40" y="12" textAnchor="middle" fontSize="7" fill="#d8d3b4">
            DEMANDS, PLEASE
          </text>
        </Fidget>

        <Fidget
          kind="keyboard"
          bounds={desk}
          transform={at(128, deskBack + 30 + drop)}
          label="Keyboard"
        >
          <Keyboard />
        </Fidget>

        {/* Mouse pad, pushed around the desk, and the mouse, pushed around the pad. */}
        <Fidget
          kind="pad"
          bounds={desk}
          transform={at(352, deskBack + 26 + drop)}
          label="Mouse pad"
        >
          <Px d="M-4 4h62l12 26H-12Z" fill={SHADOW} />
          <Px d="M0 0h62l12 26H-8Z" fill="#566961" />
          <Px d="M0 2h60l10 22H-6Z" fill="#61756a" className="fidget-surface" />
          <Fidget kind="mouse" bounds="parent" transform="" label="Mouse">
            <Px d="M18 20h4v4h14v2H18Z" fill="#46574f" />
            <Px d="M24 4h12v2h2v2h2v12h-2v2h-2v2H24v-2h-2v-2h-2V8h2V6h2Z" fill="#3a4744" />
            <Px d="M24 6h12v2h2v12h-2v2H24v-2h-2V8h2Z" fill="#8a978a" />
            <Px d="M22 12h16v2H22Zm8-6h2v6h-2Z" fill="#4f5f57" />
            <Px d="M24 8h4v2h-4Z" fill="#b3bea9" />
            <Px d="M24 6h6v6h-6Z" fill="#6f7c70" className="fx fx-click" />
            <Px d="M30 8h2v2h-2Z" fill="#c9d3bd" className="fx fx-wheel" />
          </Fidget>
        </Fidget>

        {/* Yesterday's coffee ring, half under the mug. */}
        <g transform={at(430, deskBack + 32 + drop)}>
          <Px d="M2 0h8v2H2ZM0 2h2v6H0Zm2 6h6v2H2Z" fill="#b39468" />
        </g>
        {/* Your mug, seen from above: rim and coffee on top, handle on the side. */}
        <Fidget
          kind="mug"
          bounds={desk}
          transform={at(440, deskBack + 16 + drop)}
          label="Coffee. Lukewarm."
        >
          <Px d="M-6 22h24v4H-6Z" fill={SHADOW} />
          <Px d="M18 6h8v14h-8Z" fill="#4a3127" />
          <Px d="M20 8h4v10h-4Z" fill="#7a4a3e" />
          <Px d="M20 10h2v6h-2Z" fill="#ad9674" />
          <Px d="M-2 0h24v24H-2Z" fill="#4a3127" />
          <Px d="M0 6h20v16H0Z" fill="#9e6656" />
          <Px d="M14 6h4v16h-4Z" fill="#7a4a3e" />
          <Px d="M0 0h20v6H0Z" fill="#b97f6c" />
          <Px d="M2 2h16v2H2Z" fill="#4a3127" />
          <Px d="M4 2h6v2H4Z" fill="#6b4a3a" />
          <Px d="M4 10h8v6H4Z" fill="#e5dec3" />
          <Px d="M6 12h4v2H6Z" fill="#9e6656" />
          <Px d="M6 2h4v2H6Z" fill="#8a5d48" className="fx fx-ripple" />
          <Px d="M4 -6h2v4H4Zm2 -4h2v4H6Z" fill="#ece8d8" className="fx fx-steam-a" />
          <Px d="M12 -4h2v4h-2Zm-2 -4h2v4h-2Z" fill="#ece8d8" className="fx fx-steam-b" />
        </Fidget>
        {/* A pen. */}
        <Fidget
          kind="pen"
          bounds={desk}
          transform={at(392, deskBack + 62 + drop)}
          label="A pen. Click."
        >
          {(pokes) => (
            <>
              <Px d="M-2 4h38v2H-2Z" fill={SHADOW} />
              <Px d="M0 0h34v4H0Z" fill="#3c4b46" />
              <Px d="M0 0h10v4H0Z" fill="#9e6656" />
              <Px d="M34 0h4v4h-4Z" fill="#d8d3b4" />
              {pokes % 2 === 1 && <Px d="M38 2h2v2h-2Z" fill="#3c4b46" />}
            </>
          )}
        </Fidget>
        {/* Today's declined forms, stamped and stacked on your side. */}
        <Fidget
          kind="forms"
          bounds={desk}
          transform={at(officeX + 70, deskBack + 28 + drop)}
          label="Declined forms"
        >
          <Px d="M-10 18h62l2 6H-12Z" fill={SHADOW} />
          <Px d="M2 6h52l4 12H-2Z" fill="#d8d1b6" />
          <Px d="M0 4h52l4 12H-4Z" fill="#e2dbc0" />
          <g className="fx-sheet">
            <Px d="M-2 0h52l4 12H-6Z" fill="#ebe5cd" />
            <Px d="M4 2h22v2H4Zm-2 4h18v2H2Z" fill="#b5b39a" />
            <Px d="M30 2h16v2H30Zm0 6h16v2H30ZM30 4h2v4h-2Zm14 0h2v4h-2Z" fill="#9e6656" />
            <Px d="M34 4h8v4h-8Z" fill="#c69a8a" />
          </g>
          <Px d="M28 0h20v12H28Z" fill="#b5544a" className="fx fx-stamp" />
        </Fidget>
      </svg>
      <div className="absolute overflow-hidden office-display" style={rectStyle(display)}>
        {screen}
      </div>
    </>
  );
}
