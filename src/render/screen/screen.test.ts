import { describe, expect, it } from "vitest";

import { REGIONS } from "../layout";

import { clampPointer, initialScreen, MIN_VISIBLE, screenReducer } from "./screen";

describe("clampPointer", () => {
  const { x, y, w, h } = REGIONS.screen;

  it("leaves a pointer on the screen alone", () => {
    expect(clampPointer({ x: x + 10, y: y + 10 })).toEqual({ x: x + 10, y: y + 10 });
  });

  it("stops the pointer at the screen's edges", () => {
    expect(clampPointer({ x: -500, y: -500 })).toEqual({ x, y });
    expect(clampPointer({ x: 9999, y: 9999 })).toEqual({ x: x + w - 1, y: y + h - 1 });
  });
});

describe("screenReducer", () => {
  it("starts with every window fully on the screen", () => {
    for (const w of Object.values(initialScreen().windows)) {
      expect(w.x).toBeGreaterThanOrEqual(0);
      expect(w.y).toBeGreaterThanOrEqual(0);
      expect(w.x + w.w).toBeLessThanOrEqual(REGIONS.screen.w);
      expect(w.y + w.h).toBeLessThanOrEqual(REGIONS.screen.h);
    }
  });

  it("moves a window, letting it hang off the screen", () => {
    const screen = initialScreen();

    const moved = screenReducer(screen, { type: "move", id: "form", x: 10, y: 20 });
    expect(moved.windows.form).toMatchObject({ x: 10, y: 20 });

    const hanging = screenReducer(screen, { type: "move", id: "form", x: -40, y: 200 });
    expect(hanging.windows.form).toMatchObject({ x: -40, y: 200 });
  });

  it("always keeps a strip of the window on screen to grab it back", () => {
    const screen = initialScreen();
    const form = screen.windows.form;

    const farAway = screenReducer(screen, { type: "move", id: "form", x: 9999, y: 9999 });
    expect(farAway.windows.form).toMatchObject({
      x: REGIONS.screen.w - MIN_VISIBLE,
      y: REGIONS.screen.h - MIN_VISIBLE,
    });

    const farBack = screenReducer(screen, { type: "move", id: "form", x: -9999, y: -9999 });
    expect(farBack.windows.form).toMatchObject({
      x: MIN_VISIBLE - form.w,
      y: MIN_VISIBLE - form.h,
    });
  });

  it("snaps to whole game pixels", () => {
    const moved = screenReducer(initialScreen(), { type: "move", id: "form", x: 10.4, y: 20.6 });
    expect(moved.windows.form).toMatchObject({ x: 10, y: 21 });
  });

  it("keeps the same state when a move changes nothing", () => {
    const screen = initialScreen();
    const { x, y } = screen.windows.form;
    expect(screenReducer(screen, { type: "move", id: "form", x: x + 0.2, y })).toBe(screen);
  });

  it("raises a window to the top of the stack", () => {
    const screen = initialScreen();
    expect(screenReducer(screen, { type: "raise", id: "binder" }).order).toEqual([
      "calendar",
      "gauges",
      "form",
      "binder",
    ]);
    expect(screenReducer(screen, { type: "raise", id: "form" })).toBe(screen);
  });
});
