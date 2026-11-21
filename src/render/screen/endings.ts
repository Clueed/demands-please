import { FINDINGS_LIMIT, LAST_DAY } from "@/game/time";
import type { GameState } from "@/game/types";

type Ending = { title: string; from: string; text: (state: GameState) => string };

/** How a run ends, by what ended it. Nobody gets fired; the process changes hands. */
export const ENDINGS: Record<"audit" | "shadowIT" | "won", Ending> = {
  audit: {
    title: "Audit review",
    from: "Memo from internal audit",
    text: () =>
      `${FINDINGS_LIMIT} open findings on software approvals. The CIO pauses the demand ` +
      `process: until it's fixed, the steering committee signs off every request itself.`,
  },
  shadowIT: {
    title: "Shadow IT",
    from: "Memo from the CFO",
    text: (state) =>
      `${state.queue.length} request${state.queue.length === 1 ? " was" : "s were"} still waiting at closing time, so the business ` +
      `stopped waiting. Departments bought their own tools on company credit cards, and ` +
      `nobody knows what runs where.`,
  },
  won: {
    title: "The process runs",
    from: "Memo from the CIO",
    text: (state) =>
      `${LAST_DAY} days of requests, no shadow IT, and ` +
      (state.findings === 0
        ? "a clean audit."
        : `only ${state.findings} open finding${state.findings === 1 ? "" : "s"} for audit.`) +
      " The business keeps asking, and the demand process keeps up.",
  },
};
