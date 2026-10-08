import { IHeatSync } from "./data-interfaces";

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
* Dates: IO:AE p.36 tech progression (single: Early Spaceflight; circa 2022 per TM p.220). Double heat sinks:
* Inner Sphere prototype 2559, production 2567, lost 2865, recovered 3040;
* Clan prototype 2825, production 2827. Laser (Clan, TO:AUE p.129): prototype 3040,
* production 3051. Double Heat Sink Prototype (IO:AE p.65, 2559-2567) and Freezers
* (IO:AE p.96, 3022-3040) exist only as Inner Sphere prototypes. Compact (TO:AUE p.128):
* Inner Sphere prototype 3058, production 3079.
*/

export const mechHeatSinkTypes: IHeatSync[] = [
	{
		name:  "Single",
		tag: "single",
		altNames: ["Single Heat Sink"],
		dissipation: 1,
		crits: {
			clan: 1,
			is: 1
		},

		cost: 2000,
		freeSinks: 10,
		book: "TM",
		page: 220,
		introduced: 2022,
		extinct: null,
		reintroduced: null,
		introducedInEdition: "battledroids",
		editionStats: {
			battledroids: {
				book: "BD", page: 24, name: "Heat Sink", weight: 1, criticals: 1,
				notes: "Ten come with the engine; each extra one weighs 1 ton (BD p.24). Every heat sink takes one box on the Critical Hit Chart, the engine's ten included (BD p.25; record sheet, BD p.13). Each working sink removes 1 heat point a turn (Heat Point Table, BD p.27).",
			},
			"battletech-2nd-edition": null,
			"battletech-manual": {
				book: "BTM", page: 79, name: "Heat Sink", weight: 1, criticals: 1, cbills: 2000,
				notes: "Ten come with the engine; each extra one weighs one ton (BTM p.79). New: only some of the engine's ten are placed on the Equipment Tables. Engine rating divided by 25, rounded down, are integral to the engine and are lost only with it; the rest, and every extra sink, take one critical location each (BTM pp.79-80). Only allocated sinks can take a critical hit (BTM p.24). 2,000 C-bills for each sink over 10 (BTM p.84).",
			},
			"battletech-compendium": null,
		},
	},
	{
		name: "Double",
		tag: "double",
		introducedInEdition: "battletech-compendium", editionStats: { "battletech-compendium": { book: "BTC", page: 119, name: "Double Heat Sink", weight: 1, notes: "Sheds 2 heat points a turn for the weight of a standard sink. 3 critical slots (Inner Sphere), which keeps it out of a BattleMech's legs, or 2 (Clan). No mixing with standard sinks: the 10 that come with the engine are double as well. Not for vehicles; AeroSpace fighters may use them (BTC pp.112, 119). 6,000 C-bills each, the engine's 10 included (BTC p.128)." } },
		altNames: ["Double Heat Sink"],
		dissipation: 2,
		crits: {
			clan: 2,
			is: 3
		},
		cost: 6000,
		freeSinks: 0,
		book: "TM",
		page: 221,
		prototype: 2559,
		introduced: 2567,
		extinct: 2865,
		reintroduced: 3040,
		clanDates: { prototype: 2825, introduced: 2827, extinct: null, reintroduced: null }
	},
	{
		name: "Laser",
		tag: "laser",
		altNames: ["Laser Heat Sink"],
		dissipation: 2,
		crits: {
			clan: 2,
			is: 0
		},
		cost: 6000,
		freeSinks: 0,
		techBase: "clan",
		book: "TO:AUE",
		page: 129,
		notes: "Clan laser heat sinks: double heat sinks that do not boil water and reduce the heat of their own vent.",
		introduced: 3051,
		extinct: null,
		reintroduced: null,
		clanDates: { prototype: 3040, introduced: 3051, extinct: null, reintroduced: null }
	},
	{
		name: "Double (Prototype)",
		tag: "double-prototype",
		dissipation: 2,
		crits: {
			clan: 0,
			is: 3
		},
		cost: 18000,
		freeSinks: 0,
		techBase: "is",
		book: "IO:AE",
		page: 65,
		notes: "Star League prototype double heat sinks: Experimental rules only.",
		prototype: 2559,
		introduced: null,
		extinct: 2567,
		reintroduced: null
	},
	{
		name: "Double (Freezers)",
		tag: "double-freezers",
		dissipation: 2,
		crits: {
			clan: 0,
			is: 3
		},
		cost: 30000,
		freeSinks: 0,
		techBase: "is",
		book: "IO:AE",
		page: 96,
		notes: "Succession Wars 'Freezer' prototype double heat sinks: Experimental rules only.",
		prototype: 3022,
		introduced: null,
		extinct: 3040,
		reintroduced: null
	},
	{
		name: "Compact",
		tag: "compact",
		altNames: ["Compact Heat Sink"],
		dissipation: 1,
		crits: {
			clan: 0,
			is: 1
		},
		cost: 3000,
		freeSinks: 10,
		techBase: "is",
		weightEach: 1.5,
		perSlot: 2,
		engineCapacityMultiplier: 2,
		book: "TO:AUE",
		page: 128,
		notes: "Single-strength sinks at 1.5 tons each, two per critical slot; an engine holds twice its normal number.",
		prototype: 3058,
		introduced: 3079,
		extinct: null,
		reintroduced: null
	}
];
