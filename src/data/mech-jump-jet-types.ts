import { IJumpJet } from "./data-interfaces";

/*
* DISCLAIMER: This file processes gameplay data derived from the BattleTech universe. 
* All lore, stats, and intellectual property belong strictly to Catalyst Game Labs, 
* Topps, and their respective rights holders. 
*
* This open-source utility is a non-commercial fan project designed purely for 
* tabletop gameplay assistance. Content processed by this file is not intended 
* to challenge any copyright or trademark status, and this data is explicitly 
* excluded from the software's underlying license (GNU GPLv3).
*
* Dates: IO:AE p.29 tech progression. Improved jump jets: Clan prototype 3060, production 3069;
* Inner Sphere introduction 3070. UMUs (TO:AUE p.107) follow the jump jet
* construction rules and give underwater MP instead: Inner Sphere 3066, Clan prototype 3061, Clan introduction 3072.
*/

export const mechJumpJetTypes: IJumpJet[] = [
	{
		name: "Standard Jump Jets",
		tag: "standard",
		weight_multiplier: {
			light: 0.5,
			medium: 1,
			heavy: 2,
			superheavy: 4
		},
		criticals: 1,
		costMultiplier: 200,
		book: "TM",
		page: 225,
		prototype: 2464,
		introduced: 2471,
		extinct: null,
		reintroduced: null
	},

	{
		name:  "Improved Jump Jets",
		tag: "improved",
		weight_multiplier: {
			light: 1,
			medium: 2,
			heavy: 4,
			superheavy: 8
		},
		criticals: 2,
		costMultiplier: 500,
		book: "TM",
		page: 225,
		introduced: 3070,
		extinct: null,
		reintroduced: null,
		clanDates: { prototype: 3060, introduced: 3069, extinct: null, reintroduced: null }
	},

	{
		name:  "UMU (Underwater Maneuvering Units)",
		tag: "umu",
		weight_multiplier: {
			light: 0.5,
			medium: 1,
			heavy: 2,
			superheavy: 4
		},
		criticals: 1,
		costMultiplier: 200,
		underwater: true,
		book: "TO:AUE",
		page: 107,
		introduced: 3066,
		extinct: null,
		reintroduced: null,
		clanDates: { prototype: 3061, introduced: 3072, extinct: null, reintroduced: null }
	},

	// Recovered prototype (IO:AE p.97): the construction rules of standard jump jets, the reach of
	// improved ones, 2 heat a hex (at least 6), and a 10-point explosion when a jet takes a critical hit.
	// IO:AE prints no cost; the standard jump jet rate is used, as MegaMek does.
	{
		name: "Prototype Improved Jump Jets",
		tag: "prototype-improved",
		weight_multiplier: {
			light: 0.5,
			medium: 1,
			heavy: 2,
			superheavy: 4
		},
		criticals: 1,
		costMultiplier: 200,
		jumpAsRun: true,
		heatPerHex: 2,
		minimumHeat: 6,
		innerSphereOnly: true,
		book: "IO:AE",
		page: 97,
		prototype: 3022,
		introduced: null,
		extinct: 3069,
		reintroduced: null
	}
];
