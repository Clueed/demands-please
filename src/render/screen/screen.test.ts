import { describe, expect, it } from "vitest";

import { REGIONS } from "../layout";

import {
  clampPointer,
  initialScreen,
  MIN_VISIBLE,
  screenReducer,
  TASKBAR_H,
  TITLE_H,
} from "./screen";

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
  it("starts with every window on the screen", () => {
    for (const w of Object.values(initialScreen().windows)) {
      expect(w.x).toBeGreaterThanOrEqual(0);
      expect(w.y).toBeGreaterThanOrEqual(0);
      expect(w.x + w.w).toBeLessThanOrEqual(REGIONS.screen.w);
      expect(w.y + w.h).toBeLessThanOrEqual(REGIONS.screen.h);
    }
  });

  it("starts with the rulebook and ticket open, attachments closed", () => {
    expect(initialScreen().order).toEqual(["rulebook", "ticket"]);
  });

  it("moves a window, letting it hang off the left and bottom", () => {
    const screen = initialScreen();

    const moved = screenReducer(screen, { type: "move", id: "ticket", x: 10, y: 20 });
    expect(moved.windows.ticket).toMatchObject({ x: 10, y: 20 });

    const hanging = screenReducer(screen, { type: "move", id: "ticket", x: -40, y: 200 });
    expect(hanging.windows.ticket).toMatchObject({ x: -40, y: 200 });
  });

  it("keeps the title bar and close button on screen", () => {
    const screen = initialScreen();
    const doc = screen.windows.vendorSheet;

    const farAway = screenReducer(screen, { type: "move", id: "vendorSheet", x: 9999, y: 9999 });
    expect(farAway.windows.vendorSheet).toMatchObject({
      x: REGIONS.screen.w - doc.w,
      y: REGIONS.screen.h - TASKBAR_H - TITLE_H,
    });

    const farBack = screenReducer(screen, { type: "move", id: "vendorSheet", x: -9999, y: -9999 });
    expect(farBack.windows.vendorSheet).toMatchObject({ x: MIN_VISIBLE - doc.w, y: 0 });
  });

  it("snaps to whole game pixels", () => {
    const moved = screenReducer(initialScreen(), { type: "move", id: "ticket", x: 10.4, y: 20.6 });
    expect(moved.windows.ticket).toMatchObject({ x: 10, y: 21 });
  });

  it("keeps the same state when a move changes nothing", () => {
    const screen = initialScreen();
    const { x, y } = screen.windows.ticket;
    expect(screenReducer(screen, { type: "move", id: "ticket", x: x + 0.2, y })).toBe(screen);
  });

  it("raises a window to the top of the stack", () => {
    const screen = initialScreen();
    expect(screenReducer(screen, { type: "raise", id: "rulebook" }).order).toEqual([
      "ticket",
      "rulebook",
    ]);
    expect(screenReducer(screen, { type: "raise", id: "ticket" })).toBe(screen);
  });

  it("opens attachments on top and puts them all away together", () => {
    let screen = screenReducer(initialScreen(), { type: "raise", id: "vendorSheet" });
    screen = screenReducer(screen, { type: "raise", id: "certificate" });
    expect(screen.order.slice(-2)).toEqual(["vendorSheet", "certificate"]);
    expect(screenReducer(screen, { type: "close", id: "certificate" }).order).not.toContain(
      "certificate",
    );
    expect(screenReducer(screen, { type: "closeAttachments" }).order).toEqual(
      initialScreen().order,
    );
  });

  it("opens the next ticket's files where they started", () => {
    let screen = screenReducer(initialScreen(), { type: "raise", id: "vendorSheet" });
    screen = screenReducer(screen, { type: "move", id: "vendorSheet", x: 0, y: 100 });
    screen = screenReducer(screen, { type: "closeAttachments" });
    expect(screen.windows).toEqual(initialScreen().windows);
  });

  it("closes the attachment on top with Escape, then the next, then nothing", () => {
    let screen = screenReducer(initialScreen(), { type: "raise", id: "vendorSheet" });
    screen = screenReducer(screen, { type: "raise", id: "certificate" });
    screen = screenReducer(screen, { type: "raise", id: "ticket" });

    screen = screenReducer(screen, { type: "closeTopAttachment" });
    expect(screen.order).toEqual(["rulebook", "vendorSheet", "ticket"]);
    screen = screenReducer(screen, { type: "closeTopAttachment" });
    expect(screen.order).toEqual(["rulebook", "ticket"]);
    expect(screenReducer(screen, { type: "closeTopAttachment" })).toBe(screen);
  });
});
