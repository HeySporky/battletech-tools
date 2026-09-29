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
		criticals: {
			is: { ct: 6 },
			clan: { ct: 6 }
		},
		costMultiplier: 5000,
		introduced: 2300,
		extinct: 0,
		reintroduced: 0,
		rating: 0
	},
	{
		name: "XL Fusion",
		tag: "xl",
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
		criticals: {
			clan: { ct: 6, lt: 2, rt: 2 }
		},
		costMultiplier: 20000,
		prototype: 2824,
		introduced: 2827,
		extinct: 0,
		reintroduced: 0,
		rating: 0
	},
	{
		name: "Light Fusion",
		tag: "light",
		criticals: {
			is: { ct: 6, lt: 2, rt: 2 }
		},
		costMultiplier: 15000,
		prototype: 3055,
		introduced: 3062,
		extinct: 0,
		reintroduced: 0,
		rating: 0
	},
	{
		name: "Compact Fusion",
		tag: "compact",
		criticals: {
			is: { ct: 3 }
		},
		costMultiplier: 10000,
		prototype: 3060,
		introduced: 3066,
		extinct: 0,
		reintroduced: 0,
		rating: 0
	},
	{
		name: "XXL Fusion",
		tag: "xxl",
		criticals: {
			is: { ct: 6, lt: 6, rt: 6 }
		},
		costMultiplier: 100000,
		prototype: 3055,
		introduced: 3125,
		extinct: 0,
		reintroduced: 0,
		rating: 0
	},
	{
		name: "Clan XXL Fusion",
		tag: "clan_xxl",
		criticals: {
			clan: { ct: 6, lt: 4, rt: 4 }
		},
		costMultiplier: 100000,
		prototype: 3030,
		introduced: 3125,
		extinct: 0,
		reintroduced: 0,
		rating: 0
	},
	{
		name: "Internal Combustion Engine",
		alternateName: "ICE",
		tag: "ice",
		criticals: {
			is: { ct: 6 },
			clan: { ct: 6 }
		},
		costMultiplier: 1250,
		introduced: 1950,
		extinct: 0,
		reintroduced: 0,
		rating: 0
	},
	{
		name: "Fuel Cell Engine",
		alternateName: "FCE",
		tag: "cell",
		criticals: {
			is: { ct: 6 },
			clan: { ct: 6 }
		},
		costMultiplier: 3500,
		prototype: 2300,
		introduced: 2470,
		extinct: 0,
		reintroduced: 0,
		rating: 0
	},
	{
		name: "Fission Engine",
		tag: "fission",
		criticals: {
			is: { ct: 6 }
		},
		costMultiplier: 7500,
		prototype: 2470,
		introduced: 2882,
		extinct: 0,
		reintroduced: 0,
		rating: 0
	},
	{
		name: "Primitive Fusion Engine",
		tag: "primitive",
		criticals: {
			is: { ct: 6 }
		},
		costMultiplier: 5000,
		introduced: 2300,
		extinct: 2500, // Unverified: no IO source recorded for these dates
		reintroduced: 3070,
		rating: 0
	}
];
