import { describe, expect, it } from "vitest";

import { parsePath, snapPath } from "./pixel";

describe("parsePath", () => {
  it("reads absolute and relative straight-line commands into closed shapes", () => {
    expect(parsePath("M0 0h4v4H0Zm10 0l2 2-2 2Z")).toEqual([
      [
        [0, 0],
        [4, 0],
        [4, 4],
        [0, 4],
      ],
      [
        [10, 0],
        [12, 2],
        [10, 4],
      ],
    ]);
  });
});

describe("snapPath", () => {
  it("keeps grid-aligned rectangles exactly", () => {
    expect(snapPath("M0 0h4v2H0Z")).toBe("M0 0h4v2h-4Z");
  });

  it("turns a diagonal into whole-cell stair steps", () => {
    // A right triangle: the hypotenuse becomes a staircase of 2×2 cells. Cells whose
    // centre sits exactly on the hypotenuse stay empty.
    const rows = snapPath("M0 0L8 8H0Z").split("Z").filter(Boolean);
    expect(rows).toEqual(["M0 2h2v2h-2", "M0 4h4v2h-4", "M0 6h6v2h-6"]);
  });

  it("drops marks finer than one art pixel", () => {
    expect(snapPath("M0.2 0.2h0.5v0.5h-0.5Z")).toBe("");
  });
});
