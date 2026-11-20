import { describe, expect, it } from "vitest";

import { boundingRect, FACES, REGIONS, roomLayout, VISITOR_PARTS, type Rect } from "./layout";
import { STAGE_MAX, STAGE_MIN, type Size } from "./stage";

const inside = (inner: Rect, outer: Rect) =>
  inner.x >= outer.x &&
  inner.y >= outer.y &&
  inner.x + inner.w <= outer.x + outer.w &&
  inner.y + inner.h <= outer.y + outer.h;

const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

const asRect = ({ width, height }: Size): Rect => ({ x: 0, y: 0, w: width, h: height });

/** The extremes: the smallest window, and one at the widest and tallest limits at once. */
const SIZES: Size[] = [STAGE_MIN, STAGE_MAX];

describe("layout", () => {
  it("keeps the whole screen in view, inside the monitor", () => {
    expect(inside(REGIONS.screen, asRect(STAGE_MIN))).toBe(true);
    expect(inside(REGIONS.screen, REGIONS.monitor)).toBe(true);
    const share = (REGIONS.screen.w * REGIONS.screen.h) / (STAGE_MIN.width * STAGE_MIN.height);
    expect(share).toBeGreaterThan(0.5);
  });

  it("lets the monitor peek in from the left, with a gap above it", () => {
    expect(REGIONS.monitor.x).toBeLessThan(0);
    expect(REGIONS.monitor.y).toBeGreaterThan(0);
  });

  it.each(SIZES)("runs the desk top past the edges of a $width×$height window", (size) => {
    const desk = boundingRect(roomLayout(size).deskTop);
    expect(desk.y + desk.h).toBeGreaterThanOrEqual(size.height);
    expect(desk.x).toBeLessThan(0);
    expect(desk.x + desk.w).toBeGreaterThan(size.width);
  });

  it.each(SIZES)("seats the visitor in view beside the monitor at $width×$height", (size) => {
    const { visitor } = roomLayout(size);
    expect(inside(visitor, asRect(size))).toBe(true);
    expect(overlaps(visitor, REGIONS.monitor)).toBe(false);
    expect(overlaps(visitor, boundingRect(FACES.monitorSide))).toBe(false);
  });

  it("ends the visitor where the desk begins", () => {
    const room = roomLayout(STAGE_MIN);
    expect(room.visitor.y + room.visitor.h).toBe(boundingRect(room.deskTop).y);
  });

  it("fits the visitor's parts in the visitor, chair and body down to the desk", () => {
    const { visitor } = roomLayout(STAGE_MIN);
    const box = { ...visitor, x: 0, y: 0 };
    for (const part of Object.values(VISITOR_PARTS)) expect(inside(part, box)).toBe(true);
    expect(VISITOR_PARTS.chair.y + VISITOR_PARTS.chair.h).toBe(visitor.h);
    expect(VISITOR_PARTS.body.y + VISITOR_PARTS.body.h).toBe(visitor.h);
  });
});
