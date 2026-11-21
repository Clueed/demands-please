import { useEffect, useReducer, useRef, useState } from "react";

import {
  currentDemand,
  decide,
  haveCoffee,
  jumpToDay,
  newGame,
  next,
  nextDay,
  startDay,
  tick,
} from "@/game/engine";
import { loadRun, saveRun } from "@/game/save";
import { MS_PER_GAME_MINUTE } from "@/game/time";
import type { Decision, GameState } from "@/game/types";
import { Room } from "@/render/scene/Room";
import { Screen } from "@/render/scene/Screen";
import { Visitor } from "@/render/scene/Visitor";
import { Stage } from "@/render/Stage";

type Action =
  | { type: "start" }
  | { type: "decide"; decision: Decision }
  | { type: "next" }
  | { type: "tick"; minutes: number }
  | { type: "nextDay" }
  | { type: "coffee" }
  | { type: "restart" };

/** `round` counts restarts, so presentation state (where windows sit) can start fresh too. */
type AppState = { game: GameState; round: number };

/**
 * `?day=6` in the URL starts a fresh run there, to playtest later rules. Such a run isn't
 * saved, so it leaves the real one alone.
 */
const playtestDay = Number(new URLSearchParams(window.location.search).get("day")) || null;

const startGame = (round = 0): AppState => ({
  game: jumpToDay(newGame(Math.floor(Math.random() * 2 ** 32)), playtestDay ?? 1),
  round,
});

/** Carry on with the saved run, if there is one. There's only ever the one run. */
function resumeGame(): AppState {
  const saved = playtestDay ? null : loadRun(localStorage);
  return saved ? { game: saved, round: 0 } : startGame();
}

function step(game: GameState, action: Exclude<Action, { type: "restart" }>): GameState {
  if (action.type === "decide") return decide(game, action.decision);
  if (action.type === "tick") return tick(game, action.minutes);
  const moves = { start: startDay, next, nextDay, coffee: haveCoffee };
  return moves[action.type](game);
}

function reducer(state: AppState, action: Action): AppState {
  if (action.type === "restart") return startGame(state.round + 1);
  const game = step(state.game, action);
  return game === state.game ? state : { ...state, game };
}

/** Runs the game clock while the day is on. A hidden tab stops it, like a paused game. */
function useGameClock(running: boolean, dispatch: (action: Action) => void) {
  useEffect(() => {
    if (!running) return undefined;
    let last = performance.now();
    let frame = requestAnimationFrame(function loop(now) {
      // Capped, so coming back to the tab doesn't fast-forward the day.
      const ms = Math.min(now - last, 250);
      last = now;
      dispatch({ type: "tick", minutes: ms / MS_PER_GAME_MINUTE });
      frame = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(frame);
  }, [running, dispatch]);
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
    if (playtestDay) return;
    const last = saved.current;
    // A tick only moves the clock; everything else keeps the same objects.
    const onlyClock =
      last?.game.log === game.log &&
      last.game.queue === game.queue &&
      last.game.phase === game.phase &&
      last.game.day === game.day;
    const now = performance.now();
    if (onlyClock && now - last.at < CLOCK_SAVE_MS) return;
    saveRun(localStorage, game);
    saved.current = { game, at: now };
  }, [game]);

  useEffect(() => {
    if (playtestDay) return undefined;
    const onLeave = () => saveRun(localStorage, latest.current);
    window.addEventListener("pagehide", onLeave);
    return () => window.removeEventListener("pagehide", onLeave);
  }, []);
}

export function App() {
  const [{ game, round }, dispatch] = useReducer(reducer, undefined, resumeGame);
  const demand = currentDemand(game);
  // Paused is the monitor switched off: the power light or the start menu toggle it.
  const [paused, setPaused] = useState(false);
  const togglePause = () => setPaused((p) => !p);

  useGameClock(game.phase === "working" && !paused, dispatch);
  useSaveRun(game);

  return (
    <Stage>
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
    </Stage>
  );
}
