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
    {
        id: 5,
        sswid: null,
        tag: "custom",
        name: "Custom Homebrew",
    }
];

export function getRulesLevelOptions(): IRulesLevelOption[] {
    return btRulesLevelOptions;
}

