import { CATALOG } from "@/game/data";
import type { Resolution } from "@/game/types";

/** What the stamp on a decided ticket says. */
export function stampOf(resolution: Resolution) {
  const d = resolution.decision;
  if (d.kind === "approve") return "Approved";
  if (d.kind === "decline") return "Declined";
  return `Offered ${CATALOG.find((a) => a.id === d.appId)?.name ?? ""}`;
}
