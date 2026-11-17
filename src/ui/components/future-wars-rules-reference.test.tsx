// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FUTURE_WARS_PLAY_RULESET_IDS, getFutureWarsPlayRules } from "../../data/future-wars-play-rules";
import { findSpecialRuleset } from "../../data/special-rulesets";
import FutureWarsRulesReference from "./future-wars-rules-reference";
import SpecialRulesetsStep from "./special-rulesets-step";

/** Best of Future Wars plan, Chunk D (#172): each play ruleset's summary, as roster play and the ruleset window show it. */
afterEach(cleanup);

describe("FutureWarsRulesReference", () => {
    it.each(FUTURE_WARS_PLAY_RULESET_IDS)("renders the summary and every table of %s", (id) => {
        render(<FutureWarsRulesReference rulesetId={id} open />);
        const panel = screen.getByTestId(`future-wars-rules-${id}`);
        expect(panel.textContent).toContain(findSpecialRuleset(id)!.name);
        expect(panel.textContent).toContain(getFutureWarsPlayRules(id)!.summary);
        for (const table of getFutureWarsPlayRules(id)!.tables) {
            expect(panel.textContent).toContain(table.title);
            expect(panel.textContent).toContain(table.rows[0][1]);
        }
    });

    it("renders nothing for a ruleset with no play summary", () => {
        const { container } = render(<FutureWarsRulesReference rulesetId="sample-no-clans" />);
        expect(container.innerHTML).toBe("");
    });

    it("shows each play ruleset's tables open in More info", () => {
        render(<SpecialRulesetsStep rulesets={[]} notice="" onToggle={() => undefined} />);
        fireEvent.change(screen.getByLabelText("Special Rulesets:"), { target: { value: "yes" } });
        for (const id of FUTURE_WARS_PLAY_RULESET_IDS) {
            const name = findSpecialRuleset(id)!.name;
            fireEvent.click(screen.getByRole("button", { name: new RegExp("^More info\\s*: " + name + "$") }));
            const panel = screen.getByTestId(`future-wars-rules-${id}`);
            expect((panel as HTMLDetailsElement).open, id).toBe(true);
            expect(panel.textContent).toContain(getFutureWarsPlayRules(id)!.tables[0].title);
            fireEvent.click(screen.getByRole("button", { name: /Back to list/ }));
        }
    });
});
