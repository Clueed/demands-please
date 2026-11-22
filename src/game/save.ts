import type { GameState } from "./types";

/** Bump when `GameState` changes shape, so an old save starts a new run instead of breaking. */
const VERSION = 4;
/** Where runs are kept. Debug runs have their own slot, so they leave the real run alone. */
export type Slot = "run" | "debug";
const key = (slot: Slot) => `demands-pls:${slot}`;

type Storage = Pick<globalThis.Storage, "getItem" | "setItem">;

type Save = { version: typeof VERSION; game: GameState };

/** A save from this version. The game itself is trusted: only this file writes it. */
function isSave(value: unknown): value is Save {
  return (
    typeof value === "object" &&
    value !== null &&
    "version" in value &&
    value.version === VERSION &&
    "game" in value &&
    typeof value.game === "object" &&
    value.game !== null
  );
}

/** The run saved in this browser, or null if there's none or it can't be read. */
export function loadRun(storage: Storage, slot: Slot = "run"): GameState | null {
  try {
    const saved: unknown = JSON.parse(storage.getItem(key(slot)) ?? "null");
    if (isSave(saved)) return saved.game;
  } catch {
    // Unreadable save: start over.
  }
  return null;
}

/** Keep the run, so a reload carries on where it was. A full or blocked storage is ignored. */
export function saveRun(storage: Storage, game: GameState, slot: Slot = "run") {
  try {
    storage.setItem(key(slot), JSON.stringify({ version: VERSION, game } satisfies Save));
  } catch {
    // Playing on without a save beats breaking the game.
  }
}
