import { useEffect, useReducer } from "react";

import {
  currentDemand,
  decide,
  jumpToDay,
  newGame,
  next,
  nextDay,
  push,
  startDay,
  tick,
} from "@/game/engine";
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
  | { type: "push" }
  | { type: "tick"; minutes: number }
  | { type: "nextDay" }
  | { type: "restart" };

/** `round` counts restarts, so presentation state (where windows sit) can start fresh too. */
type AppState = { game: GameState; round: number };

/** `?day=6` in the URL starts there, to playtest later rules. */
const firstDay = Number(new URLSearchParams(window.location.search).get("day")) || 1;

const startGame = (round = 0): AppState => ({
  game: jumpToDay(newGame(Math.floor(Math.random() * 2 ** 32)), firstDay),
  round,
});

function step(game: GameState, action: Exclude<Action, { type: "restart" }>): GameState {
  if (action.type === "decide") return decide(game, action.decision);
  if (action.type === "tick") return tick(game, action.minutes);
  const moves = { start: startDay, next, push, nextDay };
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

export function App() {
  const [{ game, round }, dispatch] = useReducer(reducer, undefined, () => startGame());
  const demand = currentDemand(game);

  useGameClock(game.phase === "working", dispatch);

  return (
    <Stage>
      <Room
        visitor={<Visitor demand={demand} ticket={demand?.ticket ?? ""} />}
        screen={
          <Screen
            key={round}
            state={game}
            onDecide={(decision) => dispatch({ type: "decide", decision })}
            onNext={() => dispatch({ type: "next" })}
            onPush={() => dispatch({ type: "push" })}
            onStart={() => dispatch({ type: "start" })}
            onNextDay={() => dispatch({ type: "nextDay" })}
            onRestart={() => dispatch({ type: "restart" })}
          />
        }
      />
    </Stage>
  );
}
