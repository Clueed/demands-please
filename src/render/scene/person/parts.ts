/**
 * The pieces a visitor is put together from. Each piece is a list of shapes, each painted
 * with a `Tone`: a slot in the visitor's colours rather than a fixed colour, so one drawing
 * serves every skin tone, hair colour and outfit.
 *
 * Bodies and arms are in visitor coordinates. Heads, hair and faces are in head coordinates:
 * the face spans x 46–96 and y 82–146, the ears sit at y 100–114.
 */
import type { Gender } from "@/game/types";

import type { Cloth, HairColor, Shirt, SkinTone } from "./palette";

export type Tone =
  | `skin.${keyof SkinTone}`
  | `hair.${keyof HairColor}`
  | `cloth.${keyof Cloth}`
  | `shirt.${keyof Shirt}`
  | `sleeve.${"line" | "base" | "deep"}`
  | "ink"
  | "white"
  | "pupil"
  | "mouth"
  | "teeth"
  | "lip"
  | "frame"
  | "glare"
  | "accent";

export type Shape = readonly [tone: Tone, d: string];

// ---------------------------------------------------------------------------------------------
// Hair

export type HairStyle = {
  gender: Gender;
  /** Hair that falls behind the shoulders, drawn before the body. */
  back?: Shape[];
  /** Drawn behind the face: the hair's outline, a bun. */
  under: Shape[];
  /** On top of the face. */
  front: Shape[];
  /** Hair over the ears hides earrings. */
  coversEars?: boolean;
};

export type HairStyleId =
  | "swept"
  | "crop"
  | "bald"
  | "curly"
  | "parted"
  | "bob"
  | "long"
  | "ponytail"
  | "bun"
  | "pixie"
  | "curls";

export const HAIR_STYLES: Record<HairStyleId, HairStyle> = {
  swept: {
    gender: "male",
    under: [["ink", "M40 100V70h14v-4h42v8h6v26Z"]],
    front: [
      ["hair.base", "M42 98h8V86h12v-6h30v6h4v14h4V76h-6v-8H56v4H42Z"],
      ["hair.hi", "M50 76h12v-4h28v4H66v6H50Z"],
      ["hair.shade", "M92 70h6v6h-6Z"],
      ["skin.shade", "M50 86h12v2H50Zm12-6h30v2H62Zm30 6h4v2h-4Z"],
    ],
  },
  crop: {
    gender: "male",
    under: [["ink", "M40 100V76h4v-4h54v4h4v24Z"]],
    front: [
      ["hair.base", "M42 98V78h4v-4h50v4h4v20h-4V84H46v14Z"],
      ["hair.hi", "M50 76h24v2H50Z"],
      ["skin.shade", "M46 84h50v2H46Z"],
    ],
  },
  bald: {
    gender: "male",
    under: [["ink", "M46 76h50v4H46ZM40 100V84h4v16Zm62 0V84h-4v16Z"]],
    front: [
      ["skin.base", "M48 78h46v4H48Z"],
      ["skin.hi", "M58 82h12v2H58Z"],
      ["hair.base", "M42 98V86h4v12Zm58 0V86h-4v12Z"],
    ],
  },
  curly: {
    gender: "male",
    under: [["ink", "M40 100V76h2v-4h4v-4h8v-2h40v2h4v4h4v4h2v24Z"]],
    front: [
      [
        "hair.base",
        "M42 98V78h2v-4h4v-4h8v-2h8v2h6v-2h8v2h6v-2h8v2h2v4h4v4h2v20h-4V86h-4v-2H52v2h-6v12Z",
      ],
      ["hair.hi", "M50 72h4v2h-4Zm14 0h4v2h-4Zm14 0h4v2h-4Zm12 4h4v2h-4ZM46 80h4v2h-4Z"],
      ["hair.shade", "M46 86h6v2h-6Zm36-2h8v2h-8Z"],
      ["skin.shade", "M52 86h44v2H52Z"],
    ],
  },
  parted: {
    gender: "male",
    under: [["ink", "M40 100V76h4v-4h56v4h4v24Z"]],
    front: [
      ["hair.base", "M42 98V78h4v-4h52v4h4v20h-4V86H72v-2H46v14Z"],
      ["hair.shade", "M66 74h4v8h-4Z"],
      ["hair.hi", "M72 76h20v2H72Zm-22 0h12v2H50Z"],
      ["skin.shade", "M46 86h26v2H46Z"],
    ],
  },
  bob: {
    gender: "female",
    coversEars: true,
    under: [["ink", "M36 138V78h4v-6h6v-4h50v4h6v6h4v60h-10V90H46v48Z"]],
    front: [
      ["hair.base", "M38 136V80h4v-6h6v-2h46v2h6v6h4v56h-8V92h-2v-4H80v-4H62v4H50v4h-2v44Z"],
      ["hair.hi", "M50 76h20v2H50Zm-8 6h2v24h-2Z"],
      ["hair.shade", "M46 98h2v36h-2Zm50 0h2v36h-2Z"],
      ["skin.shade", "M50 88h12v2H50Zm12-4h18v2H62Zm18 4h14v2H80Z"],
    ],
  },
  long: {
    gender: "female",
    coversEars: true,
    back: [
      ["ink", "M34 178V80h70v98h-12l-2-2H48l-2 2Z"],
      ["hair.shade", "M36 176V82h66v94h-8l-4-2H50l-4 2Z"],
    ],
    under: [["ink", "M36 162V78h4v-6h6v-4h50v4h6v6h4v84h-10V92H46v70Z"]],
    front: [
      [
        "hair.base",
        "M38 160V80h4v-6h6v-2h46v2h6v6h4v80h-4v-4h-4V92h-2v-4H76v-4h-2v4H50v4h-2v64h-4v4Z",
      ],
      ["hair.hi", "M52 76h14v2H52Zm26 0h14v2H78ZM42 90h2v50h-2Z"],
      ["hair.shade", "M46 96h2v56h-2Zm50 0h2v56h-2Z"],
      ["skin.shade", "M50 88h24v2H50Zm26 0h18v2H76Z"],
    ],
  },
  ponytail: {
    gender: "female",
    back: [
      ["ink", "M96 86h10v4h4v24h-2v16h-4v6h-6V86Z"],
      ["hair.base", "M98 88h6v4h4v20h-2v16h-4v4h-2V88Z"],
      ["hair.shade", "M100 112h4v16h-2v4h-2Z"],
    ],
    under: [["ink", "M40 100V78h4v-6h8v-2h38v2h8v6h4v22Z"]],
    front: [
      ["hair.base", "M42 98V80h4v-6h8v-2h34v2h8v6h4v18h-4V88h-6v-4H58v4h-8v10Z"],
      ["hair.hi", "M54 74h16v2H54Z"],
      ["accent", "M98 86h4v6h-4Z"],
      ["skin.shade", "M50 88h8v2h-8Zm8-4h30v2H58Zm30 4h6v2h-6Z"],
    ],
  },
  bun: {
    gender: "female",
    under: [
      ["ink", "M40 100V78h4v-6h8v-2h38v2h8v6h4v22ZM58 58h26v4h4v12H54V62h4Z"],
      ["hair.base", "M60 60h22v4h4v8H56v-8h4Z"],
      ["hair.hi", "M62 62h8v2h-8Z"],
    ],
    front: [
      ["hair.base", "M42 98V80h4v-6h8v-2h34v2h8v6h4v18h-4V88h-6v-4H58v4h-8v10Z"],
      ["hair.shade", "M56 70h30v2H56Z"],
      ["hair.hi", "M54 74h16v2H54Z"],
      ["skin.shade", "M50 88h8v2h-8Zm8-4h30v2H58Zm30 4h6v2h-6Z"],
    ],
  },
  pixie: {
    gender: "female",
    under: [["ink", "M40 100V78h4v-6h6v-2h44v2h6v6h4v22Z"]],
    front: [
      ["hair.base", "M42 98V80h4v-6h6v-2h40v2h6v6h4v18h-4V86H80v2H66v2h-8v2h-6v4h-4v2Z"],
      ["hair.hi", "M54 74h20v2H54Zm-6 8h20v2H48Z"],
      ["skin.shade", "M52 96h6v2h-6Zm6-4h8v2h-8Zm8-2h14v2H66Zm14-2h18v2H80Z"],
    ],
  },
  curls: {
    gender: "female",
    coversEars: true,
    back: [
      ["ink", "M32 172V80h4v-6h70v6h4v92h-10v-4h-6v4H48v-4h-6v4Z"],
      ["hair.shade", "M34 170V82h4v-6h66v6h4v88h-6v-4h-6v4H46v-4h-6v4Z"],
    ],
    under: [["ink", "M34 142V78h2v-4h4v-4h6v-4h8v-2h34v2h8v4h6v4h4v4h2v64h-12V94H48v48Z"]],
    front: [
      [
        "hair.base",
        "M36 140V80h2v-4h4v-4h6v-4h8v-2h30v2h8v4h6v4h4v4h2v60h-4v-4h-2v4h-4V92h-4v-4h-6v-2H62v2h-8v2h-6v4h-2v46h-4v-4h-2v4Z",
      ],
      [
        "hair.hi",
        "M44 76h4v2h-4Zm14-8h4v2h-4Zm18 0h4v2h-4Zm16 4h4v2h-4ZM40 92h2v4h-2Zm0 20h2v4h-2Zm62-20h2v4h-2Zm0 20h2v4h-2Z",
      ],
      ["hair.shade", "M46 96h2v42h-2Zm50 0h2v40h-2Z"],
      ["skin.shade", "M48 94h6v2h-6Zm6-4h8v2h-8Zm8-2h24v2H62Zm24 2h6v2h-6Z"],
    ],
  },
};

// ---------------------------------------------------------------------------------------------
// Face

/** The bare head: ears, outline, face and its shading. */
export const HEAD: Shape[] = [
  ["ink", "M38 98h8v18h-8Zm58 0h8v18h-8Z"],
  ["ink", "M44 80h54v56l-16 12H60l-16-12Z"],
  ["skin.deep", "M40 100h6v14h-6Z"],
  ["skin.mid", "M96 100h6v14h-6Z"],
  ["skin.dark", "M42 104h2v6h-2Z"],
  ["skin.deep", "M98 104h2v6h-2Z"],
  ["skin.base", "M46 82h50v54l-14 10H60l-14-10Z"],
  // Light from the window on the right: form shadow down the left and jaw.
  ["skin.shade", "M46 90h4v36h2v8l10 8h18v2H60l-14-10Z"],
  ["skin.mid", "M50 118h6v2h-6Zm34-2h6v2h-6Z"],
];

export type Eyes = {
  open: Shape[];
  /** Covers the open eyes for a blink. */
  blink: Shape[];
  /** A dark tick at the outer corner of each eye. */
  lashes: string;
};

const blink = (lid: string, line: string): Shape[] => [
  ["skin.shade", lid],
  ["hair.shade", line],
];

export const EYES = {
  /** A hopeful half-squint on the near side, wide open on the far side, one brow cocked. */
  hopeful: {
    open: [
      ["hair.shade", "M52 98h6v2h-6Zm6-2h6v2h-6Zm22-4h4v2h-4Zm4-2h6v2h-6Zm6 2h4v2h-4Z"],
      ["white", "M54 104h8v4h-8Zm26-2h8v6h-8Z"],
      ["skin.deep", "M54 102h8v2h-8Z"],
      ["pupil", "M56 104h4v4h-4Zm26-2h4v6h-4Z"],
      ["white", "M84 102h2v2h-2Z"],
    ],
    blink: blink("M54 102h8v4h-8Zm26-2h8v6h-8Z", "M54 106h8v2h-8Zm26 0h8v2h-8Z"),
    lashes: "M52 102h2v2h-2Zm36-2h2v2h-2Z",
  },
  /** Wide open, brows up: this is a very exciting app. */
  wide: {
    open: [
      ["hair.shade", "M52 96h10v2H52Zm28-2h10v2H80Z"],
      ["white", "M54 102h8v6h-8Zm26 0h8v6h-8Z"],
      ["pupil", "M56 104h4v4h-4Zm26 0h4v4h-4Z"],
      ["white", "M58 104h2v2h-2Zm26 0h2v2h-2Z"],
    ],
    blink: blink("M54 102h8v4h-8Zm26 0h8v4h-8Z", "M54 106h8v2h-8Zm26 0h8v2h-8Z"),
    lashes: "M52 102h2v2h-2Zm36 0h2v2h-2Z",
  },
  /** Heavy lids and bags: this request has been a long time coming. */
  tired: {
    open: [
      ["hair.shade", "M52 98h10v2H52Zm28 0h10v2H80Z"],
      ["skin.shade", "M54 102h8v2h-8Zm26 0h8v2h-8ZM54 110h8v2h-8Zm26 0h8v2h-8Z"],
      ["white", "M54 104h8v4h-8Zm26 0h8v4h-8Z"],
      ["pupil", "M56 104h4v4h-4Zm28 0h4v4h-4Z"],
    ],
    blink: blink("M54 104h8v2h-8Zm26 0h8v2h-8Z", "M54 106h8v2h-8Zm26 0h8v2h-8Z"),
    lashes: "M52 104h2v2h-2Zm36 0h2v2h-2Z",
  },
  /** Brows knitted up in the middle: please. */
  pleading: {
    open: [
      ["hair.shade", "M52 98h4v2h-4Zm4-2h6v2h-6Zm24 0h6v2h-6Zm6 2h4v2h-4Z"],
      ["white", "M54 104h8v4h-8Zm26 0h8v4h-8Z"],
      ["pupil", "M58 104h4v4h-4Zm26 0h4v4h-4Z"],
      ["white", "M58 104h2v2h-2Z"],
    ],
    blink: blink("M54 104h8v2h-8Zm26 0h8v2h-8Z", "M54 106h8v2h-8Zm26 0h8v2h-8Z"),
    lashes: "M52 104h2v2h-2Zm36 0h2v2h-2Z",
  },
} satisfies Record<string, Eyes>;

export type EyesId = keyof typeof EYES;

export const NOSES = {
  straight: "M70 106h4v10h4v4h-8Z",
  button: "M72 110h2v6h4v4h-8v-2h2Z",
  long: "M70 104h4v14h4v2h-8Z",
  broad: "M70 108h4v8h6v4H66v-4h4Z",
} satisfies Record<string, string>;

export type NoseId = keyof typeof NOSES;

export type Mouth = {
  shapes: Shape[];
  /** The lower lip: lipstick, or a soft shadow without. */
  lower: string;
};

export const MOUTHS = {
  /** Lopsided and slightly too eager. */
  eager: {
    shapes: [
      ["mouth", "M64 126h12v-2h4v-2h2v4l-4 4H66l-2-2Z"],
      ["teeth", "M68 126h8v2h-8Z"],
    ],
    lower: "M66 132h10v2H66Z",
  },
  grin: {
    shapes: [
      ["mouth", "M62 124h20v2l-2 4H64l-2-4Z"],
      ["teeth", "M64 124h16v2H64Z"],
    ],
    lower: "M64 130h16v2H64Z",
  },
  polite: {
    shapes: [["mouth", "M62 124h2v2h16v-2h2v2l-2 2H64l-2-2Z"]],
    lower: "M66 128h12v2H66Z",
  },
  smirk: {
    shapes: [["mouth", "M64 128h14v-2h4v-2h2v4l-2 2H64Z"]],
    lower: "M66 130h12v2H66Z",
  },
  nervous: {
    shapes: [["mouth", "M64 126h4v2h4v-2h4v2h4v-2h2v2h-2v2h-4v-2h-4v2h-4v-2h-4Z"]],
    lower: "M66 130h12v2H66Z",
  },
} satisfies Record<string, Mouth>;

export type MouthId = keyof typeof MOUTHS;

const MOUSTACHE: Shape = ["hair.base", "M62 120h20v2h2v2h-4v-2H64v2h-4v-2h2Z"];

/** Stubble: a sparse stipple over the jaw, skipping the mouth. */
function stipple(): string {
  let d = "";
  for (let y = 118; y < 144; y += 4)
    for (let x = 48 + ((y / 4) % 2) * 2; x < 94; x += 4) {
      const onJaw = y >= 128 || x < 58 || x > 86;
      const onFace = y < 136 || (x >= 60 - (144 - y) && x <= 82 + (144 - y));
      if (onJaw && onFace) d += `M${x} ${y}h2v2h-2Z`;
    }
  return d;
}

export const BEARDS = {
  moustache: [MOUSTACHE],
  full: [
    ["hair.base", "M46 116h4v12l10 8h22l12-8v-12h4v22l-14 10H60l-14-10ZM62 128h20v8H62Z"],
    ["hair.shade", "M46 116h2v20l12 10h-2l-12-10Z"],
    MOUSTACHE,
  ],
  goatee: [["hair.base", "M64 130h16v6l-2 2H66l-2-2Z"], MOUSTACHE],
  stubble: [["skin.deep", stipple()]],
} satisfies Record<string, Shape[]>;

export type BeardId = keyof typeof BEARDS;

/** A rectangular frame as four bars, `round` dropping the corners. */
function frame(x: number, y: number, w: number, h: number, round: boolean): string {
  const c = round ? 2 : 0;
  return (
    `M${x + c} ${y}h${w - 2 * c}v2h${2 * c - w}Z` +
    `M${x + c} ${y + h - 2}h${w - 2 * c}v2h${2 * c - w}Z` +
    `M${x} ${y + 2}h2v${h - 4}h-2Z` +
    `M${x + w - 2} ${y + 2}h2v${h - 4}h-2Z`
  );
}

const glasses = (round: boolean): Shape[] => [
  ["frame", frame(50, 100, 16, 12, round) + frame(76, 100, 16, 12, round)],
  ["frame", "M66 104h10v2H66ZM44 104h6v2h-6Zm48 0h4v2h-4Z"],
  ["glare", "M78 102h2v2h-2Zm-26 0h2v2h-2Z"],
];

export const GLASSES = { square: glasses(false), round: glasses(true) } satisfies Record<
  string,
  Shape[]
>;

export type GlassesId = keyof typeof GLASSES;

export const EARRINGS: Shape[] = [["accent", "M42 116h2v4h-2Zm56 0h2v4h-2Z"]];

// ---------------------------------------------------------------------------------------------
// Body

/** The torso in cloth, lit from the window on the right. */
const torso = (line: Tone, base: Tone, shade: Tone, light: Tone, fold: Tone): Shape[] => [
  [line, "M48 146h50l28 16 12 46 4 106H6l4-106 14-46Z"],
  [base, "M46 150h52l24 18 8 90-6 56H24l-6-56 10-90Z"],
  [shade, "M48 152h18v162H28l-4-110 8-34Z"],
  [light, "M90 152h12l18 18 10 88-6 56H90Z"],
  // Folds at the armpits and the elbows, so the forearms read, and at the waist.
  [fold, "M26 196h6v2h-2v10h-4Zm96 0h-6v2h2v10h4ZM22 238h8v2h-6v6h-2Zm104 0h-8v2h6v6h2Z"],
  [shade, "M36 262h14v2H36Zm62 6h14v2H98Z"],
];

const CLOTH_TORSO = torso("cloth.line", "cloth.base", "cloth.shade", "cloth.light", "cloth.deep");
const NECK: Shape[] = [
  ["skin.shade", "M58 128h32v32l-16 16-16-16Z"],
  ["skin.dark", "M58 130h32v14H66Z"],
];
const SHORT_NECK: Shape[] = [
  ["skin.shade", "M58 128h32v24H58Z"],
  ["skin.dark", "M58 130h32v12H66Z"],
];
const COLLAR: Shape[] = [
  ["shirt.base", "M48 150l10-6 16 26-16 16-16-26Zm44-6 10 10-10 28-18-12Z"],
  ["shirt.shade", "M56 146l18 24-2 4-18-24Zm36-2 2 4-20 24-2-4Z"],
];

export type Cut = {
  gender?: Gender;
  shapes: Shape[];
  /** Whether the forearms are in the shirt rather than the cloth. */
  shirtSleeves?: boolean;
  /** Room for a necklace at the neckline. */
  necklace?: boolean;
};

export type CutId = "blazer" | "jumper" | "turtleneck" | "shirtAndTie" | "cardigan" | "blouse";

export const CUTS: Record<CutId, Cut> = {
  blazer: {
    shapes: [
      ...CLOTH_TORSO,
      ...NECK,
      ["cloth.deep", "M38 156h4l22 72h-4Zm72 0h-4l-22 72h4Z"],
      ["cloth.hi", "M42 156h4l20 66h-2Zm64 0h-4l-20 66h2Z"],
      ...COLLAR,
    ],
  },
  jumper: {
    shapes: [
      ...CLOTH_TORSO,
      ...SHORT_NECK,
      ["shirt.base", "M54 146h12l-4 10h-4Zm28 0h12l-4 10h-4Z"],
      ["cloth.deep", "M52 148h44v4l-4 6H56l-4-6Z"],
      ["cloth.shade", "M60 152h2v4h-2Zm6 0h2v4h-2Zm6 0h2v4h-2Zm6 0h2v4h-2Zm6 0h2v4h-2Z"],
    ],
  },
  turtleneck: {
    shapes: [
      ...CLOTH_TORSO,
      ["cloth.line", "M56 126h36v28H56Z"],
      ["cloth.base", "M58 128h32v24H58Z"],
      ["cloth.shade", "M58 128h8v24h-8Z"],
      ["cloth.deep", "M58 136h32v2H58Zm0 6h32v2H58Zm0 6h32v2H58Z"],
    ],
  },
  shirtAndTie: {
    gender: "male",
    shirtSleeves: true,
    shapes: [
      ...torso("ink", "shirt.base", "shirt.shade", "shirt.base", "shirt.shade"),
      ...NECK,
      ["cloth.line", "M70 160h8l2 4-2 50-4 6-4-6-2-50Z"],
      ["cloth.base", "M72 162h4l2 2-2 48-2 4-2-4-2-48Z"],
      ["cloth.light", "M72 162h4v4h-4Z"],
      ["shirt.shade", "M48 150l10-6 16 26-16 16-16-26Zm44-6 10 10-10 28-18-12Z"],
      ["shirt.base", "M52 152l6-4 12 20-12 12-10-16Zm36-4 6 6-8 22-12-8Z"],
    ],
  },
  cardigan: {
    shapes: [
      ...CLOTH_TORSO,
      ...SHORT_NECK,
      ["shirt.base", "M56 148h8l4 4h12l4-4h8l-14 84h-8Z"],
      ["shirt.shade", "M64 150h4v2h12v-2h4l-2 4H66Z"],
      ["cloth.deep", "M54 148h4l14 84h-2Zm40 0h-4l-14 84h2Z"],
      ["cloth.hi", "M72 240h4v2h-4Zm0 14h4v2h-4Zm0 14h4v2h-4Z"],
    ],
  },
  blouse: {
    gender: "female",
    necklace: true,
    shapes: [
      ...CLOTH_TORSO,
      ["skin.shade", "M58 128h32v32l-6 6H64l-6-6Z"],
      ["skin.dark", "M58 130h32v12H66Z"],
      ["skin.deep", "M62 156h6v2h-6Zm18 0h6v2h-6Z"],
      ["cloth.light", "M56 150h2v10l6 8h20l6-8v-10h2v10l-8 10H64l-8-10Z"],
    ],
  },
};

export const NECKLACE: Shape[] = [
  ["accent", "M60 152h2v6h2v4h4v2h-4v-2h-2v-4h-2ZM86 152h2v6h-2v4h-2v2h-4v-2h4v-4h2Z"],
  ["accent", "M72 164h4v4h-4Z"],
];

/** Forearms reaching to the desk, outlined so the hands clearly belong to them. */
export const FOREARMS: Shape[] = [
  ["sleeve.line", "M24 208l8 66 20 18-6 24H10l4-84Zm100 0-8 66-20 18 6 24h36l-4-84Z"],
  ["sleeve.base", "M26 212l6 62 16 16-4 24H14l4-82Zm96 0-6 62-16 16 4 24h30l-4-82Z"],
  ["sleeve.deep", "M28 240h2l2 30h-2Zm90 0h2l-2 30h-2Z"],
];

/** A hand gripping the printout's left edge. The right hand is its mirror image. */
export const HAND: Shape[] = [
  ["ink", "M34 286h16v22h-8l-8-8Z"],
  ["skin.mid", "M36 288h12v18h-6l-6-6Z"],
  ["skin.base", "M44 290h6v2h-6Zm0 4h6v2h-6Zm0 4h6v2h-6Z"],
  ["skin.hi", "M46 284h4v8h-4Z"],
  ["skin.deep", "M36 300l6 6h6v2h-8l-6-6Z"],
];
