export { cn } from "cn";

/** `n` limited to the range `[min, max]`. */
export const clamp = (n: number, min: number, max: number) => Math.min(Math.max(min, n), max);
