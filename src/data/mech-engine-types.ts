import { IEngineType } from "./data-interfaces";

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
 * 'Mech critical slots and cost multipliers: TechManual pp.48-49 and p.278.
 * Dates: IO tech progression (prototype, production, extinct, reintroduced).
 * Fission and Light engines are Inner Sphere only; ICE and Fuel Cell engines
 * use six center torso slots in a 'Mech like a standard fusion engine.
 */

export const mechEngineTypes: IEngineType[] = [
	{
		name: "Standard Fusion",
		alternateName: "Fusion Engine",
		tag: "standard",
		book: "TM",
		page: 214,
		criticals: {
			is: { ct: 6 },
			clan: { ct: 6 }
		},
		costMultiplier: 5000,
		introduced: 2300,
		extinct: null,
		reintroduced: null,
		rating: 0
	},
	{
		name: "XL Fusion",
		tag: "xl",
		book: "TM",
		page: 214,
		criticals: {
			is: { ct: 6, lt: 3, rt: 3 }
		},
		costMultiplier: 20000,
		prototype: 2556,
		introduced: 2579,
		extinct: 2865,
		reintroduced: 3035,
		rating: 0
	},
	{
		name: "Clan XL Fusion",
		tag: "clan_xl",
		book: "TM",
		page: 214,
		criticals: {
			clan: { ct: 6, lt: 2, rt: 2 }
		},
		costMultiplier: 20000,
		prototype: 2824,
		introduced: 2827,
		extinct: null,
		reintroduced: null,
		rating: 0
	},
	{
		name: "Light Fusion",
		tag: "light",
		book: "TM",
		page: 214,
		criticals: {
			is: { ct: 6, lt: 2, rt: 2 }
		},
		costMultiplier: 15000,
		prototype: 3055,
		introduced: 3062,
		extinct: null,
		reintroduced: null,
		rating: 0
	},
	{
		name: "Compact Fusion",
		tag: "compact",
		book: "TM",
		page: 214,
		criticals: {
			is: { ct: 3 }
		},
		costMultiplier: 10000,
		prototype: 3065,
		introduced: 3068,
		extinct: null,
		reintroduced: null,
		rating: 0
	},
	{
		name: "XXL Fusion",
		tag: "xxl",
		book: "TO:AUE",
		page: 120,
		criticals: {
			is: { ct: 6, lt: 6, rt: 6 }
		},
		costMultiplier: 100000,
		prototype: 3055,
		introduced: 3110,
		extinct: null,
		reintroduced: null,
		rating: 0
	},
	{
		name: "Clan XXL Fusion",
		tag: "clan_xxl",
		book: "TO:AUE",
		page: 120,
		criticals: {
			clan: { ct: 6, lt: 4, rt: 4 }
		},
		costMultiplier: 100000,
		prototype: 2954,
		introduced: 3084,
		extinct: null,
		reintroduced: null,
		rating: 0
	},
	{
		name: "Internal Combustion Engine",
		alternateName: "ICE",
		tag: "ice",
		book: "TM",
		page: 215,
		criticals: {
			is: { ct: 6 },
			clan: { ct: 6 }
		},
		costMultiplier: 1250,
		introduced: 1950,
		extinct: null,
		reintroduced: null,
		rating: 0
	},
	{
		name: "Fuel Cell Engine",
		alternateName: "FCE",
		tag: "cell",
		book: "TM",
		page: 215,
		criticals: {
			is: { ct: 6 },
			clan: { ct: 6 }
		},
		costMultiplier: 3500,
		prototype: 2300,
		introduced: 2470,
		extinct: null,
		reintroduced: null,
		rating: 0
	},
	{
		name: "Fission Engine",
		tag: "fission",
		book: "TM",
		page: 215,
		criticals: {
			is: { ct: 6 }
		},
		costMultiplier: 7500,
		prototype: 2470,
		introduced: 2882,
		extinct: null,
		reintroduced: null,
		rating: 0
	},
	{
		name: "Primitive Fusion Engine",
		tag: "primitive",
		book: "IO:AE",
		page: 117,
		criticals: {
			is: { ct: 6 }
		},
		costMultiplier: 5000,
		prototype: 2439,
		introduced: 2443,
		extinct: 2520,
		reintroduced: null,
		rating: 0
	}
];
