import { rng } from "@/game/generate";
import type { Gender, Person } from "@/game/types";

import {
  CLOTHS,
  EARRINGS,
  FRAMES,
  HAIR_COLORS,
  INK,
  LIPSTICKS,
  SHIRTS,
  SKIN_TONES,
  type Cloth,
  type HairColor,
  type Shirt,
  type SkinTone,
} from "./palette";
import {
  BEARDS,
  CUTS,
  EYES,
  GLASSES,
  HAIR_STYLES,
  MOUTHS,
  NOSES,
  type BeardId,
  type CutId,
  type EyesId,
  type GlassesId,
  type HairStyleId,
  type MouthId,
  type NoseId,
  type Tone,
} from "./parts";

/** Everything that tells one visitor from the next: which parts, in which colours. */
export type Look = {
  gender: Gender;
  skin: SkinTone;
  hair: HairColor;
  hairStyle: HairStyleId;
  eyes: EyesId;
  nose: NoseId;
  mouth: MouthId;
  beard: BeardId | null;
  glasses: GlassesId | null;
  frame: string;
  cut: CutId;
  cloth: Cloth;
  shirt: Shirt;
  /** Lipstick, or null for none. */
  lips: string | null;
  earrings: boolean;
  necklace: boolean;
  /** Earrings, a necklace, a hair tie. */
  accent: string;
};

/** A catalog's part ids. */
const keys = <K extends string>(parts: Record<K, unknown>) =>
  Object.keys(parts).filter((id): id is K => id in parts);

/** Parts made for this gender, or for anyone. */
const forGender = <K extends string>(parts: Record<K, { gender?: Gender }>, gender: Gender) =>
  keys(parts).filter((id) => (parts[id].gender ?? gender) === gender);

/** A stable number for a string (FNV-1a), so a person always gets the same look. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

/**
 * Puts a visitor together from parts. The look is seeded by their name, so the same person
 * always looks the same, and every part fits their gender.
 */
export function lookFor(person: Pick<Person, "name" | "gender">): Look {
  const r = rng(hash(person.name));
  const { gender } = person;
  const female = gender === "female";
  const hairStyle = r.pick(forGender(HAIR_STYLES, gender));
  const cut = r.pick(forGender(CUTS, gender));
  // Grey hair is for the few, not one visitor in seven.
  const hair = r.chance(0.12) ? HAIR_COLORS.at(-1)! : r.pick(HAIR_COLORS.slice(0, -1));

  return {
    gender,
    skin: r.pick(SKIN_TONES),
    hair,
    hairStyle,
    eyes: r.pick(keys(EYES)),
    nose: r.pick(keys(NOSES)),
    mouth: r.pick(keys(MOUTHS)),
    beard: !female && r.chance(0.5) ? r.pick(keys(BEARDS)) : null,
    glasses: r.chance(0.35) ? r.pick(keys(GLASSES)) : null,
    frame: r.pick(FRAMES),
    cut,
    cloth: r.pick(CLOTHS),
    shirt: r.pick(SHIRTS),
    lips: female && r.chance(0.5) ? r.pick(LIPSTICKS) : null,
    earrings: female && !(HAIR_STYLES[hairStyle].coversEars ?? false) && r.chance(0.7),
    necklace: (CUTS[cut].necklace ?? false) && r.chance(0.6),
    accent: r.pick(EARRINGS),
  };
}

/** Every tone and its colour in this look. */
function colours(look: Look): Record<string, string> {
  const sleeves = CUTS[look.cut].shirtSleeves
    ? { line: INK, base: look.shirt.base, deep: look.shirt.shade }
    : { line: look.cloth.line, base: look.cloth.shade, deep: look.cloth.deep };
  const ramps = {
    skin: look.skin,
    hair: look.hair,
    cloth: look.cloth,
    shirt: look.shirt,
    sleeve: sleeves,
  };
  return {
    ...Object.fromEntries(
      Object.entries(ramps).flatMap(([group, ramp]) =>
        Object.entries(ramp).map(([key, colour]) => [`${group}.${key}`, colour]),
      ),
    ),
    ink: INK,
    white: "#f1ecd9",
    pupil: "#2c3431",
    mouth: "#5a3c32",
    teeth: "#e8dfc8",
    glare: "#e9efe4",
    lip: look.lips ?? look.skin.deep,
    frame: look.frame,
    accent: look.accent,
  };
}

const cache = new WeakMap<Look, Record<string, string>>();

/** The colour a tone stands for in this look. */
export function paint(look: Look, tone: Tone): string {
  let table = cache.get(look);
  if (!table) cache.set(look, (table = colours(look)));
  return table[tone] ?? INK;
}
