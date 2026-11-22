import { describe, expect, it } from "vitest";

import { seedRun } from "@/game/debug";

import { archivedMail, inbox, pendingMail } from "./mail";

const ids = (mails: { id: string }[]) => mails.map((m) => m.id);

describe("mail", () => {
  it("opens the run with the morning email on top of the inbox, nothing archived", () => {
    const game = seedRun({ seed: 1 });
    expect(pendingMail(game)?.id).toBe("morning-1");
    expect(inbox(game)[0]?.id).toBe("morning-1");
    expect(archivedMail(game)).toEqual([]);
  });

  it("archives the morning email once the day starts", () => {
    const game = seedRun({ seed: 1, ticket: 0 });
    expect(pendingMail(game)).toBeNull();
    expect(ids(archivedMail(game))).toEqual(["morning-1"]);
    expect(ids(inbox(game))).not.toContain("morning-1");
  });

  it("waits on the evening report at the end of the day", () => {
    const game = seedRun({ seed: 1, day: 2, phase: "dayEnd" });
    expect(pendingMail(game)?.id).toBe("evening-2");
    expect(ids(archivedMail(game))).toEqual(["morning-2", "evening-1", "morning-1"]);
  });

  it("keeps the coffee email in the archive once had", () => {
    const game = seedRun({ seed: 1, day: 2, phase: "coffee" });
    expect(pendingMail(game)?.id).toBe("coffee-2");
    expect(ids(archivedMail(game))).not.toContain("coffee-2");
  });

  it("ends the run with an email from whoever ended it", () => {
    const game = seedRun({ seed: 1, day: 3, phase: "lost" });
    expect(pendingMail(game)).toMatchObject({ kind: "ending", from: "Internal audit" });
  });
});
