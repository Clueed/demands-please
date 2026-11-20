import { useReducer } from "react";

import { CATALOG, DEMANDS } from "@/game/data";
import { currentDemand, newGame, resolve } from "@/game/engine";
import type { Decision, GameState } from "@/game/types";
import { Room } from "@/render/scene/Room";
import { Screen } from "@/render/scene/Screen";
import { Visitor } from "@/render/scene/Visitor";
import { Stage } from "@/render/Stage";

type Action = { type: "decide"; decision: Decision } | { type: "restart" };

/** `round` counts restarts, so presentation state (where windows sit) can start fresh too. */
type AppState = { game: GameState; round: number };

const startGame = (round = 0): AppState => ({ game: newGame(DEMANDS, CATALOG), round });

function reducer({ game, round }: AppState, action: Action): AppState {
  return action.type === "restart"
    ? startGame(round + 1)
    : { game: resolve(game, action.decision), round };
}

export function App() {
  const [{ game, round }, dispatch] = useReducer(reducer, undefined, () => startGame());

  return (
    <Stage>
      <Room
        visitor={<Visitor demand={currentDemand(game)} />}
        screen={
          <Screen
            key={round}
            state={game}
            onDecide={(decision) => dispatch({ type: "decide", decision })}
            onRestart={() => dispatch({ type: "restart" })}
          />
        }
      />
    </Stage>
  );
}
