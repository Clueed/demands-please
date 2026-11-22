import { useEffect, useReducer, useRef, useState } from "react";

import { parseSeed, seedRun, type SeedOptions } from "@/game/debug";
import {
  currentDemand,
  decide,
  haveCoffee,
  newGame,
  next,
  nextDay,
  startDay,
  tick,
} from "@/game/engine";
import { verdict } from "@/game/rules";
import { loadRun, saveRun, type Slot } from "@/game/save";
import { MS_PER_GAME_MINUTE } from "@/game/time";
import type { Decision, GameState } from "@/game/types";
import { Room } from "@/render/scene/Room";
import { Screen } from "@/render/scene/Screen";
import { Visitor } from "@/render/scene/Visitor";
import { Stage } from "@/render/Stage";
import { TitleScreen } from "@/render/TitleScreen";

type Action =
  | { type: "start" }
  | { type: "decide"; decision: Decision }
  | { type: "next" }
  | { type: "tick"; minutes: number }
  | { type: "nextDay" }
  | { type: "coffee" }
  | { type: "restart" }
  /** Swap in a whole run, e.g. a seeded one from the debug console. */
  | { type: "load"; game: GameState };

/** `round` counts restarts, so presentation state (where windows sit) can start fresh too. */
type AppState = { game: GameState; round: number };

const query = new URLSearchParams(window.location.search);

/**
 * Debug mode. `?day=4&ticket=2&findings=1` (see `SeedOptions`) seeds a run at that point;
 * `?debug` alone carries on with the last debug run. Add `&freeze` to stop the game clock. Debug runs save to their own slot, so
 * the real run is left alone, and `window.demands` drives them from the console.
 */
const seedOptions = parseSeed(query);
const debug = seedOptions !== null || query.has("debug");
/** `?freeze` (debug only) stops the game clock, to look at a moment for as long as you like. */
const frozen = debug && query.has("freeze");
const slot: Slot = debug ? "debug" : "run";

if (seedOptions) {
  // Down to `?debug`, so a reload carries on with the seeded run rather than seeding again.
  const url = new URL(window.location.href);
  url.search = frozen ? "?debug&freeze" : "?debug";
  window.history.replaceState(null, "", url);
}

/** A fresh run, or in debug mode a fresh one seeded where the URL said. */
const startGame = (round = 0): AppState => ({
  game: seedOptions ? seedRun(seedOptions) : newGame(Math.floor(Math.random() * 2 ** 32)),
  round,
});

/** Carry on with the saved run, if there is one. There's only ever the one run per slot. */
function resumeGame(): AppState {
  const saved = seedOptions ? null : loadRun(localStorage, slot);
  return saved ? { game: saved, round: 0 } : startGame();
}

function step(
  game: GameState,
  action: Exclude<Action, { type: "restart" } | { type: "load" }>,
): GameState {
  if (action.type === "decide") return decide(game, action.decision);
  if (action.type === "tick") return tick(game, action.minutes);
  const moves = { start: startDay, next, nextDay, coffee: haveCoffee };
  return moves[action.type](game);
}

function reducer(state: AppState, action: Action): AppState {
  if (action.type === "restart") return startGame(state.round + 1);
  if (action.type === "load") return { game: action.game, round: state.round + 1 };
  const game = step(state.game, action);
  return game === state.game ? state : { ...state, game };
}

/** Real time per game minute on a break: the clock runs at the speed of a wall clock. */
const MS_PER_REAL_MINUTE = 60_000;

/**
 * Runs the game clock while the day is on, `msPerMinute` real ms to a game minute.
 * A hidden tab stops it.
 */
function useGameClock(running: boolean, msPerMinute: number, dispatch: (action: Action) => void) {
  useEffect(() => {
    if (!running) return undefined;
    let last = performance.now();
    let frame = requestAnimationFrame(function loop(now) {
      // Capped, so coming back to the tab doesn't fast-forward the day.
      const ms = Math.min(now - last, 250);
      last = now;
      dispatch({ type: "tick", minutes: ms / msPerMinute });
      frame = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(frame);
  }, [running, msPerMinute, dispatch]);
}

/** How often (real ms) the running clock alone is worth saving. Decisions save at once. */
const CLOCK_SAVE_MS = 1000;

/**
 * Saves the run as it goes, so a reload carries on where it was: the same ticket, the same
 * findings, even the same game over. Ticks only save now and then, and on leaving the page.
 */
function useSaveRun(game: GameState) {
  const saved = useRef<{ game: GameState; at: number } | null>(null);
  const latest = useRef(game);

  useEffect(() => {
    latest.current = game;
    const last = saved.current;
    // A tick only moves the clock; everything else keeps the same objects.
    const onlyClock =
      last?.game.log === game.log &&
      last.game.queue === game.queue &&
      last.game.phase === game.phase &&
      last.game.day === game.day;
    const now = performance.now();
    if (onlyClock && now - last.at < CLOCK_SAVE_MS) return;
    saveRun(localStorage, game, slot);
    saved.current = { game, at: now };
  }, [game]);

  useEffect(() => {
    const onLeave = () => saveRun(localStorage, latest.current, slot);
    window.addEventListener("pagehide", onLeave);
    return () => window.removeEventListener("pagehide", onLeave);
  }, []);
}

/** The debug console's handle on the run, as `window.demands`. */
export type DebugConsole = {
  /** The run as it stands. */
  state: () => GameState;
  /** The right call on the ticket at the desk, with the reasons to decline. */
  answer: () => ReturnType<typeof verdict> | undefined;
  /** Replace the run with a seeded one, e.g. `seed({ day: 4, ticket: 2, findings: 1 })`. */
  seed: (options?: SeedOptions) => GameState;
};

declare global {
  interface Window {
    demands?: DebugConsole;
  }
}

/** In debug mode, hands the run to the browser console as `window.demands`. */
function useDebugConsole(game: GameState, dispatch: (action: Action) => void) {
  const latest = useRef(game);
  useEffect(() => {
    latest.current = game;
  }, [game]);

  useEffect(() => {
    if (!debug) return undefined;
    window.demands = {
      state: () => latest.current,
      answer: () => {
        const demand = currentDemand(latest.current);
        return demand && verdict(demand, latest.current.day);
      },
      seed: (options = {}) => {
        const seeded = seedRun(options);
        dispatch({ type: "load", game: seeded });
        return seeded;
      },
    };
    return () => {
      delete window.demands;
    };
  }, [dispatch]);
}

export function App() {
  const [{ game, round }, dispatch] = useReducer(reducer, undefined, resumeGame);
  const demand = currentDemand(game);
  // Paused is the monitor switched off: the power light or the start menu toggle it.
  const [paused, setPaused] = useState(false);
  const togglePause = () => setPaused((p) => !p);
  // Every visit opens on the title screen, except in debug mode, which goes straight to the desk.
  const [onTitle, setOnTitle] = useState(!debug);

  // On a break the day goes on, but only as fast as a real clock.
  useGameClock(
    game.phase === "working" && !frozen && !onTitle,
    paused ? MS_PER_REAL_MINUTE : MS_PER_GAME_MINUTE,
    dispatch,
  );
  useSaveRun(game);
  useDebugConsole(game, dispatch);

  return (
    <>
      <Stage>
        {onTitle ? (
          <TitleScreen
            resume={game.day > 1 || game.log.length > 0}
            onStart={() => setOnTitle(false)}
          />
        ) : (
          <Room
            paused={paused}
            onPower={togglePause}
            visitor={<Visitor demand={demand} ticket={demand?.ticket ?? ""} />}
            screen={
              <Screen
                key={round}
                state={game}
                paused={paused}
                onPause={togglePause}
                onDecide={(decision) => dispatch({ type: "decide", decision })}
                onNext={() => dispatch({ type: "next" })}
                onStart={() => dispatch({ type: "start" })}
                onNextDay={() => dispatch({ type: "nextDay" })}
                onCoffee={() => dispatch({ type: "coffee" })}
                onRestart={() => dispatch({ type: "restart" })}
              />
            }
          />
        )}
      </Stage>
      {debug && (
        <div className="pointer-events-none fixed top-0 left-0 z-50 bg-red-600 px-1.5 py-0.5 font-mono text-xs text-white">
          DEBUG · day {game.day} · {game.phase}
          {frozen && " · frozen"}
        </div>
      )}
    </>
  );
}
