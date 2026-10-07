import { IRulesLevelOption } from "./data-interfaces";

/*
* DISCLAIMER: This file processes gameplay data derived from the BattleTech universe. 
* All lore, stats, and intellectual property belong strictly to Catalyst Game Labs, 
* Topps, and their respective rights holders. 
*
* This open-source utility is a non-commercial fan project designed purely for 
* tabletop gameplay assistance. Content processed by this file is not intended 
* to challenge any copyright or trademark status, and this data is explicitly 
* excluded from the software's underlying license (GNU GPLv3).
*/

/** Rules level at which experimental prototypes may be used (Experimental and every level above it). */
export const EXPERIMENTAL_RULES_LEVEL = 4;

/** Apocryphal: licensed material that is not canon (video games and other media). The lowest non-canon level. */
export const APOCRYPHAL_RULES_LEVEL = 5;

/** Custom Homebrew: fan-made rules and equipment meant to be balanced. Fan-made rules are enabled from here up. */
export const CUSTOM_HOMEBREW_RULES_LEVEL = 6;

/** Munchkin: fan-made content with no claim to balance. Includes every level below it. */
export const MUNCHKIN_RULES_LEVEL = 7;

export const btRulesLevelOptions: IRulesLevelOption[] = [
    {
        id: 0,
        sswid: null,
        tag: "beginner",
        name: "Beginners",
    },
    {
        id: 1,
        sswid: 0,
        tag: "intro",
        name: "Introductory",
    },
    {
        id: 2,
        sswid: null,
        tag: "std",
        name: "Standard",
    },
    {
        id: 3,
        sswid: null,
        tag: "adv",
        name: "Advanced",
    },
    {
        id: 4,
        sswid: null,
        tag: "exp",
        name: "Experimental",
    },
    // 0-4 are the rulebooks' own grades. The levels above are not canon; each includes everything below it.
    {
        id: 5,
        sswid: null,
        tag: "apocryphal",
        name: "Apocryphal",
    },
    {
        id: 6,
        sswid: null,
        tag: "custom",
        name: "Custom Homebrew",
    },
    {
        id: 7,
        sswid: null,
        tag: "munchkin",
        name: "Munchkin",
    }
];

export function getRulesLevelOptions(): IRulesLevelOption[] {
    return btRulesLevelOptions;
}

