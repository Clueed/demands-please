import { describe, expect, it } from "vitest";

import { STAFF } from "@/game/data";

import { lookFor } from "./look";
import { CUTS, HAIR_STYLES } from "./parts";

const everyone = Object.values(STAFF).flat();

describe("lookFor", () => {
  it("gives the same person the same look every time", () => {
    for (const person of everyone) expect(lookFor(person)).toEqual(lookFor(person));
  });

  it("only uses parts that fit the person's gender", () => {
    const misfits = everyone.filter((person) => {
      const look = lookFor(person);
      const male = person.gender === "male";
      return (
        HAIR_STYLES[look.hairStyle].gender !== person.gender ||
        (CUTS[look.cut].gender ?? person.gender) !== person.gender ||
        (male ? look.lips !== null || look.earrings : look.beard !== null)
      );
    });
    expect(misfits).toEqual([]);
  });

  it("tells the staff apart", () => {
    const looks = new Set(everyone.map((p) => JSON.stringify(lookFor(p))));
    expect(looks.size).toBe(everyone.length);
  });
});
