/**
 * The app icon, drawn on a 16x16 pixel grid in the office palette: the desk terminal
 * with a "D" on its screen.
 */

export type Rgba = readonly [number, number, number, number];

/** One character per art pixel. `.` is transparent. */
export const PALETTE: Record<string, Rgba> = {
  ".": [0, 0, 0, 0],
  b: hex("#20332f"), // desk at night (--color-neutral-900)
  p: hex("#e1dfcc"), // terminal casing (--paper-hi)
  g: hex("#557a5c"), // screen
  G: hex("#cdbb86"), // the "D" on screen
};

/** Background colour, also used for the web manifest's theme and splash screen. */
export const BACKGROUND = "#20332f";

export const ART: readonly string[] = [
  ".bbbbbbbbbbbbbb.",
  "bbbbbbbbbbbbbbbb",
  "bbppppppppppppbb",
  "bbpggggggggggpbb",
  "bbpgggGGGggggpbb",
  "bbpgggGggGgggpbb",
  "bbpgggGggGgggpbb",
  "bbpgggGggGgggpbb",
  "bbpgggGGGggggpbb",
  "bbpggggggggggpbb",
  "bbppppppppppppbb",
  "bbppppppppppppbb",
  "bbbbbbppppbbbbbb",
  "bbbbbbppppbbbbbb",
  "bbbbppppppppbbbb",
  ".bbbbbbbbbbbbbb.",
];

/** Art with its cut corners filled, for platforms that apply their own mask (iOS). */
export function opaque(art: readonly string[]): string[] {
  return art.map((row) => row.replaceAll(".", "b"));
}

/**
 * Art centred on a larger opaque canvas, so it stays inside the safe zone of a maskable
 * icon (a circle of 80% diameter) whatever shape the launcher crops it to.
 */
export function padded(art: readonly string[], margin: number): string[] {
  const width = art[0].length + margin * 2;
  const blank = "b".repeat(width);
  const edge = "b".repeat(margin);
  return [
    ...Array<string>(margin).fill(blank),
    ...opaque(art).map((row) => edge + row + edge),
    ...Array<string>(margin).fill(blank),
  ];
}

function hex(value: string): Rgba {
  const n = Number.parseInt(value.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}
