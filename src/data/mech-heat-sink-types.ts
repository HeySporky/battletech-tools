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
* Dates: IO tech progression (single: Early Spaceflight). Double heat sinks:
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
		dissipation: 1,
		crits: {
			clan: 1,
			is: 1
		},

		cost: 2000,
		freeSinks: 10,
		book: "TM",
		page: 221,
		introduced: 1950,
		extinct: 0,
		reintroduced: 0
	},
	{
		name: "Double",
		tag: "double",
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
		clanDates: { prototype: 2825, introduced: 2827, extinct: 0, reintroduced: 0 }
	},
	{
		name: "Laser",
		tag: "laser",
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
		extinct: 0,
		reintroduced: 0,
		clanDates: { prototype: 3040, introduced: 3051, extinct: 0, reintroduced: 0 }
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
		book: "IO_AE",
		page: 65,
		notes: "Star League prototype double heat sinks: Experimental rules only.",
		prototype: 2559,
		introduced: null,
		extinct: 2567,
		reintroduced: 0
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
		book: "IO_AE",
		page: 96,
		notes: "Succession Wars 'Freezer' prototype double heat sinks: Experimental rules only.",
		prototype: 3022,
		introduced: null,
		extinct: 3040,
		reintroduced: 0
	},
	{
		name: "Compact",
		tag: "compact",
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
		extinct: 0,
		reintroduced: 0
	}
];
