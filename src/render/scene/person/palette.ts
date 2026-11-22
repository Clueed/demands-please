/**
 * Colour ramps for the visitor's portrait. Every ramp runs from the lit side (`hi`, the window
 * is on the right) to the deepest shadow, so a part can be drawn once and recoloured freely.
 */

/** The ink every outline in the room is drawn in. */
export const INK = "#3a3530";

export type SkinTone = {
  hi: string;
  base: string;
  mid: string;
  shade: string;
  deep: string;
  dark: string;
};

export const SKIN_TONES: readonly SkinTone[] = [
  {
    hi: "#f0d6c0",
    base: "#e3c2a6",
    mid: "#d9b497",
    shade: "#cda587",
    deep: "#bd9273",
    dark: "#a07a5c",
  },
  {
    hi: "#dab49a",
    base: "#c8a487",
    mid: "#bf9c82",
    shade: "#b58f74",
    deep: "#aa8670",
    dark: "#90694f",
  },
  {
    hi: "#d4ae88",
    base: "#bf9670",
    mid: "#b48b66",
    shade: "#a8805c",
    deep: "#987250",
    dark: "#7c5b3e",
  },
  {
    hi: "#b88a66",
    base: "#9f7050",
    mid: "#946648",
    shade: "#875c40",
    deep: "#7a5238",
    dark: "#5e3d28",
  },
  {
    hi: "#94664a",
    base: "#7a5038",
    mid: "#704830",
    shade: "#64402a",
    deep: "#573724",
    dark: "#40271a",
  },
];

export type HairColor = { hi: string; base: string; shade: string };

export const HAIR_COLORS: readonly HairColor[] = [
  { hi: "#4f4b46", base: "#36322f", shade: "#262321" },
  { hi: "#5d594b", base: "#42413a", shade: "#33322d" },
  { hi: "#6b4f3c", base: "#52392b", shade: "#3e2a20" },
  { hi: "#8c6a48", base: "#735438", shade: "#5a402a" },
  { hi: "#a8653f", base: "#8a4b2e", shade: "#6b3522" },
  { hi: "#d9c28a", base: "#c2a66a", shade: "#a08550" },
  { hi: "#bdbab0", base: "#9a978c", shade: "#7c7a70" },
];

/** Cloth for jackets, jumpers and blouses, from the outline to the lit fold. */
export type Cloth = {
  line: string;
  deep: string;
  shade: string;
  base: string;
  light: string;
  hi: string;
};

export const CLOTHS: readonly Cloth[] = [
  {
    line: "#2f4442",
    deep: "#3c5551",
    shade: "#4f6964",
    base: "#5f7a72",
    light: "#6e8a7f",
    hi: "#7a958a",
  },
  {
    line: "#262f42",
    deep: "#323d55",
    shade: "#414e69",
    base: "#4f5d7a",
    light: "#5f6e8a",
    hi: "#6e7d98",
  },
  {
    line: "#2a2b2d",
    deep: "#37393c",
    shade: "#46484b",
    base: "#55575a",
    light: "#65676a",
    hi: "#75777a",
  },
  {
    line: "#3e2427",
    deep: "#522f33",
    shade: "#653b3e",
    base: "#77494a",
    light: "#87585a",
    hi: "#946667",
  },
  {
    line: "#4a3d1f",
    deep: "#6a5628",
    shade: "#826a32",
    base: "#977c3b",
    light: "#a98c48",
    hi: "#b89b58",
  },
  {
    line: "#33381f",
    deep: "#454b2a",
    shade: "#565d35",
    base: "#676e41",
    light: "#777f4e",
    hi: "#868d5b",
  },
  {
    line: "#362838",
    deep: "#47344a",
    shade: "#57425a",
    base: "#67516a",
    light: "#76607a",
    hi: "#846e87",
  },
  {
    line: "#4a3626",
    deep: "#644a33",
    shade: "#7a5c41",
    base: "#8c6c4e",
    light: "#9c7c5b",
    hi: "#a98a69",
  },
];

/** Shirts and tops worn under the cloth: collars, shirt fronts, a cardigan's inside. */
export type Shirt = { base: string; shade: string };

export const SHIRTS: readonly Shirt[] = [
  { base: "#c9cfbf", shade: "#9ea89a" },
  { base: "#dcdac9", shade: "#aeac9b" },
  { base: "#b9c6cf", shade: "#8e9ca6" },
  { base: "#d6bfb8", shade: "#ad968f" },
  { base: "#d6d0aa", shade: "#aba57f" },
];

export const LIPSTICKS: readonly string[] = ["#9a4a45", "#8a4050", "#a5584a"];

export const EARRINGS: readonly string[] = ["#d9b65a", "#c9cfbf", "#9fc4c0"];

/** Frame colours for glasses. */
export const FRAMES: readonly string[] = [INK, "#6b4a3a", "#8a8f86", "#7a3e3a"];
