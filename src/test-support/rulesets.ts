// A Special Ruleset for tests to push into the registry, with every required field filled.
import { ISpecialRuleset } from "../data/special-rulesets";

export const testSpecialRuleset = (overrides: Partial<ISpecialRuleset> & { id: string }): ISpecialRuleset => ({
    name: overrides.id,
    summary: "test",
    description: "",
    category: "play",
    source: { title: "test", publication: "Test", tag: "test" },
    changes: [],
    ...overrides,
});
