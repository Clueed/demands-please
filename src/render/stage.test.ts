import { describe, expect, it } from "vitest";

import { fitStage, STAGE_MAX, STAGE_MIN, toGamePx } from "./stage";

describe("fitStage", () => {
  it("fills 16:9 viewports at the smallest size, at any zoom", () => {
    expect(fitStage(1920, 1080)).toEqual({ width: 640, height: 360, cssPx: 3, left: 0, top: 0 });
    expect(fitStage(1600, 900)).toMatchObject({ width: 640, height: 360, cssPx: 2.5 });
    expect(fitStage(320, 180)).toMatchObject({ width: 640, height: 360, cssPx: 0.5 });
  });

  it("grows wider for wide viewports, filling them", () => {
    const fit = fitStage(2560, 1080); // 21:9
    expect(fit).toMatchObject({ height: STAGE_MIN.height, cssPx: 3, top: 0 });
    expect(fit.width).toBe(Math.ceil(2560 / 3));
    expect(fit.width * fit.cssPx).toBeGreaterThanOrEqual(2560);
    expect(fit.left).toBeLessThanOrEqual(0);
    expect(fit.left).toBeGreaterThan(-fit.cssPx);
  });

  it("grows taller for narrower viewports, filling them", () => {
    const fit = fitStage(1280, 960); // 4:3
    expect(fit).toMatchObject({ width: STAGE_MIN.width, height: 480, cssPx: 2, left: 0, top: 0 });
  });

  it("stops growing at the limits and centres the rest", () => {
    const ultrawide = fitStage(4000, 360);
    expect(ultrawide).toMatchObject({ width: STAGE_MAX.width, height: 360, cssPx: 1, top: 0 });
    expect(ultrawide.left).toBe((4000 - STAGE_MAX.width) / 2);

    const portrait = fitStage(640, 1000);
    expect(portrait).toMatchObject({ width: 640, height: STAGE_MAX.height, cssPx: 1, left: 0 });
    expect(portrait.top).toBe((1000 - STAGE_MAX.height) / 2);
  });
});

describe("toGamePx", () => {
  it("maps pointer positions to whole game pixels", () => {
    const fit = fitStage(1920, 1080);
    expect(toGamePx(fit, 0, 0)).toEqual({ x: 0, y: 0 });
    expect(toGamePx(fit, 5, 8)).toEqual({ x: 1, y: 2 });
    expect(toGamePx(fit, 1919, 1079)).toEqual({ x: 639, y: 359 });
  });

  it("accounts for the bars at fractional zoom", () => {
    const fit = fitStage(4000, 900); // past the widest limit, zoom 2.5
    expect(toGamePx(fit, fit.left + 2.5 * 10, 2.5 * 4)).toEqual({ x: 10, y: 4 });
  });
});
