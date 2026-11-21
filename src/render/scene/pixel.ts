/**
 * Snaps scene art to one shared pixel grid.
 *
 * Shapes are authored as simple straight-line SVG paths in game pixels. They are rasterised
 * into whole cells of `ART_PX` game pixels, so every diagonal becomes an even stair-step and
 * nothing in the room is drawn finer than anything else.
 */

/** Size of one art pixel, in game pixels. */
export const ART_PX = 2;

type Point = readonly [number, number];

/** Parses a path made only of M, L, H, V and Z commands (absolute or relative). */
export function parsePath(d: string): Point[][] {
  const tokens = d.match(/[MLHVZmlhvz]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  const shapes: Point[][] = [];
  let shape: Point[] = [];
  let x = 0;
  let y = 0;
  let start: Point = [0, 0];
  let command = "M";
  let i = 0;
  const num = () => Number(tokens[i++]);
  const close = () => {
    if (shape.length > 2) shapes.push(shape);
    shape = [];
  };

  while (i < tokens.length) {
    const token = tokens[i]!;
    if (/[a-zA-Z]/.test(token)) {
      command = token;
      i++;
      if (command === "Z" || command === "z") {
        close();
        [x, y] = start;
        continue;
      }
    }
    switch (command) {
      case "M":
      case "m": {
        close();
        const dx = num();
        const dy = num();
        x = command === "m" ? x + dx : dx;
        y = command === "m" ? y + dy : dy;
        start = [x, y];
        shape.push(start);
        // Further coordinate pairs after a move are lines.
        command = command === "m" ? "l" : "L";
        break;
      }
      case "L":
        x = num();
        y = num();
        shape.push([x, y]);
        break;
      case "l":
        x += num();
        y += num();
        shape.push([x, y]);
        break;
      case "H":
        x = num();
        shape.push([x, y]);
        break;
      case "h":
        x += num();
        shape.push([x, y]);
        break;
      case "V":
        y = num();
        shape.push([x, y]);
        break;
      case "v":
        y += num();
        shape.push([x, y]);
        break;
      default:
        throw new Error(`Unsupported path command "${command}" in "${d}"`);
    }
  }
  close();
  return shapes;
}

/** Even-odd test of whether a point lies inside a polygon. */
function inside(px: number, py: number, polygon: Point[]): boolean {
  let hit = false;
  for (let a = 0, b = polygon.length - 1; a < polygon.length; b = a++) {
    const [ax, ay] = polygon[a]!;
    const [bx, by] = polygon[b]!;
    if (ay > py !== by > py && px < ((bx - ax) * (py - ay)) / (by - ay) + ax) hit = !hit;
  }
  return hit;
}

const cache = new Map<string, string>();

/**
 * Rasterises a path onto the art grid and returns an equivalent path of whole cells.
 * A cell is filled when its centre falls inside any of the path's subpaths.
 */
export function snapPath(d: string, cell = ART_PX): string {
  const key = `${cell}|${d}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;

  const shapes = parsePath(d);
  const points = shapes.flat();
  if (points.length === 0) return "";
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const x0 = Math.floor(Math.min(...xs) / cell) * cell;
  const x1 = Math.ceil(Math.max(...xs) / cell) * cell;
  const y0 = Math.floor(Math.min(...ys) / cell) * cell;
  const y1 = Math.ceil(Math.max(...ys) / cell) * cell;

  let out = "";
  for (let y = y0; y < y1; y += cell) {
    let run: number | undefined;
    for (let x = x0; x <= x1; x += cell) {
      const filled = x < x1 && shapes.some((shape) => inside(x + cell / 2, y + cell / 2, shape));
      if (filled && run === undefined) run = x;
      if (!filled && run !== undefined) {
        out += `M${run} ${y}h${x - run}v${cell}h${run - x}Z`;
        run = undefined;
      }
    }
  }
  cache.set(key, out);
  return out;
}
