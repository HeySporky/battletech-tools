import { CUSTOM_HOMEBREW_RULES_LEVEL } from "../../data/rules-level-options";

/**
 * Whether the menus and the Classic BattleTech home link to the Walker Creator (#172). It is a Custom Homebrew
 * creator, so it is offered at that rules level or above; a user who holds a saved or loaded Walker still gets the
 * link, so a design they own stays reachable below the level. The creator's pages open at any level.
 */
export function walkerCreatorOffered(appGlobals: {
    appSettings?: { mechRulesFilter?: number };
    walkerSaves?: unknown[];
}): boolean {
    const level = appGlobals.appSettings?.mechRulesFilter;
    if (typeof level === "number" && level >= CUSTOM_HOMEBREW_RULES_LEVEL) return true;
    return (appGlobals.walkerSaves?.length ?? 0) > 0;
}
