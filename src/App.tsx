import { useReducer, useState } from "react";

import { CAPABILITIES, CATALOG, DEMANDS } from "@/game/data";
import { currentDemand, HAPPINESS_SCALE, newGame, resolve, summarize } from "@/game/engine";
import type { CatalogApp, Decision, GameState, Resolution } from "@/game/types";

// Deliberately unstyled: plain HTML only. Graphics are a separate piece of work.

type Action = { type: "decide"; decision: Decision } | { type: "restart" };

const startGame = () => newGame(DEMANDS, CATALOG);

function reducer(state: GameState, action: Action): GameState {
  return action.type === "restart" ? startGame() : resolve(state, action.decision);
}

const money = (n: number) => `€${n.toLocaleString("en")}`;

export function App() {
  const [state, dispatch] = useReducer(reducer, undefined, startGame);
  const demand = currentDemand(state);
  const decide = (decision: Decision) => dispatch({ type: "decide", decision });

  return (
    <main>
      <h1>demands-pls</h1>
      <p>
        Total spend: {money(state.spent)} / year | Happiness: {state.happiness} /{" "}
        {HAPPINESS_SCALE.max} | In queue: {state.queue.length}{" "}
        <button onClick={() => dispatch({ type: "restart" })}>Restart</button>
      </p>
      <hr />

      {demand ? (
        <section>
          <h2>Desk</h2>
          <p>
            <b>Requested app:</b> {demand.requestedApp}
            <br />
            <b>Reason:</b> {demand.reason}
            <br />
            <b>Price:</b> {money(demand.cost)}
          </p>
          <button onClick={() => decide({ kind: "buy" })}>Approve purchase</button>{" "}
          <button onClick={() => decide({ kind: "decline" })}>Decline</button>
          <p>…or offer an existing app from the catalog below.</p>
        </section>
      ) : (
        <EndOfDay state={state} onRestart={() => dispatch({ type: "restart" })} />
      )}
      <hr />

      <Catalog
        portfolio={state.portfolio}
        onOffer={demand ? (appId) => decide({ kind: "offer", appId }) : undefined}
      />
      <hr />

      <Log log={state.log} portfolio={state.portfolio} />
    </main>
  );
}

function Catalog({
  portfolio,
  onOffer,
}: {
  portfolio: CatalogApp[];
  onOffer?: (appId: string) => void;
}) {
  const [page, setPage] = useState(CAPABILITIES[0]?.id);
  const apps = portfolio.filter((a) => a.capabilityId === page);
  const portfolioSpend = portfolio.reduce((sum, a) => sum + a.spend, 0);

  return (
    <section>
      <h2>Application catalog</h2>
      <p>
        Portfolio: {portfolio.length} apps, {money(portfolioSpend)} / year
      </p>
      <p>
        {CAPABILITIES.map((c) => (
          <button key={c.id} disabled={c.id === page} onClick={() => setPage(c.id)}>
            {c.name}
          </button>
        ))}
      </p>
      <ul>
        {apps.map((app) => (
          <li key={app.id}>
            <b>{app.name}</b> — {app.description}
            <br />
            {app.tags.length > 0 && (
              <>
                <i>Tags: {app.tags.join(", ")}</i>
                <br />
              </>
            )}
            Existing spend: {money(app.spend)} / year
            <br />
            <button disabled={!onOffer} onClick={() => onOffer?.(app.id)}>
              Offer this instead
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function EndOfDay({ state, onRestart }: { state: GameState; onRestart: () => void }) {
  const s = summarize(state);
  return (
    <section>
      <h2>End of day</h2>
      <p>
        Total spend: {money(s.spent)} / year (started at {money(s.startingSpend)}; buying everything
        would be {money(s.buyEverythingCost)})
        <br />
        Happiness: {s.happiness} / {HAPPINESS_SCALE.max}
        <br />
        Matches found: {s.matchesFound} of {s.matchesPossible}
      </p>
      <button onClick={onRestart}>Play again</button>
    </section>
  );
}

function Log({ log, portfolio }: { log: Resolution[]; portfolio: CatalogApp[] }) {
  const appName = (id: string) => portfolio.find((a) => a.id === id)?.name ?? id;
  if (log.length === 0) return null;
  return (
    <section>
      <h2>Decisions so far</h2>
      <ol>
        {log.map((r) => (
          <li key={r.demand.id}>
            {r.demand.requestedApp}: {r.outcome}
            {r.decision.kind === "offer" && ` (offered ${appName(r.decision.appId)})`} — spent{" "}
            {money(r.spent)}, happiness {r.happiness > 0 ? "+" : ""}
            {r.happiness}
          </li>
        ))}
      </ol>
    </section>
  );
}
