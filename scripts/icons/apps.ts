/**
 * Icons for the software in the game: every app people request and every app in the
 * catalog gets an 8x8 tile with its initial, coloured by vendor so a vendor's apps
 * look like a family (all Brightline Apps share a colour).
 */
import { ARCHETYPES, CATALOG, MADE_UP_APPS } from "../../src/game/data.ts";
import type { Rgba } from "./art.ts";

/** Muted brand colours that sit in the office palette. */
const TILES = [
  "#9e6656",
  "#3f6555",
  "#5a6f8e",
  "#a8874a",
  "#6e5a86",
  "#4f7f86",
  "#7d6a52",
  "#8a5f74",
];
const INK: Rgba = [0xf2, 0xef, 0xd8, 255]; // title-bar paper
const EDGE: Rgba = [0x17, 0x27, 0x24, 255]; // shadow

/** 3x5 capitals, one string per row. */
const FONT: Record<string, string> = {
  A: "### #.# ### #.# #.#",
  B: "##. #.# ##. #.# ##.",
  C: "### #.. #.. #.. ###",
  D: "##. #.# #.# #.# ##.",
  E: "### #.. ##. #.. ###",
  F: "### #.. ##. #.. #..",
  G: "### #.. #.# #.# ###",
  H: "#.# #.# ### #.# #.#",
  I: "### .#. .#. .#. ###",
  J: "..# ..# ..# #.# ###",
  K: "#.# #.# ##. #.# #.#",
  L: "#.. #.. #.. #.. ###",
  M: "#.# ### ### #.# #.#",
  N: "##. #.# #.# #.# #.#",
  O: "### #.# #.# #.# ###",
  P: "### #.# ### #.. #..",
  Q: "### #.# #.# ### ..#",
  R: "### #.# ##. #.# #.#",
  S: "### #.. ### ..# ###",
  T: "### .#. .#. .#. .#.",
  U: "#.# #.# #.# #.# ###",
  V: "#.# #.# #.# #.# .#.",
  W: "#.# #.# ### ### #.#",
  X: "#.# #.# .#. #.# #.#",
  Y: "#.# #.# .#. .#. .#.",
  Z: "### ..# .#. #.. ###",
  "3": "### ..# .## ..# ###",
};

export type AppIcon = { art: string[]; palette: Record<string, Rgba> };

/** Tile size in art pixels; the UI shows one art pixel per game pixel. */
export const APP_ICON_SIZE = 14;

/**
 * A glossy tile: dark outline with rounded corners, a light rim along the top, a lighter
 * upper half over a darker lower half, a bevel on the bottom and right, and the initial
 * at double size with a drop shadow.
 */
export function appIcon(name: string, brand: string): AppIcon {
  const glyph = FONT[name[0].toUpperCase()]?.split(" ");
  if (!glyph) throw new Error(`No pixel glyph for the first letter of "${name}"`);
  const n = APP_ICON_SIZE;
  const ink = (x: number, y: number) =>
    glyph[Math.floor((y - 2) / 2)]?.[Math.floor((x - 4) / 2)] === "#" && x >= 4 && y >= 2;
  const art = Array.from({ length: n }, (_, y) =>
    Array.from({ length: n }, (_col, x) => {
      const cx = Math.min(x, n - 1 - x);
      const cy = Math.min(y, n - 1 - y);
      if (cx + cy < 2) return ".";
      if (cx + cy === 2 || cx === 0 || cy === 0) return "o";
      if (ink(x, y)) return "i";
      if (ink(x - 1, y - 1)) return "d";
      if (y === 1 || (x === 1 && y < n / 2)) return "h";
      if (y === n - 2 || x === n - 2) return "s";
      return y < n / 2 ? "t" : "T";
    }).join(""),
  );
  const base = hex(TILES[hash(brand) % TILES.length]);
  return {
    art,
    palette: {
      ".": [0, 0, 0, 0],
      o: EDGE,
      h: mix(base, WHITE, 0.45),
      t: mix(base, WHITE, 0.12),
      T: base,
      s: mix(base, BLACK, 0.3),
      d: mix(base, BLACK, 0.5),
      i: INK,
    },
  };
}

const WHITE: Rgba = [255, 255, 255, 255];
const BLACK: Rgba = [0, 0, 0, 255];
function mix(a: Rgba, b: Rgba, t: number): Rgba {
  const c = (i: number) => Math.round(a[i] + (b[i] - a[i]) * t);
  return [c(0), c(1), c(2), 255];
}

/** Every app in the game, with the name its tile colour comes from. */
export const APPS: [name: string, brand: string][] = [
  ...ARCHETYPES.map((a): [string, string] => [a.app, a.vendor]),
  ...CATALOG.map((a): [string, string] => [a.name, "in-house"]),
  ...MADE_UP_APPS.map((name): [string, string] => [name, name]),
];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function hex(value: string): Rgba {
  const n = Number.parseInt(value.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}
