import { inflateSync } from "node:zlib";

import { describe, expect, it } from "vitest";

import { ART, PALETTE, padded } from "./art.ts";
import { encodeIco, encodePng, encodeSvg, rasterize } from "./encode.ts";

const palette = { ".": [0, 0, 0, 0], a: [255, 0, 0, 255], b: [0, 0, 255, 255] } as const;

describe("icon art", () => {
  it("is square and uses only palette colours", () => {
    for (const row of ART) {
      expect(row).toHaveLength(ART.length);
      for (const key of row) expect(PALETTE).toHaveProperty(key);
    }
  });

  it("pads to an opaque canvas", () => {
    const art = padded(ART, 4);
    expect(art).toHaveLength(24);
    expect(art.join("")).not.toContain(".");
  });
});

describe("rasterize", () => {
  it("scales by whole pixels and centres in the leftover space", () => {
    // 3x3 art in 8px: scale 2, a 1px border on every side.
    const image = rasterize(["abb", "bbb", "bbb"], palette, 8, [9, 9, 9, 9]);
    const at = (x: number, y: number) => [
      ...image.data.subarray((y * 8 + x) * 4, (y * 8 + x) * 4 + 4),
    ];
    expect(at(0, 0)).toEqual([9, 9, 9, 9]);
    expect(at(1, 1)).toEqual([255, 0, 0, 255]);
    expect(at(2, 2)).toEqual([255, 0, 0, 255]);
    expect(at(3, 1)).toEqual([0, 0, 255, 255]);
    expect(at(6, 6)).toEqual([0, 0, 255, 255]);
    expect(at(7, 7)).toEqual([9, 9, 9, 9]);
  });

  it("rejects unknown colours", () => {
    expect(() => rasterize(["x"], palette, 1)).toThrow('"x"');
  });
});

describe("encodePng", () => {
  it("writes a valid header and the raw scanlines", () => {
    const image = rasterize(["ab"], palette, 2);
    const png = encodePng(image);
    expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
    expect(png.readUInt32BE(16)).toBe(2); // width
    expect(png.readUInt32BE(20)).toBe(2); // height

    const idat = png.indexOf("IDAT");
    const raw = inflateSync(png.subarray(idat + 4, idat + 4 + png.readUInt32BE(idat - 4)));
    expect([...raw.subarray(0, 9)]).toEqual([0, 255, 0, 0, 255, 0, 0, 255, 255]);
  });
});

describe("encodeIco", () => {
  it("lists each image with its offset", () => {
    const images = [16, 32].map((size) => rasterize(ART, PALETTE, size));
    const ico = encodeIco(images);
    expect(ico.readUInt16LE(4)).toBe(2);
    expect(ico.readUInt8(6)).toBe(16);
    expect(ico.readUInt8(22)).toBe(32);
    const second = ico.readUInt32LE(22 + 12);
    expect(ico.subarray(second + 1, second + 4).toString("ascii")).toBe("PNG");
  });
});

describe("encodeSvg", () => {
  it("merges runs and skips transparent pixels", () => {
    const svg = encodeSvg([".aab"], palette);
    expect(svg).toContain('<rect x="1" y="0" width="2" height="1" fill="#ff0000"/>');
    expect(svg).toContain('<rect x="3" y="0" width="1" height="1" fill="#0000ff"/>');
    expect(svg.match(/<rect/g)).toHaveLength(2);
  });
});
