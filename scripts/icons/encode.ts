/**
 * Dependency-free encoders for pixel art: nearest-neighbour rasterising, PNG, ICO and SVG.
 */
import { crc32, deflateSync } from "node:zlib";

import type { Rgba } from "./art.ts";

export interface Image {
  width: number;
  height: number;
  /** RGBA, row-major. */
  data: Uint8Array;
}

/**
 * Scales art by the largest whole factor that fits `size`, so every art pixel stays the same
 * size, and centres it. The leftover border takes the colour of `fill`.
 */
export function rasterize(
  art: readonly string[],
  palette: Record<string, Rgba>,
  size: number,
  fill: Rgba = [0, 0, 0, 0],
): Image {
  const rows = art.length;
  const cols = art[0].length;
  const scale = Math.floor(size / Math.max(rows, cols));
  if (scale < 1) throw new Error(`${size}px is smaller than the ${cols}x${rows} art`);
  const left = Math.floor((size - cols * scale) / 2);
  const top = Math.floor((size - rows * scale) / 2);
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const col = Math.floor((x - left) / scale);
      const row = Math.floor((y - top) / scale);
      const inside = x >= left && y >= top && col < cols && row < rows;
      const color = inside ? colorAt(art, palette, row, col) : fill;
      data.set(color, (y * size + x) * 4);
    }
  }
  return { width: size, height: size, data };
}

export function encodePng({ width, height, data }: Image): Buffer {
  // Each scanline is prefixed with filter type 0 (none).
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw.set(data.subarray(y * width * 4, (y + 1) * width * 4), y * (width * 4 + 1) + 1);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 6, 0, 0, 0], 8); // 8-bit depth, RGBA, deflate, adaptive filtering, no interlace

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** An ICO holding PNG-compressed images, supported by every browser since Windows Vista. */
export function encodeIco(images: readonly Image[]): Buffer {
  const pngs = images.map(encodePng);
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // icon
  header.writeUInt16LE(images.length, 4);

  let offset = header.length;
  images.forEach((image, i) => {
    const entry = 6 + 16 * i;
    header.writeUInt8(image.width >= 256 ? 0 : image.width, entry);
    header.writeUInt8(image.height >= 256 ? 0 : image.height, entry + 1);
    header.writeUInt16LE(1, entry + 4); // colour planes
    header.writeUInt16LE(32, entry + 6); // bits per pixel
    header.writeUInt32LE(pngs[i].length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += pngs[i].length;
  });
  return Buffer.concat([header, ...pngs]);
}

/** A crisp-edged SVG with one rect per horizontal run of a colour. */
export function encodeSvg(art: readonly string[], palette: Record<string, Rgba>): string {
  const rows = art.length;
  const cols = art[0].length;
  const rects: string[] = [];
  art.forEach((line, y) => {
    let x = 0;
    while (x < cols) {
      const key = line[x];
      let end = x + 1;
      while (end < cols && line[end] === key) end++;
      const [r, g, b, a] = colorAt(art, palette, y, x);
      if (a > 0) {
        const fill = `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
        rects.push(`<rect x="${x}" y="${y}" width="${end - x}" height="1" fill="${fill}"/>`);
      }
      x = end;
    }
  });
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cols} ${rows}" shape-rendering="crispEdges">`,
    ...rects.map((rect) => `  ${rect}`),
    "</svg>",
    "",
  ].join("\n");
}

function colorAt(art: readonly string[], palette: Record<string, Rgba>, row: number, col: number) {
  const key = art[row][col];
  const color = palette[key];
  if (!color) throw new Error(`No palette colour for "${key}" at row ${row}, column ${col}`);
  return color;
}

function chunk(type: string, body: Buffer): Buffer {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(body.length, 0);
  head.write(type, 4, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), body])), 0);
  return Buffer.concat([head, body, crc]);
}
