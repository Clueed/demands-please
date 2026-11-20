import { createContext, use } from "react";

import type { StageFit } from "./stage";

export const StageFitContext = createContext<StageFit | null>(null);

/** The current zoom, for converting pointer movement to game pixels. */
export function useFit(): StageFit {
  const fit = use(StageFitContext);
  if (!fit) throw new Error("useFit must be used inside <Stage>");
  return fit;
}
