import { describe, expect, it } from "vitest";

import { decide, newGame, startDay } from "./engine";
import { loadRun, saveRun } from "./save";

function memoryStorage() {
  const items = new Map<string, string>();
  return {
    items,
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  };
}

describe("save", () => {
  it("has no run before anything is saved", () => {
    expect(loadRun(memoryStorage())).toBeNull();
  });

  it("gives back the run as it was saved", () => {
    const storage = memoryStorage();
    const game = decide(startDay(newGame(7)), { kind: "decline" });
    saveRun(storage, game);
    expect(loadRun(storage)).toEqual(game);
  });

  it("keeps debug runs apart from the real run", () => {
    const storage = memoryStorage();
    const real = newGame(1);
    const debug = newGame(2);
    saveRun(storage, real);
    saveRun(storage, debug, "debug");
    expect(loadRun(storage)).toEqual(real);
    expect(loadRun(storage, "debug")).toEqual(debug);
  });

  it("ignores a save it can't read or from another version", () => {
    const storage = memoryStorage();
    storage.setItem("demands-pls:run", "{not json");
    expect(loadRun(storage)).toBeNull();
    storage.setItem("demands-pls:run", JSON.stringify({ version: 0, game: newGame(1) }));
    expect(loadRun(storage)).toBeNull();
  });

  it("keeps playing when storage refuses the save", () => {
    const full = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    };
    expect(() => saveRun(full, newGame(1))).not.toThrow();
  });
});
