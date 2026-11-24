// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { EMPTY_RULESET_FILTER } from "../../../utils/ruleset-list";
import RulesetList from "./ruleset-list";

afterEach(cleanup);

const list = (categories?: ("construction" | "play" | "campaign" | "setting")[]) => render(
    <RulesetList tickedIds={[]} filter={EMPTY_RULESET_FILTER} onFilter={() => undefined} openGroups={{ campaign: true, play: true }}
        onGroupToggle={() => undefined} onToggle={() => undefined} onMoreInfo={() => undefined} categories={categories} />,
);

describe("RulesetList categories", () => {
    it("limits the list to campaign rulesets", () => {
        list(["campaign"]);
        expect(screen.queryByTestId("ruleset-row-fw-economics")).not.toBeNull();
        expect(screen.queryByTestId("ruleset-row-fw-morale")).toBeNull();
    });

    it("keeps campaign rulesets out of the unit builders' list (NGCFells's builder's call 6)", () => {
        list();
        expect(screen.queryByTestId("ruleset-row-fw-economics")).toBeNull();
        expect(screen.queryByTestId("ruleset-row-fw-morale")).not.toBeNull();
    });
});
